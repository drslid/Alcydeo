// Development-only stress corpus. Reuses original synthetic encoded samples,
// writes incrementally and is never included in the extension ZIP or Git.
import { readFile, mkdir, open, writeFile, stat } from 'node:fs/promises';
import { Input, BlobSource, ALL_FORMATS, EncodedPacketSink, EncodedVideoPacketSource, EncodedAudioPacketSource, Output, Mp4OutputFormat, StreamTarget, type EncodedPacket } from 'mediabunny';
await mkdir('artifacts/benchmarks',{recursive:true});
const input=new Input({formats:ALL_FORMATS,source:new BlobSource(new Blob([await readFile('fixtures/media/high.mp4')]))});
const tracks=await input.getTracks();
const handle=await open('artifacts/benchmarks/large.mp4','w');
const output=new Output({format:new Mp4OutputFormat({fastStart:'fragmented'}),target:new StreamTarget(new WritableStream({async write(c){await handle.write(c.data,0,c.data.length,c.position);},async close(){await handle.close();}}),{chunked:true,chunkSize:1024*1024})});
const streams=await Promise.all(tracks.map(async track=>{const source=track.type==='video'?new EncodedVideoPacketSource(await (track as any).getCodec()):new EncodedAudioPacketSource(await (track as any).getCodec());if(track.type==='video')output.addVideoTrack(source as EncodedVideoPacketSource);else output.addAudioTrack(source as EncodedAudioPacketSource);const packets:EncodedPacket[]=[];for await(const packet of new EncodedPacketSink(track).packets())packets.push(packet);return{source,packets,config:await(track as any).getDecoderConfig()};}));
const first=Math.min(...streams.map(s=>s.packets[0]!.timestamp));
const span=Math.max(...streams.map(s=>Math.max(...s.packets.map(p=>p.timestamp+p.duration))))-first+0.001;
await output.start();const loops=1200;
for(let loop=0;loop<loops;loop++){
 const indices=streams.map(()=>0);
 while(streams.some((s,i)=>indices[i]!<s.packets.length)){
  const choices=streams.map((s,i)=>({s,i,p:s.packets[indices[i]!]})).filter(x=>x.p);choices.sort((a,b)=>a.p!.timestamp-b.p!.timestamp);const {s,i,p}=choices[0]!;
  await s.source.add(p!.clone({timestamp:p!.timestamp-first+loop*span}),loop===0&&indices[i]===0?{decoderConfig:s.config as any}:undefined);indices[i]!++;
 }
 if(loop%200===0)console.log(`Stress fixture: ${loop}/${loops} cycles`);
}
for(const s of streams)s.source.close();await output.finalize();input.dispose();
const info={bytes:(await stat('artifacts/benchmarks/large.mp4')).size,duration:span*loops,cycles:loops,content:'Repeated original synthetic pattern and tone. This is a size/duration stress fixture, not a diverse codec corpus.'};
await writeFile('artifacts/benchmarks/large.json',JSON.stringify(info,null,2)+'\n');console.log(info);
