import{blocked,type Settings}from'../../../packages/contracts';
import{playlistId,playlistLimit,playlistSummary,type PlaylistEntry}from'../../../packages/playlists/contracts';
import{catalog,catalogs,putCatalog,removeCatalog}from'../../../packages/playlists/storage';
import{youtubePlaylistPage}from'./youtube-playlist-page';
export async function playlistTab(tabId:number,prefs:Settings){
 if(!Number.isInteger(tabId)||tabId<0)throw new Error('invalid');const tab=await chrome.tabs.get(tabId);
 if(tab.incognito)throw new Error('private');if(!tab.url||!playlistId(tab.url))throw new Error('missing');const url=new URL(tab.url);
 if(blocked(url.hostname,prefs.blocked))throw new Error('blocked');if(!await chrome.permissions.contains({origins:[`${url.origin}/*`]}))throw new Error('permission');return tab;
}
export async function forgetPlaylist(tabId:number){await navigator.locks.request(`alcydeo:playlist-catalog:${tabId}`,async()=>{await removeCatalog(tabId);await chrome.storage.session.remove(`playlist:${tabId}`);});}
export async function prunePlaylists(){for(const value of await catalogs()){const tab=await chrome.tabs.get(value.tabId).catch(()=>undefined),stored=(await chrome.storage.session.get(`playlist:${value.tabId}`))[`playlist:${value.tabId}`];if(!stored||!tab||tab.incognito||tab.url!==value.pageUrl)await forgetPlaylist(value.tabId);}}
export async function readPlaylist(tabId:number,prefs:Settings,options:{more?:boolean;after?:number;force?:boolean}={}){
 return navigator.locks.request(`alcydeo:playlist-catalog:${tabId}`,async()=>{
  const tab=await playlistTab(tabId,prefs),id=playlistId(tab.url!)!;let current=await catalog(tabId);
  if(!current||current.pageUrl!==tab.url||current.id!==id||options.force)current=undefined;
  const after=Number.isInteger(options.after)&&options.after!>=0?options.after!:0;
  if(!current||options.more&&!current.complete&&after>=current.entries.length){
   if(current&&(current.pages>=100||current.entries.length>=playlistLimit||!current.continuation||current.seen.includes(current.continuation)))throw new Error('playlistLimit');
   const result=await chrome.scripting.executeScript({target:{tabId,frameIds:[0]},world:'MAIN',func:youtubePlaylistPage,args:current?.continuation?[current.continuation]:[],injectImmediately:true});const raw=result[0]?.result;
   if((await playlistTab(tabId,prefs)).url!==tab.url)throw new Error('missing');
   if(!raw||'error'in raw||raw.id!==id||!Array.isArray(raw.entries)||raw.entries.length>playlistLimit)throw new Error('playlistRead');
   const entries:PlaylistEntry[]=[...(current?.entries??[])],keys=new Set(entries.map(e=>e.key));
   for(const row of raw.entries){const index=Number.isInteger(row.index)&&row.index!>=0&&row.index!<1_000_000?row.index!:entries.length;const videoId=typeof row.videoId==='string'&&/^[-\w]{11}$/.test(row.videoId)?row.videoId:undefined;
    const key=`${index}:${videoId??'unavailable'}:${typeof row.setId==='string'?row.setId.slice(0,150):''}`;if(keys.has(key))continue;
    if(entries.length>=playlistLimit)throw new Error('playlistLimit');entries.push({key,videoId,index,title:typeof row.title==='string'?row.title.slice(0,300):'',available:!!videoId&&row.available===true,reason:row.reason==='live'?'live':row.available===true?undefined:'unavailable'});keys.add(key);
   }
   if(current&&entries.length===current.entries.length&&raw.continuation)throw new Error('playlistRead');
   const token=typeof raw.continuation==='string'&&raw.continuation.length<=8192?raw.continuation:undefined;
   current={tabId,pageUrl:tab.url!,id,title:current?.title||String(raw.title||tab.title||'YouTube').slice(0,300),entries,continuation:token,seen:[...(current?.seen??[]),...(current?.continuation?[current.continuation]:[])],pages:(current?.pages??0)+1,complete:!token,snapshot:raw.snapshot===true||undefined,revision:current?.revision??crypto.randomUUID(),updatedAt:Date.now()};
   await putCatalog(current);await chrome.storage.session.set({[`playlist:${tabId}`]:playlistSummary(current)});
   const previous=(await catalogs()).filter(c=>c.tabId!==tabId).sort((a,b)=>b.updatedAt-a.updatedAt);for(const stale of previous.slice(7))await removeCatalog(stale.tabId);
  }
  return{...playlistSummary(current),entries:current.entries.slice(after)};
 });
}
