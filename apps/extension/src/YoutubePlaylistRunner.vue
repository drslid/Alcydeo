<script setup lang="ts">
import{onMounted,onUnmounted}from'vue';
import{api}from'./api';import{getTask}from'../../../packages/storage';import type{PlaylistBatch,PlaylistItem}from'../../../packages/playlists/contracts';import{startPlaylistVideo,pausePlaylistVideo}from'./youtube-playlist-page';
let timer:ReturnType<typeof setInterval>,busy=false,disposed=false,active='';const owner=crypto.randomUUID();
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
async function status(id:string){if(disposed)throw new Error('playlistStopped');const job=await api<PlaylistBatch>('youtubePlaylistStatus',{id,runner:true});if(!job||job.state!=='running'||job.owner!==owner)throw new Error('playlistStopped');return job;}
async function resolve(job:PlaylistBatch,item:PlaylistItem){
 const helper=await api<number>('youtubePlaylistHelper',{id:job.id,owner,key:item.key});const deadline=Date.now()+45000;let lastPlay=0;
 while(Date.now()<deadline){
  await status(job.id);const tab=await chrome.tabs.get(helper).catch(()=>undefined);if(!tab)throw new Error('playlistTabClosed');
  if(tab.url!==`https://www.youtube.com/watch?v=${item.videoId}`){if(tab.pendingUrl===`https://www.youtube.com/watch?v=${item.videoId}`||tab.url==='about:blank'){await wait(300);continue;}throw new Error('playlistTabClosed');}
  if(Date.now()-lastPlay>2000){lastPlay=Date.now();const results=await chrome.scripting.executeScript({target:{tabId:helper},world:'MAIN',func:startPlaylistVideo,args:[item.videoId!],injectImmediately:true}).catch(()=>[]);const error=results[0]?.result;if(typeof error==='string')throw new Error(error);}
  try{await api('scan',{tabId:helper});const taskId=await api<string>('youtubePlaylistEnqueue',{id:job.id,owner,key:item.key});await chrome.scripting.executeScript({target:{tabId:helper},world:'MAIN',func:pausePlaylistVideo,args:[item.videoId!]}).catch(()=>{});return taskId;}
  catch(error){if(!['sourcePending','missing'].includes((error as Error).message))throw error;}
  await wait(500);
 }
 throw new Error('playlistPlayer');
}
async function run(job:PlaylistBatch){
 active=job.id;let heartbeatBusy=false;const heartbeat=setInterval(()=>{if(heartbeatBusy)return;heartbeatBusy=true;void api('youtubePlaylistHeartbeat',{id:job.id,owner}).catch(()=>{}).finally(()=>{heartbeatBusy=false;});},5000);
 try{while(!disposed){
  job=await status(job.id);const item=job.items.find(i=>!['completed','failed','cancelled'].includes(i.state));if(!item){await api('youtubePlaylistFinish',{id:job.id,owner});return;}
  try{
   let taskId=item.taskId;if(!taskId||!await getTask(taskId))taskId=await resolve(job,item);
   while(true){await status(job.id);const task=await getTask(taskId);if(!task)throw new Error('missing');
    if(task.saved&&task.validation){await api('youtubePlaylistItem',{id:job.id,owner,key:item.key,state:'completed'});break;}
    if(task.output&&task.validation&&task.error||task.state==='paused'){await api('youtubePlaylistControl',{id:job.id,action:'pause'});return;}
    if(['failed','cancelled'].includes(task.state))throw new Error(task.error??'interrupted');await wait(500);
   }
  }catch(error){const code=error instanceof Error?error.message:'interrupted';if(code==='playlistStopped')return;
   if(['permission','blocked','playlistTabClosed'].includes(code)){await api('youtubePlaylistControl',{id:job.id,action:'pause'});return;}
   await api('youtubePlaylistItem',{id:job.id,owner,key:item.key,state:'failed',error:/^[a-zA-Z]{1,80}$/.test(code)?code:'interrupted'});
  }
 }}finally{clearInterval(heartbeat);active='';}
}
async function tick(){if(busy||disposed)return;busy=true;try{await navigator.locks.request('alcydeo:youtube-playlist-runner',{ifAvailable:true},async lock=>{
 if(!lock||disposed)return;const jobs=await api<PlaylistBatch[]>('youtubePlaylistJobs'),next=jobs.filter(j=>j.state==='queued').sort((a,b)=>a.createdAt-b.createdAt)[0];if(!next)return;
 const manager=await chrome.tabs.getCurrent();if(manager?.id===undefined)return;const owned=await api<PlaylistBatch|undefined>('youtubePlaylistClaim',{id:next.id,owner,managerTabId:manager.id});if(owned)await run(owned);
});}catch{/* Interrupted ownership is surfaced by the persisted job and lease. */}finally{busy=false;}}
onMounted(()=>{void tick();timer=setInterval(()=>{void tick();},1000);});
onUnmounted(()=>{disposed=true;clearInterval(timer);if(active)void api('youtubePlaylistControl',{id:active,action:'pause'}).catch(()=>{});});
</script>
<template><span hidden aria-hidden="true" /></template>
