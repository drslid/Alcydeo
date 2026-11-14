import{cleanName,type Task}from'../../../packages/contracts';
import{localFileUrl}from'../../../packages/media-core/local-cast';
export async function downloadedFileUrl(id:number){
 const item=(await chrome.downloads.search({id}))[0];
 if(!item||item.state!=='complete'||item.exists===false)throw new Error('tvFileChooseAgain');
 return localFileUrl(item.filename);
}
export async function taskCastFile(task:Pick<Task,'saved'|'downloadId'|'castDownloadId'>){
 for(const id of new Set([...(task.saved?[task.downloadId]:[]),task.castDownloadId])){
  if(id===undefined)continue;
  try{return{id,url:await downloadedFileUrl(id)};}catch{/* Try the other identified Chrome copy before requiring the original. */}
 }
}
// Chrome owns the disk write; retain the Blob until it completes. Cancellation
// only affects this explicitly requested copy, never an existing download.
export async function saveCastCopy(file:File,signal:AbortSignal){
 const url=URL.createObjectURL(file);let id:number|undefined;
 try{
  id=await chrome.downloads.download({url,filename:`Alcydeo/Cast/${cleanName(file.name)}`,saveAs:true,conflictAction:'uniquify'});
  if(signal.aborted){await chrome.downloads.cancel(id).catch(()=>{});throw new Error('cancelled');}
  await new Promise<void>((resolve,reject)=>{
   let done=false;
   const finish=(error?:string)=>{if(done)return;done=true;chrome.downloads.onChanged.removeListener(changed);signal.removeEventListener('abort',abort);if(error)reject(new Error(error));else resolve();};
   const check=async()=>{try{const item=(await chrome.downloads.search({id:id!}))[0];if(!item||item.state==='interrupted')finish('tvFileCopyFailed');else if(item.state==='complete')finish();}catch{finish('tvFileCopyFailed');}};
   const changed=(delta:chrome.downloads.DownloadDelta)=>{if(delta.id===id)void check();};
   const abort=()=>{void chrome.downloads.cancel(id!).catch(()=>{});finish('cancelled');};
   chrome.downloads.onChanged.addListener(changed);signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();else void check();
  });
  return{url:await downloadedFileUrl(id),id};
 }finally{URL.revokeObjectURL(url);}
}
