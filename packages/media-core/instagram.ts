import type{Media}from'../contracts';
export interface InstagramCatalog{
 code:string;mediaId:string;title:string;duration?:number;poster?:string;
 formats:{url:string;width?:number;height?:number;size?:number;bandwidth?:number;codec?:string}[];
}
export const instagramHost=(host:string)=>/^(?:www\.|m\.)?instagram\.com$/.test(host);
export function instagramPostPage(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&instagramHost(u.hostname)&&/^\/(?:reels?|p)\/[A-Za-z0-9_-]{5,32}\/?$/.test(u.pathname);}catch{return false;}}
export function instagramCdn(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&!u.hash&&/(?:^|\.)(?:cdninstagram\.com|fbcdn\.net)$/.test(u.hostname);}catch{return false;}}
export function instagramMedia(raw:InstagramCatalog,scope:Pick<Media,'tabId'|'pageUrl'|'frameId'>,previous?:Media):Media|undefined{
 if(!instagramPostPage(scope.pageUrl)||new URL(scope.pageUrl).pathname.split('/')[2]!==raw.code||!/^\d{5,25}$/.test(raw.mediaId)||!Array.isArray(raw.formats))return;
 const providerId=`instagram:${raw.code}:${raw.mediaId}`,old=previous?.providerId===providerId&&previous.tabId===scope.tabId&&previous.pageUrl===scope.pageUrl&&previous.frameId===scope.frameId?previous:undefined;
 const seen=new Set<string>();
 const variants=raw.formats.slice(0,24).flatMap(f=>{
  if(!instagramCdn(f.url))return[];const u=new URL(f.url);if(!/\.mp4$/i.test(u.pathname)||[...u.searchParams.keys()].some(key=>/^(?:bytestart|byteend|range|bytes)$/i.test(key))||seen.has(f.url))return[];seen.add(f.url);
  const saved=old?.variants.find(v=>v.url===f.url),check=saved?.check?.state==='ready'?saved.check:undefined,width=f.width??check?.width??saved?.width,height=f.height??check?.height??saved?.height,codec=f.codec??saved?.label.split(' · ').find(value=>['H.264','HEVC','VP9','AV1'].includes(value));
  return[{id:saved?.id??crypto.randomUUID(),url:f.url,label:[height?`${height}p`:'',codec].filter(Boolean).join(' · '),width,height,bandwidth:f.bandwidth??saved?.bandwidth,size:f.size??check?.size??saved?.size,contentType:'video/mp4',check:saved?.check}];
 });if(!variants.length)return;
 return{...scope,id:old?.id??crypto.randomUUID(),providerId,title:typeof raw.title==='string'&&raw.title.trim()?raw.title.trim().slice(0,300):`Instagram ${raw.code}`,url:variants[0]!.url,kind:'direct',duration:raw.duration,poster:raw.poster&&instagramCdn(raw.poster)?raw.poster:undefined,height:variants[0]!.height,contentType:'video/mp4',qualitiesResolved:true,detectedBy:'dom',variants};
}
