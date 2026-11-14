import type{XCatalog}from'../../../packages/media-core/x';

// Serialized by scripting and shared with the document-start observer. Read
// native JSON as data only: never evaluate the surrounding bootstrap script.
export function xPage(blockedSites:string[]=[],scriptTexts:string[]=[]):XCatalog|undefined{
 const own=globalThis as typeof globalThis&{__alcydeoXCatalog?:XCatalog};
 const host=location.hostname.toLowerCase();
 if(!/^(?:www\.|mobile\.|m\.)?(?:x|twitter)\.com$/.test(host))return;
 const postId=location.pathname.match(/^\/(?:[^/]+\/status|i\/web\/status|i\/videos\/tweet)\/(\d{10,25})(?:\/|$)/)?.[1];
 const denied=blockedSites.some(p=>{const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'.*');return p.includes('*')?new RegExp(`^${escaped}$`).test(host)||(p.startsWith('*.')&&host===p.slice(2)):host===p||host.endsWith(`.${p}`);});
 if(!postId||denied){delete own.__alcydeoXCatalog;return;}
 if(own.__alcydeoXCatalog?.postId!==postId)delete own.__alcydeoXCatalog;
 const maximum=2*1024*1024;let parsedBytes=0,visited=0,found=false;
 let title=own.__alcydeoXCatalog?.title??document.title.slice(0,300);
 const items=new Map<string,XCatalog['items'][number]>((own.__alcydeoXCatalog?.items??[]).map(item=>[item.mediaId,item]));
 function url(value:unknown,poster=false):string|undefined{
  if(typeof value!=='string'||value.length>8192)return;
  try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||u.hash)return;
   if(poster?u.hostname!=='pbs.twimg.com':u.hostname!=='video.twimg.com')return;
   return u.href;
  }catch{return;}
 }
 function tweet(value:Record<string,any>){
  const id=value.rest_id??value.id_str;
  if(id!==postId||!(value.__typename==='Tweet'||value.extended_entities||value.legacy?.extended_entities))return;
  if(!found)items.clear();found=true;
  const full=value.note_tweet?.note_tweet_results?.result?.text??value.details?.full_text??value.legacy?.full_text??value.full_text;
  if(typeof full==='string'){const clean=full.slice(0,2000).replace(/(?:\s*https:\/\/t\.co\/\w+)+\s*$/,'').trim();if(clean)title=clean.slice(0,300);}
  const media=value.media_entities2??value.media_entities??value.legacy?.extended_entities?.media??value.extended_entities?.media;
  if(!Array.isArray(media))return;
  for(const [index,m]of media.slice(0,4).entries()){
   if(!m||!['video','animated_gif'].includes(m.type))continue;
   // Relay's second envelope can omit id_str for the same video. The native
   // CDN asset identity keeps that partial record from creating another card.
   const nativeAsset=Array.isArray(m.video_info?.variants)?m.video_info.variants.flatMap((f:any)=>{const source=url(f?.url);return source?[new URL(source).pathname.match(/^\/(?:amplify_video|ext_tw_video)\/(\d{5,25})\//)?.[1]]:[];}).find(Boolean):undefined;
   const id=m.id_str??m.media_key?.replace(/^\d+_/,'')??nativeAsset??String(index+1);
   if(typeof id!=='string'||!/^\d{1,25}$/.test(id))continue;
   if((m.ext_media_availability?.status&&m.ext_media_availability.status!=='Available')||m.allow_download_status?.allow_download===false){items.delete(id);continue;}
   const formats:XCatalog['items'][number]['formats']=[];const seen=new Set<string>();
   const native=m.video_info?.variants;if(!Array.isArray(native))continue;
   for(const f of native.slice(0,24)){
    const source=url(f?.url);if(!source||seen.has(source))continue;
    const path=new URL(source).pathname;
    const type=typeof f.content_type==='string'?f.content_type.toLowerCase().split(';')[0]:'';
    const kind=type==='video/mp4'&&/\.mp4$/i.test(path)?'direct':['application/x-mpegurl','application/vnd.apple.mpegurl'].includes(type)&&/\.m3u8$/i.test(path)?'hls':undefined;
    if(!kind||/\/(?:aud|mp4a)\//.test(path))continue;
    const dimensions=path.match(/\/(\d{2,5})x(\d{2,5})\//),width=dimensions?Number(dimensions[1]):undefined,height=dimensions?Number(dimensions[2]):undefined;
    const rate=Number(f.bitrate);seen.add(source);formats.push({url:source,kind,width,height,bandwidth:Number.isFinite(rate)&&rate>0?rate:undefined});
   }
   if(!formats.length)continue;
   formats.sort((a,b)=>(b.height??0)-(a.height??0)||(b.bandwidth??0)-(a.bandwidth??0));
   const ms=Number(m.video_info.duration_millis);
   items.set(id,{mediaId:id,duration:Number.isFinite(ms)&&ms>0?ms/1000:undefined,poster:url(m.media_url_https,true),formats});
  }
 }
 function walk(value:unknown,depth=0){
  if(!value||typeof value!=='object'||depth>32||++visited>20000)return;
  if(Array.isArray(value)){for(const item of value.slice(0,10000))walk(item,depth+1);return;}
  const record=value as Record<string,any>;tweet(record);
  for(const [key,item]of Object.entries(record))if(!['quoted_status_result','quoted_status','retweeted_status_result','retweeted_status','core','user_results','card'].includes(key))walk(item,depth+1);
 }
 function parse(text:string){if(parsedBytes+text.length>maximum*4)return;parsedBytes+=text.length;try{walk(JSON.parse(text));}catch{/* A script is never executable input. */}}
 const texts=[...scriptTexts,...Array.from(document.scripts).slice(0,128).map(s=>s.textContent??'')];
 for(const text of texts.slice(0,160)){
  if(text.length>maximum||!text.includes(postId)||!text.includes('video_info'))continue;
  if(text.trimStart().startsWith('{')){parse(text);continue;}
  // Current X streams JSON in JS string literals (TanStack/Relay). Decode only
  // valid JSON literals; function calls, assignments and other JS are ignored.
  for(let i=0;i<text.length;){
   if(text[i]!=='"'){i++;continue;}
   const start=i++;while(i<text.length){if(text[i]==='\\'){i+=2;continue;}if(text[i++]==='"')break;}
   const literal=text.slice(start,i);if(!literal.includes('video_info')||!literal.includes(postId))continue;
   try{const decoded:unknown=JSON.parse(literal);if(typeof decoded==='string'&&decoded.startsWith('{')&&decoded.length<=maximum)parse(decoded);}catch{/* Not a JSON string. */}
  }
  // Legacy hydration is a JSON object assigned to __INITIAL_STATE__. Extract
  // only that balanced object, without running the assignment or any suffix.
  const marker=/(?:window\.)?__INITIAL_STATE__\s*=\s*/.exec(text);
  if(marker){const start=marker.index+marker[0].length;let depth=0,quoted=false,escaped=false;
   for(let i=start;i<text.length;i++){const c=text[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){parse(text.slice(start,i+1));break;}}
  }
 }
 if(found)own.__alcydeoXCatalog={postId,title:title||`X ${postId}`,items:[...items.values()].slice(0,4)};
 return own.__alcydeoXCatalog;
}
