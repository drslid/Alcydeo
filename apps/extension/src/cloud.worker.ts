/// <reference lib="webworker" />
import{cloudJob,changeCloudJob}from'../../../packages/cloud/storage';import{gofileUpload,pcloudUpload,cancelCloudSession}from'../../../packages/cloud/transport';
import{megaupUpload}from'../../../packages/cloud/megaup';
import{onefichierUpload}from'../../../packages/cloud/onefichier';
import{turbobitUpload}from'../../../packages/cloud/turbobit';
let controller:AbortController|undefined;
async function run(id:string){
 await navigator.locks.request('alcydeo:cloud-upload',{ifAvailable:true},async lock=>{
  if(!lock){postMessage({type:'waiting'});return;}const job=await cloudJob(id);if(!job||job.state!=='queued'||!job.ready){postMessage({type:'done'});return;}
  if(!['gofile','megaup','onefichier','turbobit','pcloud'].includes(job.provider)){await changeCloudJob(id,t=>{t.state='paused';t.error='cloudProviderRemoved';});postMessage({type:'done'});return;}
  controller=new AbortController();const signal=controller.signal,owner=crypto.randomUUID();await changeCloudJob(id,t=>{t.state='uploading';t.owner=owner;t.leaseUntil=Date.now()+30000;t.error=undefined;});let polling=false;
  const timer=setInterval(()=>{if(polling)return;polling=true;void changeCloudJob(id,t=>{if(t.state!=='uploading'){controller?.abort();return;}t.leaseUntil=Date.now()+30000;}).catch(()=>controller?.abort()).finally(()=>{polling=false;});},1000);
  let updates=Promise.resolve(),last=0;const progress=(bytes:number)=>{if(Date.now()-last<300)return;last=Date.now();updates=updates.then(()=>changeCloudJob(id,t=>{t.bytes=bytes;})).then(()=>{}).catch(()=>controller?.abort());};
  try{
   const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(`cloud-${id}`);const staged=await(await dir.getFileHandle('input')).getFile();if(staged.size!==job.size)throw new Error('cloudInput');const file=new File([staged],job.name,{type:job.mime});
   // Persist uncertainty before the first file body can leave the extension.
   const onefichierRequest:typeof fetch=async(input,options)=>{
    if(options?.body instanceof FormData){
     if(signal.aborted)throw new Error('cancelled');
     const current=await changeCloudJob(id,t=>{if(t.state==='uploading'&&t.owner===owner)t.uploadAttempted=true;});
     if(signal.aborted||current.state!=='uploading'||current.owner!==owner)throw new Error('cancelled');
    }
    return fetch(input,options);
   };
   const link=job.provider==='gofile'?await gofileUpload(file,signal,progress):job.provider==='megaup'?await megaupUpload(file,signal,progress):job.provider==='onefichier'?await onefichierUpload(file,signal,progress,onefichierRequest):job.provider==='turbobit'?await turbobitUpload(file,signal,progress):job.provider==='pcloud'?await pcloudUpload(file,job.destination,signal,progress).then(()=>undefined):await Promise.reject(new Error('cloudProviderRemoved'));
   await updates;const finished=await changeCloudJob(id,t=>{if(t.state!=='uploading')return;t.state='completed';t.bytes=t.size;t.link=link;t.destination=undefined;t.checkpoint=undefined;t.error=undefined;t.owner=undefined;t.leaseUntil=undefined;});if(finished.state==='completed')await(await navigator.storage.getDirectory()).removeEntry(`cloud-${id}`,{recursive:true});
  }catch(error){await updates;await changeCloudJob(id,t=>{if(t.state==='uploading'){t.state='paused';t.error=error instanceof Error&&/^cloud[A-Za-z]+$/.test(error.message)?error.message:(error as {name?:string})?.name==='QuotaExceededError'?'space':'cloudNetwork';}}).catch(()=>{});}
  finally{clearInterval(timer);const current=await cloudJob(id);if(current?.state==='cancelled'){await cancelCloudSession(current.provider,current.checkpoint).catch(()=>{});await(await navigator.storage.getDirectory()).removeEntry(`cloud-${id}`,{recursive:true}).catch(()=>{});await changeCloudJob(id,t=>{t.checkpoint=undefined;t.destination=undefined;}).catch(()=>{});}await changeCloudJob(id,t=>{t.owner=undefined;t.leaseUntil=undefined;}).catch(()=>{});postMessage({type:'done'});}
 });
}
self.onmessage=event=>{if(event.data.type==='abort')controller?.abort();if(event.data.type==='run')void run(event.data.id).catch(()=>postMessage({type:'done'}));};
