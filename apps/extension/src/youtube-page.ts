// Serialized into the page's MAIN world. Only reads its already-loaded player.
// It never fetches a player script, runs a signature decipherer or mints tokens.
export function youtubePage(){
  if(!/(^|\.)(youtube\.com|youtube-nocookie\.com)$/.test(location.hostname))return;
  const page=new URL(location.href),expected=page.searchParams.get('v')??page.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1];
  const videos=[...document.querySelectorAll('video')];const playing=videos.find(v=>!v.paused&&v.readyState>0)??videos.find(v=>v.readyState>0);
  const owner=playing?.closest('.html5-video-player') as any;
  const w=window as any;const candidates=[owner?.getPlayerResponse?.(),w.ytInitialPlayerResponse,w.ytplayer?.config?.args?.raw_player_response];
  const data=candidates.map(p=>typeof p==='string'?(()=>{try{return JSON.parse(p);}catch{return;}})():p).find(p=>p?.videoDetails?.videoId&&(!expected||p.videoDetails.videoId===expected));
  if(!data||!/^[-\w]{11}$/.test(data.videoDetails.videoId))return;
  const streaming=data.streamingData;
  return{videoId:data.videoDetails.videoId,title:String(data.videoDetails.title??document.title).slice(0,300),duration:Number(data.videoDetails.lengthSeconds)||undefined,ready:!!playing&&playing.readyState>=2&&playing.currentTime>0,live:data.videoDetails.isLive===true||data.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.isLiveNow===true,hlsManifestUrl:typeof streaming?.hlsManifestUrl==='string'?streaming.hlsManifestUrl:undefined,protected:!!streaming?.licenseInfos?.length||!!streaming?.adaptiveFormats?.some((f:any)=>f.drmFamilies?.length),status:data.playabilityStatus?.status,endpoint:typeof streaming?.serverAbrStreamingUrl==='string'?streaming.serverAbrStreamingUrl:undefined,formats:[...(streaming?.formats??[]),...(streaming?.adaptiveFormats??[])].slice(0,200).map((f:any)=>({itag:f.itag,mimeType:f.mimeType,bitrate:f.bitrate,lastModified:f.lastModified,xtags:typeof f.xtags==='string'&&f.xtags.length<=4096?f.xtags:undefined,approxDurationMs:f.approxDurationMs,contentLength:f.contentLength,height:f.height,width:f.width,fps:f.fps,qualityLabel:f.qualityLabel,audioQuality:f.audioQuality,audioTrack:f.audioTrack?{id:f.audioTrack.id,audioIsDefault:f.audioTrack.audioIsDefault}:undefined,isDrc:!!f.isDrc,url:typeof f.url==='string'?f.url:undefined}))};
}
