import type{Segment}from'./hls';
import{mediaFetch}from'./network';
import{htmlResponse}from'./classification';
import{prefixKind}from'./preflight';

// Large SegmentBase resources may take longer than a small TS segment. Bound
// inactivity instead of the complete transfer, with at most 512 KiB buffered.
export async function downloadFragment(segment:Segment,file:FileSystemFileHandle,signal:AbortSignal,progress?:(bytes:number,total?:number)=>Promise<void>){
 const idle=new AbortController(),combined=AbortSignal.any([signal,idle.signal]);let timer:ReturnType<typeof setTimeout>;
 const activity=()=>{clearTimeout(timer);timer=setTimeout(()=>idle.abort(),120000);};activity();
 let reader:ReadableStreamDefaultReader<Uint8Array>|undefined,writable:FileSystemWritableFileStream|undefined,size=0;
 try{
  const response=await mediaFetch(segment.url,{signal:combined,headers:segment.range?{Range:`bytes=${segment.range.start}-${segment.range.start+segment.range.length-1}`} :undefined});activity();
  reader=response.body?.getReader();if(!reader)throw new Error('network');
  if(htmlResponse(response.headers.get('Content-Type')??''))throw new Error('html');
  if(segment.range){const match=/^bytes (\d+)-(\d+)\/(?:\d+|\*)$/.exec(response.headers.get('Content-Range')??'');if(response.status!==206||!match||Number(match[1])!==segment.range.start||Number(match[2])!==segment.range.start+segment.range.length-1)throw new Error('range');}
  const length=Number(response.headers.get('Content-Length')),expected=segment.range?.length??(!response.headers.get('Content-Encoding')&&Number.isSafeInteger(length)&&length>0?length:undefined);
  writable=await file.createWritable();const buffer=new Uint8Array(512*1024),prefix=new Uint8Array(4096);let filled=0,prefixBytes=0;
  while(true){
   if(combined.aborted)throw new Error(signal.aborted?'cancelled':'network');const{done,value}=await reader.read();activity();if(done)break;
   if(combined.aborted)throw new Error(signal.aborted?'cancelled':'network');
   if(prefixBytes<prefix.length){const take=Math.min(value.length,prefix.length-prefixBytes);prefix.set(value.subarray(0,take),prefixBytes);prefixBytes+=take;const kind=prefixKind(prefix.subarray(0,prefixBytes));if(kind==='html'||kind==='notMedia')throw new Error(kind);}
   if(expected!==undefined&&size+value.length>expected)throw new Error('invalid');
   for(let offset=0;offset<value.length;){if(combined.aborted)throw new Error(signal.aborted?'cancelled':'network');const take=Math.min(value.length-offset,buffer.length-filled);buffer.set(value.subarray(offset,offset+take),filled);offset+=take;filled+=take;if(filled===buffer.length){await writable.write(buffer);filled=0;activity();}}
   size+=value.length;await progress?.(size,expected);
  }
  if(combined.aborted)throw new Error(signal.aborted?'cancelled':'network');if(!size||expected!==undefined&&size!==expected)throw new Error('invalid');
  if(filled)await writable.write(buffer.subarray(0,filled));await writable.close();writable=undefined;
  return{bytes:size,etag:response.headers.get('etag')??undefined};
 }catch(error){await writable?.abort().catch(()=>{});if(signal.aborted)throw new Error('cancelled');if(idle.signal.aborted)throw new Error('network');throw error;}
 finally{clearTimeout(timer!);await reader?.cancel().catch(()=>{});}
}
