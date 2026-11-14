import{safeUrl}from'../../../packages/contracts';
import type{Media,Variant}from'../../../packages/contracts';
declare const __ALCYDEO_CAST_SENDER_URL__:string;
export const castSenderPage=typeof __ALCYDEO_CAST_SENDER_URL__==='string'?__ALCYDEO_CAST_SENDER_URL__:'';
export function castWebPage(page:string){
 const target=new URL(page);if(target.username||target.password||target.search||target.hash||!(target.origin==='https://drslid.github.io'&&target.pathname==='/Alcydeo/cast/'||target.origin==='http://localhost:4180'&&['/alcydeo/cast/','/Alcydeo/cast/'].includes(target.pathname)))throw new Error('tvWebUnavailable');
 return target;
}
export function castWebUrl(page:string,media:Media,variant:Variant,locale:string,downloadSource=false){
 const target=castWebPage(page);
 if(!['direct','hls','dash'].includes(media.kind)||variant.audioUrl||media.captureOnly)throw new Error('tvNotSupported');
 // A complete native manifest retains its associated tracks. Do not send an
 // isolated video track or manufacture a combined server-side manifest.
 const url=safeUrl(media.kind==='direct'?variant.url:media.url);if(url.length>16384)throw new Error('invalid');
 const mime=media.kind==='hls'?'application/vnd.apple.mpegurl':media.kind==='dash'?'application/dash+xml':variant.contentType??media.contentType??'video/mp4';
 let sourcePage:string|undefined;try{const original=new URL(media.pageUrl);if(['http:','https:'].includes(original.protocol)&&!original.username&&!original.password&&!original.search&&!original.hash&&original.href.length<=2048)sourcePage=original.href;}catch{/* An unavailable page link does not block the media handoff. */}
 const live=variant.check?.state==='ready'&&variant.check.live===true;
 target.hash=encodeURIComponent(JSON.stringify({version:1,locale,...(downloadSource===true?{downloadSource:true}:{}),...(sourcePage?{sourcePage}:{}),media:{url,title:media.title.slice(0,500),mime,...(live?{live:true}:{})}}));return target.href;
}
export async function castWebReady(page=castSenderPage){
 if(!page)return false;
 let target:URL;try{target=castWebPage(page);}catch{return false;}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),800);
 try{
  const response=await fetch(new URL('ready.json',target),{credentials:'omit',redirect:'error',cache:'no-store',signal:controller.signal});
  if(!response.ok||!response.body||Number(response.headers.get('content-length'))>2048)return false;
  const reader=response.body.getReader();let content='',bytes=0;const decoder=new TextDecoder();
  try{for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>2048)return false;content+=decoder.decode(chunk.value,{stream:true});}}
  finally{await reader.cancel().catch(()=>{});}
  const value=JSON.parse(content+decoder.decode());return value.app==='alcydeo-cast-web'&&value.protocol===2;
 }catch{return false;}finally{clearTimeout(timer);controller.abort();}
}
