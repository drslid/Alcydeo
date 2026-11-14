import{blocked,type Task,type MediaNotice}from'../../../packages/contracts';
import{getTask,changeTask,setState}from'../../../packages/storage';
import{parseLiveHls,nextLiveSegments,segmentIdentity}from'../../../packages/media-core/live-hls';
import{mediaFetch,manifestText}from'../../../packages/media-core/network';
import{htmlResponse}from'../../../packages/media-core/classification';
import{prefixKind}from'../../../packages/media-core/preflight';
import{remux,validate}from'../../../packages/media-core/engine';
import type{Segment}from'../../../packages/media-core/hls';
const fileName='live-source';
export async function recordLive(task:Task,dir:FileSystemDirectoryHandle,signal:AbortSignal,finish:AbortSignal,notice:(code:MediaNotice)=>void){
 const live={...task.live!};const source=await dir.getFileHandle(fileName,{create:true});let handle:FileSystemSyncAccessHandle|undefined=await source.createSyncAccessHandle();
 if(handle.getSize()<live.bytes){handle.close();throw new Error('invalid');}handle.truncate(live.bytes);handle.flush();
 const allowed=(url:string)=>{if(blocked(new URL(url).hostname,live.blocked??[]))throw new Error('blocked');};
 async function segment(segment:Segment,media:boolean){
  allowed(segment.url);
  const committed=live.bytes;let offset=committed;const response=await mediaFetch(segment.url,{signal:AbortSignal.any([signal,AbortSignal.timeout(30000)]),headers:segment.range?{Range:`bytes=${segment.range.start}-${segment.range.start+segment.range.length-1}`} :undefined});
  const reader=response.body?.getReader();try{
   if(htmlResponse(response.headers.get('content-type')??''))throw new Error('html');
   if(segment.range){const range=/^bytes (\d+)-(\d+)\/(?:\d+|\*)$/.exec(response.headers.get('content-range')??'');if(response.status!==206||!range||Number(range[1])!==segment.range.start||Number(range[2])!==segment.range.start+segment.range.length-1)throw new Error('range');}
   const estimate=await navigator.storage.estimate();if(estimate.quota!==undefined&&estimate.quota-(estimate.usage??0)<Math.ceil((committed+(Number(response.headers.get('content-length'))||0))*1.05)+16*1024*1024)throw new Error('space');
   if(!reader)throw new Error('network');const prefix=new Uint8Array(4096);let length=0;
   while(true){const{done,value}=await reader.read();if(done)break;if(signal.aborted)throw new Error('cancelled');if(length<4096){const take=Math.min(value.length,4096-length);prefix.set(value.subarray(0,take),length);length+=take;const kind=prefixKind(prefix.subarray(0,length));if(kind==='html'||kind==='notMedia')throw new Error(kind);}const written=handle!.write(value,{at:offset});if(written!==value.byteLength)throw new Error('space');offset+=written;}
   if(offset===committed||segment.range&&offset-committed!==segment.range.length)throw new Error('invalid');
   const declared=response.headers.get('content-length');if(declared!==null&&!response.headers.get('content-encoding')&&Number(declared)!==offset-committed)throw new Error('network');handle!.flush();
   const current=await getTask(task.id);if(!current||['paused','cancelled'].includes(current.state))throw new Error('cancelled');
   live.bytes=offset;if(media)live.segments++;
  }catch(error){handle!.truncate(committed);handle!.flush();throw error;}finally{await reader?.cancel().catch(()=>{});}
 }
 try{
  await setState(task.id,'recording',{error:undefined,progress:0});
  if(live.active){let changed=true,last='';
   while(!signal.aborted&&!finish.aborted){const current=await getTask(task.id);if(!current||['paused','cancelled'].includes(current.state))throw new Error('cancelled');if(!current.live?.active)break;
    allowed(live.url);const started=Date.now(),playlist=parseLiveHls(await manifestText(live.url,AbortSignal.any([signal,AbortSignal.timeout(15000)])),live.url),identity=JSON.stringify(playlist);
    changed=identity!==last;last=identity;
    if(live.initialized&&live.initIdentity!==segmentIdentity(playlist.init))throw new Error('discontinuity');
    const segments=nextLiveSegments(playlist,live.lastSequence,live.lastIdentity,live.discontinuity);
    for(const item of segments){if(finish.aborted)break;if(live.segments>=100000)throw new Error('manifestLimit');if(item.gap)throw new Error('liveGap');
     if(!live.initialized){if(playlist.init)await segment(playlist.init,false);live.initialized=true;live.initIdentity=segmentIdentity(playlist.init);}
     await segment(item,true);live.lastSequence=item.sequence;live.lastIdentity=segmentIdentity(item);live.discontinuity=item.discontinuity;live.duration+=item.duration;
     await changeTask(task.id,t=>{t.bytes=live.bytes;t.live={...live,active:t.live!.active};});
    }
    if(playlist.ended||finish.aborted)break;
    const delay=Math.max(0,Math.max(500,playlist.targetDuration*1000*(changed?1:0.5))-(Date.now()-started));
    await new Promise<void>(resolve=>{const end=()=>{clearTimeout(timer);signal.removeEventListener('abort',end);finish.removeEventListener('abort',end);resolve();},timer=setTimeout(end,delay);signal.addEventListener('abort',end,{once:true});finish.addEventListener('abort',end,{once:true});if(signal.aborted||finish.aborted)end();});
   }
  }
 }catch(error){
  if(signal.aborted)throw error;const current=await getTask(task.id);if(!current||['paused','cancelled'].includes(current.state))throw error;
  if(!live.segments)throw error;live.warning=(error as {name?:string})?.name==='QuotaExceededError'?'space':error instanceof Error&&/^[a-zA-Z]+$/.test(error.message)?error.message:'network';notice('liveIncomplete');
 }finally{handle.close();handle=undefined;}
 if(signal.aborted)throw new Error('cancelled');if(!live.segments)throw new Error('liveEmpty');
 if(live.warning)notice('liveIncomplete');
 live.active=false;await changeTask(task.id,t=>{t.live=live;t.error=undefined;});
 await setState(task.id,'assembling',{progress:0.85});const file=await source.getFile(),output=await dir.getFileHandle('output.mp4',{create:true});
 const tracks=await remux([file],await output.createWritable(),signal,undefined,notice);await setState(task.id,'validating',{progress:0.95});const validation=await validate(await output.getFile(),live.duration,tracks,notice);
 await changeTask(task.id,t=>{t.validation=validation;t.output='output.mp4';t.bytes=validation.bytes;t.progress=1;});
 return validation;
}
