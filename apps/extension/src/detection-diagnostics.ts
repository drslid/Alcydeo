import{blocked,type Media,type Settings}from'../../../packages/contracts';
import{LOCAL_BUILD}from'../../../packages/contracts/distribution';
import{eligibleMedia,visibleMedia}from'../../../packages/media-core/detection-policy';
import{tiktokPage}from'./tiktok-page';
import{tiktokPlayerPage}from'./tiktok-player-page';

const errorCodes=new Set(['permission','blocked','interrupted','network','script','cancelled','busy','expired','missing','html','notMedia','unsupported','range','retryLater','tooSmall','sourcePending','sourceChanged','invalid','encrypted','live','periods','timeline','codec','discontinuity','chooseQuality','manifestLimit','manifestLoop','duration','space']);
export function detectionFailure(error:unknown,fallback='script'){
 const message=error instanceof Error?error.message:typeof error==='string'?error:'';
 if(errorCodes.has(message))return message;
 if(/cannot access|host permission|manifest must request permission|not allowed to access/i.test(message))return'permission';
 if(/context invalidated|frame.*(?:removed|not found)|no (?:frame|document|tab)|navigat|tab.*closed/i.test(message)||error instanceof Error&&error.name==='AbortError')return'interrupted';
 return errorCodes.has(fallback)?fallback:'script';
}
export interface DiagnosticBudget{attempted:number;limit:number;expanded:number;expandLimit:number;activeChecks:number;waitingChecks:number}
export interface DiagnosticSource{kind:string;providerCategory:string;height?:number;width?:number;size?:number;declaredSize?:number;state:'unchecked'|'ready'|'unknown'|'unavailable';error?:string;alternativesCount:number;sourceGranted:boolean;sourceBlocked:boolean;pageCredentials?:'include'|'omit'}
export interface TikTokPageProbe{supported:boolean;observerActive:boolean;runtimeAvailable:boolean;cachedCatalog:boolean;scripts:{type:'universal'|'sigi'|'persisted';present:boolean;characters:number;truncated:boolean}[];videos:{width:number;height:number;readyState:number;paused:boolean;playbackAdvanced:boolean|null}[]}
export interface TikTokDiagnosticFrame extends TikTokPageProbe{topFrame:boolean;catalog:'notChecked'|'missing'|'refused'|'present'|'error';formats:number;player:'notNeeded'|'notChecked'|'missing'|'refused'|'present'|'error';playerFormats:number;error?:string}
export interface DetectionDiagnostics{
 version:string;distribution:'local'|'store';pageType:'tiktok-post'|'tiktok-other'|'web'|'internal'|'unknown';limitedReason?:'missing'|'private'|'internal'|'blocked'|'permission'|'disabled'|'pageChanged';
 autoEnabled:boolean;minSize:number;pageGranted:boolean;allSitesGranted:boolean;pageBlocked:boolean;rawMediaCount:number;eligibleCount:number;visibleCount:number;pending:boolean;budget:DiagnosticBudget;sources:DiagnosticSource[];
 tiktok?:{probeStatus:'ok'|'error'|'timeout'|'limited';error?:string;frameCount:number;frames:TikTokDiagnosticFrame[]};
}

// Serialized in the isolated world. No source URL, post id or script text is
// returned, no playback is started and no application function is called.
export async function tiktokDiagnosticPage(blockedSites:string[]=[],deadline=Date.now()+5000):Promise<TikTokPageProbe>{
 const host=location.hostname,supported=/^(?:www\.|m\.)?tiktok\.com$/.test(host)&&(/^\/@[^/]+\/video\/\d{10,25}(?:\/|$)/.test(location.pathname)||/^\/(?:embed(?:\/v2)?|player\/v1)\/\d{10,25}(?:\/|$)/.test(location.pathname));
 const result:TikTokPageProbe={supported,observerActive:false,runtimeAvailable:false,cachedCatalog:false,scripts:[],videos:[]};
 if(!supported||!Number.isFinite(deadline)||Date.now()>=deadline||blockedSites.some(p=>{const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'.*');return p.includes('*')?new RegExp(`^${escaped}$`).test(host)||(p.startsWith('*.')&&host===p.slice(2)):host===p||host.endsWith(`.${p}`);}))return result;
 const own=globalThis as typeof globalThis&{__alcydeoObserveCleanup?:unknown;__alcydeoTikTokCatalog?:unknown};
 result.observerActive=typeof own.__alcydeoObserveCleanup==='function';result.runtimeAvailable=typeof chrome!=='undefined'&&!!chrome.runtime?.id&&typeof chrome.runtime.sendMessage==='function';result.cachedCatalog=!!own.__alcydeoTikTokCatalog;
 for(const[type,id]of [['universal','__UNIVERSAL_DATA_FOR_REHYDRATION__'],['sigi','SIGI_STATE'],['persisted','sigi-persisted-data']]as const){
  const node=document.getElementById(id);let characters=0;if(node)for(let n=0;n<Math.min(32,node.childNodes.length);n++){const child=node.childNodes[n]!;if(child.nodeType===3||child.nodeType===4)characters+=(child as CharacterData).length;}
  result.scripts.push({type,present:!!node,characters:Math.min(8*1024*1024,characters),truncated:characters>8*1024*1024||!!node&&node.childNodes.length>32});
 }
 const videos=[...document.querySelectorAll('video')].slice(0,4),before=videos.map(video=>video.currentTime);
 const wait=Math.min(250,Math.max(0,deadline-Date.now()));if(wait>=100)await new Promise(resolve=>setTimeout(resolve,wait));
 result.videos=videos.map((video,index)=>({width:Math.max(0,Math.min(16384,video.videoWidth)),height:Math.max(0,Math.min(16384,video.videoHeight)),readyState:Math.max(0,Math.min(4,video.readyState)),paused:video.paused,playbackAdvanced:wait>=100&&Date.now()<deadline?Number.isFinite(video.currentTime)&&video.currentTime>before[index]!+.01:null}));
 return result;
}

export async function collectDetectionDiagnostics(id:number,context:{settings:()=>Promise<Settings>;media:Media[];pending:boolean;budget:DiagnosticBudget}):Promise<DetectionDiagnostics>{
 const prefs=await context.settings(),version=chrome.runtime.getManifest().version??'';
 const count=(value:unknown,max=10000)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?Math.min(max,value):0;
 const budget=context.budget;
 const report:DetectionDiagnostics={version:/^\d+(?:\.\d+){1,3}$/.test(version)?version:'unknown',distribution:LOCAL_BUILD?'local':'store',pageType:'unknown',autoEnabled:prefs.globalDetection===true,minSize:count(prefs.minSize,Number.MAX_SAFE_INTEGER),pageGranted:false,allSitesGranted:await chrome.permissions.contains({origins:['http://*/*','https://*/*']}).catch(()=>false),pageBlocked:false,rawMediaCount:0,eligibleCount:0,visibleCount:0,pending:context.pending===true,budget:{attempted:count(budget.attempted),limit:count(budget.limit),expanded:count(budget.expanded),expandLimit:count(budget.expandLimit),activeChecks:count(budget.activeChecks),waitingChecks:count(budget.waitingChecks)},sources:[]};
 const tab=await chrome.tabs.get(id).catch(()=>undefined);if(!tab?.url){report.limitedReason='missing';return report;}
 const pageUrl=tab.url;let page:URL;try{page=new URL(pageUrl);}catch{report.limitedReason='internal';return report;}
 const tiktok=/^(?:www\.|m\.)?tiktok\.com$/.test(page.hostname);
 report.pageType=!/^https?:$/.test(page.protocol)?'internal':tiktok?(/^\/@[^/]+\/video\/\d{10,25}(?:\/|$)/.test(page.pathname)||/^\/(?:embed(?:\/v2)?|player\/v1)\/\d{10,25}(?:\/|$)/.test(page.pathname)?'tiktok-post':'tiktok-other'):'web';
 report.pageBlocked=blocked(page.hostname,prefs.blocked);report.pageGranted=/^https?:$/.test(page.protocol)&&await chrome.permissions.contains({origins:[`${page.origin}/*`]}).catch(()=>false);
 async function limited(){
  const current=await chrome.tabs.get(id).catch(()=>undefined);if(!current?.url)return'missing'as const;if(current.incognito)return'private'as const;if(current.url!==pageUrl)return'pageChanged'as const;
  const p=await context.settings();if(!/^https?:$/.test(page.protocol))return'internal'as const;if(blocked(page.hostname,p.blocked))return'blocked'as const;if(!await chrome.permissions.contains({origins:[`${page.origin}/*`]}).catch(()=>false))return'permission'as const;if(!p.globalDetection)return'disabled'as const;
 }
 function limit(reason:NonNullable<DetectionDiagnostics['limitedReason']>){report.limitedReason=reason;report.sources=[];report.rawMediaCount=report.eligibleCount=report.visibleCount=0;if(report.tiktok){report.tiktok.probeStatus='limited';report.tiktok.frames=[];}return report;}
 const reason=await limited();if(reason)return limit(reason);
 const media=context.media.filter(item=>item.tabId===id&&item.pageUrl===pageUrl);report.rawMediaCount=media.length;report.eligibleCount=eligibleMedia(media,prefs).length;report.visibleCount=visibleMedia(media,prefs).length;
 const kinds=new Set(['direct','hls','dash','adaptive','sabr']),number=(value:unknown,max=Number.MAX_SAFE_INTEGER)=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=max?value:undefined;
 for(const {item,variant}of media.flatMap(item=>item.variants.map(variant=>({item,variant}))).slice(0,24)){
  const providerCategory=['tiktok','youtube','instagram','x','vk'].find(provider=>item.providerId?.startsWith(provider+':'))??'generic';let sourceGranted=false,sourceBlocked=false;
  try{const source=new URL(variant.url);sourceBlocked=blocked(source.hostname,prefs.blocked);sourceGranted=/^https?:$/.test(source.protocol)&&await chrome.permissions.contains({origins:[`${source.origin}/*`]}).catch(()=>false);}catch{/* The malformed address itself is never exported. */}
  const check=variant.check;report.sources.push({kind:kinds.has(item.kind)?item.kind:'unknown',providerCategory,height:number(check?.height??variant.height,16384),width:number(check?.width??variant.width,16384),size:number(check?.size),declaredSize:check?.size===undefined?number(variant.size):undefined,state:check?.state==='ready'||check?.state==='unknown'||check?.state==='unavailable'?check.state:'unchecked',error:check?.error?errorCodes.has(check.error)?check.error:'unknown':undefined,alternativesCount:new Set([variant.url,...(variant.sourceUrls??[]).slice(0,64)]).size,sourceGranted,sourceBlocked,...(check?.pageCredentials==='include'||check?.pageCredentials==='omit'?{pageCredentials:check.pageCredentials}:{})});
 }
 const afterSources=await limited();if(afterSources)return limit(afterSources);
 if(!tiktok)return report;
 report.tiktok={probeStatus:'ok',frameCount:0,frames:[]};const deadline=Date.now()+5000;
 async function run<T>(work:()=>Promise<T>):Promise<{value?:T;error?:string}>{
  if(Date.now()>=deadline)return{error:'interrupted'};
  return new Promise(resolve=>{let settled=false;const finish=(value:{value?:T;error?:string})=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value);},timer=setTimeout(()=>finish({error:'interrupted'}),deadline-Date.now());try{void work().then(value=>finish({value}),error=>finish({error:detectionFailure(error)}));}catch(error){finish({error:detectionFailure(error)});}});
 }
 let checkLimit=await limited();if(checkLimit)return limit(checkLimit);
 const probe=await run(()=>chrome.scripting.executeScript({target:{tabId:id,allFrames:true},func:tiktokDiagnosticPage,args:[prefs.blocked,deadline],injectImmediately:true}));
 if(probe.error){checkLimit=await limited();if(checkLimit)return limit(checkLimit);report.tiktok.probeStatus=probe.error==='interrupted'?'timeout':'error';report.tiktok.error=probe.error;return report;}
 checkLimit=await limited();if(checkLimit)return limit(checkLimit);
 const frames=(probe.value??[]).filter(frame=>!!frame.result?.supported&&typeof frame.documentId==='string').slice(0,8);report.tiktok.frameCount=(probe.value??[]).filter(frame=>!!frame.result?.supported).length;
 for(const frame of frames){const value=frame.result!;report.tiktok.frames.push({supported:value.supported===true,observerActive:value.observerActive===true,runtimeAvailable:value.runtimeAvailable===true,cachedCatalog:value.cachedCatalog===true,scripts:(value.scripts??[]).slice(0,3).filter(script=>['universal','sigi','persisted'].includes(script.type)).map(script=>({type:script.type,present:script.present===true,characters:count(script.characters,8*1024*1024),truncated:script.truncated===true})),videos:(value.videos??[]).slice(0,4).map(video=>({width:count(video.width,16384),height:count(video.height,16384),readyState:count(video.readyState,4),paused:video.paused===true,playbackAdvanced:typeof video.playbackAdvanced==='boolean'?video.playbackAdvanced:null})),topFrame:frame.frameId===0,catalog:'notChecked',formats:0,player:'notChecked',playerFormats:0});}
 if(!frames.length)return report;
 const catalog=await run(()=>chrome.scripting.executeScript({target:{tabId:id,documentIds:frames.map(frame=>frame.documentId)},func:tiktokPage,args:[prefs.blocked,[],false],injectImmediately:true}));
 checkLimit=await limited();if(checkLimit)return limit(checkLimit);
 if(catalog.error){report.tiktok.probeStatus=catalog.error==='interrupted'?'timeout':'error';report.tiktok.error=catalog.error;return report;}
 for(const [index,frame]of frames.entries()){
  const row=report.tiktok.frames[index]!,native=catalog.value?.find(value=>value.documentId===frame.documentId)?.result;
  row.catalog=native==null?'missing':native.formats.length?'present':'refused';row.formats=Math.min(24,native?.formats.length??0);
  if(native!=null){row.player='notNeeded';continue;}
  checkLimit=await limited();if(checkLimit)return limit(checkLimit);
  const player=await run(()=>chrome.scripting.executeScript({target:{tabId:id,documentIds:[frame.documentId]},world:'MAIN',func:tiktokPlayerPage,args:[prefs.blocked],injectImmediately:true}));
  if(player.error){row.player='error';row.error=player.error;if(player.error==='interrupted'){report.tiktok.probeStatus='timeout';report.tiktok.error='interrupted';break;}continue;}
  const text=player.value?.[0]?.result;if(typeof text!=='string'||text.length>8*1024*1024){row.player='missing';continue;}
  checkLimit=await limited();if(checkLimit)return limit(checkLimit);
  const parsed=await run(()=>chrome.scripting.executeScript({target:{tabId:id,documentIds:[frame.documentId]},func:tiktokPage,args:[prefs.blocked,[text],false],injectImmediately:true}));
  if(parsed.error){row.player='error';row.error=parsed.error;if(parsed.error==='interrupted'){report.tiktok.probeStatus='timeout';report.tiktok.error='interrupted';break;}continue;}
  const value=parsed.value?.[0]?.result;row.player=value==null?'missing':value.formats.length?'present':'refused';row.playerFormats=Math.min(24,value?.formats.length??0);
 }
 checkLimit=await limited();return checkLimit?limit(checkLimit):report;
}
