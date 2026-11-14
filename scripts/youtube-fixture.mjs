// Original six-second media in a synthetic SABR/UMP envelope. This tests the
// complete local extension pipeline; it is not evidence of YouTube access.
import {readFile} from 'node:fs/promises';
import {CompositeBuffer,UmpWriter} from 'googlevideo/ump';
import {FormatXTags,FormatInitializationMetadata,MediaHeader,StreamProtectionStatus,UMPPartId,VideoPlaybackAbrRequest} from 'googlevideo/protos';
export const fixtureAudioTags=Buffer.from(FormatXTags.encode({xtags:[{key:'lang',value:'en'},{key:'acont',value:'original'}]}).finish()).toString('base64url');
export const fixtureId='abcdefghijk';
export const videoMime='video/mp4; codecs="avc1.64001e"',audioMime='audio/mp4; codecs="mp4a.40.2"';
export const fixtureEndpoint='https://fixture.googlevideo.com/videoplayback?id=original-fixture&sabr=1';
export const fixtureFormats=[{itag:136,mimeType:videoMime,bitrate:2000000,lastModified:'1234',approxDurationMs:'6000',height:404,width:720,fps:30,qualityLabel:'404p'},{itag:140,xtags:fixtureAudioTags,mimeType:audioMime,bitrate:64000,lastModified:'1234',approxDurationMs:'6021',audioQuality:'AUDIO_QUALITY_MEDIUM'}];
export function observedRequest(){return VideoPlaybackAbrRequest.encode({initializationFormatIds:[],bufferedRanges:[],selectedAudioFormatIds:[{itag:140,lastModified:'1234',xtags:fixtureAudioTags}],selectedVideoFormatIds:[],selectedCaptionFormatIds:[],ssapPlaybackInfos:[],field1000:[],videoPlaybackUstreamerConfig:new Uint8Array([1,2,3]),streamerContext:{clientInfo:{clientName:1,clientVersion:'fixture'},sabrContexts:[],unsentSabrContexts:[]}}).finish();}
export async function fixtureUmp(reject=false,videoId=fixtureId){
  const buffer=new CompositeBuffer(),writer=new UmpWriter(buffer);let headerId=1;
  for(const[type,format,count]of[['video',fixtureFormats[0],3],['audio',fixtureFormats[1],4]]){
    const formatId={itag:format.itag,lastModified:'1234',xtags:format.xtags};
    writer.write(UMPPartId.FORMAT_INITIALIZATION_METADATA,FormatInitializationMetadata.encode({videoId,formatId,mimeType:format.mimeType,endSegmentNum:String(count),endTimeTicks:type==='video'?'6000':'6021',endTimeTimescale:'1000'}).finish());
    for(let index=0;index<=count;index++){
      const data=await readFile(`fixtures/hls-${type}/${index===0?'init.mp4':`segment-${index-1}.m4s`}`),id=headerId++;
      const duration=index===0?0:type==='video'?2000:[2005,2005,1990,21][index-1];
      writer.write(UMPPartId.MEDIA_HEADER,MediaHeader.encode({videoId,headerId:id,itag:format.itag,lmt:'1234',formatId,isInitializationSegment:index===0,segmentNum:index,segmentLengthBytes:String(data.length),startMs:String(Math.max(0,(index-1)*2000)),durationMs:String(duration)}).finish());
      writer.write(UMPPartId.MEDIA,new Uint8Array([id,...data]));writer.write(UMPPartId.MEDIA_END,new Uint8Array([id]));
      if(reject&&type==='video'&&index===1){writer.write(UMPPartId.STREAM_PROTECTION_STATUS,StreamProtectionStatus.encode({status:3,maxRetries:10}).finish());return Buffer.concat(buffer.chunks);}
    }
  }
  return Buffer.concat(buffer.chunks);
}
export function fixturePage({adaptive=false,reject=false,videoId=fixtureId,title='Original separate-track fixture'}={}){
  const endpoint=(videoId===fixtureId?fixtureEndpoint:fixtureEndpoint.replace('original-fixture','playlist-'+videoId))+(reject?'&reject=1':'');
  const formats=fixtureFormats.map(f=>({...f,...(adaptive?{url:`${endpoint}&itag=${f.itag}`}:{})}));
  const response={videoDetails:{videoId,title,lengthSeconds:'6'},playabilityStatus:{status:'OK'},streamingData:{adaptiveFormats:formats,...(!adaptive?{serverAbrStreamingUrl:endpoint}:{})}};
  return `<!doctype html><meta charset="utf-8"><title>Original separate-track fixture</title><video muted autoplay loop></video><script>window.ytInitialPlayerResponse=${JSON.stringify(response)};(async()=>{const v=document.querySelector('video');const r=await fetch('/original-fixture-data');v.src=URL.createObjectURL(new Blob([await r.arrayBuffer()],{type:'video/mp4'}));await v.play();${adaptive?'':`await fetch(${JSON.stringify(endpoint)},{method:'POST',body:new Uint8Array(${JSON.stringify([...observedRequest()])})});`}})();</script>`;
}
