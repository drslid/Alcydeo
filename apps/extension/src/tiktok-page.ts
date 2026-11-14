import type{TiktokCatalog}from'../../../packages/media-core/tiktok';
// Serialized packaged reader. Read only already-loaded JSON for the exact
// selected post: no API request, remote script, cookie or generated signature.
export function tiktokPage(blockedSites:string[]=[],scriptTexts:string[]=[],retain=true):TiktokCatalog|undefined{
 const own=globalThis as typeof globalThis&{__alcydeoTikTokCatalog?:{pageUrl:string;catalog:TiktokCatalog;captured:boolean}};
 if(!/^(?:www\.|m\.)?tiktok\.com$/.test(location.hostname)){delete own.__alcydeoTikTokCatalog;return;}
 const host=location.hostname;if(blockedSites.some(p=>{const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'.*');return p.includes('*')?new RegExp(`^${escaped}$`).test(host)||(p.startsWith('*.')&&host===p.slice(2)):host===p||host.endsWith(`.${p}`);})){delete own.__alcydeoTikTokCatalog;return;}
 const expected=location.pathname.match(/^\/@[^/]+\/video\/(\d{10,25})(?:\/|$)/)?.[1]??location.pathname.match(/^\/(?:embed(?:\/v2)?|player\/v1)\/(\d{10,25})(?:\/|$)/)?.[1];if(!expected){delete own.__alcydeoTikTokCatalog;return;}
 if(own.__alcydeoTikTokCatalog?.pageUrl!==location.href||own.__alcydeoTikTokCatalog?.catalog.videoId!==expected)delete own.__alcydeoTikTokCatalog;
 const safe=(value:any)=>{if(typeof value!=='string'||value.length>16384)return;try{const u=new URL(value,location.href);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')return;if(!/(^|\.)(tiktok\.com|tiktokcdn\.com|tiktokcdn-eu\.com|byteoversea\.com|ibytedtos\.com|muscdn\.com)$/.test(u.hostname)||/^(?:www\.|m\.)?tiktok\.com$/.test(u.hostname))return;return u.href;}catch{return;}};
 const positive=(value:any,max:number)=>{const n=Number(value);return Number.isFinite(n)&&n>0&&n<=max?n:undefined;};
 const empty=():TiktokCatalog=>({videoId:expected,title:'',formats:[]});
 const parse=(raw:string):TiktokCatalog|undefined=>{
  try{
   const data=JSON.parse(raw),detail=data.__DEFAULT_SCOPE__?.['webapp.video-detail'];
   const item:any=detail?.itemInfo?.itemStruct??data.ItemModule?.[expected];
   if(detail?.statusCode!==undefined&&Number(detail.statusCode)!==0)return!item||String(item.id)===expected?empty():undefined;
   if(!item||String(item.id)!==expected)return;
   if(!item.video||item.privateItem||item.forFriend||item.secret||item.isProhibited||item.takeDown)return empty();
   const video=item.video;if(video.format&&String(video.format).toLowerCase()!=='mp4')return empty();const formats:TiktokCatalog['formats']=[],seen=new Set<string>();
   const codec=(value:any)=>/^(?:h264|avc)/i.test(String(value??''))?'H.264':/^(?:h265|hevc|bytevc1)/i.test(String(value??''))?'HEVC':/av01|av1/i.test(String(value??''))?'AV1':/bytevc2|vvc|h266/i.test(String(value??''))?'unsupported':'';
   function add(value:any,meta:any={},encoding:any=video.codecType,rate:any=video.bitrate){
    const c=codec(encoding);if(c==='unsupported')return;
    const urls=typeof value==='string'?[value]:Array.isArray(value)?value.slice(0,3).flatMap(x=>typeof x==='string'?[x]:typeof x?.src==='string'?[x.src]:[]):Array.isArray(value?.UrlList)?value.UrlList.slice(0,3):typeof value?.src==='string'?[value.src]:[];
    // Only a complete playback file is offered. Known video-only HEVC tracks
    // cannot stand in for a whole video with its audio.
    const alternatives=[...new Set<string>(urls.map(safe).filter((u:string|undefined):u is string=>!!u&&!/\/media-video-(?:hvc1|avc1)\//.test(new URL(u).pathname)))];
    const url=alternatives[0];if(!url||seen.has(url)||formats.length>=24)return;
    for(const alternative of alternatives)seen.add(alternative);formats.push({url,urls:alternatives,width:positive(meta.Width??meta.width??video.width,16384),height:positive(meta.Height??meta.height??video.height,16384),size:positive(meta.DataSize??meta.dataSize,Number.MAX_SAFE_INTEGER),bandwidth:positive(rate,1e10),codec:c});
   }
   for(const row of (Array.isArray(video.bitrateInfo)?video.bitrateInfo:[]).slice(0,24))if(!row.Format||String(row.Format).toLowerCase()==='mp4')add(row.PlayAddr??row.playAddr,row.PlayAddr??row.playAddr,row.CodecType??video.codecType,row.Bitrate);
   add(video.PlayAddrStruct,video.PlayAddrStruct);add(video.playAddr,video.PlayAddrStruct??{DataSize:video.size});
   if(!formats.length)return empty();
   formats.sort((a,b)=>(b.height??0)-(a.height??0)||Number(b.codec==='H.264')-Number(a.codec==='H.264')||(b.bandwidth??0)-(a.bandwidth??0));
   return{videoId:expected,title:typeof item.desc==='string'?item.desc.trim().slice(0,300):'',duration:positive(video.duration,86400*7),poster:safe(video.cover)||safe(video.originCover),formats};
  }catch{/* A stale or invalid state cannot supply a media URL. */}
 };
 let budget=8*1024*1024;
 const read=(text:string|undefined|null)=>{if(!text||text.length>budget)return;budget-=text.length;return parse(text);};
 const remember=(catalog:TiktokCatalog,captured:boolean)=>{if(retain)own.__alcydeoTikTokCatalog={pageUrl:location.href,catalog,captured};return catalog;};
 // Observer inputs are newest first. Keep only parsed current-post metadata;
 // neither raw JSON nor data from profiles/recommendations survives this call.
 for(const text of scriptTexts.slice(0,32)){const catalog=read(text);if(catalog)return remember(catalog,true);}
 // A captured refusal is an explicit empty catalogue. Old hydration left in
 // the DOM cannot undo it; a newly observed native catalogue can replace it.
 if(own.__alcydeoTikTokCatalog?.captured)return own.__alcydeoTikTokCatalog.catalog;
 for(const id of ['__UNIVERSAL_DATA_FOR_REHYDRATION__','SIGI_STATE','sigi-persisted-data']){const catalog=read(document.getElementById(id)?.textContent);if(catalog)return remember(catalog,false);}
 return own.__alcydeoTikTokCatalog?.catalog;
}
