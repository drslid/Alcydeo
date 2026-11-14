import{blocked,type Task,type Settings}from'../../../packages/contracts';
import{getTask,changeTask}from'../../../packages/storage';
import{prefixKind}from'../../../packages/media-core/preflight';
import{sampleTikTokSources}from'./tiktok-sample';
import{tiktokStreamPage}from'./tiktok-stream-page';
export async function tiktokTransfer(task:Task,action:string,prefs:Settings){
 if(!task.media.providerId?.startsWith('tiktok:')||task.media.kind!=='direct'||task.transfer?.mode!=='page'||!['open','read','close'].includes(action))throw new Error('invalid');
 const deadline=Date.now()+33000,owner=task.owner,key=`${task.id}:${owner}`,videoId=task.media.providerId.slice(7),primary=task.variant.url;
 const active=(value:Task|undefined)=>!!value&&!!owner&&value.owner===owner&&['fetching','queued'].includes(value.state)&&(value.leaseUntil??0)>=Date.now()&&value.media.providerId===task.media.providerId&&value.media.pageUrl===task.media.pageUrl&&value.media.tabId===task.media.tabId&&value.media.frameId===task.media.frameId&&value.variant.id===task.variant.id&&value.variant.url===primary;
 const guard=async(url:string)=>{
  if(action!=='close'&&(Date.now()>=deadline||!active(await getTask(task.id))))throw new Error('interrupted');
  const tab=await chrome.tabs.get(task.media.tabId).catch(()=>undefined);if(!tab||tab.incognito||tab.url!==task.media.pageUrl)throw new Error('interrupted');
  const stored=(await chrome.storage.local.get('settings')).settings as Partial<Settings>|undefined;
  for(const value of [task.media.pageUrl,url]){const u=new URL(value);if(blocked(u.hostname,stored?.blocked??prefs.blocked))throw new Error('blocked');if(!await chrome.permissions.contains({origins:[`${u.origin}/*`]}))throw new Error('permission');}
 };
 const call=async(operation:string,url:string,expires?:number,credentials=task.variant.check?.pageCredentials??'include')=>{
  const result=await chrome.scripting.executeScript({target:{tabId:task.media.tabId,frameIds:[task.media.frameId??0]},world:'MAIN',func:tiktokStreamPage,injectImmediately:true,args:operation==='open'&&credentials==='omit'?[operation,key,url,videoId,expires,credentials]:expires===undefined?[operation,key,url,videoId]:[operation,key,url,videoId,expires]});
  const data=result[0]?.result;if(!data)throw new Error('interrupted');if(data.error)throw new Error(data.error);return data;
 };
 await guard(primary);
 if(action==='close')return call(action,primary);
 if(action==='read'){try{const data=await call(action,primary);await guard(primary);return data;}catch(error){await call('close',primary).catch(()=>{});throw error;}}
 let opened:string|undefined;
 try{
  let firstError:unknown;
  try{const data=await call('open',primary,deadline);opened=primary;await guard(primary);return data;}catch(error){firstError=error;}
  if(!(firstError instanceof Error)||!['expired','missing','network','html','notMedia','range'].includes(firstError.message))throw firstError;
  const urls=[...new Set([primary,...(task.variant.sourceUrls??[])])].slice(0,3).filter(url=>url!==primary);if(!urls.length)throw firstError;
  const size=task.variant.check?.size??task.variant.size;if(!Number.isSafeInteger(size)||!size||size<1||task.variant.size!==undefined&&task.variant.size!==size)throw new Error('sourceChanged');
  const sample=await sampleTikTokSources(task.media.tabId,task.media.frameId??0,urls,videoId,AbortSignal.timeout(Math.max(1,deadline-Date.now())),guard,deadline);
  if(sample.error)throw new Error(sample.error);if(!sample.url||!urls.includes(sample.url))throw new Error('invalid');
  if(sample.size!==size)throw new Error('sourceChanged');
  if(!sample.prefix||sample.prefix.length>5464||prefixKind(Uint8Array.from(atob(sample.prefix),c=>c.charCodeAt(0)))!=='media')throw new Error('notMedia');
  await guard(sample.url);const data=await call('open',sample.url,deadline,sample.pageCredentials??'include');opened=sample.url;await guard(sample.url);if(data.size!==size)throw new Error('sourceChanged');
  await changeTask(task.id,current=>{if(!active(current))throw new Error('interrupted');current.variant.url=sample.url!;current.variant.check={state:'ready',checkedAt:Date.now(),size:sample.size,contentType:sample.contentType,...(sample.pageCredentials?{pageCredentials:sample.pageCredentials}:{})};});
  return data;
 }catch(error){if(opened)await call('close',opened).catch(()=>{});throw error;}
}
