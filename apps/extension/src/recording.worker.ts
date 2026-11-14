/// <reference lib="webworker" />
let access:FileSystemSyncAccessHandle|undefined;let bytes=0;
self.onmessage=event=>{const{id,type,taskId,buffer}=event.data;void(async()=>{
 try{
  if(type==='open'){const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(taskId,{create:true});access=await(await dir.getFileHandle('recording.webm',{create:true})).createSyncAccessHandle();access.truncate(0);bytes=0;}
  if(type==='write'){if(!access)throw new Error('interrupted');const view=new Uint8Array(buffer);let offset=0;while(offset<view.length){const count=access.write(view.subarray(offset),{at:bytes+offset});if(!count)throw new Error('space');offset+=count;}bytes+=offset;access.flush();}
  if(type==='close'){access?.flush();access?.close();access=undefined;}
  postMessage({id,bytes});
 }catch(error){try{access?.close();}catch{/* Already closed. */}access=undefined;postMessage({id,error:(error as {name?:string})?.name==='QuotaExceededError'?'space':'interrupted'});}
 })();};
