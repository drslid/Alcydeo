import type {Media,Variant} from '../contracts';

// Identity keys are used for comparison only. Never download these normalized
// URLs: real request URLs, including all signatures, remain untouched.
export function qualityIdentity(source:string):{key:string;height:number}|undefined {
  const url=new URL(source);let height=0;
  url.pathname=url.pathname.replace(/(^|[/_.-])(\d{3,5})p(?=$|[/_.-])/gi,(_all,prefix,value)=>{height=Number(value);return `${prefix}@quality`;});
  for(const key of ['quality','resolution','height']){
    const value=url.searchParams.get(key);if(value&&/^\d{3,5}p?$/i.test(value)){height=Number.parseInt(value);url.searchParams.set(key,'@quality');}
  }
  return height?{key:url.href,height}:undefined;
}
export const mediaMatches=(media:Media,id:string)=>media.id===id||!!media.aliases?.includes(id);
const titleKey=(title:string)=>title.normalize('NFKC').replace(/\s+/g,' ').trim().replace(/\s*[-–—|[(]?\s*\d{3,5}p[\])]?$/i,'').trim().toLowerCase();
const urlsOf=(media:Media)=>new Set([media.url,...(media.sourceUrls??[]),...media.variants.map(v=>v.url)]);
const variantKey=(kind:Media['kind'],v:Variant)=>['dash','sabr'].includes(kind)?`${v.url}\0${v.id}`:`${v.url}\0${v.audioUrl??''}`;
const planKey=(v:Variant)=>v.check?.state==='ready'&&!v.check.live?v.check.planIdentity:undefined;
const tracksOf=(v:Variant)=>v.check?.state==='ready'&&!v.check.live?v.check.hlsTracks:undefined;
function componentOf(pair:Variant,leaf:Variant){
  const tracks=tracksOf(pair),single=tracksOf(leaf),unconfirmed=!leaf.check||leaf.check.state==='unknown',audio=pair.audioUrl===leaf.url||!!pair.audioSourceUrls?.includes(leaf.url),video=pair.url===leaf.url||!!pair.sourceUrls?.includes(leaf.url);
  return!!pair.audioUrl&&!leaf.audioUrl&&tracks?.length===2&&tracks[0]!==tracks[1]&&(single?.length===1?!(video&&single[0]!==tracks[0]||audio&&single[0]!==tracks[1])&&tracks.includes(single[0]!):unconfirmed&&audio);
}
export function matchingVariant(kind:Media['kind'],previous:Variant,available:Variant[]):Variant|undefined{
  const sameId=available.find(v=>v.id===previous.id);
  if(['dash','sabr'].includes(kind)&&sameId)return sameId;
  const exact=available.find(v=>v.url===previous.url&&v.audioUrl===previous.audioUrl);if(exact)return exact;
  const sameUrl=available.filter(v=>v.url===previous.url);if(sameUrl.length===1)return sameUrl[0];if(sameId)return sameId;
  // A refreshed master may issue entirely new signed URLs for the same
  // quality. Keep a unique matching quality, never an ambiguous alternative.
  const qualities=available.filter(v=>previous.height!==undefined?v.height===previous.height:!!previous.label&&v.label===previous.label);
  const sameRate=qualities.filter(v=>previous.bandwidth!==undefined&&v.bandwidth===previous.bandwidth);
  return sameRate.length===1?sameRate[0]:qualities.length===1?qualities[0]:undefined;
}

export function groupMedia(input:Media[]):Media[]{
  const groups:Media[][]=[];
  function related(a:Media,b:Media){
    if(a.tabId!==b.tabId||a.pageUrl!==b.pageUrl||a.kind!==b.kind)return false;
    if(a.providerId&&a.providerId===b.providerId)return true;
    if(a.kind==='hls'&&(a.frameId??0)===(b.frameId??0)){const plans=new Set(a.variants.map(planKey).filter(Boolean));if(b.variants.some(v=>!!planKey(v)&&plans.has(planKey(v)))||a.variants.some(pair=>b.variants.some(leaf=>componentOf(pair,leaf)||componentOf(leaf,pair))))return true;}
    const urls=urlsOf(a);if([...urlsOf(b)].some(url=>urls.has(url))){
      if(a.kind!=='direct'||(a.frameId??0)===(b.frameId??0))return true;
      const actual=new Set([a.url,...a.variants.map(v=>v.url)]);if([b.url,...b.variants.map(v=>v.url)].some(url=>actual.has(url)))return true;
    }
    if(a.kind!=='direct'||(a.frameId??0)!==(b.frameId??0)||titleKey(a.title)!==titleKey(b.title)||!titleKey(a.title))return false;
    if(a.duration&&b.duration&&Math.abs(a.duration-b.duration)>1)return false;
    const families=new Set(a.variants.flatMap(v=>{const identity=qualityIdentity(v.url);return identity?[identity.key]:[];}));
    return b.variants.some(v=>{const identity=qualityIdentity(v.url);return identity&&families.has(identity.key);});
  }
  for(const media of input){
    const matches=groups.filter(group=>group.some(member=>related(member,media)));
    if(!matches.length){groups.push([media]);continue;}
    const first=matches[0]!;first.push(media);
    for(const other of matches.slice(1)){first.push(...other);groups.splice(groups.indexOf(other),1);}
  }
  return groups.map(members=>{
    const first=members[0]!;
    const roots=members.filter(m=>!members.some(parent=>parent!==m&&parent.url!==m.url&&parent.variants.some(v=>v.url===m.url)));
    const primary=[...(roots.length?roots:members)].sort((a,b)=>Number(!!b.qualitiesResolved)-Number(!!a.qualitiesResolved)||(a.kind==='hls'?Number(b.variants.some(v=>!!v.audioUrl))-Number(a.variants.some(v=>!!v.audioUrl)):0)||b.variants.length-a.variants.length||(a.kind==='hls'?Math.max(0,...b.variants.map(v=>v.height??0))-Math.max(0,...a.variants.map(v=>v.height??0)):0)||Number(b.detectedBy==='dom')-Number(a.detectedBy==='dom'))[0]!;
    const variants:Variant[]=[];const seen=new Set<string>(),seenPlans=new Set<string>(),usedIds=new Set<string>();
    const previousVariants=new Map<string,Variant>();for(const member of members)for(const v of member.variants){const key=variantKey(primary.kind,v),old=previousVariants.get(key);if(!old)previousVariants.set(key,v);else if(primary.kind==='hls'&&v.check&&(v.check.checkedAt>(old.check?.checkedAt??0)))previousVariants.set(key,{...old,check:v.check});}
    for(const member of [primary,...members.filter(m=>m!==primary)])for(const candidate of member.variants){
      const latest=previousVariants.get(variantKey(primary.kind,candidate));const original=primary.kind==='hls'&&latest?.check&&latest.check.checkedAt>(candidate.check?.checkedAt??0)?{...candidate,check:latest.check}:candidate;
      if(primary.providerId&&member!==primary)continue;
      if(member!==primary&&member.url===primary.url&&primary.qualitiesResolved&&!member.qualitiesResolved)continue;
      // A master variant carries the audio association. Its separately observed
      // media playlist must not create a second, video-only option.
      if(primary.kind==='hls'&&primary.qualitiesResolved&&member!==primary&&!original.audioUrl&&(primary.variants.some(v=>{if(v.url!==original.url)return false;const expected=tracksOf(v),actual=tracksOf(original);return!(actual?.length===1&&expected&&actual[0]!==expected[0]||!v.audioUrl&&planKey(v)&&planKey(original)&&planKey(v)!==planKey(original));})||members.some(parent=>(parent.frameId??0)===(member.frameId??0)&&parent.variants.some(v=>componentOf(v,original)))))continue;
      const key=variantKey(primary.kind,original),plan=primary.kind==='hls'?planKey(original):undefined;if(seen.has(key)||plan&&seenPlans.has(plan))continue;seen.add(key);if(plan)seenPlans.add(plan);
      const previous=previousVariants.get(key);
      let id=previous?.id??original.id;
      // Legacy direct/HLS sources used local ids such as "0". Disambiguate
      // those once; DASH ids are representation selectors and remain intact.
      if(primary.kind!=='dash'){const base=id;let n=1;while(usedIds.has(id))id=`${base}#${n++}`;}
      usedIds.add(id);const identity=primary.kind==='direct'?qualityIdentity(original.url):undefined;
      const native=plan?members.filter(m=>(m.frameId??0)===(primary.frameId??0)).flatMap(m=>m.variants.filter(v=>m.url===v.url&&planKey(v)===plan)).sort((a,b)=>(b.check?.checkedAt??0)-(a.check?.checkedAt??0))[0]:undefined;
      const tracks=primary.kind==='hls'&&original.audioUrl?tracksOf(original):undefined;
      const nativeTrack=(index:number)=>tracks?.length===2&&tracks[0]!==tracks[1]?members.filter(m=>(m.frameId??0)===(member.frameId??0)).flatMap(m=>m.variants.filter(v=>m.url===v.url&&!v.audioUrl&&tracksOf(v)?.length===1&&tracksOf(v)![0]===tracks[index])).sort((a,b)=>(b.check?.checkedAt??0)-(a.check?.checkedAt??0))[0]:undefined;
      const video=nativeTrack(0)??native,audio=nativeTrack(1);
      variants.push({...original,...(video?{url:video.url,sourceUrls:[...new Set([original.url,video.url,...(original.sourceUrls??[]),...(video.sourceUrls??[])])].slice(0,64)}:{}),...(native?{audioUrl:native.audioUrl??original.audioUrl,check:native.check}:{}),...(audio?{audioUrl:audio.url,audioSourceUrls:[...new Set([original.audioUrl!,audio.url,...(original.audioSourceUrls??[]),...(audio.sourceUrls??[])])].slice(0,64)}:{}),id,height:original.height??identity?.height,label:original.label||(identity?`${identity.height}p`:''),size:primary.kind==='direct'?(original.size??(member.variants.length===1?member.size:undefined)):undefined});
    }
    const nativeTikTok=primary.providerId?.startsWith('tiktok:');
    variants.sort((a,b)=>(b.height??0)-(a.height??0)||(nativeTikTok?Number(/(?:^| · )H\.264$/.test(b.label))-Number(/(?:^| · )H\.264$/.test(a.label)):0)||(b.bandwidth??0)-(a.bandwidth??0));
    return {...primary,id:first.id,aliases:[...new Set(members.flatMap(m=>[m.id,...(m.aliases??[])]))],sourceUrls:[...new Set(members.flatMap(m=>[m.url,...(m.sourceUrls??[])]))],variants,poster:primary.poster??members.find(m=>m.poster)?.poster,size:variants.length===1?variants[0]?.size:undefined};
  });
}
