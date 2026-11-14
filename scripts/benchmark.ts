import { readFile, mkdir, open, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { cpus, totalmem, platform, release } from 'node:os';
import { createFile } from 'mp4box';
import muxjs from 'mux.js';
import { Input, BlobSource, ALL_FORMATS } from 'mediabunny';
import { remux, validate } from '../packages/media-core/engine';
await mkdir('artifacts/benchmarks',{recursive:true});
const direct = await readFile('fixtures/media/high.mp4');
const ts = Buffer.concat(await Promise.all([0,1,2].map(i=>readFile(`fixtures/hls-high/segment-${i}.ts`))));
const file = new File([direct],'synthetic.mp4'); const tsfile = new File([ts],'synthetic.ts');
const results: Record<string,unknown>[] = [];
async function measure(name:string,fn:()=>Promise<unknown>) {
  await fn(); const times=[]; const before=process.memoryUsage();
  for(let i=0;i<10;i++){const start=performance.now();await fn();times.push(performance.now()-start);}
  results.push({name,iterations:10,medianMs:[...times].sort((a,b)=>a-b)[5],minMs:Math.min(...times),maxMs:Math.max(...times),rssAfterBytes:process.memoryUsage().rss,rssBeforeBytes:before.rss});
}
await measure('MP4 metadata — MP4Box.js',async()=>{
  const mp4=createFile();const buffer=direct.buffer.slice(direct.byteOffset,direct.byteOffset+direct.length) as ArrayBuffer & {fileStart:number};buffer.fileStart=0;
  let ready=false;mp4.onReady=()=>{ready=true;};mp4.appendBuffer(buffer);mp4.flush();if(!ready)throw new Error('MP4Box parse failed');
});
await measure('MP4 metadata — Mediabunny',async()=>{const input=new Input({formats:ALL_FORMATS,source:new BlobSource(file,{maxCacheSize:4*1024*1024})});await input.getTracks();await input.computeDuration();input.dispose();});
await measure('TS transmux — mux.js (memory output)',async()=>{
  const transmuxer=new muxjs.mp4.Transmuxer();let bytes=0;transmuxer.on('data',(d:{data:Uint8Array})=>{bytes+=d.data.length;});transmuxer.push(new Uint8Array(ts));transmuxer.flush();if(!bytes)throw new Error('mux.js produced no data');transmuxer.dispose();
});
await measure('TS remux — production engine (streamed file + validation)',async()=>{
  const handle=await open('artifacts/benchmarks/output.mp4','w');
  const stream=new WritableStream({async write(chunk:{data:Uint8Array;position:number}){await handle.write(chunk.data,0,chunk.data.length,chunk.position);},async close(){await handle.close();},async abort(){await handle.close();}});
  await remux([tsfile],stream as unknown as FileSystemWritableFileStream);
  const output=await readFile('artifacts/benchmarks/output.mp4');await validate(new Blob([output]),6,2);
});
const report={date:new Date().toISOString(),environment:{node:process.version,os:`${platform()} ${release()}`,cpu:cpus()[0]?.model,logicalCpus:cpus().length,totalMemoryBytes:totalmem()},corpus:{source:'original synthetic test pattern + tone',durationSeconds:6,mp4Bytes:direct.length,tsBytes:ts.length},results,limitations:['Node microbenchmark; not a Chrome or Windows measurement.','Different operations and output strategies; not a head-to-head ranking.','RSS includes the shared Node process and earlier libraries; it is not an isolated engine peak.','No conclusion about multi-GB files, hardware decoding, network speed or 8K.']};
await writeFile('artifacts/benchmarks/engine.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
