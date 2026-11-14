import{changeTask}from'../storage';import type{Task}from'../contracts';import{prefixKind}from'./preflight';
export interface PageReply{error?:string;chunk?:string;done?:boolean;size?:number;contentType?:string;pageCredentials?:'include'|'omit'}
export async function pageFile(task:Task,dir:FileSystemDirectoryHandle,signal:AbortSignal,call:(action:string)=>Promise<PageReply>){
 const output=await dir.getFileHandle('output.original',{create:true}),writer=await output.createWritable();let bytes=0,last=0;const prefix=new Uint8Array(4096);let prefixBytes=0,expected:number|undefined;
 try{
  const opened=await call('open');if(opened.size!==undefined&&task.variant.size!==undefined&&opened.size!==task.variant.size)throw new Error('sourceChanged');expected=opened.size??task.variant.size;if(expected!==undefined&&(!Number.isSafeInteger(expected)||expected<1))throw new Error('invalid');
  await changeTask(task.id,t=>{t.bytes=0;t.progress=0;t.total=expected;delete t.validation;delete t.output;});
  while(true){if(signal.aborted)throw new Error('cancelled');const part=await call('read');if(signal.aborted)throw new Error('cancelled');if(part.done)break;if(typeof part.chunk!=='string'||part.chunk.length>349528)throw new Error('invalid');const text=atob(part.chunk);if(!text.length||text.length>262144)throw new Error('invalid');const data=Uint8Array.from(text,c=>c.charCodeAt(0));
   if(prefixBytes<4096){const n=Math.min(data.length,4096-prefixBytes);prefix.set(data.subarray(0,n),prefixBytes);prefixBytes+=n;const kind=prefixKind(prefix.subarray(0,prefixBytes));if(kind==='html'||kind==='notMedia')throw new Error(kind);}
   if(expected!==undefined&&bytes+data.length>expected)throw new Error('sourceChanged');await writer.write(data);bytes+=data.length;
   if(Date.now()-last>500){last=Date.now();await changeTask(task.id,t=>{t.bytes=bytes;t.progress=expected?Math.min(.9,bytes/expected*.9):0;});}
  }
  if(signal.aborted)throw new Error('cancelled');if(!bytes||expected!==undefined&&bytes!==expected)throw new Error('invalid');await writer.close();
 }catch(error){await writer.abort().catch(()=>{});throw error;}finally{await call('close').catch(()=>{});}
 return bytes;
}
