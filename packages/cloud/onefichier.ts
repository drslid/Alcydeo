// Original implementation of the documented anonymous web-upload protocol.
// Only the download link is retained; upload IDs and deletion links stay private.
export const onefichierLimit=300_000_000_000;
export function onefichierSession(data:unknown){
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('cloudOnefichierUnavailable');
 const value=data as Record<string,unknown>;
 if(typeof value.url!=='string'||!/^(?:up|ru-)[1-9]\d{0,3}\.1fichier\.com$/.test(value.url)||typeof value.id!=='string'||!(/^[a-z\d]{10}$/i).test(value.id))throw new Error('cloudOnefichierUnavailable');
 const origin=`https://${value.url}`;return{upload:`${origin}/upload.cgi?id=${value.id}`,report:`${origin}/end.pl?xid=${value.id}`};
}
export function onefichierResult(data:unknown,file:Pick<File,'name'|'size'>){
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('cloudResponse');const value=data as Record<string,unknown>;
 if(value.incoming!==0&&value.incoming!=='0'||!Array.isArray(value.links)||value.links.length!==1||!value.links[0]||typeof value.links[0]!=='object')throw new Error('cloudResponse');
 const item=value.links[0] as Record<string,unknown>;
 if(item.filename!==file.name||!(typeof item.size==='number'&&Number.isSafeInteger(item.size)||typeof item.size==='string'&&/^\d{1,15}$/.test(item.size))||Number(item.size)!==file.size||typeof item.download!=='string')throw new Error('cloudResponse');
 let link:URL;try{link=new URL(item.download);}catch{throw new Error('cloudResponse');}
 if(link.protocol!=='https:'||link.username||link.password||link.port||link.hash||!['1fichier.com','www.1fichier.com'].includes(link.hostname)||link.pathname!=='/'||!/^\?[a-z\d]{5,64}$/i.test(link.search))throw new Error('cloudResponse');
 return link.href;
}
async function json(response:Response,error:string){
 if(!response.ok)throw new Error(response.status===429?'cloudRate':error);
 const reader=response.body?.getReader();if(!reader)throw new Error(error);const decoder=new TextDecoder();let text='',size=0;
 try{while(true){const{value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536)throw new Error(error);text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
 try{return JSON.parse(text) as unknown;}catch{throw new Error(error);}
}
export async function onefichierUpload(file:File,signal:AbortSignal,progress:(bytes:number)=>void,request:typeof fetch=fetch){
 if(!file.size)throw new Error('invalid');if(file.size>onefichierLimit)throw new Error('cloudFileTooLarge');if(signal.aborted)throw new Error('cancelled');
 const session=onefichierSession(await json(await request('https://api.1fichier.com/v1/upload/get_upload_server.cgi',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"pretty":1}',credentials:'omit',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])}),'cloudOnefichierUnavailable'));
 if(signal.aborted)throw new Error('cancelled');const body=new FormData();body.append('domain','0');body.append('file[]',file,file.name);
 // Chrome computes Content-Length for the known-size File. Do not stream an
 // unknown-length body or invent support for multipart/range resumption.
 const sent=await request(session.upload,{method:'POST',body,credentials:'omit',redirect:'manual',signal:AbortSignal.any([signal,AbortSignal.timeout(4*60*60*1000)])});
 if(signal.aborted)throw new Error('cancelled');if(sent.status===429)throw new Error('cloudRate');
 // A manual cross-origin redirect is opaque in Chrome. Never follow Location:
 // read the documented report on the exact previously validated upload node.
 if(sent.type!=='opaqueredirect'&&sent.status!==302)throw new Error(sent.ok?'cloudResponse':'cloudNetwork');
 const result=await json(await request(session.report,{headers:{JSON:'1'},credentials:'omit',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(30000)])}),'cloudResponse');
 const link=onefichierResult(result,file);if(signal.aborted)throw new Error('cancelled');progress(file.size);return link;
}
