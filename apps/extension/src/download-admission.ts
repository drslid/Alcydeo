import{downloadConcurrency,managedTask,type Task,type Settings}from'../../../packages/contracts';
import{allTasks,changeTask,runningMediaTasks}from'../../../packages/storage';

const admissionLock='alcydeo:download-admission';
type DownloadKind='native'|'managed';
const sourceTask=(task:Task)=>!task.conversion&&!task.recording&&/^https?:\/\//.test(task.variant.url);
const eligible=(task:Task,kind:DownloadKind)=>sourceTask(task)&&task.state==='queued'&&(kind==='managed'?managedTask(task)&&task.downloadId===undefined:!managedTask(task));
const pageScope=(task:Task)=>task.transfer?.mode==='page'?`${task.media.tabId}:${task.media.frameId??0}`:undefined;
const ownsSlot=(task:Task,owner:string,kind:DownloadKind)=>task.downloadSlot?.owner===owner&&task.downloadSlot.kind===kind;
const liveSlot=(task:Task,now:number)=>!!task.downloadSlot&&(task.downloadSlot.kind==='native'||task.downloadSlot.expiresAt>=now||!!task.outputSave);
const heldByOther=(task:Task,owner:string,now:number)=>!!task.owner&&task.owner!==owner&&(task.leaseUntil??0)>=now;

export async function reserveDownload(id:string,owner:string,kind:DownloadKind):Promise<boolean>{
 if(!owner||!['native','managed'].includes(kind))return false;
 return navigator.locks.request(admissionLock,async()=>{
  const[tasks,running,items,stored]=await Promise.all([allTasks(),runningMediaTasks(),chrome.downloads.search({state:'in_progress'}),chrome.storage.local.get('settings')]);
  const now=Date.now(),task=tasks.find(task=>task.id===id);if(!task||!eligible(task,kind)||running.has(id)||heldByOther(task,owner,now))return false;
  const active=new Set<string>(),nativeActive=new Set<string>();
  for(const current of tasks){
   if(!sourceTask(current))continue;
   const item=items.find(item=>item.id===current.downloadId&&item.state==='in_progress'&&!item.paused);
   if(item&&(!item.url.startsWith('blob:')||current.downloadSlot)){active.add(current.id);nativeActive.add(current.id);}
   if(running.has(current.id)||liveSlot(current,now))active.add(current.id);
  }
  if(nativeActive.has(id)||liveSlot(task,now)&&!ownsSlot(task,owner,kind))return false;
  const existing=active.has(id)&&ownsSlot(task,owner,kind),prefs=stored.settings as Partial<Settings>|undefined,limit=downloadConcurrency(prefs?.maxConcurrentFiles);
  if(!existing&&active.size>=limit)return false;
  const scope=pageScope(task);if(!existing&&scope&&tasks.filter(current=>active.has(current.id)&&pageScope(current)===scope).length>=2)return false;
  let reserved=false;
  await changeTask(id,current=>{
   if(!eligible(current,kind)||heldByOther(current,owner,now)||liveSlot(current,now)&&!ownsSlot(current,owner,kind))return;
   const prior=current.downloadSlot;
   current.downloadSlot=ownsSlot(current,owner,kind)?{...prior!,...(kind==='managed'?{expiresAt:now+30000}:{})}:{owner,kind,expiresAt:now+30000,startedAt:now};
   if(kind==='managed'){current.owner=owner;current.leaseUntil=now+30000;}
   reserved=true;
  });
  return reserved;
 });
}

export async function releaseDownload(id:string,owner:string):Promise<void>{
 await navigator.locks.request(admissionLock,async()=>{
  await changeTask(id,task=>{if(task.downloadSlot?.owner!==owner)return;delete task.downloadSlot;if(task.owner===owner){delete task.owner;delete task.leaseUntil;}}).catch(error=>{if(!(error instanceof Error)||error.message!=='missing')throw error;});
 });
}
