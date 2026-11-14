import {safeUrl, type Media, type SourceCheck, type Variant} from '../contracts';
import {directExtension,htmlResponse,mimeType,responseFilename} from './classification';
import {permitted} from './network';
import {buildPlan} from './plan';
import type{Plan}from'./hls';
import{hlsIdentity,hlsTrackIdentities,prefixIdentity}from'./hls-identity';
import{directDimensions,prefixDimensions,sampleResponseSize}from'./source-metadata';

const prefixLimit=4096;
// A cheap availability check, not whole-file validation. In particular an
// extension fetch may be refused while a native browser download still works.
export function prefixKind(bytes:Uint8Array):'media'|'html'|'notMedia'|'unknown'{
  const text=new TextDecoder().decode(bytes).replace(/^\uFEFF/,'').trimStart();
  if(/^(?:<!doctype\s+html\b|<(?:html|head|body|script)\b)/i.test(text)||/^<\?xml[^>]*>\s*<html\b/i.test(text))return 'html';
  if(/^(?:<\?xml\b|<(?:error|Error|AccessDenied)\b|\{\s*"|\[\s*\{)/.test(text))return 'notMedia';
  const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.subarray(start,end));
  if(['ftyp','styp','moov','moof','sidx','mdat','wide','free'].includes(ascii(4,8))||
    [0x1a,0x45,0xdf,0xa3].every((value,i)=>bytes[i]===value)||
    ['OggS','fLaC'].includes(ascii(0,4))||ascii(0,4)==='RIFF'&&['WAVE','AVI '].includes(ascii(8,12))||ascii(0,3)==='FLV'||ascii(0,3)==='ID3'||
    bytes[0]===0x47&&(bytes.length<189||bytes[188]===0x47)||bytes[4]===0x47&&bytes[196]===0x47||
    bytes[0]===0xff&&((bytes[1]??0)&0xe0)===0xe0||ascii(0,3)==='\0\0\u0001'||
    [0x30,0x26,0xb2,0x75,0x8e,0x66,0xcf,0x11].every((value,i)=>bytes[i]===value))return 'media';
  return 'unknown';
}
export async function checkSource(media:Media,variant:Variant,allow:(url:string)=>Promise<void>=async()=>{},signal?:AbortSignal,minimumSize=0,onPlan?:(plan:Plan)=>void):Promise<SourceCheck>{
  const checkedAt=Date.now(),bounded=signal?AbortSignal.any([signal,AbortSignal.timeout(8000)]):AbortSignal.timeout(8000);
  if(media.captureOnly)return{state:'unknown',checkedAt,live:media.live};
  let directSize:number|undefined;
  const guard=async(url:string)=>{safeUrl(url);await allow(url);if(!await permitted(url))throw new Error('permission');};
  async function sample(url:string,range?:{start:number;length:number}){
    await guard(url);const start=range?.start??0,end=start+Math.min(range?.length??prefixLimit,prefixLimit)-1;
    const response=await fetch(url,{credentials:'include',redirect:'error',cache:'no-store',headers:{Range:`bytes=${start}-${end}`},signal:bounded});
    const reader=response.body?.getReader();
    try{
      if(!response.ok){if([401,403].includes(response.status))throw new Error('expired');if([404,410].includes(response.status))throw new Error('missing');throw new Error('network');}
      const mime=mimeType(response.headers.get('content-type')??'');
      if(htmlResponse(mime,responseFilename(response.headers.get('content-disposition')??'')))throw new Error('html');
      if(/^text\/|application\/(?:json|xml|xhtml\+xml)$/.test(mime))throw new Error('notMedia');
      const{size,length:responseLength}=sampleResponseSize(response.status,response.headers,start,end);
      if(media.kind==='direct')directSize=size;
      if(media.kind==='direct'&&size!==undefined&&size<minimumSize)throw new Error('tooSmall');
      if(!reader)throw new Error('network');const prefix=new Uint8Array(prefixLimit);let length=0;
      while(length<prefixLimit){const{value,done}=await reader.read();if(done){if(responseLength!==undefined&&length<responseLength){directSize=undefined;throw new Error('range');}break;}if(responseLength!==undefined&&length+value.length>responseLength){directSize=undefined;throw new Error('range');}const take=Math.min(value.length,prefixLimit-length);prefix.set(value.subarray(0,take),length);length+=take;}
      if(!length)throw new Error('notMedia');const kind=prefixKind(prefix.subarray(0,length));
      if(['html','notMedia'].includes(kind))throw new Error(kind);
      return{recognized:kind==='media',size,contentType:/^(?:video|audio)\//.test(mime)?mime:undefined,prefix:prefix.subarray(0,length),etag:response.headers.get('etag')??undefined};
    }finally{await reader?.cancel().catch(()=>{});}
  }
  try{
    if(media.pending||media.kind==='sabr')return{state:'unknown',checkedAt,error:media.pending?'sourcePending':undefined};
    if(media.kind==='direct'){const result=await sample(variant.url);let dimensions=result.recognized?await prefixDimensions(result.prefix):undefined;if(!dimensions&&result.recognized&&result.size!==undefined)dimensions=await directDimensions(variant.url,result.size,result.prefix,guard,bounded,result.etag);return{state:result.recognized&&directExtension(variant.url,result.contentType??variant.contentType)?'ready':'unknown',checkedAt,size:result.size,contentType:result.contentType,...dimensions};}
    if(media.kind==='adaptive'){const video=await sample(variant.url);const audio=variant.audioUrl?await sample(variant.audioUrl):undefined;const size=audio&&variant.url!==variant.audioUrl?completeSize([video.size,audio.size]):undefined;return{state:video.recognized&&audio?.recognized?'ready':'unknown',checkedAt,size,...(video.recognized?await prefixDimensions(video.prefix):{})};}
    const plan=await buildPlan({media,variant},bounded,guard,true);onPlan?.(plan);let recognized=true;const samples:string[][]=[],totals:(number|undefined)[]=[];let dimensions:{width:number;height:number}|undefined;
    if(!plan.tracks.length)throw new Error('unsupported');
    // First initialization/media fragments for each track, never the whole VOD.
    for(const track of plan.tracks.slice(0,2)){if(!track.segments.length)throw new Error('missing');const trackSamples:string[]=[];samples.push(trackSamples);for(const segment of plan.live?track.segments.slice(-1):track.segments.slice(0,2)){const result=await sample(segment.url,segment.range);recognized=result.recognized&&recognized;if(!dimensions&&track.type!=='audio'&&result.recognized)dimensions=await prefixDimensions(result.prefix);if(track.segments.length===1&&!segment.range)totals.push(result.size);if(media.kind==='hls')trackSamples.push(JSON.stringify([result.prefix.length,result.size,await prefixIdentity(result.prefix)]));}}
    const identities=recognized&&media.kind==='hls'?{planIdentity:await hlsIdentity(plan,samples.flat()),hlsTracks:await hlsTrackIdentities(plan,samples)}:{};
    const monofiles=!plan.live&&plan.tracks.length===totals.length&&new Set(plan.tracks.map(t=>t.segments[0]!.url)).size===plan.tracks.length;
    const size=recognized&&monofiles?completeSize(totals):undefined;
    const estimatedSize=recognized&&size===undefined&&media.kind==='hls'?hlsSize(plan,variant.bandwidth):undefined;
    return{state:recognized?'ready':'unknown',checkedAt,size,estimatedSize,...dimensions,...(plan.live?{live:true}:{}),...identities};
  }catch(error){
    const code=error instanceof Error?error.message:'network';
    const definitive=['html','notMedia','tooSmall','missing','expired','encrypted','invalid','live','periods','timeline','codec','discontinuity','chooseQuality','manifestLimit','manifestLoop','unsupported'];
    return{state:definitive.includes(code)?'unavailable':'unknown',checkedAt,error:/^[a-zA-Z]+$/.test(code)?code:'network',size:directSize};
  }
}
function completeSize(values:(number|undefined)[]){if(!values.length||values.some(v=>v===undefined||!Number.isSafeInteger(v)||v<=0))return;const total=values.reduce<number>((sum,value)=>sum+value!,0);return Number.isSafeInteger(total)?total:undefined;}
function hlsSize(plan:Plan,bandwidth?:number){
 if(plan.live||plan.tracks.some(t=>t.live||t.durationComplete!==true)||!Number.isFinite(bandwidth)||!bandwidth||bandwidth<=0||!Number.isFinite(plan.duration)||!plan.duration||plan.duration<=0||plan.tracks.some(t=>!Number.isFinite(t.duration)||!t.duration||t.duration<=0||Math.abs(t.duration-plan.duration!)>Math.max(2,plan.duration!*0.02)))return;
 const size=Math.round(bandwidth*plan.duration/8);return Number.isSafeInteger(size)&&size>0?size:undefined;
}
