import {safeUrl,type Media,type SabrContext,type YoutubeFormat} from '../contracts';
export const googleMedia=(url:string)=>{const u=new URL(safeUrl(url));if(!/(^|\.)googlevideo\.com$/.test(u.hostname)||u.pathname!=='/videoplayback')throw new Error('unsupported');return u;};
export const streamId=(url:string)=>googleMedia(url).searchParams.get('id')??'';
const b64=(data:Uint8Array)=>{let text='';for(const byte of data)text+=String.fromCharCode(byte);return btoa(text);};
export async function sabrRequest(endpoint:string,data:Uint8Array):Promise<SabrContext>{
  const u=googleMedia(endpoint);if(data.byteLength>131072||u.searchParams.get('sabr')!=='1')throw new Error('invalid');
  const{VideoPlaybackAbrRequest}=await import('googlevideo/protos');const parsed=VideoPlaybackAbrRequest.decode(data),client=parsed.streamerContext?.clientInfo;
  if(!parsed.videoPlaybackUstreamerConfig?.length||!client?.clientName||!client.clientVersion||!u.searchParams.get('id'))throw new Error('invalid');
  return{endpoint:u.href,streamId:u.searchParams.get('id')!,ustreamer:b64(parsed.videoPlaybackUstreamerConfig),client:{clientName:client.clientName,clientVersion:client.clientVersion},poToken:parsed.streamerContext?.poToken?.length?b64(parsed.streamerContext.poToken):undefined};
}
export function youtubeMedia(raw:any,scope:{tabId:number;pageUrl:string;frameId:number},context?:SabrContext,old?:Media):Media|undefined{
  if(!raw||!/^[-\w]{11}$/.test(raw.videoId)||raw.status!=='OK'||raw.protected)return;
  if(raw.live){
    const common={...scope,id:old?.id??crypto.randomUUID(),providerId:`youtube:${raw.videoId}`,title:String(raw.title??'YouTube').slice(0,300),live:true,detectedBy:'dom' as const};
    if(typeof raw.hlsManifestUrl==='string')try{const manifest=new URL(safeUrl(raw.hlsManifestUrl));if(manifest.protocol==='https:'&&/(^|\.)googlevideo\.com$/.test(manifest.hostname)){
      const previous=old?.kind==='hls'&&old.url===manifest.href?old:undefined;
      return{...common,kind:'hls',url:manifest.href,contentType:'application/vnd.apple.mpegurl',qualitiesResolved:previous?.qualitiesResolved,variants:previous?.variants??[{id:'live-hls',url:manifest.href,label:'HLS',contentType:'application/vnd.apple.mpegurl'}]};
    }}catch{/* The playing tab remains recordable without trusting a manifest. */}
    return{...common,kind:'direct',url:scope.pageUrl,captureOnly:true,qualitiesResolved:true,variants:[{id:'capture',url:scope.pageUrl,label:''}]};
  }
  if(!Array.isArray(raw.formats))return;
  const formats:YoutubeFormat[]=raw.formats.filter((f:any)=>Number.isInteger(f.itag)&&typeof f.mimeType==='string'&&/^(video|audio)\/(mp4|webm);/.test(f.mimeType)&&Number.isFinite(f.bitrate)&&f.bitrate>0).slice(0,200);
  const audios=formats.filter(f=>f.mimeType.startsWith('audio/')&&!f.isDrc).sort((a,b)=>Number(!!b.audioTrack?.audioIsDefault)-Number(!!a.audioTrack?.audioIsDefault)||Number(b.mimeType.includes('mp4a'))-Number(a.mimeType.includes('mp4a'))||b.bitrate-a.bitrate);const audio=audios[0];
  const videos=formats.filter(f=>f.mimeType.startsWith('video/')&&Number.isInteger(f.height)&&f.height!>0).sort((a,b)=>(b.height??0)-(a.height??0)||Number(b.mimeType.includes('avc1'))-Number(a.mimeType.includes('avc1'))||(b.fps??0)-(a.fps??0));
  const selected=videos.filter((f,i,list)=>list.findIndex(v=>(v.qualityLabel??v.height)===(f.qualityLabel??f.height)&&v.fps===f.fps)===i);if(!selected.length||!audio)return;
  const quality=(format:YoutubeFormat)=>{const label=format.qualityLabel??`${format.height}p`;return selected.filter(f=>(f.qualityLabel??`${f.height}p`)===label).length>1&&format.fps?`${label} · ${format.fps} fps`:label;};
  const providerId=`youtube:${raw.videoId}`;const current=context&&raw.endpoint&&streamId(raw.endpoint)===context.streamId?context:undefined;
  if(raw.endpoint){
    const url=current?.endpoint??googleMedia(raw.endpoint).href;
    return{...scope,id:old?.id??crypto.randomUUID(),providerId,title:String(raw.title??'YouTube').slice(0,300),kind:'sabr',url,duration:Number(raw.duration)||undefined,variants:selected.map(f=>({id:`${f.itag}`,url,label:quality(f),height:f.height,contentType:'video/mp4'})),detectedBy:'dom',qualitiesResolved:true,pending:!current||raw.ready===false,sabr:current?{...current,videoId:raw.videoId,formats:[...selected,audio]}:undefined};
  }
  const available=selected.filter(f=>f.url),audioUrl=audio.url;if(!available.length||!audioUrl)return;
  googleMedia(audioUrl);for(const f of available)googleMedia(f.url!);
  return{...scope,id:old?.id??crypto.randomUUID(),providerId,title:String(raw.title??'YouTube').slice(0,300),kind:'adaptive',url:available[0]!.url!,duration:Number(raw.duration)||undefined,variants:available.map(f=>{const saved=old?.kind==='adaptive'&&old.tabId===scope.tabId&&old.pageUrl===scope.pageUrl&&old.frameId===scope.frameId?old.variants.find(v=>v.id===String(f.itag)&&v.url===f.url&&v.audioUrl===audioUrl):undefined;return{id:String(f.itag),url:f.url!,audioUrl,label:quality(f),width:saved?.check?.width,height:saved?.check?.height??f.height,contentType:f.mimeType,check:saved?.check};}),detectedBy:'dom',qualitiesResolved:true};
}
