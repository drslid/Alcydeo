import {blocked,type Media,type Settings} from '../contracts';
export function eligibleMedia(media:Media[],settings:Settings){
  const allowed=(url:string)=>{try{return !blocked(new URL(url).hostname,settings.blocked);}catch{return false;}};
  return media.flatMap(item=>{
    if(!allowed(item.pageUrl))return [];
    const variants=item.variants.filter(v=>(v.check?.state!=='unavailable'||item.kind==='hls'&&v.check.error==='live')&&allowed(v.url)&&(item.kind!=='direct'||(v.size??(item.variants.length===1?item.size:undefined)??Infinity)>=settings.minSize));
    for(let i=0;i<variants.length;i++)if(item.kind==='hls'&&variants[i]!.check?.error==='live')variants[i]={...variants[i]!,check:undefined};
    if(!variants.length){if(item.live&&item.providerId?.startsWith('youtube:'))return[{...item,kind:'direct' as const,url:item.pageUrl,captureOnly:true,variants:[{id:'capture',url:item.pageUrl,label:''}]}];return [];}
    if(item.kind!=='direct')return [{...item,variants}];
    const first=variants.find(v=>v.url===item.url)??variants[0]!;
    return [{...item,url:first.url,contentType:first.contentType??item.contentType,size:first.size??(variants.length===item.variants.length?item.size:undefined),variants}];
  });
}

// Candidates remain available to the bounded background checks, never to the
// toolbar counter. Native YouTube catalogs and explicit capture stay distinct.
export function visibleMedia(media:Media[],settings:Settings){
  return eligibleMedia(media,settings).flatMap(item=>{
    if(item.captureOnly||item.kind==='sabr'&&!item.pending)return[item];
    const variants=item.variants.filter(v=>v.check?.state==='ready');if(!variants.length)return[];
    if(item.kind!=='direct')return[{...item,variants}];
    const first=variants.find(v=>v.url===item.url)??variants[0]!;
    return[{...item,url:first.url,contentType:first.contentType??item.contentType,size:first.size??(variants.length===item.variants.length?item.size:undefined),variants}];
  });
}
