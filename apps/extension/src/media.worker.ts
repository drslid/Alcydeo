/// <reference lib="webworker" />
import type { MediaNotice,Task } from '../../../packages/contracts';
import type { Plan, Segment } from '../../../packages/media-core/hls';
import { allowWorkerOrigins, mediaFetch } from '../../../packages/media-core/network';
import { remux, validate } from '../../../packages/media-core/engine';
import {downloadFragment} from '../../../packages/media-core/fragment';
import { changeTask, getTask, renew, release, setState,mediaTaskLock } from '../../../packages/storage';
import {LOCAL_BUILD} from '../../../packages/contracts/distribution';
const pagePending=new Map<string,{resolve:(value:any)=>void;reject:(error:Error)=>void}>();
function pageCall(task:Task,owner:string,action:string):Promise<any>{const requestId=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pagePending.delete(requestId);reject(new Error('interrupted'));},35000);pagePending.set(requestId,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});postMessage({type:'pageMedia',id:task.id,owner,action,requestId});});}
let controller: AbortController | undefined;let liveFinish:AbortController|undefined;
const digest = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(n => n.toString(16).padStart(2,'0')).join('');
async function run(task: Task, plan: Plan, owner: string, origins: string[]) {
  allowWorkerOrigins(origins); controller = new AbortController(); const signal = controller.signal;
  const root = await navigator.storage.getDirectory(); const dir = await root.getDirectoryHandle(task.id, { create: true });
  let lastRenew=Date.now();const heartbeat=setInterval(()=>{void getTask(task.id).then(current=>{if(!current||['paused','cancelled'].includes(current.state)){controller?.abort();return;}if(current.live&&!current.live.active)liveFinish?.abort();if(Date.now()-lastRenew>=8000){lastRenew=Date.now();return renew(task.id,owner);}}).catch(()=>controller?.abort());},1000);
  let bytes = 0; let completed = 0; const total = plan.tracks.reduce((n,t) => n + t.segments.length, 0);
  const partials=new Map<string,{bytes:number;fraction:number}>();let lastProgress=0;
  let outcome = 'stopped';
  const notices=new Set<MediaNotice>(task.notices??[]);const notice=(code:MediaNotice)=>{notices.add(code);};
  async function fragment(segment: Segment,connections?:2|4|8,parallelTracks=false) {
    if (signal.aborted) throw new Error('cancelled');
    const key = await digest(JSON.stringify(segment)); const cached = task.checkpoints[key];
    if (cached?.etag && !cached.etag.startsWith('W/')) {
      const check = await mediaFetch(segment.url, { method: 'HEAD', signal });
      if (check.headers.get('etag') !== cached.etag) throw new Error('sourceChanged');
      const file = await dir.getFileHandle(cached.file).then(h => h.getFile()).catch(() => undefined);
      if (file?.size === cached.bytes) { bytes += cached.bytes; completed++; return cached.file; }
    }
    const estimate = await navigator.storage.estimate(); if (estimate.quota && estimate.usage && estimate.quota - estimate.usage < 16 * 1024 * 1024) throw new Error('space');
    const name = `${key}.part`; const file = await dir.getFileHandle(name, { create: true });
    let result:Awaited<ReturnType<typeof downloadFragment>>;
    const progress=async(received:number,length?:number)=>{
      partials.set(key,{bytes:received,fraction:length?Math.min(.99,received/length):0});if(Date.now()-lastProgress<500)return;lastProgress=Date.now();
      await changeTask(task.id,t=>{t.bytes=bytes+[...partials.values()].reduce((n,p)=>n+p.bytes,0);t.progress=(completed+[...partials.values()].reduce((n,p)=>n+p.fraction,0))/total*.8;});postMessage({type:'progress',id:task.id});
    };
    try{
      let split:Awaited<ReturnType<typeof downloadFragment>>|undefined;
      if(connections){const{downloadFragmentParts}=await import('../../../packages/media-core/fragment-parts');split=await downloadFragmentParts(segment,file,signal,connections,progress);if(!split&&!parallelTracks)notice('multipartUnavailable');}
      result=split??await downloadFragment(segment,file,signal,progress);
    }finally{partials.delete(key);}
    const size=result.bytes;
    bytes += size; completed++;
    const checkpoint = { file: name, bytes: size, etag: result.etag };
    await changeTask(task.id, t => { t.checkpoints[key] = checkpoint; t.bytes=bytes+[...partials.values()].reduce((n,p)=>n+p.bytes,0);t.progress=(completed+[...partials.values()].reduce((n,p)=>n+p.fraction,0))/total*.8; });
    postMessage({ type: 'progress', id: task.id }); return name;
  }
  try {
    if(task.live){liveFinish=new AbortController();const{recordLive}=await import('./live-recording');await recordLive(task,dir,signal,liveFinish.signal,notice);await changeTask(task.id,t=>{t.notices=[...notices];});outcome='ready';return;}
    if(task.conversion){
      if(!task.conversion.ready)throw new Error('conversionInput');
      const input=await(await dir.getFileHandle(task.conversion.input)).getFile();if(input.size!==task.conversion.inputBytes)throw new Error('conversionInput');
      await setState(task.id,'converting',{error:undefined,progress:0,validation:undefined,output:undefined,saved:false,downloadId:undefined});
      const{editVideos}=await import('../../../packages/media-core/editing');let last=0;let update=Promise.resolve();
      const inputs=task.conversion.inputs?await Promise.all(task.conversion.inputs.map(async item=>{const file=await(await dir.getFileHandle(item.file)).getFile();if(file.size!==item.bytes)throw new Error('conversionInput');return file;})):[input];
      const result=await editVideos(inputs,dir,task.conversion.operation??{kind:'convert'},signal,n=>{if(Date.now()-last<500)return;last=Date.now();update=update.then(()=>changeTask(task.id,t=>{t.progress=Math.min(0.94,n*0.94);})).then(()=>{}).catch(()=>controller?.abort());},notice);await update;
      await setState(task.id,'validating',{progress:0.96});
      await changeTask(task.id,t=>{t.validation=result.validation;t.notices=[...notices];t.output='converted.mp4';t.bytes=result.validation.bytes;t.progress=1;t.conversion!.videoEncoded=result.videoEncoded;t.conversion!.audioEncoded=result.audioEncoded;});outcome='ready';return;
    }
    const signature = await digest(JSON.stringify(task.media.kind==='sabr'?{videoId:task.media.sabr?.videoId,formats:task.media.sabr?.formats.map(f=>[f.itag,f.lastModified,f.xtags]),selected:task.variant.id}:plan,(key,value)=>key==='durationComplete'?undefined:value));
    if (task.planSignature && task.planSignature !== signature) throw new Error('sourceChanged');
    await changeTask(task.id,t => { t.planSignature = signature; });
    await setState(task.id, 'fetching', { error: undefined });
    if(task.media.kind==='direct'&&task.transfer?.mode==='page'){const{pageFile}=await import('../../../packages/media-core/page-transfer');await pageFile(task,dir,signal,action=>pageCall(task,owner,action));await setState(task.id,'validating',{progress:.95});const validation=await validate(await(await dir.getFileHandle('output.original')).getFile(),task.media.duration);await changeTask(task.id,t=>{t.validation=validation;t.output='output.original';t.bytes=validation.bytes;t.progress=1;});outcome='ready';return;}
    if(task.media.kind==='direct'&&task.transfer?.mode==='multipart'){
      const{multipartFile}=await import('../../../packages/media-core/multipart');
      if(!await multipartFile(task,dir,signal)){await changeTask(task.id,t=>{if(['paused','cancelled'].includes(t.state))return;t.transfer!.mode='native';t.state='queued';t.notices=[...new Set([...(t.notices??[]),'multipartUnavailable' as const])];});return;}
      await setState(task.id,'validating',{progress:0.95});const validation=await validate(await(await dir.getFileHandle('output.original')).getFile(),task.media.duration,undefined,notice);
      await changeTask(task.id,t=>{t.validation=validation;t.output='output.original';t.bytes=validation.bytes;t.notices=[...notices];t.progress=1;});outcome='ready';return;
    }
    const trackFiles: File[] = [];
    if(LOCAL_BUILD&&task.media.kind==='sabr'){const{sabrFiles}=await import('../../../packages/media-core/sabr');trackFiles.push(...await sabrFiles(task,dir,signal));}
    const dashResources=task.media.kind==='dash'&&task.transfer?.mode==='multipart'&&plan.tracks.every(track=>track.segments.length===1&&!track.segments[0]!.range);
    const parallelTracks=dashResources&&plan.tracks.length===2&&new Set(plan.tracks.map(track=>track.segments[0]!.url)).size===2;
    const budget=dashResources?task.transfer!.connections:undefined;
    const connections=parallelTracks?(budget===2?undefined:budget!/2 as 2|4):budget;
    async function trackFile(trackIndex:number){
      const track = plan.tracks[trackIndex]!; const names: string[] = new Array(track.segments.length); let next = 0,failed=false;let failure:unknown;
      await Promise.allSettled(Array.from({ length: Math.min(3, track.segments.length) }, async () => { try { while (next < track.segments.length) { const i = next++; names[i] = await fragment(track.segments[i]!,connections,parallelTracks); } } catch (e) { if(!failed){failed=true;failure=e;}controller?.abort();throw e; } }));
      if(failed)throw failure;
      const handle = await dir.getFileHandle(`track-${trackIndex}`, { create: true }); const writable = await handle.createWritable();
      try { for (const name of names) { const file = await (await dir.getFileHandle(name)).getFile(); const reader = file.stream().getReader(); while (true) { const { done,value } = await reader.read(); if (done) break; if (signal.aborted) throw new Error('cancelled'); await writable.write(value); } } await writable.close(); }
      catch (e) { await writable.abort().catch(() => {}); throw e; }
      trackFiles[trackIndex]=await handle.getFile();
    }
    if(parallelTracks){let failure:unknown;await Promise.allSettled(plan.tracks.map((_track,i)=>trackFile(i).catch(error=>{failure??=error;controller?.abort();throw error;})));if(failure)throw failure;}
    else for(let trackIndex=0;trackIndex<plan.tracks.length;trackIndex++)await trackFile(trackIndex);
    await setState(task.id, 'assembling', { progress: 0.85 });
    const output = await dir.getFileHandle('output.mp4', { create: true });
    const tracks = await remux(trackFiles, await output.createWritable(), signal,undefined,notice);
    await setState(task.id, 'validating', { progress: 0.95 });
    const validation = await validate(await output.getFile(), plan.duration, tracks,notice);
    await changeTask(task.id, t => { t.validation = validation;t.notices=[...notices]; t.output = 'output.mp4'; t.bytes = validation.bytes; t.progress = 1; });
    outcome = 'ready';
  } catch (error) {
    controller.abort(); const current = await getTask(task.id);
    if (current && !['cancelled','paused'].includes(current.state) && !(signal.aborted&&current.state==='queued')) await setState(task.id, 'failed', {notices:[...notices], error: error instanceof Error && /^[a-zA-Z]+$/.test(error.message) ? error.message : (error as any)?.name === 'QuotaExceededError' ? 'space' : 'invalid' });
  } finally { liveFinish=undefined;clearInterval(heartbeat); await release(task.id, owner); postMessage({ type: outcome, id: task.id }); }
}
self.onmessage = event => {
  const data = event.data;
  if(data.type==='pageMediaResult'){const pending=pagePending.get(data.requestId);pagePending.delete(data.requestId);if(pending){if(data.error)pending.reject(new Error(data.error));else pending.resolve(data.value);}return;}
  if(data.type==='finishLive'){liveFinish?.abort();return;}
  if (data.type === 'abort') { controller?.abort();for(const[id,pending]of pagePending){pagePending.delete(id);pending.reject(new Error('cancelled'));}return; }
  if (data.type === 'run') {
    void navigator.locks.request(mediaTaskLock(data.task.id),{ifAvailable:true},async taskLock=>{
      if(!taskLock){await release(data.task.id,data.owner);postMessage({type:'waiting',id:data.task.id});return;}
      if(data.task.conversion)await navigator.locks.request('alcydeo:mp4-conversion',{ifAvailable:true},async lock=>{if(lock)await run(data.task,data.plan,data.owner,data.origins);else{await release(data.task.id,data.owner);postMessage({type:'waiting',id:data.task.id});}});
      else{
        const current=await getTask(data.task.id),slot=current?.downloadSlot;
        if(!current||current.state!=='queued'||slot?.kind!=='managed'||slot.owner!==data.owner||slot.expiresAt<Date.now()){
          await release(data.task.id,data.owner);postMessage({type:'waiting',id:data.task.id});return;
        }
        await run(current,data.plan,data.owner,data.origins);
      }
    });
  }
  if (data.type === 'validate') void validate(data.file, data.duration).then(result => postMessage({ type: 'validation', result })).catch(() => postMessage({ type: 'validationError' }));
};
