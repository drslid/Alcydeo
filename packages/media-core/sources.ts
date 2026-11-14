import type {Media,Variant} from '../contracts';

export function sameAudio(target:Variant,variant:Variant){
  return target.audioUrl===variant.audioUrl||!!target.audioUrl&&!!variant.audioUrl&&target.check?.state==='ready'&&target.check.hlsTracks?.length===2&&!!target.audioSourceUrls?.includes(variant.audioUrl);
}

// Only observed redirects or checked HLS equivalence can replace a URL.
// Titles and resolutions alone never prove that two sources are the same.
export function sourceIndex(input:Media[]){
  const scope=(m:Pick<Media,'tabId'|'pageUrl'|'frameId'>)=>`${m.tabId}\0${m.pageUrl}\0${m.frameId??0}`;
  const index=new Map<string,Map<string,Variant|null>>();
  for(const media of input){const key=scope(media);let aliases=index.get(key);if(!aliases){aliases=new Map();index.set(key,aliases);}
    for(const variant of media.variants)if(variant.contentType)for(const url of variant.sourceUrls??[]){if(url===variant.url)continue;const old=aliases.get(url);aliases.set(url,old===undefined?variant:old?.url===variant.url&&old.audioUrl===variant.audioUrl?old:null);}
  }
  return(media:Pick<Media,'tabId'|'pageUrl'|'frameId'>,url:string)=>index.get(scope(media))?.get(url)??undefined;
}
export function canonicalMedia(input:Media[]):Media[]{
  const find=sourceIndex(input);
  function resolved(media:Media,variant:Variant):Variant{
    const target=find(media,variant.url);if(!target||media.kind==='hls'&&!sameAudio(target,variant))return variant;
    if(media.kind==='hls'&&variant.check?.state==='ready'&&target.check?.state==='ready'){
      const own=variant.check,known=target.check;
      if(own.planIdentity&&known.planIdentity&&own.planIdentity!==known.planIdentity||own.hlsTracks&&known.hlsTracks&&JSON.stringify(own.hlsTracks)!==JSON.stringify(known.hlsTracks)||own.checkedAt>known.checkedAt)return variant;
    }
    return{...variant,check:target.check,url:target.url,...(media.kind==='hls'?{audioUrl:target.audioUrl,audioSourceUrls:target.audioUrl?[...new Set([variant.audioUrl,...(variant.audioSourceUrls??[]),...(target.audioSourceUrls??[])].filter((url):url is string=>!!url))].slice(0,64):undefined}:{}),contentType:target.contentType,size:target.size,sourceUrls:[...new Set([variant.url,...(variant.sourceUrls??[]),...(target.sourceUrls??[])])]};
  }
  return input.map(media=>{
    const variants=media.variants.map(v=>resolved(media,v));const primary=media.variants.findIndex(v=>v.url===media.url);const url=primary<0?media.url:variants[primary]!.url;
    return{...media,url,contentType:primary<0?media.contentType:variants[primary]!.contentType??media.contentType,sourceUrls:[...new Set([media.url,...(media.sourceUrls??[]),...variants.flatMap(v=>v.sourceUrls??[])])],variants};
  });
}
