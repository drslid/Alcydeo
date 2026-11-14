import{afterEach,describe,expect,it,vi}from'vitest';
import{readFileSync}from'node:fs';
import{directDimensions}from'../../packages/media-core/source-metadata';

const url='https://media.test/original.mov?signature=keep%2Bquery%2Fbytes',data=new Uint8Array(readFileSync('fixtures/formats/sample.mov')),prefix=data.subarray(0,4096);
afterEach(()=>vi.restoreAllMocks());
function serve(bytes:Uint8Array=data,change?:(response:Response,start:number,end:number)=>Response){
 const requests:{start:number;end:number;options:RequestInit}[]=[];
 vi.spyOn(globalThis,'fetch').mockImplementation(async(input,options={})=>{
  expect(input).toBe(url);const headers=options.headers as Record<string,string>,match=/^bytes=(\d+)-(\d+)$/.exec(headers.Range)!;expect(match).toBeTruthy();
  const start=Number(match[1]),end=Number(match[2])+1;requests.push({start,end,options});
  const response=new Response(bytes.subarray(start,end),{status:206,headers:{'Content-Type':'video/quicktime','Content-Range':`bytes ${start}-${end-1}/${bytes.length}`,'Content-Length':String(end-start),'ETag':'"same-version"'}});
  return change?change(response,start,end):response;
 });return requests;
}
const concat=(...parts:Uint8Array[])=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let n=0;for(const p of parts){out.set(p,n);n+=p.length;}return out;};
const box=(type:string,body:Uint8Array)=>{const out=new Uint8Array(body.length+8);new DataView(out.buffer).setUint32(0,out.length);out.set(new TextEncoder().encode(type),4);out.set(body,8);return out;};
const identity=[65536,0,0,0,65536,0,0,0,1073741824],quarterTurn=[0,65536,0,-65536,0,0,0,0,1073741824];
function matrix(bytes:Uint8Array,offset:number,values:number[]){const view=new DataView(bytes.buffer);values.forEach((v,i)=>view.setInt32(offset+i*4,v));}
function track(width:number,height:number,options:{version?:number;matrix?:number[];role?:string;fakeHandler?:boolean}={}){
 const version=options.version??0,tkhd=new Uint8Array(version===1?96:84),view=new DataView(tkhd.buffer),offset=version===1?52:40;tkhd[0]=version;matrix(tkhd,offset,options.matrix??identity);view.setUint32(offset+36,width*65536);view.setUint32(offset+40,height*65536);
 const hdlr=new Uint8Array(24);hdlr.set(new TextEncoder().encode(options.role??'vide'),8);
 return box('trak',concat(box('tkhd',tkhd),options.fakeHandler?box('hdlr',hdlr):box('mdia',box('hdlr',hdlr))));
}
function movie(tracks:Uint8Array[],values=identity){
 const mvhd=new Uint8Array(100);matrix(mvhd,36,values);const init=new Uint8Array(readFileSync('fixtures/cmaf/init.mp4')),ftyp=init.subarray(0,new DataView(init.buffer).getUint32(0));
 return concat(ftyp,box('moov',concat(box('mvhd',mvhd),box('free',new Uint8Array(100000)),...tracks)),box('mdat',new Uint8Array(100000)));
}
describe('bounded direct ISO-BMFF metadata',()=>{
 it.each([0,1])('reads a large moov through only presentation headers, tkhd version %i',async version=>{
  const bytes=movie([track(720,1280,{version}),track(0,0,{role:'soun'})]),requests=serve(bytes);
  expect(await directDimensions(url,bytes.length,bytes.subarray(0,4096),async()=>{})).toEqual({width:720,height:1280});expect(requests.length).toBeLessThanOrEqual(4);expect(requests.reduce((sum,r)=>sum+r.end-r.start,0)).toBeLessThanOrEqual(65536);expect(requests.every(r=>r.end-r.start<=16384)).toBe(true);
 });
 it.each([
  [quarterTurn,identity,180,320],
  [[-65536,0,0,0,-65536,0,0,0,1073741824],identity,320,180],
  [[-65536,0,0,0,65536,0,0,0,1073741824],identity,320,180],
  [[0,-65536,0,-65536,0,0,0,0,1073741824],identity,180,320],
  [quarterTurn,quarterTurn,320,180],
 ])('applies only orthogonal movie and track matrices',async(trackMatrix,movieMatrix,width,height)=>{
  const bytes=movie([track(320,180,{matrix:trackMatrix as number[]})],movieMatrix as number[]);serve(bytes);expect(await directDimensions(url,bytes.length,bytes.subarray(0,4096),async()=>{})).toEqual({width,height});
 });
 it.each([
  ()=>movie([track(320,180),track(720,1280)]),
  ()=>movie([track(320,180,{fakeHandler:true})]),
  ()=>movie([track(320,180,{role:'VIDE'})]),
  ()=>movie([track(320.5,180)]),
  ()=>movie([track(320,180,{matrix:[32768,0,0,0,65536,0,0,0,1073741824]})]),
  ()=>movie([track(320,180)],[65536,1,0,0,65536,0,0,0,1073741824]),
 ])('leaves ambiguous roles, fractional presentation sizes or complex matrices unknown',async make=>{
  const bytes=make();serve(bytes);expect(await directDimensions(url,bytes.length,bytes.subarray(0,4096),async()=>{})).toBeUndefined();
 });
 it.each([4,2000000])('does not follow a child box length outside its parent (%i)',async length=>{
  const bytes=movie([track(320,180)]),position=Buffer.from(bytes).indexOf('tkhd')-4;new DataView(bytes.buffer).setUint32(position,length);const requests=serve(bytes);
  expect(await directDimensions(url,bytes.length,bytes.subarray(0,4096),async()=>{})).toBeUndefined();expect(requests.length).toBeLessThanOrEqual(4);expect(requests.reduce((sum,r)=>sum+r.end-r.start,0)).toBeLessThanOrEqual(65536);
 });
 it('skips mdat, keeps the exact signed URL, and validates strong ETag ranges',async()=>{
  const requests=serve(),guard=vi.fn(async()=>{});
  expect(await directDimensions(url,data.length,prefix,guard,undefined,'"same-version"')).toEqual({width:320,height:180});
  expect(requests).toHaveLength(1);expect(requests[0]!.start).toBeGreaterThan(data.length-16384);expect(requests[0]!.end).toBe(data.length);expect(guard).toHaveBeenCalledWith(url);
  expect(requests[0]!.options).toMatchObject({credentials:'include',cache:'no-store',redirect:'error',headers:{'If-Range':'"same-version"'}});expect(requests[0]!.options.signal?.aborted).toBe(true);
 });
 it.each([undefined,'W/"weak-version"'])('never sends an absent or weak ETag as If-Range (%s)',async etag=>{
  const requests=serve();expect(await directDimensions(url,data.length,prefix,async()=>{},undefined,etag)).toEqual({width:320,height:180});expect((requests[0]!.options.headers as Record<string,string>)['If-Range']).toBeUndefined();
 });
 it.each([
  {'ETag':'"changed-version"'},
  {'Content-Range':`bytes 1-${data.length-1}/${data.length}`},
  {'Content-Range':`bytes 521258-${data.length-2}/${data.length}`,'Content-Length':'4454'},
  {'Content-Range':`bytes 521258-${data.length-1}/${data.length+1}`},
  {'Content-Encoding':'gzip'},
  {'Content-Type':'text/html'},
  {'Content-Disposition':'attachment; filename="error.html"'},
 ])('leaves metadata unknown on changed or inconsistent response %j',async changed=>{
  const requests=serve(data,(response)=>{for(const[k,v]of Object.entries(changed))response.headers.set(k,v);return response;});
  expect(await directDimensions(url,data.length,prefix,async()=>{},undefined,'"same-version"')).toBeUndefined();expect(requests).toHaveLength(1);
 });
 it('cancels an ignored Range response without draining the whole file',async()=>{
  const cancel=vi.fn(),pull=vi.fn();serve(data,()=>new Response(new ReadableStream({pull,cancel}),{status:200,headers:{'Content-Type':'video/mp4','Content-Length':String(data.length)}}));
  expect(await directDimensions(url,data.length,prefix,async()=>{})).toBeUndefined();expect(cancel).toHaveBeenCalledOnce();expect(pull.mock.calls.length).toBeLessThanOrEqual(1);
 });
 it('stops on a disguised HTML body rather than parsing it as metadata',async()=>{
  serve(data,(_response,start,end)=>new Response(new Uint8Array(Buffer.from('<!doctype html><html>Unavailable</html>'.padEnd(end-start))),{status:206,headers:{'Content-Type':'video/mp4','Content-Range':`bytes ${start}-${end-1}/${data.length}`,'Content-Length':String(end-start)}}));
  expect(await directDimensions(url,data.length,prefix,async()=>{})).toBeUndefined();
 });
 it.each(['short','oversized'])('cancels a %s range body',async mode=>{
  const cancel=vi.fn();serve(data,(_response,start,end)=>new Response(new ReadableStream({start(controller){const body=new Uint8Array(end-start+(mode==='short'?-1:1));body.set(data.subarray(start,Math.min(end,start+body.length)));controller.enqueue(body);if(mode==='short')controller.close();},cancel}),{status:206,headers:{'Content-Type':'video/mp4','Content-Range':`bytes ${start}-${end-1}/${data.length}`,'Content-Length':String(end-start)}}));
  expect(await directDimensions(url,data.length,prefix,async()=>{})).toBeUndefined();if(mode==='oversized')expect(cancel).toHaveBeenCalledOnce();
 });
 it('honors permission checks before any additional network request',async()=>{
  const requests=serve();expect(await directDimensions(url,data.length,prefix,async()=>{throw Error('blocked');})).toBeUndefined();expect(requests).toHaveLength(0);
 });
 it('aborts pending reads and never continues after the shared deadline',async()=>{
  const deadline=new AbortController(),clock=vi.spyOn(AbortSignal,'timeout').mockReturnValue(deadline.signal),cancel=vi.fn();let started:()=>void=()=>{};const pending=new Promise<void>(resolve=>{started=resolve;});
  const requests=serve(data,(_response,start,end)=>{started();return new Response(new ReadableStream({cancel}),{status:206,headers:{'Content-Type':'video/mp4','Content-Range':`bytes ${start}-${end-1}/${data.length}`,'Content-Length':String(end-start)}});});
  const result=directDimensions(url,data.length,prefix,async()=>{});await pending;deadline.abort();expect(await result).toBeUndefined();expect(clock).toHaveBeenCalledWith(8000);expect(cancel).toHaveBeenCalledOnce();expect(requests).toHaveLength(1);expect(requests[0]!.options.signal?.aborted).toBe(true);
 });
 it('does not start a late fetch if the guard finishes after cancellation',async()=>{
  const stop=new AbortController(),requests=serve();let unlock:()=>void=()=>{},entered:()=>void=()=>{};const entry=new Promise<void>(resolve=>{entered=resolve;}),gate=new Promise<void>(resolve=>{unlock=resolve;});
  const result=directDimensions(url,data.length,prefix,()=>{entered();return gate;},stop.signal);await entry;stop.abort();expect(await result).toBeUndefined();unlock();await Promise.resolve();expect(requests).toHaveLength(0);
 });
 it('limits extra reads to four attempts and 64 KiB when metadata is far beyond many boxes',async()=>{
  const initial=new Uint8Array(readFileSync('fixtures/cmaf/init.mp4')),ftypSize=new DataView(initial.buffer,initial.byteOffset).getUint32(0),sparse=new Uint8Array(ftypSize+20000*10+initial.length-ftypSize);sparse.set(initial.subarray(0,ftypSize));
  for(let i=0;i<10;i++){const start=ftypSize+i*20000;new DataView(sparse.buffer).setUint32(start,20000);sparse.set([102,114,101,101],start+4);}sparse.set(initial.subarray(ftypSize),ftypSize+20000*10);
  const requests=serve(sparse);expect(await directDimensions(url,sparse.length,sparse.subarray(0,4096),async()=>{})).toBeUndefined();expect(requests).toHaveLength(4);expect(requests.reduce((sum,r)=>sum+r.end-r.start,0)).toBe(65536);
 });
 it('rejects an excessive moov length before any parser or network allocation',async()=>{
  const bytes=new Uint8Array(4096);new DataView(bytes.buffer).setUint32(0,1000000);bytes.set([109,111,111,118],4);const requests=serve();expect(await directDimensions(url,2000000,bytes,async()=>{})).toBeUndefined();expect(requests).toHaveLength(0);
 });
 it('checks extended box lengths with BigInt before converting to Number',async()=>{
  const bytes=new Uint8Array(4096),view=new DataView(bytes.buffer);view.setUint32(0,1);bytes.set([102,114,101,101],4);view.setBigUint64(8,BigInt(Number.MAX_SAFE_INTEGER)+1n);const requests=serve();expect(await directDimensions(url,Number.MAX_SAFE_INTEGER,bytes,async()=>{})).toBeUndefined();expect(requests).toHaveLength(0);
 });
 it('bounds even tiny box-header traversal without more requests',async()=>{
  const bytes=new Uint8Array(4096);for(let start=0;start<bytes.length;start+=8){new DataView(bytes.buffer).setUint32(start,8);bytes.set([102,114,101,101],start+4);}const requests=serve();expect(await directDimensions(url,5000000,bytes,async()=>{})).toBeUndefined();expect(requests).toHaveLength(0);
 });
 it.each([new Uint8Array([0x47,0,0,0,0]),new Uint8Array([0x1a,0x45,0xdf,0xa3,0,0,0,0])])('does not apply the fallback to other container signatures',async bytes=>{
  const requests=serve();expect(await directDimensions(url,5000000,bytes,async()=>{})).toBeUndefined();expect(requests).toHaveLength(0);
 });
});
