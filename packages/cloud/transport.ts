import type{CloudProvider,CloudCheckpoint}from'./contracts';
import type{PcloudDestination}from'./contracts';
import{pcloudDestination,pcloudResult}from'./pcloud';
type Progress=(bytes:number)=>void;type Checkpoint=(value:CloudCheckpoint)=>Promise<void>;
export function cloudSessionUrl(provider:CloudProvider,value:string){
 const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.hash)throw new Error('cloudResponse');
 const host=url.hostname;
 if(provider==='drive'&&(host!=='www.googleapis.com'||!url.pathname.startsWith('/upload/drive/')))throw new Error('cloudResponse');
 if(provider==='onedrive'&&!['1drv.com','sharepoint.com','onedrive.com','storage.live.com'].some(domain=>host===domain||host.endsWith('.'+domain)))throw new Error('cloudResponse');
 return url.href;
}
function httpError(response:Response){return new Error([401,403].includes(response.status)?'cloudAuth':response.status===429?'cloudRate':[404,410].includes(response.status)?'cloudExpired':response.status===507?'space':'cloudNetwork');}
function nextDrive(response:Response,total:number){const range=response.headers.get('Range');if(!range)return 0;const match=/^bytes=0-(\d+)$/i.exec(range);if(!match)throw new Error('cloudResponse');const next=Number(match[1])+1;if(!Number.isSafeInteger(next)||next<0||next>total)throw new Error('cloudResponse');return next;}
function nextOneDrive(data:any,total:number){const ranges=data.nextExpectedRanges;if(!Array.isArray(ranges)||!ranges.length)throw new Error('cloudResponse');const offsets=ranges.map((range:unknown)=>typeof range==='string'&&/^\d+-\d*$/.test(range)?Number(range.split('-')[0]):NaN);const next=Math.min(...offsets);if(!Number.isSafeInteger(next)||next<0||next>=total)throw new Error('cloudResponse');return next;}
const checkedLink=(value:unknown,domains:string[])=>{if(typeof value!=='string')throw new Error('cloudResponse');const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||!domains.some(d=>url.hostname===d||url.hostname.endsWith('.'+d)))throw new Error('cloudResponse');return url.href;};
function complete(provider:CloudProvider,data:any,total:number){
 if(!data||!data.id||Number(data.size)!==total)throw new Error('cloudResponse');
 return provider==='drive'?checkedLink(data.webViewLink??`https://drive.google.com/file/d/${encodeURIComponent(data.id)}/view`,['drive.google.com']):checkedLink(data.webUrl,['onedrive.live.com','1drv.ms','sharepoint.com','onedrive.com']);
}
export async function resumableUpload(file:File,provider:'drive'|'onedrive',token:string|undefined,previous:CloudCheckpoint|undefined,signal:AbortSignal,checkpoint:Checkpoint,progress:Progress,request:typeof fetch=fetch){
 if(!file.size)throw new Error('invalid');
 const call=(url:string,init:RequestInit)=>request(url,{...init,credentials:'omit',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(120000)])});
 const authorization:Record<string,string>=token?{Authorization:`Bearer ${token}`}:{ };
 let current=previous;
 if(current)cloudSessionUrl(provider,current.url);
 if(!current){
  if(!token)throw new Error('cloudAuth');
  const response=await call(provider==='drive'?'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,size,webViewLink':`https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(file.name)}:/createUploadSession`,{method:'POST',headers:{...authorization,'Content-Type':'application/json',...(provider==='drive'?{'X-Upload-Content-Type':file.type||'application/octet-stream','X-Upload-Content-Length':String(file.size)}:{})},body:JSON.stringify(provider==='drive'?{name:file.name,mimeType:file.type||'application/octet-stream'}:{item:{'@microsoft.graph.conflictBehavior':'rename',name:file.name}})});
  if(!response.ok)throw httpError(response);
  const data=provider==='onedrive'?await response.json():undefined;
  current={url:cloudSessionUrl(provider,provider==='drive'?response.headers.get('Location')??'':data.uploadUrl),offset:0,expires:provider==='onedrive'?Date.parse(data.expirationDateTime):undefined};await checkpoint(current);
 }else{
  // Query authoritative committed bytes; a lost PUT response is never assumed
  // to mean zero bytes or a completed file.
  if(provider==='drive'&&!token)throw new Error('cloudAuth');
  const response=await call(current.url,provider==='drive'?{method:'PUT',headers:{...authorization,'Content-Range':`bytes */${file.size}`},body:new Blob([])}:{method:'GET'});
  if((provider==='drive'&&[200,201].includes(response.status))){return complete(provider,await response.json(),file.size);}
  if(provider==='drive'&&response.status!==308||provider==='onedrive'&&!response.ok)throw httpError(response);
  const data=provider==='onedrive'?await response.json():undefined;
  current={...current,offset:provider==='drive'?nextDrive(response,file.size):nextOneDrive(data,file.size),...(provider==='onedrive'?{expires:Date.parse(data.expirationDateTime)}:{})};await checkpoint(current);
 }
 const chunkSize=provider==='drive'?8*1024*1024:10*320*1024;let rounds=0;
 while(current.offset<file.size){
  if(signal.aborted)throw new Error('cancelled');const start=current.offset,end=Math.min(file.size,start+chunkSize);
  const response=await call(current.url,{method:'PUT',headers:{...(provider==='drive'?authorization:{}),'Content-Type':'application/octet-stream','Content-Range':`bytes ${start}-${end-1}/${file.size}`},body:file.slice(start,end)});
  if([200,201].includes(response.status)){const link=complete(provider,await response.json(),file.size);progress(file.size);return link;}
  if(provider==='drive'&&response.status!==308||provider==='onedrive'&&response.status!==202)throw httpError(response);
  const data=provider==='onedrive'?await response.json():undefined;const next=provider==='drive'?nextDrive(response,file.size):nextOneDrive(data,file.size);
  if(next<=start||next>end||++rounds>Math.ceil(file.size/chunkSize)*2+8)throw new Error('cloudResponse');
  current={...current,offset:next,...(provider==='onedrive'?{expires:Date.parse(data.expirationDateTime)}:{})};await checkpoint(current);progress(next);
 }
 throw new Error('cloudResponse');
}
export function gofileUpload(file:File,signal:AbortSignal,progress:Progress){
 return new Promise<string>((resolve,reject)=>{
  const xhr=new XMLHttpRequest();let timeout:ReturnType<typeof setTimeout>;let settled=false;
  const clean=()=>{clearTimeout(timeout);signal.removeEventListener('abort',abort);};const fail=(code:string)=>{if(settled)return;settled=true;clean();reject(new Error(code));};const abort=()=>{xhr.abort();fail('cancelled');};const activity=()=>{clearTimeout(timeout);timeout=setTimeout(()=>{fail('cloudNetwork');xhr.abort();},120000);};
  if(signal.aborted){reject(new Error('cancelled'));return;}signal.addEventListener('abort',abort,{once:true});xhr.open('POST','https://upload.gofile.io/uploadfile');xhr.responseType='json';xhr.withCredentials=false;
  xhr.upload.onprogress=event=>{activity();if(event.lengthComputable)progress(Math.min(file.size,Math.floor(file.size*event.loaded/event.total)));};xhr.onerror=()=>fail('cloudNetwork');xhr.onabort=()=>fail('cancelled');
  xhr.onload=()=>{if(settled)return;try{if(xhr.status<200||xhr.status>=300)throw new Error(xhr.status===429?'cloudRate':'cloudNetwork');const result=xhr.response;if(result?.status!=='ok'||!result.data)throw new Error('cloudResponse');const data=result.data;const link=checkedLink(data.downloadPage??(typeof data.parentFolderCode==='string'?`https://gofile.io/d/${encodeURIComponent(data.parentFolderCode)}`:undefined),['gofile.io']);if(data.size!==undefined&&Number(data.size)!==file.size)throw new Error('cloudResponse');settled=true;clean();progress(file.size);resolve(link);}catch(e){fail(e instanceof Error?e.message:'cloudResponse');}};
  const form=new FormData();form.append('file',file,file.name);activity();xhr.send(form);
 });
}
export function pcloudUpload(file:File,destination:PcloudDestination|undefined,signal:AbortSignal,progress:Progress){
 if(!destination)throw new Error('cloudPcloudLink');
 const checked=pcloudDestination(destination.code,destination.region);
 return new Promise<void>((resolve,reject)=>{
  const xhr=new XMLHttpRequest();let timeout:ReturnType<typeof setTimeout>;let settled=false;
  const clean=()=>{clearTimeout(timeout);signal.removeEventListener('abort',abort);};const fail=(code:string)=>{if(settled)return;settled=true;clean();reject(new Error(code));};const abort=()=>{xhr.abort();fail('cancelled');};const activity=()=>{clearTimeout(timeout);timeout=setTimeout(()=>{fail('cloudNetwork');xhr.abort();},120000);};
  if(signal.aborted){reject(new Error('cancelled'));return;}if(!file.size){reject(new Error('invalid'));return;}
  signal.addEventListener('abort',abort,{once:true});xhr.open('POST',`https://${checked.region==='eu'?'eapi':'api'}.pcloud.com/uploadtolink`);xhr.responseType='json';xhr.withCredentials=false;
  xhr.upload.onprogress=event=>{activity();if(event.lengthComputable)progress(Math.min(file.size,Math.floor(file.size*event.loaded/event.total)));};xhr.onerror=()=>fail('cloudNetwork');xhr.onabort=()=>fail('cancelled');
  xhr.onload=()=>{if(settled)return;try{if(xhr.status<200||xhr.status>=300)throw new Error(xhr.status===429?'cloudRate':'cloudNetwork');pcloudResult(xhr.response,file.size);settled=true;clean();progress(file.size);resolve();}catch(e){fail(e instanceof Error?e.message:'cloudResponse');}};
  const form=new FormData();form.append('code',checked.code);form.append('nopartial','1');form.append('file',file,file.name);activity();xhr.send(form);
 });
}
export async function cancelCloudSession(provider:CloudProvider,checkpoint?:CloudCheckpoint){
 if(provider!=='onedrive'||!checkpoint)return;
 // Microsoft documents DELETE on the preauthenticated upload URL. Other
 // providers' partial sessions expire under their service policy.
 const response=await fetch(cloudSessionUrl(provider,checkpoint.url),{method:'DELETE',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(10000)});if(!response.ok&&response.status!==404)throw httpError(response);
}
