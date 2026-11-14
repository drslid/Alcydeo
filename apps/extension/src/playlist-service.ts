import{cleanName,blocked,type Media,type Settings,type Task}from'../../../packages/contracts';
import{getTask,changeTask}from'../../../packages/storage';
import{batch,batches,catalog,putBatch,changeBatch,removeBatch}from'../../../packages/playlists/storage';
import{playlistLimit,playlistId,playlistBatchView,type PlaylistBatch}from'../../../packages/playlists/contracts';
import{readPlaylist,playlistTab}from'./playlist-catalog';
export interface PlaylistTaskOptions{id:string;title:string;destination:Task['destination'];playlist:Task['playlist'];scope:{tabId:number;pageUrl:string}}
interface Context{settings:()=>Promise<Settings>;cached:(id:number)=>Promise<Media[]>;enqueue:(message:any,options?:PlaylistTaskOptions)=>Promise<string>}
const currentItem=(job:PlaylistBatch)=>job.items.find(i=>!['completed','failed','cancelled'].includes(i.state));
async function closeHelper(job:PlaylistBatch){
 if(job.helperTabId===undefined)return;const tab=await chrome.tabs.get(job.helperTabId).catch(()=>undefined),key=`playlist-helper:${job.helperTabId}`,marker=(await chrome.storage.session.get(key))[key];
 if(marker===job.id&&tab&&(tab.url==='about:blank'||tab.url===`https://www.youtube.com/watch?v=${job.helperVideoId}`))await chrome.tabs.remove(job.helperTabId).catch(()=>{});
 await chrome.storage.session.remove(key);await changeBatch(job.id,value=>{delete value.helperTabId;delete value.helperVideoId;},false).catch(()=>{});
}
export const closePlaylistHelper=(job:PlaylistBatch)=>navigator.locks.request(`alcydeo:playlist-helper:${job.id}`,()=>closeHelper(job));
export async function playlistManagerClosed(tabId:number){for(const job of await batches())if(job.managerTabId===tabId&&job.state==='running'){
 const item=currentItem(job),task=item?.taskId?await getTask(item.taskId):undefined;if(task&&!task.saved&&!['completed','failed','cancelled'].includes(task.state)){if(task.downloadId!==undefined)await chrome.downloads.pause(task.downloadId).catch(()=>{});await changeTask(task.id,t=>{if(!t.saved)t.state='paused';});}
 await changeBatch(job.id,b=>{if(b.managerTabId===tabId&&b.state==='running'){b.state='paused';b.error='playlistInterrupted';delete b.owner;delete b.leaseUntil;}});await closePlaylistHelper(job);
}await chrome.storage.session.remove(`playlist-manager:${tabId}`);}
export async function clearPlaylistHistory(){for(const job of await batches())if(['completed','cancelled'].includes(job.state)){let retained=false;for(const item of job.items)if(item.taskId&&await getTask(item.taskId)){retained=true;break;}if(!retained)await removeBatch(job.id);}}
export async function playlistMessage(message:any,context:Context){
 const prefs=await context.settings(),tabId=Number(message.tabId);
 if(message.type==='youtubePlaylistGet')return readPlaylist(tabId,prefs,{more:message.more===true,after:message.after,force:message.force===true});
 if(message.type==='youtubePlaylistStart')return navigator.locks.request(`alcydeo:playlist-start:${tabId}`,async()=>{
  const source=await playlistTab(tabId,prefs),list=await catalog(tabId);
  if(!list||list.pageUrl!==source.url||list.revision!==message.revision||!list.complete)throw new Error('playlistRead');
  if(!Array.isArray(message.keys)||!message.keys.length||message.keys.length>playlistLimit||message.keys.some((v:unknown)=>typeof v!=='string'||v.length>250)||![0,480,720,1080].includes(message.quality))throw new Error('invalid');
  const keys=new Set<string>(message.keys),entries=list.entries.filter(e=>keys.has(e.key));if(entries.length!==keys.size||entries.some(e=>!e.available||!e.videoId))throw new Error('invalid');
  const existing=(await batches()).find(b=>b.sourceTabId===tabId&&b.playlistId===list.id&&['queued','running','paused'].includes(b.state));
  if(existing){if(JSON.stringify(existing.items.map(i=>i.key))!==JSON.stringify(entries.map(i=>i.key)))throw new Error('busy');return existing.id;}
  const records=await batches();if(records.filter(b=>['queued','running','paused'].includes(b.state)).length>=4)throw new Error('busy');for(const old of records.filter(b=>['completed','cancelled'].includes(b.state)).sort((a,b)=>b.createdAt-a.createdAt).slice(19))await removeBatch(old.id);
  const now=Date.now(),job:PlaylistBatch={id:crypto.randomUUID(),playlistId:list.id,revision:list.revision,sourceTabId:tabId,pageUrl:list.pageUrl,title:list.title,items:entries.map(e=>({...e,state:'queued'})),state:'queued',quality:message.quality,destination:{folder:prefs.folder,subfolder:cleanName(list.title),saveAs:prefs.saveAs},createdAt:now,updatedAt:now};await putBatch(job);return job.id;
 });
 if(message.type==='youtubePlaylistJobs'){
  for(const job of await batches())if(job.state==='running'&&(job.leaseUntil??0)<Date.now()){
   const next=await changeBatch(job.id,value=>{if(value.state==='running'&&(value.leaseUntil??0)<Date.now()){value.state='paused';value.error='playlistInterrupted';delete value.owner;delete value.leaseUntil;}});
   if(next.state==='paused'&&next.error==='playlistInterrupted'){
    const item=currentItem(next),task=item?.taskId?await getTask(item.taskId):undefined;
    if(task&&!task.saved&&!['completed','failed','cancelled'].includes(task.state)){if(task.downloadId!==undefined)await chrome.downloads.pause(task.downloadId).catch(()=>{});await changeTask(task.id,t=>{if(!t.saved)t.state='paused';});}
    await closePlaylistHelper(next);
   }
  }
  return(await batches()).filter(b=>['queued','running','paused'].includes(b.state)).map(({items,...job})=>({...job,total:items.length}));
 }
 if(message.type==='youtubePlaylistList')return(await batches()).sort((a,b)=>b.createdAt-a.createdAt).filter((b,index)=>!['completed','cancelled'].includes(b.state)||index<3).map(playlistBatchView);
 if(message.type==='youtubePlaylistStatus'){
  const job=typeof message.id==='string'?await batch(message.id):(await batches()).filter(b=>b.sourceTabId===tabId&&b.playlistId===playlistId(message.pageUrl)).sort((a,b)=>b.createdAt-a.createdAt)[0];if(!job)return;
  if(job.updatedAt===message.since)return{unchanged:true};
  if(message.compact===true)return{...playlistBatchView(job),quality:job.quality,updatedAt:job.updatedAt,keys:message.since===undefined?job.items.map(i=>i.key):undefined};
  if(message.runner===true)return{...job,items:currentItem(job)?[currentItem(job)!]:[]};
  return job;
 }
 if(typeof message.id!=='string'||message.id.length>128)throw new Error('invalid');const job=await batch(message.id);if(!job)throw new Error('missing');
 if(message.type==='youtubePlaylistControl'){
  if(!['pause','resume','cancel','retry'].includes(message.action))throw new Error('invalid');
  if(['pause','cancel'].includes(message.action)&&['completed','cancelled'].includes(job.state))return true;
  const item=currentItem(job),task=item?.taskId?await getTask(item.taskId):undefined;
  if(message.action==='resume'){
   if(job.state!=='paused')throw new Error('invalid');
   if(task&&!task.saved&&task.output&&task.validation){await changeTask(task.id,t=>{t.state='validating';t.error=undefined;delete t.outputSave;});}
   else if(task&&!task.saved&&['paused','failed','cancelled'].includes(task.state)){await changeTask(task.id,t=>{t.state='cancelled';});await changeBatch(job.id,b=>{const row=b.items.find(i=>i.key===item!.key)!;delete row.taskId;row.state='queued';delete row.error;});}
  }
  if(['pause','cancel'].includes(message.action)&&task&&!task.saved&&!['completed','failed','cancelled'].includes(task.state)){
   if(task.downloadId!==undefined)await(message.action==='cancel'?chrome.downloads.cancel(task.downloadId):chrome.downloads.pause(task.downloadId)).catch(()=>{});
   await changeTask(task.id,t=>{if(!t.saved)t.state=message.action==='cancel'?'cancelled':'paused';});
  }
  await changeBatch(job.id,b=>{if(message.action==='retry'){if(!['completed','paused'].includes(b.state))throw new Error('busy');for(const row of b.items)if(row.state==='failed'){row.state='queued';delete row.taskId;delete row.error;}b.state='queued';}
   else{b.state=message.action==='cancel'?'cancelled':message.action==='pause'?'paused':'queued';if(message.action==='cancel')for(const row of b.items)if(!['completed','failed'].includes(row.state))row.state='cancelled';}delete b.error;delete b.owner;delete b.leaseUntil;});
  if(message.action!=='resume'&&message.action!=='retry')await closePlaylistHelper(job);return true;
 }
 if(message.type==='youtubePlaylistClaim'){
  if(typeof message.owner!=='string'||message.owner.length>100||!Number.isInteger(message.managerTabId))throw new Error('invalid');const manager=await chrome.tabs.get(message.managerTabId);if(manager.incognito||manager.url?.split(/[?#]/)[0]!==chrome.runtime.getURL('/manager.html'))throw new Error('invalid');let granted=false;
  await changeBatch(job.id,b=>{if(b.state!=='queued'||b.owner&&(b.leaseUntil??0)>=Date.now())return;b.owner=message.owner;b.managerTabId=manager.id;b.leaseUntil=Date.now()+30000;b.state='running';delete b.error;granted=true;});if(granted)await chrome.storage.session.set({[`playlist-manager:${manager.id}`]:true});return granted?await batch(job.id):undefined;
 }
 if(job.state!=='running'||job.owner!==message.owner||(job.leaseUntil??0)<Date.now())throw new Error('playlistStopped');
 if(message.type==='youtubePlaylistHeartbeat'){await changeBatch(job.id,b=>{if(b.owner!==message.owner||b.state!=='running')throw new Error('playlistStopped');b.leaseUntil=Date.now()+30000;},false);return true;}
 if(message.type==='youtubePlaylistHelper')return navigator.locks.request(`alcydeo:playlist-helper:${job.id}`,async()=>{
  const job=await batch(message.id);if(!job||job.state!=='running'||job.owner!==message.owner)throw new Error('playlistStopped');
  const item=currentItem(job);if(!item?.videoId||item.key!==message.key)throw new Error('invalid');if(blocked('www.youtube.com',prefs.blocked))throw new Error('blocked');if(!await chrome.permissions.contains({origins:['https://www.youtube.com/*']}))throw new Error('permission');
  const url=`https://www.youtube.com/watch?v=${item.videoId}`;let tab=job.helperTabId!==undefined?await chrome.tabs.get(job.helperTabId).catch(()=>undefined):undefined;
  if(job.helperTabId!==undefined&&(!tab||(await chrome.storage.session.get(`playlist-helper:${job.helperTabId}`))[`playlist-helper:${job.helperTabId}`]!==job.id||tab.url!==`https://www.youtube.com/watch?v=${job.helperVideoId}`&&tab.url!=='about:blank'))throw new Error('playlistTabClosed');
  if(!tab){tab=await chrome.tabs.create({url:'about:blank',active:false});if(tab.id===undefined)throw new Error('playlistRead');await chrome.storage.session.set({[`playlist-helper:${tab.id}`]:job.id});}
  const next=await changeBatch(job.id,b=>{b.helperTabId=tab!.id;b.helperVideoId=item.videoId;if(b.state==='running'&&b.owner===message.owner){const row=b.items.find(r=>r.key===item.key)!;row.state='resolving';}});
  if(next.state!=='running'||next.owner!==message.owner){await closeHelper(next);throw new Error('playlistStopped');}
  await chrome.tabs.update(tab.id!,{muted:true,url});return tab.id;
 });
 if(message.type==='youtubePlaylistEnqueue')return navigator.locks.request(`alcydeo:playlist-item:${job.id}`,async()=>{
  const fresh=await batch(job.id);if(!fresh||fresh.state!=='running'||fresh.owner!==message.owner)throw new Error('playlistStopped');const item=currentItem(fresh);if(!item?.videoId||item.key!==message.key||fresh.helperTabId===undefined)throw new Error('invalid');
  if(item.taskId&&await getTask(item.taskId))return item.taskId;
  const tab=await chrome.tabs.get(fresh.helperTabId);if(tab.incognito||tab.url!==`https://www.youtube.com/watch?v=${item.videoId}`)throw new Error('playlistTabClosed');
  const media=(await context.cached(tab.id!)).find(m=>m.providerId===`youtube:${item.videoId}`);if(!media||media.pending)throw new Error('sourcePending');if(media.live||media.captureOnly)throw new Error('live');
  const variants=media.variants.filter(v=>!fresh.quality||v.height!==undefined&&v.height<=fresh.quality).sort((a,b)=>(b.height??0)-(a.height??0));const variant=variants[0];if(!variant)throw new Error('playlistQuality');
  const taskId=item.taskId??crypto.randomUUID();await changeBatch(job.id,b=>{const row=b.items.find(i=>i.key===item.key)!;row.taskId=taskId;});
  const title=`${String(item.index+1).padStart(Math.max(3,String(Math.max(...fresh.items.map(i=>i.index+1))).length),'0')} - ${media.title||item.title}`;
  await context.enqueue({tabId:tab.id,id:media.id,variantId:variant.id},{id:taskId,title,destination:fresh.destination,playlist:{batchId:job.id,videoId:item.videoId,index:item.index},scope:{tabId:fresh.sourceTabId,pageUrl:fresh.pageUrl}});
  const latest=await batch(job.id);if(!latest||latest.state!=='running'||latest.owner!==message.owner){await changeTask(taskId,t=>{if(!t.saved)t.state=latest?.state==='cancelled'?'cancelled':'paused';});throw new Error('playlistStopped');}
  await changeBatch(job.id,b=>{const row=b.items.find(i=>i.key===item.key)!;if(b.state==='running'){row.state='downloading';delete row.error;}});return taskId;
 });
 if(message.type==='youtubePlaylistItem'){
  const item=currentItem(job);if(!item||item.key!==message.key||!['completed','failed'].includes(message.state))throw new Error('invalid');
  if(message.state==='completed'){const task=item.taskId?await getTask(item.taskId):undefined;if(!task?.saved||!task.validation)throw new Error('playlistNotSaved');}
  await changeBatch(job.id,b=>{if(b.state!=='running'||b.owner!==message.owner)throw new Error('playlistStopped');const row=b.items.find(r=>r.key===item.key)!;row.state=message.state;row.error=typeof message.error==='string'&&/^[a-zA-Z]{1,80}$/.test(message.error)?message.error:undefined;});return true;
 }
 if(message.type==='youtubePlaylistFinish'){if(currentItem(job))throw new Error('busy');await closePlaylistHelper(job);await changeBatch(job.id,b=>{if(b.owner===message.owner&&b.state==='running'){b.state='completed';delete b.owner;delete b.leaseUntil;}});return true;}
 throw new Error('invalid');
}
