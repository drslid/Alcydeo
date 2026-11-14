import {managedTask,safeUrl,type Settings,type Task} from '../../../packages/contracts';
import {destination} from '../../../packages/media-core/destination';
import {allTasks,changeTask,getTask,setState} from '../../../packages/storage';
import {directExtension,htmlResponse,mimeType} from '../../../packages/media-core/classification';
import{reserveDownload,releaseDownload}from'./download-admission';
export function createNativeDownloads(settings:()=>Promise<Settings>,rejectSource:(task:Task)=>Promise<unknown>,wake:()=>Promise<unknown>=async()=>{}){
  const owner=crypto.randomUUID(),launching=new Set<string>();let draining:Promise<void>|undefined,drainAgain=false;
  const sourceTask=(task:Task)=>!managedTask(task)&&/^https?:\/\//.test(task.variant.url);
  const legacyStart=(task:Task)=>task.downloadId===undefined&&sourceTask(task)&&task.state==='fetching'&&!task.nativeStart&&!task.downloadSlot&&!task.outputSave;
  async function releaseSlot(task:Task){if(task.downloadSlot){await releaseDownload(task.id,task.downloadSlot.owner);void wake().catch(()=>{});}}
  async function applyControl(task:Task,item:chrome.downloads.DownloadItem){if(item.state!=='in_progress')return;if(task.state==='cancelled'||task.state==='failed')await chrome.downloads.cancel(item.id).catch(()=>{});else if(task.state==='paused'&&!item.paused)await chrome.downloads.pause(item.id).catch(()=>{});}
  async function owned(item:chrome.downloads.DownloadItem){
    const tasks=await allTasks(),known=tasks.find(t=>t.downloadId===item.id);if(known)return known;if(item.byExtensionId!==chrome.runtime.id)return;
    const outputs=tasks.filter(t=>t.downloadId===undefined&&t.outputSave?.url===item.url&&t.output&&t.validation);
    const pending=outputs.length?outputs:tasks.filter(t=>t.downloadId===undefined&&sourceTask(t)&&t.variant.url===item.url&&(t.nativeStart?Date.parse(item.startTime)>=t.nativeStart.startedAt-1000:legacyStart(t)&&Math.abs(Date.parse(item.startTime)-t.createdAt)<30000));
    if(pending.length!==1)return;
    const candidate=pending[0]!,linked=await changeTask(candidate.id,t=>{if(t.downloadId!==undefined)return;if(outputs.length?t.outputSave?.url===item.url:t.nativeStart?.startedAt===candidate.nativeStart?.startedAt){t.downloadId=item.id;delete t.nativeStart;}});
    if(linked.downloadId!==item.id)return;await applyControl(linked,item);return linked;
  }
  async function guard(item:chrome.downloads.DownloadItem){return navigator.locks.request(`alcydeo:native:${item.id}`,async()=>{
    const task=await owned(item);if(!task||managedTask(task))return false;
    const code=htmlResponse(item.mime,item.filename)?'html':/^text\/|application\/(?:json|xml)$/.test(mimeType(item.mime))?'notMedia':undefined;
    if(!code)return false;
    await changeTask(task.id,t=>{if(t.state==='cancelled')return;t.downloadId=item.id;t.state='failed';t.error=code;t.saved=false;delete t.validation;});
    await chrome.downloads.cancel(item.id).catch(()=>{});const[current]=await chrome.downloads.search({id:item.id});if(current?.state==='complete'&&current.exists)await chrome.downloads.removeFile(item.id).catch(()=>{});await rejectSource(task).catch(()=>{});return true;
  });}
  async function refresh(){return navigator.locks.request('alcydeo:native-refresh',async()=>{
    const pending=(await allTasks()).filter(t=>t.downloadId===undefined&&(t.outputSave||t.nativeStart||t.downloadSlot?.kind==='native'||legacyStart(t)));
    if(pending.length){
      const startedAfter=new Date(Math.max(0,Math.min(...pending.map(t=>t.outputSave?.startedAt??t.nativeStart?.startedAt??t.downloadSlot?.startedAt??t.createdAt))-1000)).toISOString();
      for(const item of await chrome.downloads.search({startedAfter}))await owned(item);
    }
    for(const task of await allTasks()){
      if(task.downloadId===undefined){
        if(task.state==='queued'&&task.downloadSlot?.kind==='native'&&!task.nativeStart&&!launching.has(task.id)){await releaseSlot(task);continue;}
        if(task.downloadSlot?.kind==='native'&&!launching.has(task.id)&&!['paused','cancelled','failed'].includes(task.state))await changeTask(task.id,t=>{if(t.downloadId===undefined&&t.downloadSlot?.kind==='native'){t.nativeStart??={startedAt:t.downloadSlot.startedAt};t.state='paused';t.error='saveInterrupted';}});
        continue;
      }
      if(!task.downloadSlot&&['completed','cancelled','failed'].includes(task.state))continue;
      let[item]=await chrome.downloads.search({id:task.downloadId});
      if(!item){await changeTask(task.id,t=>{if(!['cancelled','failed'].includes(t.state)){t.state='failed';t.saved=false;t.error='missing';}});await releaseSlot(task);continue;}
      const rejected=await guard(item);if(rejected)[item]=await chrome.downloads.search({id:task.downloadId});if(!item){await releaseSlot(task);continue;}
      if(launching.has(task.id)&&(item.state!=='in_progress'||item.paused))continue;
      const current=await changeTask(task.id,t=>{
        if(['failed','cancelled','completed'].includes(t.state))return;
        t.bytes=t.output&&t.validation?t.validation.bytes:item.bytesReceived;t.total=item.totalBytes>0?item.totalBytes:t.output?t.validation?.bytes:undefined;
        t.progress=t.output&&t.validation?(item.state==='complete'?1:0.95+(item.totalBytes>0?Math.min(1,item.bytesReceived/item.totalBytes):0)*0.05):item.totalBytes>0?Math.min(1,item.bytesReceived/item.totalBytes):0;t.filename=item.filename;
        if(item.state==='complete'){t.saved=item.exists;t.state=item.exists?'completed':'failed';t.error=item.exists?undefined:'missing';delete t.outputSave;delete t.nativeStart;}
        else if(item.state==='interrupted'){if(t.state!=='queued'){t.state=item.paused?'paused':'failed';t.error=item.error==='USER_CANCELED'?'cancelled':'interrupted';delete t.outputSave;delete t.nativeStart;}}
        else if(item.paused){if(t.state!=='queued')t.state='paused';}
        else t.state=t.output&&t.validation?'validating':'fetching';
      });
      if(!launching.has(task.id)&&(item.state!=='in_progress'||item.paused))await releaseSlot(current);
    }
  });}
  async function launch(id:string){
    try{await navigator.locks.request(`alcydeo:native-start:${id}`,async()=>{
      const task=await getTask(id);if(!task||task.state!=='queued'||task.downloadSlot?.owner!==owner||!sourceTask(task)){if(task?.downloadSlot?.owner===owner)await releaseSlot(task);return;}
      const ext=directExtension(task.variant.url,task.variant.contentType??task.media.contentType);if(!ext){await setState(id,'failed',{error:'unsupported'});await releaseSlot(task);return;}
      let options:ReturnType<typeof destination>|undefined,resultId:number|undefined;
      try{
        options=destination(task,await settings(),ext);
        const current=await changeTask(id,t=>{if(t.state==='queued'&&t.downloadSlot?.owner===owner){t.state='fetching';t.error=undefined;t.nativeStart={startedAt:t.downloadSlot.startedAt};}});
        if(current.state!=='fetching'||current.downloadSlot?.owner!==owner){await releaseSlot(current);return;}
        safeUrl(current.variant.url);
        const downloadId=resultId=current.downloadId===undefined?await chrome.downloads.download({url:current.variant.url,...options}):await chrome.downloads.resume(current.downloadId).then(()=>current.downloadId!);
        const linked=await changeTask(id,t=>{t.downloadId=downloadId;delete t.nativeStart;});const[item]=await chrome.downloads.search({id:downloadId});if(item)await applyControl(linked,item);
      }catch(error){
        const current=await getTask(id);if(current){if(resultId!==undefined&&current.downloadId===undefined)return;const code=error instanceof Error&&['excluded','unsupported'].includes(error.message)?error.message:options?.saveAs?'saveDialog':'network';await changeTask(id,t=>{if(!['cancelled','failed','paused'].includes(t.state)){t.state='failed';t.error=code;}delete t.nativeStart;});const[item]=current.downloadId===undefined?[]:await chrome.downloads.search({id:current.downloadId});if(!item||item.state!=='in_progress'||item.paused)await releaseSlot(current);}
      }
    });}finally{launching.delete(id);void drain().catch(()=>{});}
  }
  function drain():Promise<void>{
    drainAgain=true;if(draining)return draining;
    draining=(async()=>{do{
      drainAgain=false;await refresh();await navigator.locks.request('alcydeo:native-drain',async()=>{
        const queued=(await allTasks()).filter(t=>t.state==='queued'&&sourceTask(t)).sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id));
        for(const task of queued){if(launching.has(task.id)||task.downloadSlot?.kind==='native'||task.nativeStart)continue;if(!await reserveDownload(task.id,owner,'native'))break;launching.add(task.id);void launch(task.id).catch(()=>{});}
      });
    }while(drainAgain);})().finally(()=>{draining=undefined;});return draining;
  }
  async function resume(task:Task){
    await refresh();const current=await getTask(task.id);if(!current)throw new Error('missing');if(!['paused','failed'].includes(current.state))return;
    if(current.downloadId!==undefined&&current.output&&current.validation){await chrome.downloads.resume(current.downloadId);await changeTask(current.id,t=>{if(!['cancelled','completed'].includes(t.state)){t.state='validating';t.error=undefined;}});await refresh();return;}
    if(!sourceTask(current))throw new Error('invalid');
    if(current.downloadId===undefined&&(current.nativeStart||current.downloadSlot?.kind==='native'))throw new Error('saveInterrupted');
    await setState(current.id,'queued',{error:undefined});await drain();
  }
  async function browserRestart(){
    await refresh();for(const task of await allTasks())if(task.downloadId===undefined&&task.downloadSlot?.kind==='native'&&task.nativeStart&&!launching.has(task.id)){
      const possible=(await chrome.downloads.search({startedAfter:new Date(Math.max(0,task.nativeStart!.startedAt-1000)).toISOString()})).some(item=>item.byExtensionId===chrome.runtime.id&&item.url===task.variant.url);if(possible)continue;
      const current=await changeTask(task.id,t=>{if(t.downloadId===undefined){delete t.nativeStart;if(!['completed','cancelled','failed'].includes(t.state)){t.state='paused';t.error='interrupted';}}});if(current.downloadId===undefined)await releaseSlot(current);
    }await drain();
  }
  chrome.downloads.onCreated.addListener(item=>{if(item.byExtensionId===chrome.runtime.id)void guard(item).then(()=>drain()).catch(()=>{});});
  chrome.downloads.onChanged.addListener(()=>{void drain().catch(()=>{});});
  const start=(task:Task)=>task.state==='queued'?drain():Promise.resolve();
  return{start,drain,refresh,resume,browserRestart};
}
