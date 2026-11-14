import type{Media}from'../contracts';
export interface XCatalog{
 postId:string;title:string;
 items:{mediaId:string;duration?:number;poster?:string;formats:{url:string;kind:'direct'|'hls';height?:number;width?:number;bandwidth?:number}[]}[];
}
export const xHost=(host:string)=>/^(?:www\.|mobile\.|m\.)?(?:x|twitter)\.com$/.test(host);
export function xPostPage(url:string){try{const u=new URL(url);return xHost(u.hostname)&&/^\/(?:[^/]+\/status|i\/web\/status|i\/videos\/tweet)\/\d{10,25}(?:\/|$)/.test(u.pathname);}catch{return false;}}
export const xCdn=(url:string)=>{try{return new URL(url).hostname==='video.twimg.com';}catch{return false;}};
export function xMedia(raw:XCatalog,scope:Pick<Media,'tabId'|'pageUrl'|'frameId'>,previous:Media[]=[]):Media[]{
 return raw.items.flatMap((item,index)=>{
  const providerId=`x:${raw.postId}:${item.mediaId}`,old=previous.find(m=>m.providerId===providerId);
  const formats=item.formats.some(f=>f.kind==='direct')?item.formats.filter(f=>f.kind==='direct'):item.formats.filter(f=>f.kind==='hls');
  if(!formats.length)return[];const kind=formats[0]!.kind;
  const variants=formats.map(f=>{const saved=old?.variants.find(v=>v.url===f.url);return{id:saved?.id??crypto.randomUUID(),url:f.url,label:f.height?`${f.height}p`:'',height:f.height,bandwidth:f.bandwidth,contentType:kind==='direct'?'video/mp4':'application/vnd.apple.mpegurl',check:saved?.check,size:saved?.size};});
  return[{...scope,id:old?.id??crypto.randomUUID(),providerId,title:raw.title+(raw.items.length>1?` · ${index+1}`:''),url:variants[0]!.url,kind,duration:item.duration,poster:item.poster,height:variants[0]!.height,contentType:variants[0]!.contentType,qualitiesResolved:kind==='direct',detectedBy:'dom' as const,variants}];
 });
}
