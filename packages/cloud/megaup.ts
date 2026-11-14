// Original adapter for MegaUp's public anonymous upload form. The page is
// parsed as data; no provider JavaScript is evaluated or included in Alcydeo.
export const megaupLimit=5*1024**3;
export interface MegaupSession{endpoint:string;session:string;tracker:string;chunkSize:number;maxSize:number}
export function megaupEndpoint(value:string){
 const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash||!(url.hostname==='megaup.net'||url.hostname.endsWith('.megaup.net')||/^[a-z\d-]+\.mupload\.store$/.test(url.hostname))||url.pathname!=='/ajax/file_upload_handler')throw new Error('cloudMegaupUnavailable');return url.href;
}
export function megaupSession(html:string):MegaupSession{
 try{
  if(html.length>524288)throw new Error();
  const list=/(?:var|const|let)\s+uploadEndpoints\s*=\s*(\[[^\]\r\n]{1,16384}\])\s*;/.exec(html)?.[1];if(!list)throw new Error();const endpoints:unknown=JSON.parse(list);
  if(!Array.isArray(endpoints)||!endpoints.length||endpoints.length>8||endpoints.some(value=>typeof value!=='string'))throw new Error();
  const checked=endpoints.map(megaupEndpoint),session=/_sessionid\s*:\s*['"]([a-z\d_-]{16,128})['"]/i.exec(html)?.[1],tracker=/cTracker\s*:\s*['"]([a-z\d_-]{16,128})['"]/i.exec(html)?.[1];
  const sizes=[...html.matchAll(/\buploaderMaxSize\s*=\s*(\d{1,12})\s*;/g)].map(m=>Number(m[1])).filter(n=>n>0),chunks=[...html.matchAll(/\bmaxChunkSize\s*=\s*(\d{1,12})\s*;/g)].map(m=>Number(m[1])).filter(n=>n>0);
  if(!session||!tracker||!sizes.length||!chunks.length)throw new Error();
  return{endpoint:checked[0]!,session,tracker,maxSize:Math.min(megaupLimit,...sizes),chunkSize:Math.min(100000000,...chunks)};
 }catch{throw new Error('cloudMegaupUnavailable');}
}
export function megaupResult(data:unknown,file:Pick<File,'name'|'size'>,last:boolean){
 if(!Array.isArray(data)||data.length!==1||!data[0]||typeof data[0]!=='object')throw new Error('cloudResponse');const item=data[0];
 if(item.error!=null||item.name!==undefined&&item.name!==file.name)throw new Error('cloudResponse');if(!last)return;
 if(item.size!==undefined&&Number(item.size)!==file.size)throw new Error('cloudResponse');
 if(typeof item.url!=='string')throw new Error('cloudResponse');const link=new URL(item.url);
 if(link.protocol!=='https:'||link.username||link.password||link.port||link.hash||!['megaup.net','www.megaup.net'].includes(link.hostname)||link.pathname==='/')throw new Error('cloudResponse');return link.href;
}
async function pageText(response:Response,limit=524288,error='cloudMegaupUnavailable'){
 if(!response.ok)throw new Error(response.status===429?'cloudRate':error);
 const reader=response.body?.getReader();if(!reader)throw new Error(error);const decoder=new TextDecoder();let text='',bytes=0;
 try{while(true){const{done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit)throw new Error(error);text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}finally{await reader.cancel().catch(()=>{});}
}
async function uploadChunk(file:File,start:number,end:number,session:MegaupSession,signal:AbortSignal,request:typeof fetch){
 const form=new FormData();form.append('_sessionid',session.session);form.append('cTracker',session.tracker);form.append('maxChunkSize',String(session.chunkSize));form.append('folderId','');form.append('uploadSource','file_manager');form.append('relativePath','');form.append('files[]',file.slice(start,end,file.type),file.name);
 const response=await request(session.endpoint,{method:'POST',body:form,headers:file.size>session.chunkSize?{'Content-Range':`bytes ${start}-${end-1}/${file.size}`}:{},credentials:'omit',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(120000)])});
 if(!response.ok)throw new Error(response.status===429?'cloudRate':'cloudNetwork');
 const text=await pageText(response,262144,'cloudResponse');try{return JSON.parse(text) as unknown;}catch{throw new Error('cloudResponse');}
}
export async function megaupUpload(file:File,signal:AbortSignal,progress:(bytes:number)=>void,request:typeof fetch=fetch){
 if(!file.size)throw new Error('invalid');if(file.size>megaupLimit)throw new Error('cloudFileTooLarge');
 const response=await request('https://megaup.net/',{credentials:'omit',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])});const session=megaupSession(await pageText(response));if(file.size>session.maxSize)throw new Error('cloudFileTooLarge');
 // Smaller parts keep acknowledged progress useful without upload listeners.
 // Unlike privileged extension XHR, fetch can explicitly omit all cookies and
 // reject redirects before forwarding any file bytes to a different location.
 session.chunkSize=Math.min(session.chunkSize,8*1024**2);
 if(Math.ceil(file.size/session.chunkSize)>1024)throw new Error('cloudMegaupUnavailable');
 let link:string|undefined;
 for(let start=0;start<file.size;start+=session.chunkSize){if(signal.aborted)throw new Error('cancelled');const end=Math.min(file.size,start+session.chunkSize);const result=await uploadChunk(file,start,end,session,signal,request);if(signal.aborted)throw new Error('cancelled');link=megaupResult(result,file,end===file.size);progress(end===file.size?file.size:Math.min(file.size-1,end));}
 if(!link)throw new Error('cloudResponse');return link;
}
