import{afterEach,describe,expect,it,vi}from'vitest';
import{checkSource,prefixKind}from'../../packages/media-core/preflight';
import{allowWorkerOrigins}from'../../packages/media-core/network';
import{mediaTitle}from'../../packages/media-core/titles';
import type{Media,Variant}from'../../packages/contracts';
const url='https://media.test/signed.mp4?token=keep%2Bthis',variant:Variant={id:'v',url,label:''},media:Media={id:'m',tabId:1,pageUrl:'https://page.test/',title:'Original',url,kind:'direct',variants:[variant]};
const mp4=new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109]);
afterEach(()=>vi.unstubAllGlobals());
describe('source preflight',()=>{
 it('never samples the watch page for a record-only player',async()=>{const request=vi.fn();vi.stubGlobal('fetch',request);expect(await checkSource({...media,captureOnly:true,live:true},variant)).toMatchObject({state:'unknown',live:true});expect(request).not.toHaveBeenCalled();});
 it('rejects HTML disguised as video without trusting its MIME',async()=>{allowWorkerOrigins(['https://media.test/*']);vi.stubGlobal('fetch',vi.fn(async()=>new Response('\ufeff \n<!doctype html><html>reader</html>',{headers:{'Content-Type':'video/mp4'}})));expect(await checkSource(media,variant)).toMatchObject({state:'unavailable',error:'html'});});
 it('uses a bounded range, retains signatures and cancels a response ignoring Range',async()=>{allowWorkerOrigins(['https://media.test/*']);const cancel=vi.fn(),fetcher=vi.fn(async()=>new Response(new ReadableStream({start(controller){const data=new Uint8Array(100_000);data.set(mp4);controller.enqueue(data);},cancel}),{headers:{'Content-Type':'application/octet-stream','Content-Length':'5000000000'}}));vi.stubGlobal('fetch',fetcher);expect(await checkSource(media,variant)).toMatchObject({state:'ready',size:5_000_000_000});expect(fetcher.mock.calls[0]![0]).toBe(url);expect((fetcher.mock.calls[0]![1] as RequestInit).headers).toEqual({Range:'bytes=0-4095'});expect(cancel).toHaveBeenCalledOnce();});
 it('compares the complete Content-Range size, not the sample length, with the threshold',async()=>{allowWorkerOrigins(['https://media.test/*']);vi.stubGlobal('fetch',vi.fn(async()=>new Response(mp4,{status:206,headers:{'Content-Range':'bytes 0-11/500000','Content-Length':'12'}})));expect(await checkSource(media,variant,undefined,undefined,10000)).toMatchObject({state:'ready',size:500000});});
 it('rejects a tiny complete file even with a plausible MP4 signature',async()=>{allowWorkerOrigins(['https://media.test/*']);vi.stubGlobal('fetch',vi.fn(async()=>new Response(mp4,{headers:{'Content-Length':'12'}})));expect(await checkSource(media,variant,undefined,undefined,10000)).toMatchObject({state:'unavailable',error:'tooSmall'});});
 it('keeps network uncertainty distinct from a rejected file',async()=>{allowWorkerOrigins(['https://media.test/*']);vi.stubGlobal('fetch',vi.fn(async()=>{throw new TypeError('Failed to fetch');}));expect(await checkSource(media,variant)).toMatchObject({state:'unknown',error:'network'});});
 it('does not request an unauthorized or blocked source',async()=>{allowWorkerOrigins([]);const request=vi.fn();vi.stubGlobal('fetch',request);expect(await checkSource(media,variant)).toMatchObject({state:'unknown',error:'permission'});allowWorkerOrigins(['https://media.test/*']);expect(await checkSource(media,variant,async()=>{throw Error('blocked');})).toMatchObject({state:'unknown',error:'blocked'});expect(request).not.toHaveBeenCalled();});
 it('checks each HLS component independently and keeps native leaf identities without extra samples',async()=>{
  allowWorkerOrigins(['https://media.test/*']);const video='https://media.test/video.m3u8',audio='https://media.test/audio.m3u8',requests:{url:string;range?:string}[]=[];
  vi.stubGlobal('fetch',vi.fn(async(url:string,init:RequestInit={})=>{const path=new URL(url).pathname;requests.push({url,range:(init.headers as Record<string,string>)?.Range});if(path.endsWith('.m3u8'))return new Response(`#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXTINF:2,\n${path.startsWith('/audio')?'audio':'video'}-0.ts\n#EXTINF:2,\n${path.startsWith('/audio')?'audio':'video'}-1.ts\n#EXT-X-ENDLIST`,{headers:{'Content-Type':'application/vnd.apple.mpegurl'}});const prefix=new Uint8Array(mp4);if(path.startsWith('/audio'))prefix[prefix.length-1]=1;return new Response(prefix,{status:206,headers:{'Content-Range':`bytes 0-${prefix.length-1}/500000`}});}));
  const pair={...variant,url:video,audioUrl:audio},hls={...media,url:video,kind:'hls' as const,variants:[pair]},complete=await checkSource(hls,pair),calls=requests.length;
  expect(complete.state).toBe('ready');expect(complete.hlsTracks).toHaveLength(2);expect(complete.hlsTracks![0]).not.toBe(complete.hlsTracks![1]);expect(requests.filter(r=>r.range)).toHaveLength(4);expect(calls).toBe(6);
  const videoOnly=await checkSource(hls,{...pair,audioUrl:undefined}),audioOnly=await checkSource(hls,{...variant,url:audio});expect(videoOnly.hlsTracks).toEqual([complete.hlsTracks![0]]);expect(audioOnly.hlsTracks).toEqual([complete.hlsTracks![1]]);expect(videoOnly.planIdentity).not.toBe(complete.planIdentity);
 });
 it.each(['<html>reader','<!DOCTYPE html>reader','{ "error":"denied" }'])('rejects non-media body %s',body=>expect(prefixKind(new TextEncoder().encode(body))).not.toBe('media'));
});
describe('download title fallback',()=>{
 it.each(['','   ','Alcydeo.mp4','Alcydeo','Video','Player'])('uses the page title instead of generic %s',title=>expect(mediaTitle(title,'Cours sur la lumière')).toBe('Cours sur la lumière'));
 it('preserves an explicit media title and normalizes whitespace',()=>expect(mediaTitle('  Le\n martin-pêcheur  ','Page')).toBe('Le martin-pêcheur'));
});
