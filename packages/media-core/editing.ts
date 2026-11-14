import{Input,BlobSource,ALL_FORMATS,EncodedPacketSink,Output,Mp4OutputFormat,StreamTarget,EncodedVideoPacketSource,EncodedAudioPacketSource,type EncodedPacket,type InputVideoTrack,type InputAudioTrack}from'mediabunny';
import{convertMp4}from'./conversion';import{validate}from'./engine';
import type{EditOperation,MediaNotice}from'../contracts';
type AVTrack=InputVideoTrack|InputAudioTrack;
const open=(file:File)=>new Input({source:new BlobSource(file,{maxCacheSize:4*1024*1024}),formats:ALL_FORMATS});
const signature=(config:VideoDecoderConfig|AudioDecoderConfig)=>JSON.stringify({...config,description:config.description?Array.from(new Uint8Array(ArrayBuffer.isView(config.description)?config.description.buffer:config.description,ArrayBuffer.isView(config.description)?config.description.byteOffset:0,config.description.byteLength)):null});
export async function editVideos(files:File[],dir:FileSystemDirectoryHandle,operation:EditOperation,signal:AbortSignal,progress:(n:number)=>void,notice?:(code:MediaNotice)=>void){
 if(operation.kind!=='merge'){if(files.length!==1)throw new Error('invalid');return convertMp4(files[0]!,dir,signal,progress,notice,{operation});}
 if(files.length<2||files.length>20)throw new Error('mergeTracks');
 const first=open(files[0]!);let width=0,height=0,audio=false;
 try{const video=await first.getPrimaryVideoTrack();if(!video)throw new Error('mergeTracks');const w=await video.getDisplayWidth(),h=await video.getDisplayHeight(),scale=Math.min(1,1280/w,720/h);width=Math.max(2,Math.ceil(w*scale/2)*2);height=Math.max(2,Math.ceil(h*scale/2)*2);audio=!!await first.getPrimaryAudioTrack();}finally{first.dispose();}
 const names:string[]=[];
 let output:Output|undefined;let writable:FileSystemWritableFileStream|undefined;
 try{
  // Each clip is normalized and closed before the next is decoded. Memory does
  // not grow with the number of source files. Reject layouts we cannot preserve.
  for(let i=0;i<files.length;i++){
   if(signal.aborted)throw new Error('cancelled');const check=open(files[i]!);try{if(!!await check.getPrimaryAudioTrack()!==audio)throw new Error('mergeTracks');}finally{check.dispose();}
   const name=`normalized-${i}.mp4`;names.push(name);await convertMp4(files[i]!,dir,signal,n=>progress((i+n)/files.length*0.8),notice,{outputName:name,width,height,normalize:true});
  }
  const handle=await dir.getFileHandle('converted.mp4',{create:true});writable=await handle.createWritable();output=new Output({format:new Mp4OutputFormat({fastStart:'fragmented',minimumFragmentDuration:2}),target:new StreamTarget(writable,{chunked:true,chunkSize:1024*1024})});
  const videoSource=new EncodedVideoPacketSource('avc');output.addVideoTrack(videoSource);
  const audioSource=audio?new EncodedAudioPacketSource('aac'):undefined;if(audioSource)output.addAudioTrack(audioSource);
  let offset=0;const configs=new Map<string,string>();let started=false;
  for(let i=0;i<names.length;i++){
   const input=open(await(await dir.getFileHandle(names[i]!)).getFile());
   try{
    const tracks=(await input.getTracks()).filter((t):t is AVTrack=>t.isVideoTrack()||t.isAudioTrack());
    const streams: {iterator:AsyncGenerator<EncodedPacket,void,unknown>;next:IteratorResult<EncodedPacket,void>;source:EncodedVideoPacketSource|EncodedAudioPacketSource;config:VideoDecoderConfig|AudioDecoderConfig;first:boolean}[]=[];
    for(const track of tracks){const config=await track.getDecoderConfig();if(!config)throw new Error('conversionCodec');const key=signature(config);if(configs.has(track.type)&&configs.get(track.type)!==key)throw new Error('mergeTracks');configs.set(track.type,key);const iterator=new EncodedPacketSink(track).packets();streams.push({iterator,next:await iterator.next(),source:track.type==='video'?videoSource:audioSource!,config,first:true});}
    if(!started){await output.start();started=true;}const begin=Math.min(...streams.filter(s=>!s.next.done).map(s=>s.next.value!.timestamp));let end=0;
    while(streams.some(s=>!s.next.done)){
     if(signal.aborted)throw new Error('cancelled');const stream=streams.filter(s=>!s.next.done).sort((a,b)=>a.next.value!.timestamp-b.next.value!.timestamp)[0]!;const packet=stream.next.value!;const timestamp=offset+packet.timestamp-begin;
     await stream.source.add(packet.clone({timestamp}),stream.first?{decoderConfig:stream.config as VideoDecoderConfig & AudioDecoderConfig}:undefined);stream.first=false;end=Math.max(end,packet.timestamp-begin+packet.duration);stream.next=await stream.iterator.next();
    }offset+=end;progress(0.8+(i+1)/names.length*0.18);
   }finally{input.dispose();}
  }
  videoSource.close();audioSource?.close();await output.finalize();const validation=await validate(await handle.getFile(),offset,audio?2:1);return{validation,videoEncoded:true,audioEncoded:audio};
 }catch(error){await output?.cancel().catch(()=>{});if(writable&&!writable.locked)await writable.abort().catch(()=>{});await dir.removeEntry('converted.mp4').catch(()=>{});throw error;}
 finally{for(const name of names)await dir.removeEntry(name).catch(()=>{});}
}
