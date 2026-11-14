// Native decoding is cheap for ordinary files. The local demuxer also handles
// recordings whose WebM header has no duration, and authorized file: sources.
async function decodedFrames(source:File|string,positions:number[],signal:AbortSignal){
 const{Input,BlobSource,UrlSource,ALL_FORMATS,CanvasSink}=await import('mediabunny');if(signal.aborted)throw new Error('cancelled');
 const input=new Input({formats:ALL_FORMATS,source:typeof source==='string'?new UrlSource(source,{maxCacheSize:8*1024*1024,parallelism:1,getRetryDelay:()=>null,requestInit:{credentials:'omit'},handleUnhandledError:()=>{}}):new BlobSource(source)});
 const abort=()=>input.dispose(),timer=setTimeout(abort,10000);signal.addEventListener('abort',abort,{once:true});
 try{const duration=await input.computeDuration(undefined,{skipLiveWait:true}),track=await input.getPrimaryVideoTrack();if(!track||!Number.isFinite(duration)||duration<=0)throw new Error('codec');const sink=new CanvasSink(track,{width:160,fit:'contain'}),images:string[]=[];
  for(const position of positions){if(signal.aborted)throw new Error('cancelled');const frame=await sink.getCanvas(Math.min(duration-.01,Math.max(.001,duration*position)),{skipLiveWait:true});if(!frame)throw new Error('codec');images.push((frame.canvas as HTMLCanvasElement).toDataURL('image/jpeg',.72));}return{duration,images};
 }finally{clearTimeout(timer);signal.removeEventListener('abort',abort);input.dispose();}
}
async function nativeFrames(source:File|string,positions:number[],signal:AbortSignal){
 const video=document.createElement('video'),url=typeof source==='string'?source:URL.createObjectURL(source);video.muted=true;video.preload='metadata';if(typeof source==='string')video.crossOrigin='anonymous';
 function event(name:string){return new Promise<void>((resolve,reject)=>{const clean=()=>{clearTimeout(timer);video.removeEventListener(name,ready);video.removeEventListener('error',fail);signal.removeEventListener('abort',abort);};const ready=()=>{clean();resolve();},fail=()=>{clean();reject(new Error('codec'));},abort=()=>{clean();reject(new Error('cancelled'));},timer=setTimeout(fail,10000);video.addEventListener(name,ready,{once:true});video.addEventListener('error',fail,{once:true});signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();});}
 try{const loaded=event('loadeddata');video.src=url;await loaded;const duration=video.duration;if(!Number.isFinite(duration)||duration<=0)throw new Error('codec');const canvas=document.createElement('canvas');canvas.width=160;canvas.height=Math.max(60,Math.min(240,Math.round(160*video.videoHeight/video.videoWidth)));const ctx=canvas.getContext('2d')!;const images:string[]=[];
  for(const position of positions){if(signal.aborted)throw new Error('cancelled');const seek=event('seeked');video.currentTime=Math.min(duration-.01,Math.max(.001,duration*position));await seek;ctx.drawImage(video,0,0,canvas.width,canvas.height);images.push(canvas.toDataURL('image/jpeg',.72));}return{duration,images};
 }finally{video.pause();video.removeAttribute('src');video.load();if(typeof source!=='string')URL.revokeObjectURL(url);}
}
export async function videoFrames(source:File|string,positions:number[],signal:AbortSignal){try{return await nativeFrames(source,positions,signal);}catch(error){if(signal.aborted)throw error;return decodedFrames(source,positions,signal);}}
