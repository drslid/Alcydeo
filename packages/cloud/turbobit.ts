// Original guest web-form adapter. The authenticated CostAction API is not used.
// A fresh destination is obtained for every file; provider code is never run.
import type{CloudJob}from'./contracts';
export const turbobitLimit=200_000_000;
export function turbobitHistoryLink(job:Pick<CloudJob,'provider'|'link'>){
 return job.provider==='turbobit'&&typeof job.link==='string'&&/^https:\/\/torbobit\.net\/[A-Za-z0-9]{6,64}(?![\s\S])/.test(job.link)?`${job.link}.html`:job.link;
}
export function turbobitEndpoint(data:unknown){
 try{
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error();const value=data as Record<string,unknown>;
  if(!Array.isArray(value.urls)||value.urls.length!==1||typeof value.urls[0]!=='string'||value.urls[0].length>2048)throw new Error();
  const url=new URL(value.urls[0]);
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash||!/^s[1-9]\d{0,4}\.fdfiles\.net$/.test(url.hostname)||url.pathname!=='/uploadfile')throw new Error();
  return url.href;
 }catch{throw new Error('cloudTurbobitUnavailable');}
}
export function turbobitResult(data:unknown,file:Pick<File,'name'|'size'>){
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('cloudResponse');const value=data as Record<string,unknown>;
 if(value.error!=null||value.status!==undefined&&value.status!=='success'||typeof value.id!=='string'||!(/^[a-z\d]{6,64}$/i).test(value.id))throw new Error('cloudResponse');
 for(const key of ['name','filename'])if(value[key]!==undefined&&value[key]!==file.name)throw new Error('cloudResponse');
 for(const key of ['size','file_size'])if(value[key]!==undefined&&(!(typeof value[key]==='number'&&Number.isSafeInteger(value[key])||typeof value[key]==='string'&&/^\d{1,15}$/.test(value[key] as string))||Number(value[key])!==file.size))throw new Error('cloudResponse');
 // The native Turbobit sharing route requires .html. Do not retain delete_id,
 // arbitrary response URLs, provider messages or temporary upload destinations.
 return`https://torbobit.net/${value.id}.html`;
}
async function json(response:Response,error:string){
 if(!response.ok)throw new Error(response.status===429?'cloudRate':error);
 const reader=response.body?.getReader();if(!reader)throw new Error(error);const decoder=new TextDecoder();let text='',bytes=0;
 try{while(true){const{done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>65536)throw new Error(error);text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
 try{return JSON.parse(text) as unknown;}catch{throw new Error(error);}
}
export async function turbobitUpload(file:File,signal:AbortSignal,progress:(bytes:number)=>void,request:typeof fetch=fetch){
 if(!file.size)throw new Error('invalid');if(file.size>turbobitLimit)throw new Error('cloudFileTooLarge');if(signal.aborted)throw new Error('cancelled');
 const endpoint=turbobitEndpoint(await json(await request('https://app.torbobit.net/api/upload/urls',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"count":1}',credentials:'omit',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])}),'cloudTurbobitUnavailable'));
 if(signal.aborted)throw new Error('cancelled');const body=new FormData();body.append('Filedata',file,file.name);body.append('apptype','fd1');body.append('folder_id','0');
 const result=await json(await request(endpoint,{method:'POST',body,credentials:'omit',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(3600000)])}),'cloudResponse');
 const link=turbobitResult(result,file);if(signal.aborted)throw new Error('cancelled');progress(file.size);return link;
}
