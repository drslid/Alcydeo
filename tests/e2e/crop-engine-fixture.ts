import{Input,BlobSource,ALL_FORMATS,Output,Mp4OutputFormat,BufferTarget,CanvasSource,EncodedAudioPacketSource,EncodedPacketSink,CanvasSink,AudioSampleSink,QUALITY_HIGH}from'mediabunny';
import{convertMp4}from'../../packages/media-core/conversion';
import type{EditOperation}from'../../packages/contracts';

type Request={crop:{x:number;y:number;width:number;height:number};rotation?:0|90;secondVideo?:boolean;secondAudio?:boolean;opusAudio?:boolean;cancel?:boolean;points:[number,number][]};
const digest=async(file:Blob)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');
async function audioPackets(file:File){
 const input=new Input({source:new BlobSource(file),formats:ALL_FORMATS});
 try{return await Promise.all((await input.getAudioTracks()).map(async track=>{
  const chunks:Uint8Array[]=[];let bytes=0;
  for await(const packet of new EncodedPacketSink(track).packets()){chunks.push(packet.data);bytes+=packet.data.length;}
  const joined=new Uint8Array(bytes);let at=0;for(const chunk of chunks){joined.set(chunk,at);at+=chunk.length;}
  return{packets:chunks.length,sha256:await digest(new Blob([joined]))};
 }));}finally{input.dispose();}
}
async function sourceFile(request:Request){
 const canvas=new globalThis.OffscreenCanvas(320,180),paint=canvas.getContext('2d')!;
 for(const[color,x,y]of[['#ff0000',0,0],['#00ff00',160,0],['#0000ff',0,90],['#ffff00',160,90]]as const){paint.fillStyle=color;paint.fillRect(x,y,160,90);}
 const target=new BufferTarget(),output=new Output({format:new Mp4OutputFormat(),target});
 const video=new CanvasSource(canvas,{codec:'avc',quality:QUALITY_HIGH});output.addVideoTrack(video,{rotation:request.rotation??0});
 const second=request.secondVideo?new CanvasSource(canvas,{codec:'avc',quality:QUALITY_HIGH}):undefined;if(second)output.addVideoTrack(second);
 const aac=new Input({source:new BlobSource(await(await fetch(request.opusAudio?'/conversion/transcode.webm':'/media/low.mp4')).blob()),formats:ALL_FORMATS});
 try{
  const track=(await aac.getPrimaryAudioTrack())!,config=await track.getDecoderConfig(),codec=await track.getCodec(),audio=new EncodedAudioPacketSource(codec!);output.addAudioTrack(audio);
  const extra=request.secondAudio?new EncodedAudioPacketSource(codec!):undefined;if(extra)output.addAudioTrack(extra);
  await output.start();
  for(let i=0;i<12;i++){await video.add(i/12,1/12);if(second)await second.add(i/12,1/12);}video.close();second?.close();
  let first=true;for await(const packet of new EncodedPacketSink(track).packets()){if(packet.timestamp>=1)break;await audio.add(packet,first?{decoderConfig:config!}:undefined);if(extra)await extra.add(packet,first?{decoderConfig:config!}:undefined);first=false;}audio.close();extra?.close();
  await output.finalize();return new File([target.buffer!],'Original.mp4',{type:'video/mp4'});
 }finally{aac.dispose();}
}
self.onmessage=async(event:MessageEvent<Request>)=>{
 const request=event.data,id='crop-engine-'+crypto.randomUUID(),root=await navigator.storage.getDirectory(),dir=await root.getDirectoryHandle(id,{create:true});
 try{
  const file=await sourceFile(request),handle=await dir.getFileHandle('input.original',{create:true}),write=await handle.createWritable();await write.write(file);await write.close();const before=await digest(file),controller=new AbortController();
  let result:Awaited<ReturnType<typeof convertMp4>>|undefined,error:string|undefined;
  try{result=await convertMp4(await handle.getFile(),dir,controller.signal,n=>{if(request.cancel&&n>0)controller.abort();},undefined,{operation:{kind:'crop',crop:request.crop}as EditOperation,outputName:'cropped.mp4'});}catch(e){error=e instanceof Error?e.message:String(e);}
  const entries:string[]=[];for await(const name of(dir as any).keys())entries.push(name);
  const report:any={error,result,entries,originalUnchanged:before===await digest(await handle.getFile())};
  if(result){
   const output=await(await dir.getFileHandle('cropped.mp4')).getFile(),input=new Input({source:new BlobSource(output),formats:ALL_FORMATS});
   try{
    const video=(await input.getPrimaryVideoTrack())!,frame=await new CanvasSink(video).getCanvas(0);if(!frame)throw new Error('No output frame');
    const image=frame.canvas.getContext('2d')!;report.width=await video.getDisplayWidth();report.height=await video.getDisplayHeight();report.rotation=await video.getRotation();report.pixels=request.points.map(([x,y])=>Array.from(image.getImageData(x,y,1,1).data));report.tracks=(await input.getTracks()).map(t=>t.type);
    let decoded=0;for await(const sample of new AudioSampleSink((await input.getPrimaryAudioTrack())!).samples()){decoded++;sample.close();}report.decodedAudioSamples=decoded;
   }finally{input.dispose();}
   report.originalAudio=await audioPackets(file);report.outputAudio=await audioPackets(output);
  }
  postMessage(report);
 }catch(error){postMessage({fatal:String(error)});}
 finally{await root.removeEntry(id,{recursive:true});}
};
