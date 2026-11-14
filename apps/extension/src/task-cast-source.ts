import type{Media,Task}from'../../../packages/contracts';
import{matchingVariant,mediaMatches}from'../../../packages/media-core/grouping';
import{directExtension}from'../../../packages/media-core/classification';
import{audioExtensions}from'../../../packages/media-core/formats';

export interface TaskCastSource{sourceTabId:number;mediaId:string;variantId:string}
export interface SourceTab{id?:number;url?:string;incognito?:boolean}

// This selects the current source of an unchanged download, never the bytes
// of a local result. Edited files and recordings must keep their file workflow.
export function taskCastSource(task:Task,tab:SourceTab,available:Media[]):TaskCastSource|undefined{
 if(!(task.saved||task.output)||task.conversion||task.recording||task.live||task.media.captureOnly||task.media.live||task.variant.check?.live)return;
 if(!Number.isInteger(task.media.tabId)||task.media.tabId<0||tab.id!==task.media.tabId||tab.incognito||tab.url!==task.media.pageUrl||!/^https?:\/\//.test(task.media.pageUrl))return;
 if(!['direct','hls','dash'].includes(task.media.kind)||task.validation&&!task.validation.tracks.some(track=>track.type==='video'))return;
 const matches=available.filter(item=>item.tabId===tab.id&&item.pageUrl===tab.url&&(item.frameId??0)===(task.media.frameId??0)&&item.kind===task.media.kind&&(task.media.providerId?item.providerId===task.media.providerId:mediaMatches(item,task.media.id)));
 if(matches.length!==1)return;const item=matches[0]!;
 if(item.captureOnly||item.live||item.pending)return;
 const variant=matchingVariant(item.kind,task.variant,item.variants);
 if(!variant||variant.check?.state!=='ready'||variant.check.live||task.variant.audioUrl||variant.audioUrl)return;
 if(item.variants.filter(value=>value.id===variant.id).length!==1||item.kind!=='dash'&&item.variants.filter(value=>value.url===variant.url).length!==1)return;
 for(const dimension of['width','height']as const){const previous=task.variant[dimension]??task.variant.check?.[dimension],current=variant[dimension]??variant.check[dimension];if(previous!==undefined&&(!Number.isFinite(previous)||previous<=0||current!==previous))return;}
 if(task.variant.bandwidth!==undefined&&variant.bandwidth!==undefined&&task.variant.bandwidth!==variant.bandwidth)return;
 const mime=variant.check.contentType??variant.contentType??item.contentType;
 if(/^audio\//.test(mime??'')||audioExtensions.some(ext=>ext===directExtension(variant.url,mime)))return;
 if(!/^https?:\/\//.test(variant.url)||!/^https?:\/\//.test(item.url))return;
 return{sourceTabId:task.media.tabId,mediaId:item.id,variantId:variant.id};
}
