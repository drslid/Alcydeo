import { defaults, managedTask, safeUrl, cleanName, cleanFolder, blocked, publicMetadata, sitePattern, sizePresets,concurrentFileOptions,downloadConcurrency,conversionOptions,compressionDefaults, type Settings, type Task } from '../../../packages/contracts';
import { allTasks, getTask, putTask, changeTask, setState, removeTask, removeHistory,mediaTaskLock,outputSaveLock } from '../../../packages/storage';
import {pendingOutput} from '../../../packages/media-core/output-saving';
import {LOCAL_BUILD}from'../../../packages/contracts/distribution';
import type{PlaylistTaskOptions}from'../src/playlist-service';
import { createDetection } from '../src/detection';
import { createNativeDownloads } from '../src/native-downloads';
import { mediaKind } from '../../../packages/media-core/classification';
import {mediaMatches} from '../../../packages/media-core/grouping';
import {mediaTitle} from '../../../packages/media-core/titles';
import{managerContext,messageOriginMatches}from'../src/platform';

export default defineBackground(() => {
  // This default replaces the former opt-in flow at the user's request. Apply
  // it once on upgrade, then preserve subsequent explicit pause preferences.
  const initialized = chrome.storage.local.get(['settings','automaticDetectionDefault','minimumSizeDefault']).then(async stored => {
    const previous=stored.settings as Partial<Settings>|undefined;
    await chrome.storage.session.remove(['cloud-token:drive','cloud-token:onedrive']);
    await chrome.storage.local.remove('cloudOneDriveClientId');
    if(LOCAL_BUILD)await import('../src/playlist-catalog').then(m=>m.prunePlaylists());
    await chrome.storage.local.set({settings:{...defaults,...previous,maxConcurrentFiles:downloadConcurrency(previous?.maxConcurrentFiles),...(stored.automaticDetectionDefault!==1?{globalDetection:true}:{}),...(stored.minimumSizeDefault!==1&&(!previous?.minSize)?{minSize:10000}:{})},automaticDetectionDefault:1,minimumSizeDefault:1});
  });
  const settings = async (): Promise<Settings> => {await initialized;const stored=(await chrome.storage.local.get('settings')).settings as Partial<Settings>|undefined;return{...defaults,...stored,maxConcurrentFiles:downloadConcurrency(stored?.maxConcurrentFiles),conversion:conversionOptions(stored?.conversion),compression:conversionOptions(stored?.compression??compressionDefaults),captureQuality:stored?.captureQuality??'high'};};
  const detection = createDetection(settings);
  const { cached, scan } = detection;
  const wakeManager=(id?:string,targetTabId?:number,route?:string,finishLive=false)=>chrome.runtime.sendMessage({type:'downloadWake',id,targetTabId,route,finishLive}).catch(()=>{});
  const native = createNativeDownloads(settings,task=>detection.reject({tabId:task.media.tabId,pageUrl:task.media.pageUrl,url:task.variant.url}),()=>wakeManager());
  void initialized.then(()=>native.drain()).catch(()=>{});
  chrome.runtime.onStartup.addListener(()=>{void initialized.then(()=>native.browserRestart()).catch(()=>{});});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.settings&&(changes.settings.newValue as Partial<Settings>|undefined)?.maxConcurrentFiles!==(changes.settings.oldValue as Partial<Settings>|undefined)?.maxConcurrentFiles)void native.drain().then(()=>wakeManager()).catch(()=>{});});
  async function manager(active=false,view='queue',taskId?:string){return navigator.locks.request('alcydeo:manager-open',async()=>{
    const path=chrome.runtime.getURL('/manager.html');const context=await managerContext(path);const tab=context?await chrome.tabs.get(context.tabId).catch(()=>undefined):(await chrome.tabs.query({})).find(t=>t.url&&t.url.split(/[?#]/)[0]===path);const currentUrl=context?.documentUrl??tab?.url;
    if(tab?.id!==undefined){if(active){const url=new URL(currentUrl!);const route=taskId?`tools/${encodeURIComponent(taskId)}`:view;const unchanged=url.hash===`#${route}`;url.hash=route;await chrome.tabs.update(tab.id,{active:true,url:url.href});await chrome.windows.update(tab.windowId,{focused:true});if(unchanged)await wakeManager(undefined,tab.id,route);}else if(tab.discarded)await chrome.tabs.reload(tab.id);}
    else await chrome.tabs.create({url:`${path}#${taskId?`tools/${encodeURIComponent(taskId)}`:view}`,active});
    await wakeManager();
  });}
  async function enqueueMedia(message:any,options?:PlaylistTaskOptions){
      const tabId=Number(message.tabId);if(options){const existing=await getTask(options.id);if(existing){if(existing.playlist?.batchId!==options.playlist?.batchId)throw new Error('invalid');return existing.id;}}
      let media = (await cached(tabId)).find(m => mediaMatches(m,message.id)); let variant = media?.variants.find(v => v.id === message.variantId);
      if (!media || !variant) throw new Error('missing');if(media.captureOnly)throw new Error('unsupported');if(media.pending)throw new Error('sourcePending'); safeUrl(variant.url);
      let check=await detection.check(tabId,media.id,variant.id);if(check?.state==='unavailable'||media.kind!=='sabr'&&check?.state!=='ready')throw new Error(check?.error??'network');if(check?.live)throw new Error('live');
      if(media.providerId?.startsWith('tiktok:')){const current=(await cached(tabId)).find(m=>mediaMatches(m,media!.id)),selected=current?.variants.find(v=>v.id===variant!.id);if(!current||!selected||selected.check?.state!=='ready')throw new Error('missing');media=current;variant=selected;check=selected.check;}
      const contentType=check?.contentType??variant.contentType??(variant.url===media.url?media.contentType:undefined);
      const prefs=await settings();const chosen={...variant,check,width:check?.width??variant.width,height:check?.height??variant.height,size:media.kind==='direct'?check?.size:variant.size};if(check?.height)chosen.label=`${check.height}p${variant.label.includes(' · ')?variant.label.slice(variant.label.indexOf(' · ')):''}`;
      const page=await chrome.tabs.get(tabId);if(page.incognito||page.url!==media.pageUrl)throw new Error('missing');
      const task: Task = { id: options?.id??crypto.randomUUID(), media: { ...media,...options?.scope,kind:['sabr','adaptive'].includes(media.kind)?media.kind:mediaKind(variant.url,contentType),contentType,size:chosen.size,height:chosen.height??media.height }, variant:{...chosen,contentType}, title: cleanName(options?.title??mediaTitle(typeof message.title==='string'?message.title:media.title,page.title)),playlist:options?.playlist,destination:options?.destination??{folder:prefs.folder,saveAs:prefs.saveAs},transfer:media.providerId?.startsWith('tiktok:')?{mode:'page',connections:2}:['direct','dash'].includes(media.kind)&&prefs.multipart?{mode:'multipart',connections:prefs.connections}:undefined, state: 'queued', createdAt: Date.now(), updatedAt: Date.now(), bytes: 0, progress: 0, checkpoints: {} };
      await putTask(task);
      if (!managedTask(task)) await native.start(task);else await manager();
      return task.id;
  }
  async function handle(message: any) {
    if (!message || typeof message.type !== 'string') throw new Error('invalid');
    const tabId = Number(message.tabId);
    if(LOCAL_BUILD&&message.type.startsWith('youtubePlaylist')){const module=await import('../src/playlist-service');const result=await module.playlistMessage(message,{settings,cached,enqueue:enqueueMedia});if(message.type==='youtubePlaylistStart'||message.type==='youtubePlaylistControl'&&['resume','retry'].includes(message.action))await manager();return result;}
    if(message.type==='pageMedia'){const task=await getTask(message.id);if(!task||task.owner!==message.owner||task.transfer?.mode!=='page'||message.action!=='close'&&(!['fetching','queued'].includes(task.state)||(task.leaseUntil??0)<Date.now()))throw new Error('interrupted');const run=async()=>{const{tiktokTransfer}=await import('../src/tiktok-transfer');return tiktokTransfer(task,message.action,await settings());};return message.action==='close'?run():navigator.locks.request(`alcydeo:page-rpc:${task.id}`,run);}
    if(message.type==='openManager'){
      const view=message.view==='queue'?'library':message.view??'library';if(!['queue','library','tools','record','cloud','settings','help'].includes(view))throw new Error('invalid');
      if(message.taskId!==undefined&&(typeof message.taskId!=='string'||message.taskId.length>128||!await getTask(message.taskId)))throw new Error('missing');
      await manager(true,view,message.taskId);return true;
    }
    if(message.type==='liveSources'){
      const result=[];for(const tab of await chrome.tabs.query({})){if(tab.id===undefined||tab.incognito||!tab.url?.startsWith('http'))continue;for(const media of await cached(tab.id))if(media.kind==='hls')result.push(media);if(result.length>=200)break;}return result.slice(0,200);
    }
    if(message.type==='startLive')return navigator.locks.request('alcydeo:live-start',async()=>{
      const prefs=await settings();let media:Task['media'],variant:Task['variant'];
      if(typeof message.url==='string'){const url=safeUrl(message.url);if(message.url.length>16384)throw new Error('invalid');const id=crypto.randomUUID(),title=`Alcydeo ${new Date().toISOString().slice(0,19).replace('T',' ')}`;variant={id:'live',url,label:'HLS'};media={id,tabId:-1,pageUrl:url,url,title,kind:'hls',variants:[variant]};}
      else{const found=(await cached(tabId)).find(m=>mediaMatches(m,message.id));const selected=found?.variants.find(v=>v.id===message.variantId);if(!found||!selected||found.kind!=='hls')throw new Error('missing');const page=await chrome.tabs.get(tabId);if(page.incognito||page.url!==found.pageUrl)throw new Error('missing');media=found;variant=selected;}
      if(blocked(new URL(media.pageUrl).hostname,prefs.blocked))throw new Error('blocked');
      const{permitted}=await import('../../../packages/media-core/network');const guard=async(url:string)=>{safeUrl(url);if(blocked(new URL(url).hostname,prefs.blocked))throw new Error('blocked');if(!await permitted(url))throw new Error('permission');};
      const{resolveLiveHls}=await import('../../../packages/media-core/live-hls');const resolved=await resolveLiveHls(variant,AbortSignal.timeout(20000),guard);
      if((await allTasks()).some(t=>t.live?.active&&t.live.url===resolved.variant.url&&['queued','recording'].includes(t.state)))throw new Error('busy');
      const now=Date.now(),task:Task={id:crypto.randomUUID(),media,variant:resolved.variant,title:cleanName(media.title),state:'queued',createdAt:now,updatedAt:now,bytes:0,progress:0,checkpoints:{},destination:{folder:prefs.folder,saveAs:prefs.saveAs},live:{blocked:prefs.blocked,active:true,startedAt:now,url:resolved.variant.url,bytes:0,segments:0,duration:0}};
      await putTask(task);await manager();return task.id;
    });
    if(message.type==='detectionDiagnostics'){if(!Number.isSafeInteger(tabId)||tabId<0)throw new Error('invalid');return detection.diagnostics(tabId);}
    if (message.type === 'snapshot') { await native.drain(); return { playlist:LOCAL_BUILD&&Number.isInteger(tabId)?(await chrome.storage.session.get(`playlist:${tabId}`))[`playlist:${tabId}`]:undefined,sourcePending:Number.isInteger(tabId)&&tabId>=0?detection.pending(tabId):false,sourceRejected:Number.isInteger(tabId)&&tabId>=0?await detection.rejectedCount(tabId):0,allSitesAllowed:await chrome.permissions.contains({origins:['http://*/*','https://*/*']}),frameOrigins: Number.isInteger(tabId) && tabId >= 0 ? await detection.frameOrigins(tabId) : [], media: Number.isInteger(tabId) && tabId >= 0 ?await cached(tabId) : [], tasks: (await allTasks()).sort((a,b) => b.createdAt - a.createdAt), settings: await settings() }; }
    if (message.type === 'scan') { if (!Number.isInteger(tabId) || tabId < 0) throw new Error('invalid');if(message.forceChecks===true){await detection.resetChecks(tabId);if(LOCAL_BUILD)await import('../src/playlist-catalog').then(m=>m.forgetPlaylist(tabId));}return scan(tabId); }
    if (message.type === 'observe') { await detection.observe(tabId); return true; }
    if (message.type === 'globalDetection') {
      if (typeof message.enabled !== 'boolean') throw new Error('invalid');
      await chrome.storage.local.set({ settings:{ ...await settings(),globalDetection:message.enabled } });
      await detection.synchronize(); return true;
    }
    if (message.type === 'expand') {
      if(typeof message.id!=='string')throw new Error('invalid');return detection.expand(tabId,message.id,message.force===true);
    }
    if(message.type==='checkSource'){if(!Number.isInteger(tabId)||tabId<0||typeof message.id!=='string'||typeof message.variantId!=='string')throw new Error('invalid');return detection.check(tabId,message.id,message.variantId);}
    if(message.type==='enqueue')return enqueueMedia(message);
    if (message.type === 'settings') {
      const p = message.value;
      const previous=await settings();
      if (!p || !['light','dark','system'].includes(p.theme) || !['count','dot','hidden'].includes(p.badge) || typeof p.folder !== 'string' || !Array.isArray(p.blocked) || p.blocked.some((x: unknown) => typeof x !== 'string') || p.blocked.length > 100) throw new Error('invalid');
      const globalDetection=p.globalDetection??(await settings()).globalDetection;
      const saveAs=p.saveAs??(await settings()).saveAs;
      const multipart=p.multipart??previous.multipart,connections=p.connections??previous.connections,maxConcurrentFiles=p.maxConcurrentFiles===undefined?previous.maxConcurrentFiles:p.maxConcurrentFiles;
      const conversion=conversionOptions(p.conversion??previous.conversion),compression=conversionOptions(p.compression??previous.compression??compressionDefaults),captureQuality=p.captureQuality??previous.captureQuality??'high';if(!['source','high','standard'].includes(captureQuality))throw new Error('invalid');
      if(!sizePresets.includes(p.minSize)||typeof multipart!=='boolean'||![2,4,8].includes(connections)||typeof maxConcurrentFiles!=='number'||!concurrentFileOptions.some(value=>value===maxConcurrentFiles)||typeof globalDetection!=='boolean'||typeof saveAs!=='boolean')throw new Error('invalid');
      await chrome.storage.local.set({ settings: { theme: p.theme, badge: p.badge, folder: cleanFolder(p.folder),saveAs, blocked: [...new Set(p.blocked.map((x: string) => sitePattern(x.slice(0, 200))).filter(Boolean))], multipart,connections,maxConcurrentFiles,conversion,compression,captureQuality,minSize: p.minSize, globalDetection } });
      if(previous.minSize!==p.minSize)for(const tab of await chrome.tabs.query({}))if(tab.id!==undefined&&!tab.incognito)await detection.resetChecks(tab.id,true);
      await native.drain();await wakeManager();await detection.synchronize(); return true;
    }
    if (message.type === 'export') return publicMetadata(await allTasks());
    if (message.type === 'clearHistory') {
      if (!Array.isArray(message.ids) || message.ids.some((id: unknown) => typeof id !== 'string' || id.length > 128)) throw new Error('invalid');
      const ids = await navigator.locks.request('alcydeo:native-refresh', () => removeHistory(message.ids));
      if(LOCAL_BUILD)await import('../src/playlist-service').then(m=>m.clearPlaylistHistory());
      if (ids.length) {
        const root = await navigator.storage.getDirectory();
        for (const id of ids) await root.removeEntry(id, { recursive: true }).catch(() => {});
      }
      return ids.length;
    }
    if (typeof message.id !== 'string') throw new Error('invalid');
    const task = await getTask(message.id); if (!task) throw new Error('missing');
    if(message.type==='retryOutput')return navigator.locks.request(outputSaveLock(task.id),{ifAvailable:true},async lock=>{
      if(!lock)throw new Error('busy');await native.refresh();const current=await getTask(task.id);if(!current)throw new Error('missing');if(current.downloadId!==undefined)return true;if(!pendingOutput(current))throw new Error('invalid');
      await changeTask(task.id,t=>{if(pendingOutput(t)){t.error=undefined;delete t.outputSave;}});await manager();return true;
    });
    if(message.type==='nativeFallback'){if(task.media.kind!=='direct'||task.transfer?.mode!=='native'||!task.notices?.includes('multipartUnavailable'))throw new Error('invalid');await navigator.locks.request(mediaTaskLock(task.id),()=>{});await native.start(task);return true;}
    if(message.type==='stopLive'){if(!task.live)throw new Error('invalid');const next=await changeTask(task.id,t=>{t.live!.active=false;if(t.state==='queued'&&!t.live!.segments)t.state='cancelled';});await wakeManager(task.id,undefined,undefined,true);return next;}
    if(message.type==='recoverLive'){if(!task.live?.segments||!['paused','failed'].includes(task.state))throw new Error('invalid');await setState(task.id,'queued',{live:{...task.live,active:false,warning:task.live.warning??'liveInterrupted'}});await manager();return true;}
    if (message.type === 'favorite') return changeTask(task.id, t => { t.favorite = !t.favorite; });
    if (message.type === 'reveal') { if (task.downloadId === undefined) throw new Error('missing'); await chrome.downloads.show(task.downloadId); return true; }
    if (message.type === 'pause') { if (task.downloadId !== undefined) await chrome.downloads.pause(task.downloadId);const next=await setState(task.id,'paused');if(task.downloadId===undefined&&next.downloadId!==undefined)await chrome.downloads.pause(next.downloadId);await native.drain();await wakeManager(task.id);return next; }
    if (message.type === 'resume') { if(task.live)throw new Error('liveInterrupted');if(task.conversion&&!task.conversion.ready)throw new Error('conversionInput'); if(!managedTask(task)||task.downloadId!==undefined){await native.resume(task);return getTask(task.id);} const next=await setState(task.id, 'queued', { error: undefined });if(!managedTask(next))await native.start(next);else await manager();return next; }
    if (message.type === 'cancel') { if (task.downloadId !== undefined && !task.saved) await chrome.downloads.cancel(task.downloadId);const next=await setState(task.id,'cancelled');if(task.downloadId===undefined&&next.downloadId!==undefined&&!next.saved)await chrome.downloads.cancel(next.downloadId);await native.drain();await wakeManager(task.id);return next; }
    if (message.type === 'delete') { if (task.downloadSlot?.kind==='native'||(task.owner&&(task.leaseUntil??0)>=Date.now())||!['completed','failed','cancelled','paused'].includes(task.state)) throw new Error('busy'); await removeTask(task.id); const root = await navigator.storage.getDirectory(); await root.removeEntry(task.id, { recursive: true }).catch(() => {}); return true; }
    throw new Error('invalid');
  }
  if(LOCAL_BUILD)chrome.tabs.onRemoved.addListener(id=>{void chrome.storage.session.get(`playlist-manager:${id}`).then(value=>{if(value[`playlist-manager:${id}`])return import('../src/playlist-service').then(m=>m.playlistManagerClosed(id));}).catch(()=>{});});
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    const own = chrome.runtime.getURL('/');
    if (message?.type === 'domChanged' && sender.id === chrome.runtime.id && sender.tab?.id !== undefined && !sender.tab.incognito && sender.url) {
      void (async () => {
        const url = safeUrl(sender.url!); const origin = new URL(url).origin;
        if (!messageOriginMatches(sender,origin) || !await chrome.permissions.contains({origins:[`${origin}/*`]})) throw new Error('permission');
        if (blocked(new URL(url).hostname,(await settings()).blocked)) return;
        // The message is only a notification. Rescan the authorized frame; never trust its URLs.
        detection.changed(sender.tab!.id!);
      })().catch(() => {}); respond({ok:true}); return false;
    }
    if(['alcydeo.quickCast','alcydeo.quickCapture'].includes(message?.type))return false;
    if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(own) || !['/popup.html','/manager.html'].includes(new URL(sender.url).pathname)) return false;
    void handle(message).then(data => respond({ ok: true, data })).catch(error => { const code = error instanceof Error ? error.message : 'unknown'; respond({ ok: false, error: /^[a-zA-Z]+$/.test(code) ? code : 'unknown' }); }); return true;
  });
});
