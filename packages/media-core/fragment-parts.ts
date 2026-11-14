import type{Segment}from'./hls';
import{mediaFetch}from'./network';
import{htmlResponse,responseFilename}from'./classification';
import{prefixKind}from'./preflight';
import{divideRanges,rangeInfo,strongEtag}from'./multipart';

// Whole DASH resources use the existing connection setting. Partial track
// files are never checkpoints: only a complete, version-consistent resource is.
export async function downloadFragmentParts(segment:Segment,file:FileSystemFileHandle,signal:AbortSignal,connections:2|4|8,progress?:(bytes:number,total:number)=>Promise<void>):Promise<{bytes:number;etag:string}|undefined>{
 if(segment.range||typeof file.createSyncAccessHandle!=='function')return;
 if(![2,4,8].includes(connections))throw new Error('invalid');
 const probe=await mediaFetch(segment.url,{headers:{Range:'bytes=0-0'},signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])});
 let info:ReturnType<typeof rangeInfo>,etag:string|null;
 const rejectHtml=(response:Response)=>{if(htmlResponse(response.headers.get('content-type')??'',responseFilename(response.headers.get('content-disposition')??'')))throw new Error('html');};
 const encoded=(response:Response)=>!['','identity'].includes(response.headers.get('content-encoding')??'');
 try{
  rejectHtml(probe);info=rangeInfo(probe.headers.get('content-range'));etag=probe.headers.get('etag');
  if(probe.status!==206||!info||info.start!==0||info.end!==0||info.total<1024*1024||!strongEtag(etag)||encoded(probe)||(probe.headers.has('content-length')&&probe.headers.get('content-length')!=='1'))return;
 }finally{await probe.body?.cancel().catch(()=>{});}
 if(signal.aborted)throw new Error('cancelled');
 const total=info!.total,parts=divideRanges(total,connections),access=await file.createSyncAccessHandle();
 const failed=new AbortController(),combined=AbortSignal.any([signal,failed.signal]);let failure:unknown,complete=false;
 try{
  const estimate=await navigator.storage.estimate();if(estimate.quota&&estimate.quota-(estimate.usage??0)<Math.max(0,total-access.getSize())+16*1024*1024)throw new Error('space');
  access.truncate(total);
  const results=await Promise.allSettled(parts.map(async part=>{
   const idle=new AbortController(),partSignal=AbortSignal.any([combined,idle.signal]);let timer:ReturnType<typeof setTimeout>,reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
   const activity=()=>{clearTimeout(timer);timer=setTimeout(()=>idle.abort(),120000);};activity();
   const prefix=new Uint8Array(4096);let prefixBytes=0;
   try{
    const response=await mediaFetch(segment.url,{headers:{Range:`bytes=${part.start}-${part.end}`,'If-Range':etag!},signal:partSignal});activity();reader=response.body?.getReader();if(!reader)throw new Error('network');rejectHtml(response);
    const actual=rangeInfo(response.headers.get('content-range'));
    if(response.status!==206||response.headers.get('etag')!==etag)throw new Error('sourceChanged');
    if(!actual||actual.start!==part.start||actual.end!==part.end||actual.total!==total||encoded(response)||(response.headers.has('content-length')&&Number(response.headers.get('content-length'))!==part.end-part.start+1))throw new Error('range');
    while(true){
     if(partSignal.aborted)throw new Error(signal.aborted?'cancelled':'network');const{done,value}=await reader.read();activity();if(done)break;
     if(partSignal.aborted)throw new Error(signal.aborted?'cancelled':'network');
     if(part.start===0&&prefixBytes<prefix.length){const take=Math.min(value.length,prefix.length-prefixBytes);prefix.set(value.subarray(0,take),prefixBytes);prefixBytes+=take;const kind=prefixKind(prefix.subarray(0,prefixBytes));if(kind==='html'||kind==='notMedia')throw new Error(kind);}
     if(part.start+part.received+value.length>part.end+1)throw new Error('range');
     const written=access.write(value,{at:part.start+part.received});if(written!==value.length)throw new Error('space');part.received+=written;activity();
     await progress?.(parts.reduce((n,p)=>n+p.received,0),total);
    }
    if(part.received!==part.end-part.start+1)throw new Error('range');
   }catch(error){failure??=signal.aborted?new Error('cancelled'):idle.signal.aborted?new Error('network'):error;failed.abort();throw error;}
   finally{clearTimeout(timer!);await reader?.cancel().catch(()=>{});}
  }));
  if(results.some(result=>result.status==='rejected'))throw failure??new Error('network');
  if(combined.aborted||parts.reduce((n,p)=>n+p.received,0)!==total)throw new Error('cancelled');
  access.flush();complete=true;return{bytes:total,etag:etag!};
 }finally{try{if(!complete)access.truncate(0);}finally{access.close();}}
}
