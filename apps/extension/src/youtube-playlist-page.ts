// Serialized original code in the existing YouTube page. No player API call,
// signature deciphering, token generation or remote executable is involved.
export async function youtubePlaylistPage(continuation?:string){
 try{
  const u=new URL(location.href),id=u.searchParams.get('list');if(u.protocol!=='https:'||!/^(?:www\.|m\.)?youtube\.com$/.test(u.hostname)||!['/playlist','/watch'].includes(u.pathname)||!id||!/^[\w-]{2,100}$/.test(id))return;
  const w=window as any,text=(v:any):string=>typeof v==='string'?v:typeof v?.simpleText==='string'?v.simpleText:typeof v?.content==='string'?v.content:Array.isArray(v?.runs)?v.runs.map((x:any)=>x.text??'').join(''):'';
  if(continuation&&id.startsWith('RD'))throw new Error();
  async function browse(payload:{continuation?:string;browseId?:string}){
   const context=w.ytcfg?.get?.('INNERTUBE_CONTEXT');if(!context?.client?.clientName||!context.client.clientVersion)throw new Error();
   const response=await fetch('/youtubei/v1/browse?prettyPrint=false',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({context,...payload}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error();
   const reader=response.body?.getReader();if(!reader)throw new Error();const decoder=new TextDecoder();let raw='',bytes=0;
   try{while(true){const{done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2*1024*1024)throw new Error();raw+=decoder.decode(value,{stream:true});}return JSON.parse(raw+decoder.decode());}finally{await reader.cancel().catch(()=>{});}
  }
  let data:any,title='',roots:any[]=[],snapshot=false;
  if(continuation){
   if(continuation.length>8192)throw new Error();data=await browse({continuation});
   roots=[...(data.onResponseReceivedActions??[]),...(data.onResponseReceivedEndpoints??[])].flatMap(x=>x.appendContinuationItemsAction?.continuationItems??[]);
   if(!roots.length)roots=data.continuationContents?.playlistVideoListContinuation?.contents??data.continuationContents?.sectionListContinuation?.contents??[];
   if(!roots.length)throw new Error();
  }else{
   const loaded=[w.ytInitialData,(document.querySelector('ytd-browse')as any)?.data,(document.querySelector('ytd-watch-flexy')as any)?.data];
   data=loaded.find(x=>{if(!x?.contents&&!x?.metadata)return false;const canonical=x.microformat?.microformatDataRenderer?.urlCanonical;if(!canonical)return true;const target=new URL(canonical,location.href);return !target.searchParams.has('list')&&target.pathname!=='/playlist'||target.searchParams.get('list')===id;});if(!data)return;
   const panel=data.contents?.twoColumnWatchNextResults?.playlist?.playlist;
   if(u.pathname==='/watch'){
    if(panel?.playlistId&&panel.playlistId!==id)throw new Error();
    title=text(panel?.title);
    if(panel?.isInfinite||id.startsWith('RD')){if(!panel||!Array.isArray(panel.contents))throw new Error();snapshot=true;roots=panel.contents;}
    else data=await browse({browseId:'VL'+id});
   }
   if(!snapshot){
    title=text(data.metadata?.playlistMetadataRenderer?.title)||text(data.header?.playlistHeaderRenderer?.title)||title||document.title.replace(/\s*[-–]\s*YouTube\s*$/i,'');
    const tabs=data.contents?.twoColumnBrowseResultsRenderer?.tabs??data.contents?.singleColumnBrowseResultsRenderer?.tabs??[];
    const tab=(tabs.find((t:any)=>t.tabRenderer?.selected===true)??tabs.find((t:any)=>t.tabRenderer?.content))?.tabRenderer?.content;
    const sections=tab?.sectionListRenderer?.contents;
    if(Array.isArray(sections)){
     // The current outer section continuation loads recommendations, not more
     // playlist rows. Actual list continuations belong inside the item section.
     const list=sections.find((s:any)=>s.itemSectionRenderer?.contents?.some((x:any)=>x.playlistVideoListRenderer||x.playlistVideoRenderer||x.videoRenderer||x.lockupViewModel?.contentType==='LOCKUP_CONTENT_TYPE_VIDEO'))??sections.find((s:any)=>s.itemSectionRenderer);
     roots=list?.itemSectionRenderer?.contents??[];
    }else if(tab?.playlistVideoListRenderer)roots=[tab];
   }
   if(!roots.length)return;
  }
  const entries:any[]=[],queue=[...roots],seen=new WeakSet<object>();let token:string|undefined,cursor=0;
  while(cursor<queue.length&&cursor<50000){const value=queue[cursor++];if(!value||typeof value!=='object'||seen.has(value))continue;seen.add(value);if(Array.isArray(value)){queue.push(...value);continue;}
   if(value.playlistVideoListRenderer?.playlistId&&value.playlistVideoListRenderer.playlistId!==id)continue;
   const video=value.playlistVideoRenderer??value.playlistPanelVideoRenderer??value.videoRenderer,lockup=value.lockupViewModel;
   if(video||lockup?.contentType==='LOCKUP_CONTENT_TYPE_VIDEO'){
    const r=video??lockup,endpoint=r.navigationEndpoint?.watchEndpoint??r.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint;
    if(endpoint?.playlistId&&endpoint.playlistId!==id)continue;const videoId=r.videoId??r.contentId??endpoint?.videoId;
    const label=text(r.title??r.metadata?.lockupMetadataViewModel?.title).slice(0,300),indexText=text(r.index),number=Number(indexText.replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(c<='٩'?1632:1776))).replace(/\D/g,''));
    const live=(r.thumbnailOverlays??[]).some((x:any)=>['LIVE','UPCOMING'].includes(x.thumbnailOverlayTimeStatusRenderer?.style));
    const available=typeof videoId==='string'&&/^[-\w]{11}$/.test(videoId)&&r.isPlayable!==false&&!r.unplayableText&&!live;
    entries.push({videoId:typeof videoId==='string'&&/^[-\w]{11}$/.test(videoId)?videoId:undefined,title:label,index:Number.isInteger(number)&&number>0?number-1:Number.isInteger(endpoint?.index)&&endpoint.index>=0?endpoint.index:undefined,setId:typeof r.playlistSetVideoId==='string'?r.playlistSetVideoId.slice(0,150):undefined,available,reason:available?undefined:live?'live':'unavailable'});if(entries.length>5000)throw new Error();continue;
   }
   const next=value.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token??value.continuationItemViewModel?.continuationCommand?.innertubeCommand?.continuationCommand?.token??value.nextContinuationData?.continuation;
   if(typeof next==='string'&&next.length<=8192)token=next;
   for(const[key,child]of Object.entries(value))if(!['secondaryContents','header','trackingParams','menu','thumbnail','thumbnails','adSlotRenderer'].includes(key)&&child&&typeof child==='object')queue.push(child);
  }
  if(cursor<queue.length||!entries.length&&token)throw new Error();return{id,title:title.slice(0,300),entries,continuation:snapshot?undefined:token,snapshot:snapshot||undefined};
 }catch{return{error:'playlistRead'};}
}
export function startPlaylistVideo(expected:string){
 const u=new URL(location.href);if(u.protocol!=='https:'||u.hostname!=='www.youtube.com'||u.pathname!=='/watch'||u.searchParams.get('v')!==expected)return false;
 const raw=(document.querySelector('#movie_player')as any)?.getPlayerResponse?.()??(window as any).ytInitialPlayerResponse;
 if(raw?.videoDetails?.videoId===expected){if(raw.playabilityStatus?.status&&raw.playabilityStatus.status!=='OK')return'sourceRestricted';if(raw.streamingData?.licenseInfos?.length)return'encrypted';if(raw.videoDetails?.isLive===true)return'live';}
 const video=document.querySelector<HTMLVideoElement>('video');if(!video)return false;video.muted=true;if(video.paused)void video.play().catch(()=>{});return true;
}
export function pausePlaylistVideo(expected:string){const u=new URL(location.href);if(u.hostname==='www.youtube.com'&&u.pathname==='/watch'&&u.searchParams.get('v')===expected)document.querySelector<HTMLVideoElement>('video')?.pause();}
