import{castSenderPage,castWebReady,castWebUrl}from'./cast-web';
import{api}from'./api';
import{language}from'./i18n';
import{taskCastSource,type TaskCastSource}from'./task-cast-source';
import{mediaMatches}from'../../../packages/media-core/grouping';
import type{Media,Task}from'../../../packages/contracts';
type CastSource={sourceTabId?:number;mediaId?:string;variantId?:string;taskId?:string};
type Snapshot={media:Media[];tasks:Task[]};
async function webHandoff(source:CastSource){
 let target:TaskCastSource|undefined,snapshot:Snapshot|undefined;
 if(source.taskId){
  const task=(await api<Snapshot>('snapshot')).tasks.find(value=>value.id===source.taskId);if(!task)return;
  const tab=await chrome.tabs.get(task.media.tabId);snapshot=await api<Snapshot>('snapshot',{tabId:task.media.tabId});target=taskCastSource(task,tab,snapshot.media);
 }else if(source.sourceTabId!==undefined&&source.mediaId&&source.variantId)target={sourceTabId:source.sourceTabId,mediaId:source.mediaId,variantId:source.variantId};
 if(!target||!await castWebReady())return;
 snapshot??=await api<Snapshot>('snapshot',{tabId:target.sourceTabId});
 const item=snapshot.media.find(value=>value.id===target.mediaId),variant=item?.variants.find(value=>value.id===target.variantId),tab=await chrome.tabs.get(target.sourceTabId);
 if(!item||!variant||tab.incognito||tab.id!==item.tabId||tab.url!==item.pageUrl||!['direct','hls','dash'].includes(item.kind)||variant.audioUrl||item.captureOnly)return;
 const result=await api('checkSource',{tabId:target.sourceTabId,id:item.id,variantId:variant.id});if(result.state!=='ready')return;
 const latest=await api<Snapshot>('snapshot',{tabId:target.sourceTabId}),currentTab=await chrome.tabs.get(target.sourceTabId);
 let selection:TaskCastSource|undefined=target;
 if(source.taskId){const task=latest.tasks.find(value=>value.id===source.taskId);selection=task&&taskCastSource(task,currentTab,latest.media);}
 if(!selection)return;
 const matches=latest.media.filter(value=>mediaMatches(value,selection.mediaId)),current=matches.length===1?matches[0]:undefined,selected=current?.variants.find(value=>value.id===selection.variantId);
 if(!current||currentTab.incognito||currentTab.id!==target.sourceTabId||current.tabId!==target.sourceTabId||currentTab.url!==item.pageUrl||current.pageUrl!==item.pageUrl||(current.frameId??0)!==(item.frameId??0)||item.providerId&&current.providerId!==item.providerId||selected?.check?.state!=='ready'||selected.check.checkedAt<result.checkedAt)return;
 return castWebUrl(castSenderPage,current,selected,language.value,!!source.taskId);
}
let opening=false;
export async function quickCast(source:CastSource){
 if(opening)return;opening=true;try{
 let handoff:string|undefined;try{handoff=await webHandoff(source);}catch(error){if(!source.taskId)throw error;}
 if(handoff){await chrome.tabs.create({url:handoff,active:true});return;}
 const token=crypto.randomUUID(),params=new URLSearchParams({castToken:token});for(const[key,value]of Object.entries(source))if(value!==undefined)params.set(key,String(value));
 const tab=await chrome.tabs.create({url:chrome.runtime.getURL(`/manager.html?${params}#tv`),active:!!source.taskId});if(tab.id===undefined)throw new Error('tvNotSupported');
 // A file or transformed result needs an explicit action in its own player.
 // Do not silently send its unedited source or trigger a native file prompt.
 if(source.taskId)return;
 // Chrome propagates this extension gesture through API callbacks/messages.
 // The persistent owner must invoke Presentation/RemotePlayback itself.
 for(let attempt=0;attempt<300;attempt++){try{const current=await chrome.tabs.get(tab.id);if(current.status!=='complete')continue;const result=await chrome.runtime.sendMessage({type:'alcydeo.quickCast',token,ownerId:tab.id});if(result?.started)return;if(result?.setup){await chrome.tabs.update(tab.id,{active:true});return;}}catch(error){if(attempt===299){await chrome.tabs.update(tab.id,{active:true});throw error;}}}
 await chrome.tabs.update(tab.id,{active:true});
 }finally{opening=false;}
}
