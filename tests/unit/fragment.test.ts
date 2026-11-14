import{afterEach,describe,it,expect,vi}from'vitest';
import{downloadFragment}from'../../packages/media-core/fragment';import{mediaFetch}from'../../packages/media-core/network';
vi.mock('../../packages/media-core/network',()=>({mediaFetch:vi.fn()}));
afterEach(()=>{vi.useRealTimers();vi.resetAllMocks();});
const segment={url:'https://cdn.test/?sig=a%2Bb&id=native'};
function target(){const writes:Uint8Array[]=[],writer={write:vi.fn(async(b:Uint8Array)=>{writes.push(b.slice());}),close:vi.fn(async()=>{}),abort:vi.fn(async()=>{})};return{file:{createWritable:vi.fn(async()=>writer)}as unknown as FileSystemFileHandle,writer,writes};}
function bytes(size:number){const b=Uint8Array.from({length:size},(_,i)=>i%251);b.set([0,0,0,24,102,116,121,112]);return b;}
describe('progressive DASH/HLS fragment transfer',()=>{
 it('coalesces tiny network chunks into bounded writes, reports bytes, and preserves every byte',async()=>{
  const data=bytes(1300000),t=target(),progress:number[]=[];let offset=0;vi.mocked(mediaFetch).mockResolvedValue(new Response(new ReadableStream({pull(c){if(offset===data.length){c.close();return;}const end=Math.min(offset+4096,data.length);c.enqueue(data.subarray(offset,end));offset=end;}}),{headers:{'Content-Length':String(data.length),'ETag':'"native"'}}));
  const result=await downloadFragment(segment,t.file,new AbortController().signal,async n=>{progress.push(n);});expect(result).toEqual({bytes:data.length,etag:'"native"'});expect(Buffer.concat(t.writes)).toEqual(Buffer.from(data));expect(t.writes).toHaveLength(3);expect(t.writes.every(w=>w.length<=512*1024)).toBe(true);expect(progress.at(-1)).toBe(data.length);expect(t.writer.close).toHaveBeenCalledOnce();expect(t.writer.abort).not.toHaveBeenCalled();expect(mediaFetch).toHaveBeenCalledWith(segment.url,expect.objectContaining({signal:expect.any(AbortSignal)}));
 });
 it('continues beyond two minutes while data is arriving',async()=>{
  vi.useFakeTimers();const t=target();let count=0;vi.mocked(mediaFetch).mockResolvedValue(new Response(new ReadableStream({async pull(c){if(count===3){c.close();return;}await new Promise(r=>setTimeout(r,50000));c.enqueue(bytes(16));count++;}})));
  const finished=downloadFragment(segment,t.file,new AbortController().signal);await vi.advanceTimersByTimeAsync(160000);await expect(finished).resolves.toMatchObject({bytes:48});expect(t.writer.close).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
 });
 it.each(['idle','cancel'])('aborts a %s stream, closes its reader and commits no file',async mode=>{
  vi.useFakeTimers();const t=target(),controller=new AbortController();let source:ReadableStreamDefaultController<Uint8Array>;
  vi.mocked(mediaFetch).mockImplementation(async(_url,init)=>{const body=new ReadableStream<Uint8Array>({start(c){source=c;}});init!.signal!.addEventListener('abort',()=>source.error(new DOMException('Aborted','AbortError')));return new Response(body);});
  const finished=downloadFragment(segment,t.file,controller.signal),check=expect(finished).rejects.toThrow(mode==='idle'?'network':'cancelled');await vi.advanceTimersByTimeAsync(mode==='idle'?120001:1);if(mode==='cancel')controller.abort();await check;expect(t.writer.abort).toHaveBeenCalledOnce();expect(t.writer.close).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
 it.each(['short','long','html','range'])('refuses %s responses without committing a checkpoint',async kind=>{
  const t=target(),data=kind==='html'?new TextEncoder().encode('<!doctype html><html>Not a video'):bytes(16);
  vi.mocked(mediaFetch).mockResolvedValue(new Response(data,{headers:{'Content-Length':String(kind==='short'?20:kind==='long'?8:data.length)}}));
  await expect(downloadFragment(kind==='range'?{...segment,range:{start:0,length:16}}:segment,t.file,new AbortController().signal)).rejects.toThrow(kind==='html'?'html':kind==='range'?'range':'invalid');expect(t.writer.close).not.toHaveBeenCalled();
 });
});
