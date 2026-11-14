import {Input,BlobSource,ALL_FORMATS,Output,Mp4OutputFormat,StreamTarget,Conversion,canEncodeAudio,QUALITY_HIGH,QUALITY_MEDIUM,QUALITY_LOW,type InputVideoTrack,type InputAudioTrack} from 'mediabunny';
import {validate} from './engine';
import {mediaLogs} from './media-logs';
import {cropRegion} from './crop';
import {conversionOptions,type MediaNotice,type EditOperation} from '../contracts';

export async function convertMp4(file:File,dir:FileSystemDirectoryHandle,signal:AbortSignal,progress:(n:number)=>void,notice?:(code:MediaNotice)=>void,options:{operation?:EditOperation;outputName?:string;width?:number;height?:number;normalize?:boolean}={}) {
  const operation=options.operation??{kind:'convert'};const force=operation.kind!=='convert'||options.normalize;const compress=operation.kind==='compress'||options.normalize;const outputName=options.outputName??'converted.mp4';
  const profile=conversionOptions(operation.options);
  const input=new Input({source:new BlobSource(file,{maxCacheSize:4*1024*1024}),formats:ALL_FORMATS});
  let output:Output|undefined,conversion:Conversion|undefined;
  let writable:FileSystemWritableFileStream|undefined;
  const logs=mediaLogs(notice);
  const abort=()=>{void conversion?.cancel().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
  try {
    const tracks=(await input.getTracks()).filter((t):t is InputVideoTrack|InputAudioTrack=>t.isVideoTrack()||t.isAudioTrack());
    logs.check();
    if(!tracks.some(t=>t.type==='video')||tracks.length>8)throw new Error('conversionCodec');
    const duration=await input.computeDuration();if(!Number.isFinite(duration)||duration<=0)throw new Error('invalid');
    if(operation.kind==='trim'&&(!Number.isFinite(operation.start)||!Number.isFinite(operation.end)||operation.start!<0||operation.end!<=operation.start!||operation.end!>duration+0.05))throw new Error('trimRange');
    if(options.normalize&&(tracks.filter(t=>t.type==='video').length!==1||tracks.filter(t=>t.type==='audio').length>1))throw new Error('mergeTracks');
    const audioCount=tracks.filter(t=>t.type==='audio').length,videoCount=tracks.filter(t=>t.type==='video').length;
    if(operation.kind==='crop'&&videoCount!==1)throw new Error('conversionCodec');
    const cropTrack=operation.kind==='crop'?tracks.find((t):t is InputVideoTrack=>t.isVideoTrack())!:undefined;
    const crop=cropTrack?cropRegion(operation.crop,await cropTrack.getDisplayWidth(),await cropTrack.getDisplayHeight()):undefined;
    const videoBitrate=operation.kind==='compress'?Math.floor(Math.max(96000,Math.min(profile.quality==='high'?8000000:profile.quality==='balanced'?4000000:1500000,(file.size*8/duration*(profile.quality==='high'?.9:profile.quality==='balanced'?.7:.5)-audioCount*(profile.audioKbps||128)*1000)/videoCount))):1500000;
    const bounds=operation.kind==='compress'&&videoBitrate<700000?{width:854,height:480}:{width:1280,height:720};
    const targetSize=(width:number,height:number)=>{
      const limit=profile.maxHeight,landscape=width>=height;
      const maxWidth=limit?(landscape?Math.ceil(limit*16/9):limit):options.normalize?bounds.width:width;
      const maxHeight=limit?(landscape?limit:Math.ceil(limit*16/9)):options.normalize?bounds.height:height;
      const scale=limit||compress?Math.min(1,maxWidth/width,maxHeight/height):1;
      return{width:options.width??Math.max(2,Math.floor(width*scale/2)*2),height:options.height??Math.max(2,Math.floor(height*scale/2)*2)};
    };
    const copy=await Promise.all(tracks.map(async track=>{
      const config=await track.getDecoderConfig();
      // Spatial editing does not require re-encoding an already compatible audio track.
      if(crop&&track.type==='audio')return /^mp4a\.40\.2$/i.test(config?.codec??'');
      if(force)return false;
      if(track.type==='audio')return profile.audioKbps===0&&/^mp4a\.40\.2$/i.test(config?.codec??'');
      const width=await (track as InputVideoTrack).getDisplayWidth(),height=await (track as InputVideoTrack).getDisplayHeight(),target=targetSize(width,height);
      return profile.quality==='auto'&&target.width===width&&target.height===height&&/^avc[13]\.(42|4d|58|64)/i.test(config?.codec??'');
    }));
    const copyTracks=new Set(tracks.filter((_,i)=>copy[i]));
    const audioNeedsEncoding=tracks.some((t,i)=>t.type==='audio'&&!copy[i]);
    const audioTargets=await Promise.all(tracks.filter((t):t is InputAudioTrack=>t.isAudioTrack()&&!copyTracks.has(t)).map(async track=>{const channels=compress?Math.min(2,await track.getNumberOfChannels()):await track.getNumberOfChannels();return{numberOfChannels:channels,sampleRate:48000,bitrate:profile.audioKbps?profile.audioKbps*1000:Math.max(192000,Math.min(512000,channels*64000))};}));
    if((await Promise.all(audioTargets.map(options=>canEncodeAudio('aac',options)))).some(supported=>!supported)){const{registerAacEncoder}=await import('./.generated/aac-encoder.mjs');registerAacEncoder();}
    if(signal.aborted)throw new Error('cancelled');
    const estimate=await navigator.storage.estimate();if(estimate.quota!==undefined&&estimate.quota-(estimate.usage??0)<Math.max(32*1024*1024,file.size))throw new Error('space');
    const handle=await dir.getFileHandle(outputName,{create:true});
    writable=await handle.createWritable();
    output=new Output({format:new Mp4OutputFormat({fastStart:'fragmented',minimumFragmentDuration:2}),target:new StreamTarget(writable,{chunked:true,chunkSize:1024*1024})});
    conversion=await Conversion.init({input,output,showWarnings:false,tags:{},
      trim:operation.kind==='trim'?{start:operation.start,end:operation.end}:undefined,
      video:async track=>{
        if(copyTracks.has(track))return{codec:'avc'};
        const width=await track.getDisplayWidth(),height=await track.getDisplayHeight(),size=crop?{width:Math.floor(crop.width/2)*2,height:Math.floor(crop.height/2)*2}:targetSize(width,height);
        return{codec:'avc',forceTranscode:true,...(compress?{bitrate:videoBitrate}:{quality:profile.quality==='small'?QUALITY_LOW:profile.quality==='balanced'?QUALITY_MEDIUM:QUALITY_HIGH}),...size,...(crop?{crop}:{}),fit:'contain',...(options.normalize?{frameRate:30}:{}),allowTransformationMetadata:false};
      },
      audio:async track=>copyTracks.has(track)?{codec:'aac'}:{codec:'aac',forceTranscode:true,sampleRate:48000,...(compress?{numberOfChannels:Math.min(2,await track.getNumberOfChannels()),bitrate:(profile.audioKbps||128)*1000}:{bitrate:profile.audioKbps?profile.audioKbps*1000:Math.max(192000,Math.min(512000,(await track.getNumberOfChannels())*64000))})},
    });
    if(!conversion.isValid||conversion.discardedTracks.some(t=>t.track.type==='video'||t.track.type==='audio'))throw new Error('conversionCodec');
    conversion.onProgress=progress;if(signal.aborted)throw new Error('cancelled');await conversion.execute();logs.check();if(signal.aborted)throw new Error('cancelled');
    const result=await handle.getFile();const validation=await validate(result,operation.kind==='trim'?operation.end!-operation.start!:duration,tracks.length);
    if(validation.tracks.some(t=>t.type==='video'?t.codec!=='avc':t.codec!=='aac'))throw new Error('conversionCodec');
    return {validation,videoEncoded:tracks.some((t,i)=>t.type==='video'&&!copy[i]),audioEncoded:audioNeedsEncoding};
  } catch(error) {
    await conversion?.cancel().catch(()=>{});await output?.cancel().catch(()=>{});if(writable&&!writable.locked)await writable.abort().catch(()=>{});await dir.removeEntry(outputName).catch(()=>{});
    if(signal.aborted)throw new Error('cancelled');
    if((error as {name?:string})?.name==='QuotaExceededError')throw new Error('space');
    if(error instanceof Error&&['space','invalid','conversionCodec','trimRange','mergeTracks','cropRange'].includes(error.message))throw error;
    throw new Error('conversionCodec');
  } finally {signal.removeEventListener('abort',abort);input.dispose();logs.dispose();}
}
