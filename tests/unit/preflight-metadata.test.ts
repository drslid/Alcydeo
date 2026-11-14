import{afterEach,describe,expect,it,vi}from'vitest';
import{readFileSync}from'node:fs';
import{checkSource}from'../../packages/media-core/preflight';
import{allowWorkerOrigins}from'../../packages/media-core/network';
import type{Media,Variant}from'../../packages/contracts';

const url='https://media.test/selected.mp4?sig=original%2Bbytes',variant:Variant={id:'v',url,label:'1080p',height:1080},media:Media={id:'m',tabId:1,pageUrl:'https://page.test/',title:'Original',url,kind:'direct',variants:[variant]};
const prefix=(name:string)=>new Uint8Array(readFileSync(name)).subarray(0,4096);
const mp4=prefix('fixtures/cmaf/init.mp4');
function response(data:Uint8Array,total=500000,headers:Record<string,string>={}){return new Response(data,{status:206,headers:{'Content-Type':'application/octet-stream','Content-Range':`bytes 0-${data.length-1}/${total}`,'Content-Length':String(data.length),...headers}});}
afterEach(()=>vi.unstubAllGlobals());
function ready(fetcher:typeof fetch){allowWorkerOrigins(['https://media.test/*']);vi.stubGlobal('fetch',vi.fn(fetcher));}

describe('bounded source metadata',()=>{
 it.each([
  ['MP4 initialization','fixtures/cmaf/init.mp4',720,404],
  ['MPEG-TS','fixtures/hls-high/segment-0.ts',720,404],
  ['WebM','fixtures/formats/sample.webm',320,180],
 ])('reads actual display dimensions from an existing %s prefix',async(_format,name,width,height)=>{
  ready(async()=>response(prefix(String(name))));
  expect(await checkSource(media,variant)).toMatchObject({state:'ready',width,height,size:500000});
  expect(variant.height).toBe(1080);
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  expect(vi.mocked(fetch).mock.calls[0]![1]?.headers).toEqual({Range:'bytes=0-4095'});
 });
 it('keeps a valid file available when its metadata lies outside the prefix',async()=>{
  ready(async()=>response(prefix('fixtures/media/high.mp4')));
  const check=await checkSource(media,variant);expect(check.state).toBe('ready');expect(check.width).toBeUndefined();expect(check.height).toBeUndefined();
 });
 it.each([
  ['fixtures/formats/sample.mov',320,180],
  ['fixtures/media/high.mp4',720,404],
 ])('reads bounded direct MP4/MOV metadata outside the first 4K: %s',async(name,width,height)=>{
  const data=new Uint8Array(readFileSync(String(name))),ranges:{start:number;end:number}[]=[];
  ready(async(input,init)=>{expect(input).toBe(url);const match=/^bytes=(\d+)-(\d+)$/.exec((init?.headers as Record<string,string>).Range)!;const start=Number(match[1]),end=Number(match[2]);ranges.push({start,end});return new Response(data.subarray(start,end+1),{status:206,headers:{'Content-Type':'video/mp4','Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':String(end-start+1),'ETag':'"same-source"'}});});
  expect(await checkSource(media,variant)).toMatchObject({state:'ready',width,height,size:data.length});expect(ranges[0]).toEqual({start:0,end:4095});expect(ranges.length).toBeGreaterThan(1);expect(ranges.length).toBeLessThanOrEqual(5);expect(ranges.slice(1).reduce((sum,r)=>sum+r.end-r.start+1,0)).toBeLessThanOrEqual(65536);expect(ranges.slice(1).every(r=>r.start>0)).toBe(true);
 });
 it('reads fMP4 initialization dimensions without announcing its size as the VOD size',async()=>{
  ready(async(input)=>{const path=new URL(String(input)).pathname;if(path.endsWith('.m3u8'))return new Response('#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:2,\na.m4s\n#EXTINF:2,\nb.m4s\n#EXTINF:2,\nc.m4s\n#EXT-X-ENDLIST');return response(path==='/init.mp4'?mp4:prefix('fixtures/cmaf/piece-0.m4s'),path==='/init.mp4'?mp4.length:500000);});
  const v={...variant,url:'https://media.test/index.m3u8',bandwidth:2400000};
  const check=await checkSource({...media,kind:'hls',url:v.url,variants:[v]},v);
  expect(check).toMatchObject({state:'ready',width:720,height:404,estimatedSize:1800000});expect(check.size).toBeUndefined();expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
 });
 it('keeps HLS samples at 4K and never applies the direct-file fallback to its fragments',async()=>{
  const ranges:string[]=[];ready(async(input,init)=>{if(String(input).endsWith('.m3u8'))return new Response('#EXTM3U\n#EXTINF:2,\na.mp4\n#EXTINF:2,\nb.mp4\n#EXT-X-ENDLIST');ranges.push((init!.headers as Record<string,string>).Range);return response(prefix('fixtures/media/high.mp4'));});
  const v={...variant,url:'https://media.test/index.m3u8'};const check=await checkSource({...media,kind:'hls',url:v.url,variants:[v]},v);
  expect(check.state).toBe('ready');expect(check.width).toBeUndefined();expect(check.height).toBeUndefined();expect(ranges).toEqual(['bytes=0-4095','bytes=0-4095']);
 });
 it('sums complete DASH resource sizes including audio, rather than MPD or prefix lengths',async()=>{
  ready(async(input)=>{const path=new URL(String(input)).pathname;if(path.endsWith('.mpd'))return new Response('<MPD mediaPresentationDuration="PT6S"><Period><AdaptationSet contentType="video"><Representation id="v" height="1080"><BaseURL>video.mp4</BaseURL></Representation></AdaptationSet><AdaptationSet contentType="audio"><Representation id="a"><BaseURL>audio.mp4</BaseURL></Representation></AdaptationSet></Period></MPD>');return response(path==='/audio.mp4'?prefix('fixtures/hls-audio/init.mp4'):mp4,path==='/audio.mp4'?100000:900000);});
  const v={...variant,url:'https://media.test/manifest.mpd'};const check=await checkSource({...media,kind:'dash',url:v.url,variants:[v]},v);
  expect(check).toMatchObject({state:'ready',width:720,height:404,size:1000000});expect(check.estimatedSize).toBeUndefined();expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
 });
 it('leaves segmented DASH size unknown when only video bitrate is declared',async()=>{
  ready(async(input)=>String(input).endsWith('.mpd')?new Response('<MPD mediaPresentationDuration="PT6S"><Period><AdaptationSet contentType="video"><Representation id="v" height="1080" bandwidth="2000000"><SegmentTemplate initialization="init.mp4" media="$Number$.m4s" duration="2"/></Representation></AdaptationSet><AdaptationSet contentType="audio"><Representation id="a"><SegmentTemplate initialization="init-audio.mp4" media="audio-$Number$.m4s" duration="2"/></Representation></AdaptationSet></Period></MPD>'):response(String(input).includes('audio')?prefix('fixtures/hls-audio/init.mp4'):mp4));
  const v={...variant,url:'https://media.test/manifest.mpd',bandwidth:2000000};const check=await checkSource({...media,kind:'dash',url:v.url,variants:[v]},v);
  expect(check.state).toBe('ready');expect(check.size).toBeUndefined();expect(check.estimatedSize).toBeUndefined();
 });
 it('keeps VOD size unknown without a finite positive complete duration and aggregate bitrate',async()=>{
  ready(async(input)=>String(input).endsWith('.m3u8')?new Response('#EXTM3U\n#EXTINF:2,\na.ts\n#EXTINF:2,\nb.ts\n#EXT-X-ENDLIST'):response(prefix('fixtures/hls-high/segment-0.ts')));
  const v={...variant,url:'https://media.test/index.m3u8'};const check=await checkSource({...media,kind:'hls',url:v.url,variants:[v]},v);
  expect(check.state).toBe('ready');expect(check.size).toBeUndefined();expect(check.estimatedSize).toBeUndefined();
 });
 it.each([
  '#EXTINF:2,\na.ts\nb.ts',
  '#EXTINF:NaN,\na.ts\n#EXTINF:2,\nb.ts',
  '#EXTINF:2,\n#EXTINF:2,\na.ts\n#EXTINF:2,\nb.ts',
 ])('does not estimate a VOD from missing, invalid or duplicate segment durations: %s',async body=>{
  ready(async(input)=>String(input).endsWith('.m3u8')?new Response(`#EXTM3U\n${body}\n#EXT-X-ENDLIST`):response(prefix('fixtures/hls-high/segment-0.ts')));
  const v={...variant,url:'https://media.test/index.m3u8',bandwidth:2400000};const check=await checkSource({...media,kind:'hls',url:v.url,variants:[v]},v);
  expect(check.state).toBe('ready');expect(check.size).toBeUndefined();expect(check.estimatedSize).toBeUndefined();
 });
});

describe('HTTP totals are not partial Content-Length values',()=>{
 it.each([
  {'Content-Range':'bytes 0-1311/1000'},
  {'Content-Range':'bytes 0-5000/10000'},
  {'Content-Length':'1313'},
  {'Content-Range':'bytes 0-1311/9007199254740992'},
 ])('does not expose an exact size from inconsistent range metadata %j',async headers=>{
  ready(async()=>response(mp4,500000,headers));const check=await checkSource(media,variant);expect(check).toMatchObject({state:'unknown',error:'range'});expect(check.size).toBeUndefined();
 });
 it('does not mistake a partial Content-Length for an unknown range total',async()=>{
  ready(async()=>response(mp4,500000,{'Content-Range':`bytes 0-${mp4.length-1}/*`}));const check=await checkSource(media,variant);expect(check.state).toBe('ready');expect(check.size).toBeUndefined();
 });
 it.each([200,206])('does not present encoded Content-Length or Content-Range as the media size (%i)',async status=>{
  ready(async()=>new Response(mp4,{status,headers:{'Content-Type':'video/mp4','Content-Encoding':'gzip','Content-Length':String(mp4.length),...(status===206?{'Content-Range':`bytes 0-${mp4.length-1}/500000`}:{})}}));const check=await checkSource(media,variant);expect(check.state).toBe('ready');expect(check.size).toBeUndefined();
 });
 it('does not expose an exact size from an empty Content-Length',async()=>{
  ready(async()=>new Response(mp4,{headers:{'Content-Type':'video/mp4','Content-Length':''}}));const check=await checkSource(media,variant);expect(check.state).toBe('ready');expect(check.size).toBeUndefined();
 });
 it('does not retain the claimed total when an unencoded sampled body is truncated',async()=>{
  ready(async()=>response(mp4,500000,{'Content-Range':'bytes 0-4095/500000','Content-Length':'4096'}));const check=await checkSource(media,variant);expect(check).toMatchObject({state:'unknown',error:'range'});expect(check.size).toBeUndefined();
 });
 it('rejects a range body larger than its own declared boundaries without exposing its total',async()=>{
  ready(async()=>response(mp4,500000,{'Content-Range':'bytes 0-11/500000','Content-Length':'12'}));const check=await checkSource(media,variant);expect(check).toMatchObject({state:'unknown',error:'range'});expect(check.size).toBeUndefined();
 });
});
