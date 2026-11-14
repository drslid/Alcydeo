import type {Variant} from '../contracts';
import {parseHls,type TrackPlan} from './hls';
import {manifestText,permitted} from './network';

const maxDepth=6;
const merge=(outer:Variant|undefined,inner:Variant):Variant=>({...outer,...inner,height:inner.height??outer?.height,bandwidth:inner.bandwidth??outer?.bandwidth,audioUrl:inner.audioUrl??outer?.audioUrl});
async function read(url:string,signal?:AbortSignal,guard?:(url:string)=>Promise<void>){
  await guard?.(url);
  const text=await manifestText(url,signal);
  if(/^<(?:!doctype\s+html|html\b|head\b|body\b)/i.test(text.trimStart()))throw new Error('html');
  let parsed:ReturnType<typeof parseHls>;try{parsed=parseHls(text,url);}catch(error){if(!(error instanceof Error)||error.message!=='live')throw error;parsed=parseHls(text.replace(/^#EXT-X-(?:DISCONTINUITY|GAP)\s*$/gm,'')+'\n#EXT-X-ENDLIST',url);if(parsed.track)parsed.track.live=true;}
  if(parsed.variants.length>200)throw new Error('manifestLimit');
  return parsed;
}

// Discovery only unwraps a unique rendition. A branch is returned to the UI
// without fetching every quality or any of its media fragments.
export async function inspectHls(url:string,signal?:AbortSignal,guard?:(url:string)=>Promise<void>){
  const sourceUrls:string[]=[];let inherited:Variant|undefined;
  for(let depth=0;depth<maxDepth;depth++){
    if(sourceUrls.includes(url))throw new Error('manifestLoop');
    sourceUrls.push(url);const parsed=await read(url,signal,guard);
    if(parsed.track)return{track:parsed.track,variants:inherited?[{...inherited,url}]:[],sourceUrls};
    if(parsed.variants.length!==1)return{variants:parsed.variants.map(v=>merge(inherited,v)),sourceUrls};
    inherited=merge(inherited,parsed.variants[0]!);url=inherited.url;
    // Keep the child URL visible for the normal permission action when Chrome
    // access is restricted. Do not request it or hide it behind its parent.
    if(!await permitted(url))return{variants:[inherited],sourceUrls};
  }
  throw new Error('manifestLimit');
}

function rendition(selected:Variant,variants:Variant[]):Variant{
  if(variants.length===1)return variants[0]!;
  const height=selected.height??(Number(selected.label.match(/^(\d+)p$/i)?.[1])||undefined);
  const matching=variants.filter(v=>(height===undefined||v.height===height)&&(selected.bandwidth===undefined||v.bandwidth===selected.bandwidth));
  if(matching.length===1)return matching[0]!;
  // A wrapper's advertised rate can differ from its child. An explicit unique
  // resolution still identifies the chosen quality; never pick another height.
  if(height!==undefined){const sameHeight=variants.filter(v=>v.height===height);if(sameHeight.length===1)return sameHeight[0]!;}
  if(height===undefined&&selected.bandwidth===undefined)return variants[0]!;
  throw new Error('chooseQuality');
}

export async function resolveHlsTrack(selected:Variant,signal?:AbortSignal,guard?:(url:string)=>Promise<void>):Promise<{track:TrackPlan;variant:Variant}>{
  let variant={...selected};const visited=new Set<string>();
  for(let depth=0;depth<maxDepth;depth++){
    if(visited.has(variant.url))throw new Error('manifestLoop');
    visited.add(variant.url);const parsed=await read(variant.url,signal,guard);
    if(parsed.track)return{track:parsed.track,variant};
    variant=merge(variant,rendition(variant,parsed.variants));
  }
  throw new Error('manifestLimit');
}
