import type {Media} from '../contracts';
import type {Segment} from './hls';
import {vkRangeResource} from './vk';

export function isFragment(url:string,fragments:ReadonlySet<string>){
  if(fragments.has(url))return true;const resource=vkRangeResource(url);return resource!==undefined&&fragments.has(resource);
}

// These are exact URLs read from a playlist, never guessed from numbered names.
export function fragmentUrls(segments:Segment[],previous:string[],candidates:string[]=[]){
  const current=new Set(candidates),matched:string[]=[];for(const s of segments)if(current.has(s.url))matched.push(s.url);
  const urls:string[]=[];const seen=new Set<string>();let characters=0;
  for(const url of [...matched,...segments.map(s=>s.url),...previous]){if(seen.has(url))continue;if(urls.length>=4096||characters+url.length>262144)continue;seen.add(url);urls.push(url);characters+=url.length;}
  return urls;
}
export function withoutFragments(media:Media[],urls:Iterable<string>){
  const fragments=new Set(urls);return media.flatMap(m=>{
    if(m.kind!=='direct')return[m];const variants=m.variants.filter(v=>!isFragment(v.url,fragments)&&!v.sourceUrls?.some(url=>isFragment(url,fragments)));
    return variants.length?[{...m,url:isFragment(m.url,fragments)?variants[0]!.url:m.url,variants}]:[];
  });
}
