import {SabrStream} from 'googlevideo/sabr-stream';
import {buildSabrFormat,EnabledTrackTypes,Logger,LogLevel} from 'googlevideo/utils';
import type {Task} from '../contracts';
import {mediaFetch} from './network';
import {googleMedia} from './youtube';
import {htmlResponse} from './classification';
import {changeTask} from '../storage';

export async function sabrFiles(task:Task,dir:FileSystemDirectoryHandle,signal:AbortSignal):Promise<File[]>{
  const source=task.media.sabr;if(!source||task.media.pending)throw new Error('sourcePending');
  const formats=source.formats.map(buildSabrFormat),video=formats.find(f=>String(f.itag)===task.variant.id),audio=formats.find(f=>f.hasAudio&&!f.hasVideo);
  if(!video||!audio)throw new Error('chooseQuality');
  // Library events still fail the task; avoid writing signed URLs to consoles.
  Logger.getInstance().setLogLevels(LogLevel.NONE);
  let failure:Error|undefined;const total=(video.contentLength??0)+(audio.contentLength??0),sizes=[0,0];let reported=0;let checkedSpace=0;
  const stream=new SabrStream({videoId:source.videoId,formats,serverAbrStreamingUrl:source.endpoint,videoPlaybackUstreamerConfig:source.ustreamer,clientInfo:source.client,poToken:source.poToken,videoHighWaterMark:1024*1024,audioHighWaterMark:256*1024,fetchFunction:async(input,init)=>{
    const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;googleMedia(url);
    const headers=new Headers(init?.headers);headers.delete('accept-encoding');
    const response=await mediaFetch(url,{...init,headers,signal:AbortSignal.any([signal,...(init?.signal?[init.signal]:[]),AbortSignal.timeout(120_000)])});
    if(htmlResponse(response.headers.get('content-type')??'')){await response.body?.cancel();throw new Error('html');}return response;
  }});
  stream.on('error',error=>{failure??=new Error(['html','permission','expired','missing','retryLater'].includes(error.message)?error.message:'network');});
  // A server refusal ends the transfer immediately. Never attempt to create
  // or repair an attestation, and never save already received partial media.
  stream.on('streamProtectionStatusUpdate',status=>{if(status.status===3){failure=new Error('sourceRestricted');void stream.abort();}});
  const abort=()=>{void stream.abort();};signal.addEventListener('abort',abort,{once:true});
  try{
    if(signal.aborted)throw new Error('cancelled');
    const estimate=await navigator.storage.estimate();if(estimate.quota&&estimate.quota-(estimate.usage??0)<16*1024*1024)throw new Error('space');
    const output=stream.start({videoFormat:video,audioFormat:audio,enabledTrackTypes:EnabledTrackTypes.VIDEO_AND_AUDIO,isPostLiveDvr:false,maxRetries:2,stallDetectionMs:30000});
    const downloads=await Promise.allSettled([output.videoStream,output.audioStream].map(async(input,index)=>{
      const handle=await dir.getFileHandle(`sabr-${index}`,{create:true}),writer=await handle.createWritable(),reader=input.getReader();
      try{
        while(true){if(signal.aborted)throw new Error('cancelled');const{done,value}=await reader.read();if(done)break;await writer.write(value as Uint8Array<ArrayBuffer>);sizes[index]!+=value.byteLength;const bytes=sizes[0]!+sizes[1]!;
          if(bytes-checkedSpace>=16*1024*1024){checkedSpace=bytes;const estimate=await navigator.storage.estimate();if(estimate.quota&&estimate.quota-(estimate.usage??0)<16*1024*1024)throw new Error('space');}
          if(bytes-reported>=512*1024){reported=bytes;await changeTask(task.id,t=>{t.bytes=bytes;t.total=total||undefined;t.progress=total?Math.min(0.8,bytes/total*0.8):0;});}
        }
        if(!sizes[index])throw new Error('invalid');await writer.close();return handle.getFile();
      }catch(e){await stream.abort();await reader.cancel().catch(()=>{});await writer.abort().catch(()=>{});throw failure??e;}
    }));
    const rejected=downloads.find(r=>r.status==='rejected');if(rejected?.status==='rejected')throw rejected.reason;if(failure)throw failure;
    return downloads.map(r=>(r as PromiseFulfilledResult<File>).value);
  }finally{signal.removeEventListener('abort',abort);await stream.abort();}
}
