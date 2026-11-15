import { safeUrl,blocked,type Media,type Settings,type SourceCheck } from '../../../packages/contracts';
import { htmlResponse,mediaKind,networkMedia,responseFilename,mimeType } from '../../../packages/media-core/classification';
import { matchesOrigin } from '../../../packages/media-core/network';
import {groupMedia,mediaMatches,qualityIdentity} from '../../../packages/media-core/grouping';
import {mediaSuffix,mediaLink} from '../../../packages/media-core/formats';
import {eligibleMedia,visibleMedia} from '../../../packages/media-core/detection-policy';
import {responseSize} from '../../../packages/media-core/source-metadata';
import {scanPage} from './detect';
import {canonicalMedia,sourceIndex,sameAudio} from '../../../packages/media-core/sources';
import {fragmentUrls,withoutFragments,isFragment} from '../../../packages/media-core/segmented-sources';
import {vkDecoration} from '../../../packages/media-core/vk';
import type {Segment} from '../../../packages/media-core/hls';
import {isLocalBuild,LOCAL_BUILD,youtubeHost} from '../../../packages/contracts/distribution';
import {youtubePage} from './youtube-page';
import{tiktokPage}from'./tiktok-page';
import{tiktokPlayerPage}from'./tiktok-player-page';
import{sampleTikTokSources}from'./tiktok-sample';
import{tiktokHost,tiktokMedia,tiktokDecoration}from'../../../packages/media-core/tiktok';
import{xPage}from'./x-page';
import{xHost,xPostPage,xMedia,xCdn}from'../../../packages/media-core/x';
import{instagramPage}from'./instagram-page';
import{instagramHost,instagramPostPage,instagramCdn,instagramMedia}from'../../../packages/media-core/instagram';
import type{PlaylistSummary}from'../../../packages/playlists/contracts';
import {mediaTitle} from '../../../packages/media-core/titles';
import{collectDetectionDiagnostics,detectionFailure}from'./detection-diagnostics';
export function createDetection(settings:()=>Promise<Settings>) {
  let matches:string[]=[];let networkGrants:string|undefined;let sync:Promise<unknown>=Promise.resolve();let restoration=0;const timers=new Map<number,ReturnType<typeof setTimeout>>();const lastScan=new Map<number,number>();
  const scans=new Map<number,{epoch:number;previews:boolean;dirty:boolean;promise:Promise<Media[]>}>();
  void chrome.action.setBadgeBackgroundColor({color:'#0B70B5'}).catch(()=>{});
  const rawCached=async(id:number):Promise<Media[]> => {
    const [tab,data]=await Promise.all([chrome.tabs.get(id).catch(()=>undefined),chrome.storage.session.get(`tab:${id}`)]);
    return tab&&!tab.incognito?((data[`tab:${id}`] as Media[]|undefined)??[]).filter(m=>m.pageUrl===tab.url):[];
  };
  const candidates=async(id:number)=>eligibleMedia(await rawCached(id),await settings());
  const cached=async(id:number)=>visibleMedia(await rawCached(id),await settings());
  const rejectedCount=async(id:number)=>(await rawCached(id)).reduce((n,m)=>n+m.variants.filter(v=>v.check&&v.check.state!=='ready').length,0);
  const frameOrigins=async(id:number):Promise<string[]> => (await chrome.storage.session.get(`frames:${id}`))[`frames:${id}`] as string[] ?? [];
  const rejected=async(id:number):Promise<string[]> => (await chrome.storage.session.get(`rejected:${id}`))[`rejected:${id}`] as string[]??[];
  const fragments=async(id:number):Promise<string[]> => (await chrome.storage.session.get(`fragments:${id}`))[`fragments:${id}`] as string[]??[];
  const controllers=new Map<AbortController,number>();const epochs=new Map<number,number>();
  async function save(id:number,media:Media[]) {
    if(media.some(m=>xHost(new URL(m.pageUrl).hostname))){const key=`xCatalog:${id}`,scopes=((await chrome.storage.session.get(key))[key]??[]) as {pageUrl:string;frameId:number}[];
      // Old playback resources survive SPA navigation in Performance entries.
      // A post must provide its own native catalog before those CDN resources
      // can represent that post; otherwise a previous video gets a new title.
      media=media.filter(m=>m.providerId?.startsWith('x:')||!xCdn(m.url)||!xPostPage(m.pageUrl)&&!scopes.some(s=>s.pageUrl===m.pageUrl&&s.frameId===(m.frameId??0)));}
    media=media.filter(m=>!instagramHost(new URL(m.pageUrl).hostname)||m.providerId?.startsWith('instagram:')||!instagramPostPage(m.pageUrl)||!instagramCdn(m.url));
    const grouped=groupMedia(withoutFragments(canonicalMedia(media.filter(m=>!vkDecoration(m.pageUrl,m.url))),await fragments(id))).slice(0,200);
    await chrome.storage.session.set({[`tab:${id}`]:grouped});const p=await settings();const visible=visibleMedia(grouped,p);
    const list=LOCAL_BUILD?(await chrome.storage.session.get(`playlist:${id}`))[`playlist:${id}`]as PlaylistSummary|undefined:undefined,count=list?.pageUrl===(await chrome.tabs.get(id)).url&&list?.count?1:visible.length;
    await chrome.action.setBadgeText({tabId:id,text:p.badge==='hidden'||!count?'':p.badge==='dot'?'•':String(count)});queueValidation(id);return eligibleMedia(grouped,p);
  }
  const locked=<T>(id:number,fn:()=>Promise<T>)=>navigator.locks.request(`alcydeo:detection:${id}`,fn);
  async function clear(id:number){epochs.set(id,(epochs.get(id)??0)+1);validationRuns.delete(id);validationAttempts.delete(id);qualityAttempts.delete(id);validationPages.delete(id);clearTimeout(timers.get(id));timers.delete(id);lastScan.delete(id);for(const[controller,tabId]of controllers)if(tabId===id)controller.abort();const forget=LOCAL_BUILD?import('./playlist-catalog').then(m=>m.forgetPlaylist(id)):Promise.resolve();await locked(id,async()=>{await chrome.storage.session.remove([`tab:${id}`,`frames:${id}`,`rejected:${id}`,`fragments:${id}`,`inspected:${id}`,`youtube:${id}`,`xCatalog:${id}`]);await chrome.action.setBadgeText({tabId:id,text:''}).catch(()=>{});});await forget;}
  async function rejectUrls(id:number,urls:string[]){
    const invalid=[...new Set([...await rejected(id),...urls])].slice(-200);await chrome.storage.session.set({[`rejected:${id}`]:invalid});
    const list=(await rawCached(id)).flatMap(m=>{const variants=m.variants.flatMap(v=>{if(v.audioUrl&&invalid.includes(v.audioUrl))return[];const urls=m.providerId?.startsWith('tiktok:')?v.sourceUrls?.filter(url=>!invalid.includes(url)):undefined;if(!invalid.includes(v.url))return urls?[{...v,sourceUrls:urls}]:[v];return urls?.length?[{...v,url:urls[0]!,sourceUrls:urls,check:undefined}]:[];});return variants.length?[{...m,url:invalid.includes(m.url)?variants[0]!.url:m.url,variants}]:[];});return save(id,list);
  }
  async function reject(task:{tabId:number;pageUrl:string;url:string}){return locked(task.tabId,async()=>{if((await chrome.tabs.get(task.tabId).catch(()=>undefined))?.url===task.pageUrl)await rejectUrls(task.tabId,[task.url]);});}
  function scan(id:number,previews=true):Promise<Media[]>{
    const epoch=epochs.get(id)??0;const current=scans.get(id);if(current?.epoch===epoch){current.dirty=true;return previews&&!current.previews?current.promise.then(()=>scan(id,true)):current.promise;}
    const entry={epoch,previews,dirty:false,promise:Promise.resolve([] as Media[])};
    const run=async()=>{
    const tab=await chrome.tabs.get(id);if(tab.incognito)throw new Error('private');if(!tab.url)throw new Error('permission');const pageUrl=safeUrl(tab.url);if(blocked(new URL(pageUrl).hostname,(await settings()).blocked))throw new Error('blocked');
    // Frame execution can wait for a busy renderer. Never hold the media-cache
    // lock here: a confirmed network source must still publish its badge.
    const scanPolicy=await settings();const results=await chrome.scripting.executeScript({target:{tabId:id,allFrames:true},func:scanPage,args:[previews,isLocalBuild(),mediaSuffix,scanPolicy.blocked],injectImmediately:true}).catch(()=>chrome.scripting.executeScript({target:{tabId:id},func:scanPage,args:[previews,isLocalBuild(),mediaSuffix,scanPolicy.blocked],injectImmediately:true}));
    const youtubeResults=LOCAL_BUILD&&(youtubeHost(new URL(pageUrl).hostname)||results.some(r=>r.result?.frameOrigins.some(origin=>youtubeHost(new URL(origin).hostname))))?await chrome.scripting.executeScript({target:{tabId:id,allFrames:true},world:'MAIN',func:youtubePage,injectImmediately:true}).catch(()=>[]):[];
    const tiktokResults=tiktokHost(new URL(pageUrl).hostname)||results.some(r=>r.result?.frameOrigins.some(origin=>tiktokHost(new URL(origin).hostname)))?await chrome.scripting.executeScript({target:{tabId:id,allFrames:true},func:tiktokPage,args:[scanPolicy.blocked],injectImmediately:true}).catch(()=>[]):[];
    const missingTikTokFrames=tiktokResults.filter(r=>r.result===undefined||r.result===null).map(r=>r.frameId);
    if(missingTikTokFrames.length){
      const playerResults=await chrome.scripting.executeScript({target:{tabId:id,frameIds:missingTikTokFrames},world:'MAIN',func:tiktokPlayerPage,args:[scanPolicy.blocked],injectImmediately:true}).catch(()=>[]);
      for(const player of playerResults)if(typeof player.result==='string'&&player.result.length<=8*1024*1024){
        const parsed=await chrome.scripting.executeScript({target:{tabId:id,frameIds:[player.frameId]},func:tiktokPage,args:[scanPolicy.blocked,[player.result],false],injectImmediately:true}).catch(()=>[]);
        const index=tiktokResults.findIndex(r=>r.frameId===player.frameId);if(index>=0&&parsed[0])tiktokResults[index]=parsed[0];
      }
    }
    const xResults=xHost(new URL(pageUrl).hostname)||results.some(r=>r.result?.frameOrigins.some(origin=>xHost(new URL(origin).hostname)))?await chrome.scripting.executeScript({target:{tabId:id,allFrames:true},func:xPage,args:[scanPolicy.blocked],injectImmediately:true}).catch(()=>[]):[];
    const instagramResults=instagramHost(new URL(pageUrl).hostname)?await chrome.scripting.executeScript({target:{tabId:id,allFrames:true},func:instagramPage,args:[scanPolicy.blocked],injectImmediately:true}).catch(()=>[]):[];
    if(LOCAL_BUILD&&youtubeHost(new URL(pageUrl).hostname)&&new URL(pageUrl).searchParams.has('list'))void import('./playlist-catalog').then(m=>m.readPlaylist(id,scanPolicy)).then(()=>locked(id,async()=>{if(epoch===(epochs.get(id)??0)&&(await chrome.tabs.get(id)).url===pageUrl)await save(id,await rawCached(id));})).catch(()=>{});
    return locked(id,async()=>{
    if(epoch!==(epochs.get(id)??0)||(await chrome.tabs.get(id)).url!==pageUrl)return cached(id);
    const previous=(await rawCached(id)).filter(m=>m.pageUrl===pageUrl);const source=sourceIndex(previous);const invalid=await rejected(id);const media:Media[]=[];const frames=new Set<string>();
    for(const result of results){for(const origin of result.result?.frameOrigins??[]){try{frames.add(new URL(safeUrl(origin)).origin);}catch{/* Excluded frame. */}}
      for(const item of result.result?.media??[]){const urls=item.urls.flatMap(v=>{try{safeUrl(v.url);const url=source({tabId:id,pageUrl,frameId:result.frameId},v.url)?.url??v.url;return invalid.includes(url)?[]:[{...v,url}];}catch{return [];}});if(!urls.length||media.some(m=>m.url===urls[0]!.url))continue;
        const old=previous.find(m=>urls.some(v=>m.url===v.url||m.sourceUrls?.includes(v.url)||m.variants.some(x=>x.url===v.url)));const kind=mediaKind(urls[0]!.url,old?.contentType);
        const title=mediaTitle(result.frameId!==0&&!item.explicitTitle?undefined:item.title,tab.title,old?.title);
        if(old?.qualitiesResolved&&kind!=='direct'){if(!media.some(m=>m.id===old.id))media.push({...old,title,detectedBy:'dom'});continue;}
        media.push({id:old?.id??crypto.randomUUID(),tabId:id,pageUrl,frameId:result.frameId,title,url:urls[0]!.url,sourceUrls:old?.sourceUrls,kind,variants:urls.map(v=>{const saved=old?.variants.find(x=>x.url===v.url),identity=kind==='direct'?qualityIdentity(v.url):undefined;return{id:saved?.id??crypto.randomUUID(),url:v.url,sourceUrls:saved?.sourceUrls,check:saved?.check,label:v.label||saved?.label||(identity?`${identity.height}p`:''),width:saved?.width,height:saved?.height??identity?.height??(Number(v.label.match(/^(\d{3,5})p?$/i)?.[1])||undefined),contentType:saved?.contentType??(old?.url===v.url?old.contentType:undefined),size:saved?.size??(old?.variants.length===1?old.size:undefined)};}),duration:item.duration,height:item.height,poster:item.poster&&item.poster.length<100_000?item.poster:old?.poster,size:old?.size,contentType:old?.contentType,detectedBy:'dom'});
      }
    }
    for(const result of tiktokResults)if(result.result){const raw={...result.result,formats:result.result.formats.flatMap(f=>{const urls=[...new Set([f.url,...(f.urls??[])])].filter(url=>!invalid.includes(url));return urls.length?[{...f,url:urls[0]!,urls}]:[];})};const item=tiktokMedia(raw,{tabId:id,pageUrl,frameId:result.frameId},previous.find(m=>m.providerId===`tiktok:${result.result!.videoId}`&&(m.frameId??0)===(result.frameId??0)));if(item)media.push(item);}
    for(const r of instagramResults)if(r.result){const item=instagramMedia(r.result,{tabId:id,pageUrl,frameId:r.frameId},previous.find(m=>m.providerId===`instagram:${r.result!.code}:${r.result!.mediaId}`));if(item)media.push(item);}
    for(const old of previous)if(old.providerId?.startsWith('instagram:')&&!instagramResults.some(r=>r.result&&r.frameId===(old.frameId??0)))media.push(old);
    const xCatalogs=xResults.filter(r=>r.result);
    if(xCatalogs.length){await chrome.storage.session.set({[`xCatalog:${id}`]:xCatalogs.map(r=>({pageUrl,frameId:r.frameId}))});for(const r of xCatalogs)media.push(...xMedia(r.result!,{tabId:id,pageUrl,frameId:r.frameId},previous));}
    // Hydration scripts remove themselves. Preserve a previously read exact-page
    // catalog across observer/worker restoration, never across a different URL.
    for(const old of previous)if(old.providerId?.startsWith('x:')&&!xCatalogs.some(r=>r.frameId===(old.frameId??0)))media.push(old);
    if(LOCAL_BUILD&&youtubeResults.length){
      const{youtubeMedia}=await import('../../../packages/media-core/youtube');const key=`youtube:${id}`,contexts=((await chrome.storage.session.get(key))[key]??[]) as any[];
      for(const result of youtubeResults){try{if(!result.result)continue;const raw=result.result,old=previous.find(m=>m.providerId===`youtube:${raw.videoId}`),context=contexts.find((c:any)=>c.pageUrl===pageUrl&&c.frameId===result.frameId&&c.streamId===new URL(raw.endpoint??'https://invalid.test').searchParams.get('id'));const item=youtubeMedia(raw,{tabId:id,pageUrl,frameId:result.frameId},context,old);if(item)media.push(item);}catch{/* Inaccessible or unsupported player data remains unavailable. */}
      }
    }
    if(epoch!==(epochs.get(id)??0)||(await chrome.tabs.get(id)).url!==pageUrl)return cached(id);
    for(const old of previous)if(!old.providerId?.startsWith('x:')&&(!old.providerId?.startsWith('tiktok:')||media.some(m=>m.providerId===old.providerId))&&old.detectedBy==='network'&&!media.some(m=>m.variants.some(v=>v.url===old.url)||(old.providerId&&old.providerId===m.providerId)))media.push(old);
    await chrome.storage.session.set({[`frames:${id}`]:[...frames]});await save(id,media.filter(m=>!tiktokDecoration(pageUrl,m.url)));return cached(id);
    });};
    entry.promise=run().finally(()=>{if(scans.get(id)===entry){scans.delete(id);if(entry.dirty&&entry.epoch===(epochs.get(id)??0))schedule(id);}});scans.set(id,entry);return entry.promise;
  }
  async function observed(tab:chrome.tabs.Tab){if(tab.id===undefined||tab.incognito||tab.discarded||!tab.url)return false;try{const url=new URL(safeUrl(tab.url));return matchesOrigin(url,matches)&&!blocked(url.hostname,(await settings()).blocked)&&await chrome.permissions.contains({origins:[`${url.origin}/*`]});}catch{return false;}}
  function schedule(id:number){if(timers.has(id))return;const delay=Math.max(0,(lastScan.get(id)??-Infinity)+200-Date.now());timers.set(id,setTimeout(()=>{timers.delete(id);lastScan.set(id,Date.now());void(async()=>{
    const policy=sync;await policy;if(policy!==sync)return;
    const epoch=epochs.get(id)??0,current=()=>policy===sync&&epoch===(epochs.get(id)??0);
    const tab=await chrome.tabs.get(id);if(!current())return;
    const allowed=await observed(tab);if(!current())return;
    if(allowed){await scan(id,false);return;}
    // A denied page may have navigated while its policy check was pending.
    const latest=await chrome.tabs.get(id);if(!current()||latest.url!==tab.url)return;
    const denied=!await observed(latest);if(!current()||!denied)return;
    const final=await chrome.tabs.get(id);if(current()&&final.url===latest.url)await clear(id);
  })().catch(()=>{});},delay));}
  async function restoreTabs(revision:number){
    const tabs=await chrome.tabs.query({});let next=0;
    await Promise.all(Array.from({length:Math.min(3,tabs.length)},async()=>{
      while(next<tabs.length&&revision===restoration){
        const id=tabs[next++]!.id;if(id===undefined)continue;
        const epoch=epochs.get(id)??0,current=()=>revision===restoration&&epoch===(epochs.get(id)??0);
        // tabs.query is only an id inventory: its about:blank/URL snapshot can
        // already belong to a document that navigation has replaced.
        const tab=await chrome.tabs.get(id).catch(()=>undefined);if(!tab||!current())continue;
        let allowed=await observed(tab);if(!current())continue;
        const frames=!tab.incognito&&!tab.discarded&&/^https?:\/\//.test(tab.url??'')?await chrome.scripting.executeScript({target:{tabId:id,allFrames:true},func:()=>({href:location.href}),injectImmediately:true}).catch(()=>[]):[];
        if(!current())continue;
        const latest=await chrome.tabs.get(id).catch(()=>undefined);if(!latest||!current()||latest.url!==tab.url)continue;
        allowed=await observed(latest);if(!current())continue;
        const sameDocument=frames.some(frame=>frame.frameId===0&&frame.result?.href===latest.url);
        const documentIds=[...new Set(frames.flatMap(frame=>typeof frame.documentId==='string'&&frame.documentId?[frame.documentId]:[]))];
        // Both installation and cleanup target the exact documents probed.
        // A same-URL reload must never receive work intended for its predecessor.
        if(sameDocument&&documentIds.length){
          const target={tabId:id,documentIds};
          if(allowed)await chrome.scripting.executeScript({target,files:['content-scripts/observe.js'],injectImmediately:true}).catch(()=>{});
          else await chrome.scripting.executeScript({target,func:()=>{(globalThis as typeof globalThis&{__alcydeoObserveCleanup?:()=>void}).__alcydeoObserveCleanup?.();},injectImmediately:true}).catch(()=>{});
        }
        if(!current())continue;
        if(allowed){schedule(id);continue;}
        const final=await chrome.tabs.get(id).catch(()=>undefined);if(!final||!current()||final.url!==latest.url)continue;
        const denied=!await observed(final);if(current()&&denied)await clear(id);
      }
    }));
  }
  function synchronize(){const run=sync.then(async()=>{
    const granted=(await chrome.permissions.getAll()).origins??[];const saved=(await chrome.storage.local.get('observedOrigins')).observedOrigins as string[]??[];
    const p=await settings();watchNetwork(p.globalDetection?granted:[]);
    const candidates=[...new Set([...saved,...granted.filter(p=>p!=='<all_urls>'&&!/^\*|:\/\/\*\//.test(p)&&/^https?:\/\//.test(p))])];const scoped:string[]=[];for(const p of candidates)if(await chrome.permissions.contains({origins:[p]}))scoped.push(p);
    await chrome.storage.local.set({observedOrigins:scoped});const all=await chrome.permissions.contains({origins:['http://*/*','https://*/*']});
    matches=p.globalDetection?(all?['http://*/*','https://*/*']:scoped):[];
    const registered=await chrome.scripting.getRegisteredContentScripts();const old=registered.filter(s=>s.id.startsWith('site-'));if(old.length)await chrome.scripting.unregisterContentScripts({ids:old.map(s=>s.id)});
    const current=registered.find(s=>s.id==='alcydeo-observer');if(matches.length){const script:chrome.scripting.RegisteredContentScript={id:'alcydeo-observer',matches,excludeMatches:[...p.blocked.flatMap(host=>/^([a-z0-9-]+\.)*[a-z0-9-]+$/.test(host)?[`*://*.${host}/*`]:host.startsWith('*.')&&/^([a-z0-9-]+\.)*[a-z0-9-]+$/.test(host.slice(2))?[`*://${host}/*`]:[]),...(isLocalBuild()?[]:['*://*.youtube.com/*','*://*.youtube-nocookie.com/*','*://youtu.be/*','*://*.googlevideo.com/*'])],js:['content-scripts/observe.js'],allFrames:true,persistAcrossSessions:true,runAt:'document_start'};if(current)await chrome.scripting.updateContentScripts([script]);else await chrome.scripting.registerContentScripts([script]);}else if(current)await chrome.scripting.unregisterContentScripts({ids:[current.id]});
    // Restoring already open tabs is background maintenance, not a dependency
    // of the native media response that woke the service worker.
    const revision=++restoration;void restoreTabs(revision).catch(()=>{});
  });sync=run.catch(()=>{});return run;}
  async function observe(id:number){const tab=await chrome.tabs.get(id);if(!tab.url||tab.incognito)throw new Error('permission');const origin=new URL(safeUrl(tab.url)).origin;if(!await chrome.permissions.contains({origins:[`${origin}/*`]}))throw new Error('permission');const saved=(await chrome.storage.local.get('observedOrigins')).observedOrigins as string[]??[];await chrome.storage.local.set({observedOrigins:[...new Set([...saved,`${origin}/*`])]});await synchronize();await scan(id);}
  // Clear once for top-level navigation, never for an iframe's later loading
  // transition: that used to erase manifests already seen in the iframe.
  function navigationRequest(details:chrome.webRequest.OnBeforeRequestDetails){if(details.tabId>=0)void clear(details.tabId);return undefined;}
  chrome.tabs.onUpdated.addListener((id,change)=>{if(change.status==='complete'||change.url)schedule(id);});
  chrome.tabs.onRemoved.addListener(id=>{validationRuns.delete(id);validationAttempts.delete(id);qualityAttempts.delete(id);validationPages.delete(id);clearTimeout(timers.get(id));timers.delete(id);lastScan.delete(id);scans.delete(id);epochs.delete(id);for(const[controller,tabId]of controllers)if(tabId===id)controller.abort();if(LOCAL_BUILD)void import('./playlist-catalog').then(m=>m.forgetPlaylist(id)).catch(()=>{});void chrome.storage.session.remove([`tab:${id}`,`frames:${id}`,`rejected:${id}`,`fragments:${id}`,`inspected:${id}`,`youtube:${id}`,`xCatalog:${id}`]);});
  chrome.permissions.onAdded.addListener(()=>{void synchronize();});chrome.permissions.onRemoved.addListener(()=>{void synchronize();});
  const redirects=new Map<string,{tabId:number;urls:string[];at:number}>();
  function redirected(details:chrome.webRequest.OnBeforeRedirectDetails){
    details={...details,initiator:requestInitiator(details)};
    if(details.tabId<0||!details.initiator)return;
    try{safeUrl(details.initiator);const from=safeUrl(details.url),to=safeUrl(details.redirectUrl);const old=redirects.get(details.requestId);const now=Date.now();
      for(const[id,value]of redirects)if(now-value.at>60_000)redirects.delete(id);
      redirects.delete(details.requestId);if(redirects.size>=256)redirects.delete(redirects.keys().next().value!);
      redirects.set(details.requestId,{tabId:details.tabId,urls:[...new Set([...(old?.urls??[]),from,to])].slice(-20),at:now});
    }catch{/* Never associate an excluded or non-HTTP redirect target. */}
  }
  function requestEnded(details:{requestId:string}){redirects.delete(details.requestId);}
  function sabrTraffic(details:chrome.webRequest.OnBeforeRequestDetails){
    details={...details,initiator:requestInitiator(details)};
    if(!isLocalBuild()||details.tabId<0||details.method!=='POST'||!details.initiator||!/^https?:\/\//.test(details.initiator)||!/(^|\.)(youtube\.com|youtube-nocookie\.com)$/.test(new URL(details.initiator).hostname))return;
    if(!details.url.includes('/videoplayback?')||new URL(details.url).searchParams.get('sabr')!=='1')return;
    const chunks=details.requestBody?.raw?.flatMap(r=>r.bytes?[new Uint8Array(r.bytes)]:[])??[],length=chunks.reduce((n,b)=>n+b.length,0);if(!length||length>131072)return;const body=new Uint8Array(length);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
    void(async()=>{await sync;const tab=await chrome.tabs.get(details.tabId);if(!await observed(tab))return;const epoch=epochs.get(details.tabId)??0;const{sabrRequest}=await import('../../../packages/media-core/youtube');const context=await sabrRequest(details.url,body);
      await locked(details.tabId,async()=>{if(epoch!==(epochs.get(details.tabId)??0)||(await chrome.tabs.get(details.tabId)).url!==tab.url)return;const key=`youtube:${details.tabId}`,previous=((await chrome.storage.session.get(key))[key]??[]) as any[];await chrome.storage.session.set({[key]:[{...context,frameId:details.frameId,pageUrl:tab.url},...previous.filter((c:any)=>c.pageUrl===tab.url&&c.streamId!==context.streamId)].slice(0,16)});
      });schedule(details.tabId);
    })().catch(()=>{});return undefined;
  }
  function networkHeaders(details:chrome.webRequest.OnHeadersReceivedDetails){
    details={...details,initiator:requestInitiator(details)};
    const chain=redirects.get(details.requestId);if(details.statusCode<300||details.statusCode>=400)redirects.delete(details.requestId);
    if(details.tabId<0||details.statusCode<200||(details.statusCode>=300&&details.statusCode<400)||!['media','xmlhttprequest','other','sub_frame'].includes(details.type))return;
    const contentType=details.responseHeaders?.find(h=>h.name.toLowerCase()==='content-type')?.value??'';const filename=responseFilename(details.responseHeaders?.find(h=>h.name.toLowerCase()==='content-disposition')?.value);const html=htmlResponse(contentType,filename);const refused=[401,403,404,410].includes(details.statusCode);if(details.statusCode>=400&&!html&&!refused)return;const recognized=networkMedia(details.url,contentType,filename,details.type==='media');if(!recognized&&!html&&!refused&&!/\.(ts|aac)(?:[?#]|$)/i.test(details.url))return;if(html&&details.type!=='media'&&!mediaLink.test(details.url))return;
    void(async()=>{
    await sync;const tab=await chrome.tabs.get(details.tabId);if(!await observed(tab)||!details.initiator||tiktokDecoration(tab.url!,details.url))return;safeUrl(details.initiator);const url=safeUrl(details.url);const policy=await settings();if(blocked(new URL(url).hostname,policy.blocked)||blocked(new URL(details.initiator).hostname,policy.blocked))return;
    const aliases=chain?.tabId===details.tabId?chain.urls:[];
    const kind=mediaKind(url,contentType);const size=kind==='direct'?responseSize(details.statusCode,new Headers(details.responseHeaders?.flatMap(h=>h.value===undefined?[]:[[h.name,h.value]]))):undefined;
    const target=await locked(details.tabId,async()=>{const current=await chrome.tabs.get(details.tabId);if(current.url!==tab.url)return;
      if(html){await rejectUrls(details.tabId,[url,...aliases]);return;}
      if(refused){const known=(await rawCached(details.tabId)).some(m=>m.url===url||m.variants.some(v=>v.url===url||v.audioUrl===url||m.providerId?.startsWith('tiktok:')&&v.sourceUrls?.includes(url)));if(known){await rejectUrls(details.tabId,[url]);schedule(details.tabId);}return;}
      if(kind==='direct'){const assets=new Set(await fragments(details.tabId));if(isFragment(url,assets)||aliases.some(a=>isFragment(a,assets)))return;}
      const invalid=(await rejected(details.tabId)).filter(u=>u!==url);await chrome.storage.session.set({[`rejected:${details.tabId}`]:invalid});
      const sourceMatches=(v:Media['variants'][number])=>v.url===url||tiktokHost(new URL(tab.url!).hostname)&&!!v.sourceUrls?.includes(url)||aliases.includes(v.url)||aliases.some(a=>v.sourceUrls?.includes(a));
      const list=await rawCached(details.tabId);if(!recognized&&!html&&!list.some(m=>m.detectedBy==='dom'&&m.variants.some(v=>v.url===url||aliases.includes(v.url)))&&!networkMedia(url,contentType,filename,/^attachment(?:;|$)/i.test(details.responseHeaders?.find(h=>h.name.toLowerCase()==='content-disposition')?.value??'')))return;const old=list.find(m=>(m.frameId??0)===(details.frameId??0)&&(m.url===url||m.sourceUrls?.includes(url)||m.variants.some(sourceMatches)));
      // Same-URL HLS playback keeps the checked association, without extending its 30s sample TTL.
      if(old){old.detectedBy='network';if(old.url===url||aliases.includes(old.url)||old.variants.some(v=>v.url===old.url&&sourceMatches(v))){old.url=url;old.contentType=contentType;old.kind=kind;}old.sourceUrls=[...new Set([...aliases,...(old.sourceUrls??[])])].slice(0,200);if(old.variants.length===1)old.size=size;for(const v of old.variants)if(sourceMatches(v)){v.sourceUrls=[...new Set([...aliases,...(v.sourceUrls??[])])].slice(0,64);const retained=v.url===url&&v.check?.state==='ready'&&(kind==='hls'||kind==='direct'&&Date.now()-v.check.checkedAt<30_000&&v.size===size&&mimeType(v.contentType)===mimeType(contentType));if(v.url!==url||!retained&&(v.check?.checkedAt??0)<Math.floor(details.timeStamp)){forgetValidation(details.tabId,v.url);forgetValidation(details.tabId,url);delete v.check;}v.url=url;v.contentType=contentType;v.size=size;}}
      else{forgetValidation(details.tabId,url);const identity=kind==='direct'?qualityIdentity(url):undefined;list.push({id:crypto.randomUUID(),tabId:details.tabId,frameId:details.frameId,pageUrl:tab.url!,title:mediaTitle(undefined,tab.title),url,sourceUrls:aliases,kind,contentType,size,detectedBy:'network',variants:[{id:crypto.randomUUID(),url,sourceUrls:aliases,label:identity?`${identity.height}p`:'',height:identity?.height,contentType,size}]});}const saved=await save(details.tabId,list);return saved.find(m=>m.kind!=='direct'&&(m.url===url||m.sourceUrls?.includes(url)||m.variants.some(v=>v.url===url)))?.id;});
    if(target)void automaticManifest(details.tabId,target,url).catch(()=>{});
  })().catch(()=>{});return undefined;}
  // Register synchronously against the required manifest hosts so Chrome can
  // dispatch the event that wakes this worker. Chrome enforces withheld access;
  // handlers await the restored policy before keeping a source. Synchronization
  // then narrows the filters, or removes them if access/detection is disabled.
  function watchNetwork(granted:string[]){
    const urls=[...new Set(granted.flatMap(p=>p==='<all_urls>'?['http://*/*','https://*/*']:p.startsWith('*://')?[p.replace('*:','http:'),p.replace('*:','https:')]:/^https?:\/\//.test(p)?[p]:[]))].sort();
    const key=urls.join('\n');if(key===networkGrants)return;
    for(const controller of controllers.keys())controller.abort();
    chrome.webRequest.onBeforeRequest.removeListener(navigationRequest);if(LOCAL_BUILD)chrome.webRequest.onBeforeRequest.removeListener(sabrTraffic);chrome.webRequest.onHeadersReceived.removeListener(networkHeaders);chrome.webRequest.onBeforeRedirect.removeListener(redirected);chrome.webRequest.onErrorOccurred.removeListener(requestEnded);redirects.clear();
    if(urls.length){const filter:chrome.webRequest.RequestFilter={urls,types:['media','xmlhttprequest','other','sub_frame']};chrome.webRequest.onBeforeRequest.addListener(navigationRequest,{urls,types:['main_frame']});if(LOCAL_BUILD)chrome.webRequest.onBeforeRequest.addListener(sabrTraffic,{urls,types:['xmlhttprequest','media']},['requestBody']);chrome.webRequest.onHeadersReceived.addListener(networkHeaders,filter,['responseHeaders']);chrome.webRequest.onBeforeRedirect.addListener(redirected,filter);chrome.webRequest.onErrorOccurred.addListener(requestEnded,filter);}
    networkGrants=key;
  }
  watchNetwork(chrome.runtime.getManifest().host_permissions??[]);
  const inflight=new Map<string,Promise<Media>>();let parsing=0;const waiting:(()=>void)[]=[];
  async function automaticManifest(id:number,mediaId:string,url:string){
    const permitted=await locked(id,async()=>{if(!await observed(await chrome.tabs.get(id)))return false;const key=`inspected:${id}`;const seen=(await chrome.storage.session.get(key))[key] as string[]??[];if(seen.includes(url)||seen.length>=24)return false;await chrome.storage.session.set({[key]:[...seen,url]});return true;});
    if(permitted)await expand(id,mediaId,false,url);
  }
  async function slot<T>(work:()=>Promise<T>){if(parsing>=2){if(waiting.length>=32)throw new Error('busy');await new Promise<void>(resolve=>waiting.push(resolve));}else parsing++;try{return await work();}finally{const next=waiting.shift();if(next)next();else parsing--;}}
  async function expand(id:number,mediaId:string,force=false,observedUrl?:string){
    const media=(await candidates(id)).find(m=>mediaMatches(m,mediaId));if(!media)throw new Error('missing');if(!['hls','dash'].includes(media.kind)||(media.qualitiesResolved&&!force&&!observedUrl))return media;
    const url=observedUrl??media.url;if(url!==media.url&&!media.sourceUrls?.includes(url)&&!media.variants.some(v=>v.url===url))throw new Error('missing');
    const epoch=epochs.get(id)??0;const key=`${id}\0${epoch}\0${media.pageUrl}\0${url}`;const pending=inflight.get(key);if(pending)return pending;
    const run=slot(async()=>{
      const controller=new AbortController();controllers.set(controller,id);let timedOut=false;const timeout=setTimeout(()=>{timedOut=true;controller.abort();},8000);
      try{
        if(epoch!==(epochs.get(id)??0))throw new Error('missing');
        if(observedUrl){const tab=await chrome.tabs.get(id);if(tab.url!==media.pageUrl||!await observed(tab))throw new Error('permission');}
        const guard=async(value:string)=>{if(controller.signal.aborted)throw new Error('cancelled');const policy=await settings(),tab=await chrome.tabs.get(id);if(epoch!==(epochs.get(id)??0)||tab.url!==media.pageUrl)throw new Error('missing');if(blocked(new URL(safeUrl(value)).hostname,policy.blocked)||blocked(new URL(media.pageUrl).hostname,policy.blocked))throw new Error('blocked');if(!await chrome.permissions.contains({origins:[`${new URL(value).origin}/*`]}))throw new Error('permission');};
        let variants:Media['variants'];let segments:Segment[]=[];let sourceUrls:string[]=[];
        if(media.kind==='hls'){const{inspectHls}=await import('../../../packages/media-core/hls-resolution');const parsed=await inspectHls(url,controller.signal,guard);variants=parsed.variants.length?parsed.variants.map(v=>({...v,contentType:'application/vnd.apple.mpegurl'})):media.variants;segments=parsed.track?.segments??[];sourceUrls=parsed.sourceUrls;}
        else{const{manifestText}=await import('../../../packages/media-core/network');const{parseDash}=await import('../../../packages/media-core/dash');await guard(url);const parsed=parseDash(await manifestText(url,controller.signal),url);variants=(parsed.variants.length?parsed.variants:media.variants).map(v=>({...v,contentType:'application/dash+xml'}));segments=[...parsed.resources.map(url=>({url})),...parsed.plan.tracks.flatMap(t=>t.segments)];}
        if(variants.length>200)throw new Error('manifestLimit');
        return await locked(id,async()=>{
          const tab=await chrome.tabs.get(id);if(controller.signal.aborted||epoch!==(epochs.get(id)??0)||tab.url!==media.pageUrl||(observedUrl&&!await observed(tab)))throw new Error('missing');const list=await rawCached(id);const current=list.find(m=>mediaMatches(m,mediaId)||m.url===media.url||m.sourceUrls?.includes(media.url));if(!current)throw new Error('missing');
          if(segments.length)await chrome.storage.session.set({[`fragments:${id}`]:fragmentUrls(segments,await fragments(id),list.filter(m=>m.kind==='direct').flatMap(m=>m.variants.map(v=>v.url)))});
          // A child playlist may finish after its master was resolved. It must
          // never replace that master's complete set of qualities/audio links.
          if(current.url===url||(!current.qualitiesResolved&&url===media.url)){
            current.sourceUrls=[...new Set([...(current.sourceUrls??[]),...sourceUrls])].slice(0,200);
            const previous=list.filter(m=>(m.frameId??0)===(current.frameId??0)).flatMap(m=>m.variants);const used=new Set<string>();
            current.variants=variants.map(v=>{
              if(media.kind==='dash'){forgetValidation(id,v.url);return v;}
              const checked=(p:typeof v)=>p.check?.state==='ready'&&!!(p.check.planIdentity||p.check.hlsTracks?.length);
              const old=previous.find(p=>!used.has(p.id)&&sameAudio(p,v)&&(p.url===v.url||media.kind==='hls'&&checked(p)&&p.sourceUrls?.includes(v.url)));
              const variantId=old?.id??crypto.randomUUID();used.add(variantId);
              const alias=old&&checked(old)&&(old.url===v.url||old.sourceUrls?.includes(v.url));
              if(old?.check?.state!=='ready')forgetValidation(id,v.url);
              return{...v,...(alias?{url:old.url,audioUrl:old.audioUrl??v.audioUrl,sourceUrls:old.sourceUrls,audioSourceUrls:old.audioSourceUrls}:{}),id:variantId,check:old?.check?.state==='ready'?old.check:undefined};
            });
            current.qualitiesResolved=true;
          }
          const grouped=await save(id,list);return grouped.find(m=>mediaMatches(m,mediaId))!;
        });
      }catch(error){if(controller.signal.aborted)throw new Error(timedOut?'network':'cancelled');throw error;}finally{clearTimeout(timeout);controllers.delete(controller);}
    });inflight.set(key,run);try{return await run;}finally{inflight.delete(key);}
  }
  const checks=new Map<string,Promise<Media['variants'][number]['check']>>(),activeChecks=new Set<string>();let checking=0;const checkWait:(()=>void)[]=[];
  async function resetChecks(id:number,onlySmall=false){validationAttempts.delete(id);qualityAttempts.delete(id);await locked(id,async()=>{const list=await rawCached(id);for(const m of list)for(const v of m.variants)if(!onlySmall||v.check?.error==='tooSmall')delete v.check;await save(id,list);});}
  async function check(id:number,mediaId:string,variantId:string){
    const media=(await candidates(id)).find(m=>mediaMatches(m,mediaId)),variant=media?.variants.find(v=>v.id===variantId);if(!media||!variant)throw new Error('missing');
    if(variant.check&&variant.check.error!=='live'&&Date.now()-variant.check.checkedAt<30_000)return variant.check;
    const epoch=epochs.get(id)??0,key=`${id}\0${epoch}\0${media.pageUrl}\0${media.providerId?.startsWith('tiktok:')?`${media.id}\0${variant.id}`:`${variant.url}\0${variant.audioUrl??''}`}\0${['dash','sabr'].includes(media.kind)?variant.id:''}`;const previous=checks.get(key);if(previous)return previous;
    const attemptStartedAt=Date.now();const run=(async()=>{
      if(checking>=2){if(checkWait.length>=24)throw new Error('busy');await new Promise<void>(resolve=>checkWait.push(resolve));}else checking++;
      const controller=new AbortController();controllers.set(controller,id);activeChecks.add(key);
      try{
        let planned:Segment[]=[];const policy=await settings();const guard=async(url:string)=>{if(controller.signal.aborted||epoch!==(epochs.get(id)??0))throw new Error('cancelled');const tab=await chrome.tabs.get(id);if(tab.incognito||tab.url!==media.pageUrl)throw new Error('missing');const currentPolicy=media.providerId?.startsWith('tiktok:')?await settings():policy;if(blocked(new URL(url).hostname,currentPolicy.blocked)||blocked(new URL(media.pageUrl).hostname,currentPolicy.blocked))throw new Error('blocked');};
        await guard(variant.url);const{checkSource}=await import('../../../packages/media-core/preflight');let result:SourceCheck,checkedUrl=variant.url;
        if(media.providerId?.startsWith('tiktok:')){
          const data=await sampleTikTokSources(id,media.frameId??0,[variant.url,...(variant.sourceUrls??[])],media.providerId.slice(7),controller.signal,async url=>{await guard(url);if(!await chrome.permissions.contains({origins:[`${new URL(url).origin}/*`]}))throw new Error('permission');});
          if(data.url)checkedUrl=data.url;
          result={...(data.prefix&&data.url?await(await import('../../../packages/media-core/source-metadata')).prefixDimensions(Uint8Array.from(atob(data.prefix),c=>c.charCodeAt(0))):{}),checkedAt:Date.now(),state:data.error?(['expired','missing','html','notMedia','unsupported','permission','blocked'].includes(data.error)?'unavailable':'unknown'):data.url?'ready':'unknown',error:data.error,size:data.size,pageCredentials:data.pageCredentials,contentType:/^(?:video|audio)\//.test(data.contentType??'')?data.contentType:undefined};
        }else result=await checkSource(media,variant,guard,controller.signal,policy.minSize,plan=>{planned=plan.tracks.flatMap(track=>track.segments);});
        result.checkedAt=Date.now();const minimum=(await settings()).minSize;
        if(media.kind==='direct'&&result.size!==undefined){if(result.error==='tooSmall'&&result.size>=minimum){result.state='unknown';delete result.error;}else if(result.size<minimum){result.state='unavailable';result.error='tooSmall';}}
        await locked(id,async()=>{if(controller.signal.aborted||epoch!==(epochs.get(id)??0)||(await chrome.tabs.get(id)).url!==media.pageUrl)return;const list=await rawCached(id);if(planned.length)await chrome.storage.session.set({[`fragments:${id}`]:fragmentUrls(planned,await fragments(id),list.filter(m=>m.kind==='direct').flatMap(m=>m.variants.map(v=>v.url)))});for(const item of list)for(const v of item.variants)if((v.url===variant.url||media.providerId?.startsWith('tiktok:')&&item.providerId===media.providerId&&(item.frameId??0)===(media.frameId??0)&&v.id===variant.id&&[v.url,...(v.sourceUrls??[])].includes(checkedUrl))&&v.audioUrl===variant.audioUrl&&(!['dash','sabr'].includes(media.kind)||v.id===variant.id)){if(v.url!==checkedUrl){if(item.url===v.url)item.url=checkedUrl;v.url=checkedUrl;}v.check=result;if(result.width!==undefined&&result.height!==undefined){v.width=result.width;v.height=result.height;v.label=`${result.height}p${v.label.includes(' · ')?v.label.slice(v.label.indexOf(' · ')):''}`;}if(media.kind==='direct'){if(result.size!==undefined)v.size=result.size;if(result.contentType)v.contentType=result.contentType;}}await save(id,list);});if(controller.signal.aborted)throw new Error('cancelled');return result;
      }catch(error){
        const code=detectionFailure(error,media.providerId?.startsWith('tiktok:')?'script':'network');
        if(controller.signal.aborted||epoch!==(epochs.get(id)??0))throw new Error('cancelled');
        if(code==='cancelled'||code==='busy')throw new Error(code);
        const result:SourceCheck={state:'unknown',checkedAt:Date.now(),error:code};let outcome=result;
        await locked(id,async()=>{
          if(controller.signal.aborted||epoch!==(epochs.get(id)??0)||(await chrome.tabs.get(id).catch(()=>undefined))?.url!==media.pageUrl)return;
          const list=await rawCached(id);if(controller.signal.aborted||epoch!==(epochs.get(id)??0))return;
          for(const item of list)if(item.pageUrl===media.pageUrl&&mediaMatches(item,media.id)&&item.providerId===media.providerId&&(item.frameId??0)===(media.frameId??0))for(const v of item.variants)if(v.id===variant.id&&v.url===variant.url&&v.audioUrl===variant.audioUrl){if(v.check?.state==='ready'&&v.check.checkedAt>=attemptStartedAt)outcome=v.check;else v.check=result;}
          await save(id,list);
        });
        return outcome;
      }finally{activeChecks.delete(key);controllers.delete(controller);const next=checkWait.shift();if(next)next();else checking--;}
    })();checks.set(key,run);try{return await run;}finally{checks.delete(key);}
  }
  const validationRuns=new Map<number,{epoch:number;dirty:boolean}>(),validationActive=new Set<number>();
  const validationAttempts=new Map<number,Set<string>>(),qualityAttempts=new Map<number,Set<string>>(),validationPages=new Map<number,string>();
  function forgetValidation(id:number,url:string){const attempted=validationAttempts.get(id);for(const key of attempted??[])if(key.split('\0').slice(1,3).includes(url))attempted!.delete(key);}
  function queueValidation(id:number){
    const current=validationRuns.get(id);if(current){current.dirty=true;return;}
    const entry={epoch:epochs.get(id)??0,dirty:true};validationRuns.set(id,entry);
    startValidation();
  }
  function startValidation(){
    if(validationActive.size>=2)return;const next=[...validationRuns].find(([id])=>!validationActive.has(id));if(!next)return;
    const[id,entry]=next;validationActive.add(id);startValidation();
    // Let cache writers release their lock; all network work stays outside it.
    void new Promise(resolve=>setTimeout(resolve,0)).then(async()=>{
      while(validationRuns.get(id)===entry&&entry.epoch===(epochs.get(id)??0)){
        entry.dirty=false;const tab=await chrome.tabs.get(id).catch(()=>undefined),policy=await settings();
        if(!tab?.url||tab.incognito||blocked(new URL(tab.url).hostname,policy.blocked)||!await chrome.permissions.contains({origins:[`${new URL(tab.url).origin}/*`]}))break;
        if(validationPages.get(id)!==tab.url){validationPages.set(id,tab.url);validationAttempts.delete(id);qualityAttempts.delete(id);}
        const list=await candidates(id);
        let expanded=qualityAttempts.get(id);if(!expanded){expanded=new Set();qualityAttempts.set(id,expanded);}
        const unresolved=list.filter(m=>['hls','dash'].includes(m.kind)&&!m.qualitiesResolved&&!expanded.has(m.url));
        const urgent=list.some(m=>m.kind==='direct'&&(!!m.providerId||!!m.height)&&m.variants.some(v=>!v.check&&!validationAttempts.get(id)?.has(`${m.kind}\0${v.url}\0${v.audioUrl??''}\0`)));
        if(unresolved.length&&expanded.size<24&&!urgent){
          const next=unresolved.slice(0,Math.min(2,24-expanded.size));for(const m of next)expanded.add(m.url);
          const results=await Promise.allSettled(next.map(m=>expand(id,m.id)));let retry=false;
          for(const[i,result]of results.entries())if(result.status==='rejected'){
            const item=next[i]!,code=result.reason instanceof Error&&/^[a-zA-Z]+$/.test(result.reason.message)?result.reason.message:'network';
            if(['cancelled','busy'].includes(code)){expanded.delete(item.url);retry=true;continue;}
            await locked(id,async()=>{if(entry.epoch!==(epochs.get(id)??0)||(await chrome.tabs.get(id)).url!==item.pageUrl)return;const raw=await rawCached(id);const failed=raw.find(m=>mediaMatches(m,item.id));if(failed)for(const v of failed.variants)if(!v.check)v.check={state:['html','invalid','encrypted','expired','missing','unsupported','periods','timeline','discontinuity','manifestLimit','manifestLoop'].includes(code)?'unavailable':'unknown',error:code,checkedAt:Date.now()};await save(id,raw);});
          }
          if(retry){await sync;await new Promise(resolve=>setTimeout(resolve,250));}entry.dirty=true;break;
        }
        let attempted=validationAttempts.get(id);if(!attempted){attempted=new Set();validationAttempts.set(id,attempted);}
        const pending=list.filter(m=>!m.captureOnly&&!m.pending&&m.kind!=='sabr'&&(!urgent||m.kind==='direct'&&(!!m.providerId||!!m.height))).flatMap(m=>m.variants.map(v=>({m,v,key:`${m.kind}\0${v.url}\0${v.audioUrl??''}\0${m.kind==='dash'?v.id:''}`}))).filter(({v,key})=>!v.check&&!attempted!.has(key));
        // Validate complete master pairs before their technical leaf playlists.
        // A leaf can then join the already checked pair without flashing a card.
        pending.sort((a,b)=>Number(!!b.m.providerId)-Number(!!a.m.providerId)||Number(b.m.detectedBy==='network')-Number(a.m.detectedBy==='network'));
        const pairs=pending.filter(({m,v})=>m.kind==='hls'&&v.audioUrl);
        const next=(pairs.length?pairs:pending).slice(0,Math.min(2,Math.max(0,32-attempted.size)));
        if(!next.length){if(entry.dirty)continue;break;}
        for(const item of next)attempted.add(item.key);
        const results=await Promise.allSettled(next.map(({m,v})=>check(id,m.id,v.id)));let retry=false;for(const[i,result]of results.entries())if(result.status==='rejected'&&result.reason instanceof Error&&['cancelled','busy'].includes(result.reason.message)){attempted.delete(next[i]!.key);retry=true;}if(retry){await sync;await new Promise(resolve=>setTimeout(resolve,250));}entry.dirty=true;break;
      }
    }).catch(()=>{}).finally(()=>{validationActive.delete(id);if(validationRuns.get(id)===entry){validationRuns.delete(id);if(entry.dirty)queueValidation(id);}startValidation();});
  }
  const diagnostics=async(id:number)=>{
    if(!Number.isSafeInteger(id)||id<0)throw new Error('invalid');
    const prefix=`${id}\0`,active=[...activeChecks].filter(key=>key.startsWith(prefix)).length,owned=[...checks.keys()].filter(key=>key.startsWith(prefix)).length;
    return collectDetectionDiagnostics(id,{settings,media:await rawCached(id),pending:validationRuns.has(id),budget:{attempted:validationAttempts.get(id)?.size??0,limit:32,expanded:qualityAttempts.get(id)?.size??0,expandLimit:24,activeChecks:active,waitingChecks:Math.max(0,owned-active)}});
  };
  void synchronize();return{cached,rejectedCount,pending:(id:number)=>validationRuns.has(id),scan,expand,frameOrigins,observe,synchronize,reject,check,resetChecks,diagnostics,changed:(id:number)=>schedule(id)};
}
import{requestInitiator}from'./platform';
