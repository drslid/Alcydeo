import type{InstagramCatalog}from'../../../packages/media-core/instagram';
// A serialized local reader for already-loaded application/json data blocks.
// It does not evaluate bootstrap JavaScript or issue any provider/API request.
export function instagramPage(blockedSites:string[]=[]):InstagramCatalog|undefined{
 const host=location.hostname.toLowerCase();if(!/^(?:www\.|m\.)?instagram\.com$/.test(host)||location.protocol!=='https:')return;
 const code=location.pathname.match(/^\/(?:reels?|p)\/([A-Za-z0-9_-]{5,32})\/?$/)?.[1];if(!code)return;
 const denied=(hostname:string)=>blockedSites.some(p=>{const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'.*');return p.includes('*')?new RegExp(`^${escaped}$`).test(hostname)||(p.startsWith('*.')&&hostname===p.slice(2)):hostname===p||hostname.endsWith(`.${p}`);});if(denied(host))return;
 function source(value:unknown,poster=false):string|undefined{
  if(typeof value!=='string'||value.length>8192)return;try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||u.hash||!/(?:^|\.)(?:cdninstagram\.com|fbcdn\.net)$/.test(u.hostname)||denied(u.hostname))return;
   if(!poster&&(!/\.mp4$/i.test(u.pathname)||[...u.searchParams.keys()].some(key=>/^(?:bytestart|byteend|range|bytes)$/i.test(key))))return;
   return value;
  }catch{return;}
 }
 const positive=(value:unknown,max:number)=>{const n=Number(value);return Number.isFinite(n)&&n>0&&n<=max?n:undefined;};
 const dimension=(value:unknown)=>{const n=positive(value,16384);return n!==undefined&&Number.isInteger(n)?n:undefined;};
 let found:InstagramCatalog|undefined,refused:InstagramCatalog|undefined,visited=0,parsedBytes=0;
 function media(item:Record<string,any>){
  if((item.code??item.shortcode)!==code)return;
  const id=typeof item.pk==='string'?item.pk:typeof item.id==='string'?item.id.split('_')[0]:undefined;
  if(!id||!/^\d{5,25}$/.test(id))return;
  if(item.is_private===true||item.is_unavailable===true||item.is_unpublished===true||item.is_prohibited===true||item.user?.is_private===true||item.is_video===false){refused={code:code!,mediaId:id,title:'',formats:[]};return;}
  if(!Array.isArray(item.video_versions)&&typeof item.video_url!=='string')return;
  const native=Array.isArray(item.video_versions)?item.video_versions.slice(0,24):typeof item.video_url==='string'?[{url:item.video_url}]:[];
  const formats:InstagramCatalog['formats']=[],seen=new Set<string>();
  for(const row of native){if(!row||typeof row!=='object')continue;const url=source(row.url);if(!url||seen.has(url))continue;
   const type=typeof row.mime_type==='string'?row.mime_type.toLowerCase():'';if(type&&type.split(';')[0]!.trim()!=='video/mp4')continue;
   const codec=/avc1|h264/.test(type)?'H.264':/hvc1|hev1|hevc/.test(type)?'HEVC':/vp09|vp9/.test(type)?'VP9':/av01|av1/.test(type)?'AV1':undefined;
   seen.add(url);formats.push({url,width:dimension(row.width),height:dimension(row.height),size:positive(row.file_size,Number.MAX_SAFE_INTEGER),bandwidth:positive(row.bitrate,1e10),codec});
  }
  formats.sort((a,b)=>(b.height??0)-(a.height??0)||Number(b.codec==='H.264')-Number(a.codec==='H.264')||(b.bandwidth??0)-(a.bandwidth??0));
  const caption=item.caption?.text??item.edge_media_to_caption?.edges?.[0]?.node?.text;
  const poster=(Array.isArray(item.image_versions2?.candidates)?item.image_versions2.candidates.slice(0,12).map((c:any)=>source(c?.url,true)).find(Boolean):undefined)??source(item.display_url,true);
  found={code:code!,mediaId:id,title:typeof caption==='string'?caption.trim().slice(0,300):'',duration:positive(item.video_duration,7*86400),poster,formats};
 }
 function walk(value:unknown,depth=0){
  if(!value||typeof value!=='object'||depth>28||visited>=20000)return;visited++;
  if(Array.isArray(value)){for(const entry of value.slice(0,10000)){if(visited>=20000)break;walk(entry,depth+1);}return;}
  const item=value as Record<string,any>;media(item);
  for(const[key,entry]of Object.entries(item)){if(visited>=20000)break;if(!['user','owner','comments','clips_metadata','tracking','logging'].includes(key))walk(entry,depth+1);}
 }
 for(const script of Array.from(document.scripts).slice(0,128)){
  if(visited>=20000)break;
  if(script.type!=='application/json')continue;const text=script.textContent??'';
  if(text.length>2*1024*1024||parsedBytes+text.length>8*1024*1024||!text.includes(code)||(!text.includes('video_versions')&&!text.includes('video_url')))continue;
  parsedBytes+=text.length;try{walk(JSON.parse(text));}catch{/* HTML/JavaScript and malformed state are not a media catalog. */}
 }
 return refused??found;
}
