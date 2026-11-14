import{safeUrl,type Media}from'../contracts';
export interface TiktokCatalog{videoId:string;title:string;duration?:number;poster?:string;formats:{url:string;urls?:string[];width?:number;height?:number;size?:number;bandwidth?:number;codec:string}[]}
export const tiktokHost=(host:string)=>/^(?:www\.|m\.)?tiktok\.com$/.test(host);
export function tiktokDecoration(pageUrl:string,url:string){try{return tiktokHost(new URL(pageUrl).hostname)&&/^sf\d+-website-login(?:[.-]|$)/.test(new URL(url).hostname)&&new URL(url).hostname.endsWith('.ttwstatic.com');}catch{return false;}}
export function tiktokMedia(raw:TiktokCatalog,scope:Pick<Media,'tabId'|'pageUrl'|'frameId'>,previous?:Media):Media|undefined{
 if(!/^\d{10,25}$/.test(raw.videoId)||!raw.formats.length)return;
 const used=new Set<string>();
 const variants=raw.formats.flatMap(f=>{try{
  const sourceUrls=[...new Set([f.url,...(f.urls??[])].flatMap(value=>{try{return[safeUrl(value)];}catch{return[];}}))].slice(0,3);if(!sourceUrls.length)return[];
  const old=previous?.variants.find(v=>!used.has(v.id)&&sourceUrls.includes(v.url))??previous?.variants.find(v=>!used.has(v.id)&&v.sourceUrls?.some(url=>sourceUrls.includes(url)));
  if(old)used.add(old.id);
  // A successful native CDN stays active while this exact format declares it.
  // Keeping the quality id across an alternative never carries a URL check.
  const url=old&&sourceUrls.includes(old.url)?old.url:sourceUrls[0]!;
  return[{id:old?.id??crypto.randomUUID(),url,sourceUrls,label:[f.height?`${f.height}p`:'',f.codec].filter(Boolean).join(' · '),width:f.width,height:f.height,bandwidth:f.bandwidth,size:f.size,contentType:'video/mp4',check:old?.url===url?old.check:undefined}];
 }catch{return[];}});if(!variants.length)return;
 return{...scope,id:previous?.id??crypto.randomUUID(),providerId:`tiktok:${raw.videoId}`,title:raw.title||`TikTok ${raw.videoId}`,url:variants[0]!.url,kind:'direct',duration:raw.duration,height:variants[0]!.height,poster:raw.poster??previous?.poster,contentType:'video/mp4',qualitiesResolved:true,detectedBy:'dom',variants};
}
