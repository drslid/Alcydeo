import{test,expect,chromium,type Browser,type Page}from'@playwright/test';
import{build}from'esbuild';
import{readFile}from'node:fs/promises';
import{createServer,type Server}from'node:http';
let browser:Browser,page:Page,server:Server,origin:string;
test.beforeAll(async()=>{
 const bundle=(await build({entryPoints:['tests/e2e/crop-engine-fixture.ts'],bundle:true,write:false,platform:'browser',format:'esm',target:'chrome156'})).outputFiles[0].text;
 server=createServer(async(request,response)=>{
  const files:Record<string,string>={'/aac-worker.js':'packages/media-core/.generated/aac-worker.js','/media/low.mp4':'fixtures/media/low.mp4','/conversion/transcode.webm':'fixtures/conversion/transcode.webm'};
  const content=request.url==='/'?Buffer.from('<!doctype html><meta charset="utf-8"><title>Original crop engine laboratory</title>'):request.url==='/crop-engine.worker.js'?Buffer.from(bundle):files[request.url??'']?await readFile(files[request.url!]):undefined;
  response.writeHead(content?200:404,{'Content-Type':request.url?.endsWith('.js')?'text/javascript':request.url?.endsWith('.mp4')?'video/mp4':request.url?.endsWith('.webm')?'video/webm':'text/html'});response.end(content);
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${(server.address()as{port:number}).port}`;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
});
test.beforeEach(async()=>{page=await browser.newPage();await page.goto(origin);});
test.afterEach(async()=>page?.close());
test.afterAll(async()=>{await browser?.close();if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));});
async function crop(request:Record<string,unknown>){return page.evaluate(request=>new Promise<any>((resolve,reject)=>{const worker=new Worker('/crop-engine.worker.js',{type:'module'});worker.onmessage=e=>{worker.terminate();if(e.data.fatal)reject(new Error(e.data.fatal));else resolve(e.data);};worker.onerror=e=>{worker.terminate();reject(new Error(e.message));};worker.postMessage(request);}),request);}
function colors(pixels:number[][],expected:number[][]){expect(pixels).toHaveLength(expected.length);for(let i=0;i<pixels.length;i++)for(let channel=0;channel<3;channel++)expect(Math.abs(pixels[i][channel]-expected[i][channel])).toBeLessThan(32);}
const regular={crop:{x:120,y:60,width:120,height:90},points:[[10,10],[60,10],[10,60],[60,60]]};
test('a real Worker crops an offset rectangle into H264 pixels and packet-copies AAC without changing the original',async()=>{
 const result=await crop(regular);expect(result.error).toBeUndefined();expect(result.result.videoEncoded).toBe(true);expect(result.result.audioEncoded).toBe(false);expect(result.originalUnchanged).toBe(true);expect([result.width,result.height,result.rotation]).toEqual([120,90,0]);expect(result.tracks).toEqual(['video','audio']);expect(result.outputAudio).toEqual(result.originalAudio);colors(result.pixels,[[255,0,0],[0,255,0],[0,0,255],[255,255,0]]);
});
test('crop coordinates follow display rotation and the output contains the transformed pixels without rotation metadata',async()=>{
 const result=await crop({rotation:90,crop:{x:30,y:120,width:120,height:120},points:[[10,10],[90,10],[10,90],[90,90]]});expect(result.error).toBeUndefined();expect([result.width,result.height,result.rotation]).toEqual([120,120,0]);expect(result.originalUnchanged).toBe(true);expect(result.outputAudio).toEqual(result.originalAudio);colors(result.pixels,[[0,0,255],[255,0,0],[255,255,0],[0,255,0]]);
});
test('odd selection dimensions keep the selected region and produce even H264 dimensions',async()=>{
 const result=await crop({...regular,crop:{x:120,y:60,width:121,height:91}});expect(result.error).toBeUndefined();expect([result.width,result.height]).toEqual([120,90]);colors(result.pixels,[[255,0,0],[0,255,0],[0,0,255],[255,255,0]]);
});
test('every compatible audio track survives crop with unchanged encoded packets',async()=>{
 const result=await crop({...regular,secondAudio:true});expect(result.error).toBeUndefined();expect(result.tracks).toEqual(['video','audio','audio']);expect(result.result.validation.tracks).toHaveLength(3);expect(result.outputAudio).toEqual(result.originalAudio);expect(result.result.audioEncoded).toBe(false);
});
test('a non-AAC soundtrack is converted locally without dropping audio while video is cropped',async()=>{
 const result=await crop({...regular,opusAudio:true});expect(result.error).toBeUndefined();expect(result.result.validation.tracks).toEqual([{type:'video',codec:'avc'},{type:'audio',codec:'aac'}]);expect(result.result.audioEncoded).toBe(true);expect(result.decodedAudioSamples).toBeGreaterThan(0);expect(result.originalUnchanged).toBe(true);expect([result.width,result.height]).toEqual([120,90]);colors(result.pixels,[[255,0,0],[0,255,0],[0,0,255],[255,255,0]]);
});
test('out-of-bounds and ambiguous multivideo inputs retain the original without a partial output',async()=>{
 for(const[request,error]of[[{...regular,crop:{x:250,y:60,width:120,height:90}},'cropRange'],[{...regular,secondVideo:true},'conversionCodec']]as const){const result=await crop(request);expect(result.error).toBe(error);expect(result.originalUnchanged).toBe(true);expect(result.entries).toEqual(['input.original']);}
});
test('cancelling a crop clears the partial output and keeps its source for an explicit restart',async()=>{
 const result=await crop({...regular,cancel:true});expect(result.error).toBe('cancelled');expect(result.originalUnchanged).toBe(true);expect(result.entries).toEqual(['input.original']);
});
