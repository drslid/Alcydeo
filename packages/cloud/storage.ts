import type{CloudJob}from'./contracts';
import{turbobitHistoryLink}from'./turbobit';
let db:Promise<IDBDatabase>|undefined;
const open=()=>db??=new Promise((resolve,reject)=>{const r=indexedDB.open('alcydeo-cloud',1);r.onupgradeneeded=()=>r.result.createObjectStore('jobs',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function transaction<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>){const database=await open();const tx=database.transaction('jobs',mode),request=operation(tx.objectStore('jobs'));const value=new Promise<T>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});const result=await value;await done;return result;}
export const cloudJobs=()=>transaction('readwrite',s=>{
 const request=s.getAll();request.addEventListener('success',()=>{
  for(const job of request.result as CloudJob[]){const link=turbobitHistoryLink(job);if(link!==job.link){job.link=link;s.put(job);}}
 });return request;
})as Promise<CloudJob[]>;
export const cloudJob=(id:string)=>transaction('readonly',s=>s.get(id))as Promise<CloudJob|undefined>;
export const putCloudJob=(job:CloudJob)=>transaction('readwrite',s=>s.put({...job,updatedAt:Date.now()}));
export async function removeCloudJob(id:string){
 await navigator.locks.request('alcydeo:cloud-upload',{ifAvailable:true},async upload=>{
  if(!upload)throw new Error('cloudTemporaryBusy');
  await navigator.locks.request('alcydeo:cloud-files',{ifAvailable:true},async files=>{
   if(!files)throw new Error('cloudTemporaryBusy');
   const database=await open();await new Promise<void>((resolve,reject)=>{
    const tx=database.transaction('jobs','readwrite'),store=tx.objectStore('jobs'),request=store.get(id);let failure:unknown;
    request.onsuccess=()=>{try{
     const job=request.result as CloudJob|undefined;
     if(job&&(hasCloudOwner(job)||!['completed','cancelled','failed','paused'].includes(job.state)))throw new Error('cloudTemporaryBusy');
     store.delete(id);
    }catch(error){failure=error;tx.abort();}};
    tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(failure??tx.error??new Error('cloudTemporaryFailed'));
   });
  });
 });
}
export const hasCloudOwner=(job:CloudJob,now=Date.now())=>!!job.owner&&(job.leaseUntil??0)>=now;
export async function clearCloudInputs(now=Date.now()){
 const database=await open();return new Promise<void>((resolve,reject)=>{
  const tx=database.transaction('jobs','readwrite'),store=tx.objectStore('jobs'),request=store.getAll();let failure:unknown;
  request.onsuccess=()=>{try{
   const jobs=request.result as CloudJob[];if(jobs.some(job=>hasCloudOwner(job,now)))throw new Error('cloudTemporaryBusy');
   for(const job of jobs){
    job.ready=false;delete job.checkpoint;delete job.destination;delete job.owner;delete job.leaseUntil;
    if(!['completed','cancelled','failed'].includes(job.state))job.state='cancelled';
    if(job.state==='cancelled')delete job.error;
    job.updatedAt=now;store.put(job);
   }
  }catch(error){failure=error;tx.abort();}};
  tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(failure??tx.error??new Error('cloudTemporaryFailed'));
 });
}
export async function changeCloudJob(id:string,change:(job:CloudJob)=>void){
 const database=await open();return new Promise<CloudJob>((resolve,reject)=>{const tx=database.transaction('jobs','readwrite'),store=tx.objectStore('jobs'),get=store.get(id);let job:CloudJob;get.onsuccess=()=>{job=get.result as CloudJob;if(!job){tx.abort();return;}change(job);job.updatedAt=Date.now();store.put(job);};tx.oncomplete=()=>resolve(job);tx.onabort=tx.onerror=()=>reject(tx.error??new Error('missing'));});
}
