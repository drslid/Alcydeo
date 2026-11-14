import type {Task,MultipartCheckpoint} from '../contracts';
import {mediaFetch} from './network';
import {directExtension,htmlResponse,responseFilename} from './classification';
import {changeTask} from '../storage';

export const rangeInfo=(value:string|null)=>{const m=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(value??'');if(!m)return;const[start,end,total]=m.slice(1).map(Number) as[number,number,number];return Number.isSafeInteger(total)&&total>0&&start>=0&&start<=end&&end<total?{start,end,total}:undefined;};
export const strongEtag=(value:string|null)=>!!value&&/^"[\x21\x23-\x7e\x80-\xff]*"$/.test(value);
export function divideRanges(total:number,count:number){if(!Number.isSafeInteger(total)||total<1||![2,4,8].includes(count))throw new Error('invalid');const size=Math.ceil(total/count);return Array.from({length:count},(_,i)=>({start:i*size,end:Math.min(total,(i+1)*size)-1,received:0})).filter(p=>p.start<=p.end);}
const encoded=(r:Response)=>!['','identity'].includes(r.headers.get('content-encoding')??'');
function rejectHtml(r:Response){if(htmlResponse(r.headers.get('content-type')??'',responseFilename(r.headers.get('content-disposition')??'')))throw new Error('html');}

// False means that a fresh task can use Chrome's ordinary direct transfer.
// No full response is buffered; one OPFS file is written at explicit offsets.
export async function multipartFile(task:Task,dir:FileSystemDirectoryHandle,signal:AbortSignal):Promise<boolean>{
  const prior=task.multipart;const requested=task.transfer?.connections??4;
  let response:Response;try{response=await mediaFetch(task.variant.url,{headers:{Range:'bytes=0-0',...(prior?{'If-Range':prior.etag}:{})},signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])});}catch(e){if(!prior&&!signal.aborted&&e instanceof TypeError)return false;throw e;}
  let info:ReturnType<typeof rangeInfo>,etag:string|null;
  try{rejectHtml(response);info=rangeInfo(response.headers.get('content-range'));etag=response.headers.get('etag');
    if(response.status!==206||!info||info.start!==0||info.end!==0||!strongEtag(etag)||encoded(response)||info.total<1024*1024||!directExtension(task.variant.url,task.variant.contentType??task.media.contentType)){if(prior)throw new Error('sourceChanged');return false;}
    if(prior&&(prior.etag!==etag||prior.total!==info.total))throw new Error('sourceChanged');
  }finally{await response.body?.cancel();}
  const total=info!.total,parts=divideRanges(total,requested);const output=await dir.getFileHandle('output.original',{create:true});
  if(typeof output.createSyncAccessHandle!=='function'){if(prior)throw new Error('interrupted');return false;}
  const access=await output.createSyncAccessHandle();
  let checkpoint:MultipartCheckpoint={etag:etag!,total,parts};
  if(prior&&access.getSize()===total&&prior.parts.length===parts.length&&prior.parts.every((p,i)=>p.start===parts[i]!.start&&p.end===parts[i]!.end&&Number.isInteger(p.received)&&p.received>=0&&p.received<=p.end-p.start+1))checkpoint=structuredClone(prior);
  const controller=new AbortController(),combined=AbortSignal.any([signal,controller.signal]);let failure:unknown;let persisted=0,last=0;let ready=false;
  const received=()=>checkpoint.parts.reduce((n,p)=>n+p.received,0);
  async function persist(force=false){const bytes=received();if(!force&&bytes-persisted<4*1024*1024&&Date.now()-last<1000)return;access.flush();const snapshot=structuredClone(checkpoint);persisted=bytes;last=Date.now();await changeTask(task.id,t=>{t.multipart=snapshot;t.bytes=bytes;t.total=total;t.progress=bytes/total*0.9;});}
  try{
    const estimate=await navigator.storage.estimate();
    if(estimate.quota&&estimate.quota-(estimate.usage??0)<Math.max(0,total-access.getSize())+16*1024*1024)throw new Error('space');
    if(!prior||access.getSize()!==total)access.truncate(total);await persist(true);
    const results=await Promise.allSettled(checkpoint.parts.map(async part=>{
      if(part.received===part.end-part.start+1)return;
      const idle=new AbortController();let timeout:ReturnType<typeof setTimeout>;const activity=()=>{clearTimeout(timeout);timeout=setTimeout(()=>idle.abort(),120000);};activity();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
      const initial=part.received;
      try{
        const start=part.start+part.received;const r=await mediaFetch(task.variant.url,{headers:{Range:`bytes=${start}-${part.end}`,'If-Range':checkpoint.etag},signal:AbortSignal.any([combined,idle.signal])});
        try{rejectHtml(r);}catch(e){await r.body?.cancel();throw e;}
        const actual=rangeInfo(r.headers.get('content-range'));
        if(r.status!==206||r.headers.get('etag')!==checkpoint.etag){await r.body?.cancel();throw new Error('sourceChanged');}
        const length=r.headers.get('content-length');if(!actual||actual.start!==start||actual.end!==part.end||actual.total!==total||encoded(r)||(length!==null&&Number(length)!==part.end-start+1)){await r.body?.cancel();throw new Error('range');}
        reader=r.body?.getReader();if(!reader)throw new Error('network');
        while(true){const{done,value}=await reader.read();if(done)break;activity();if(combined.aborted)throw new Error('cancelled');if(part.start+part.received+value.length>part.end+1)throw new Error('range');const written=access.write(value,{at:part.start+part.received});if(written!==value.length)throw new Error('space');part.received+=written;await persist();}
        if(part.received!==part.end-part.start+1)throw new Error('range');await persist(true);
      }catch(e){if(e instanceof Error&&['range','sourceChanged'].includes(e.message))part.received=initial;failure??=e;controller.abort();throw e;}finally{clearTimeout(timeout!);await reader?.cancel().catch(()=>{});}
    }));
    const rejected=results.find(r=>r.status==='rejected');if(rejected)throw failure??new Error('network');
    if(combined.aborted||received()!==total)throw new Error('cancelled');await persist(true);ready=true;
  }finally{try{await persist(true);}finally{access.close();}}
  return ready;
}
