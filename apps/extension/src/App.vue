<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import CloudPanel from './CloudPanel.vue';
import{LOCAL_BUILD}from'../../../packages/contracts/distribution';
import type{PlaylistSummary}from'../../../packages/playlists/contracts';
const PlaylistPanel=LOCAL_BUILD?defineAsyncComponent(()=>import('./YoutubePlaylistPanel.vue')):undefined;
const PlaylistRunner=LOCAL_BUILD?defineAsyncComponent(()=>import('./YoutubePlaylistRunner.vue')):undefined;
const PlaylistBatches=LOCAL_BUILD?defineAsyncComponent(()=>import('./YoutubePlaylistBatches.vue')):undefined;
import LanguagePicker from './LanguagePicker.vue';
import TaskThumbnail from './TaskThumbnail.vue';
import BatchFiles from './BatchFiles.vue';
import{taskFile,allowFileAccess}from'./task-files';
import{quickCast}from'./quick-cast';
import{reserveDownload,releaseDownload}from'./download-admission';
import{startTabCapture}from'./start-capture';
import{installAnnotations}from'./annotations';
import TVPanel from './TVPanel.vue';
import RecordingPanel from './RecordingPanel.vue';
import LivePanel from './LivePanel.vue';
import MediaTools from './MediaTools.vue';
import ConversionControls from './ConversionControls.vue';
import Icon from './Icon.vue';
import ActionMenu from './ActionMenu.vue';
import DetectionDiagnostics from './DetectionDiagnostics.vue';
import { api } from './api';
import { t, bytes, duration, errorText,language } from './i18n';
import { defaults, concurrentFileOptions, downloadConcurrency, managedTask, clearableHistory, sizePresets, cleanName,conversionOptions,conversionDefaults,compressionDefaults, type EditOperation, type Media, type Settings, type Task } from '../../../packages/contracts';
import { acquire, acquireConversion, renew, release, allTasks, changeTask, getTask, setState, putTask,runningMediaTasks,mediaTaskLock,outputSaveLock } from '../../../packages/storage';
import {automaticOutput,pendingOutput,taskProgress,taskPhase} from '../../../packages/media-core/output-saving';
import type {Plan} from '../../../packages/media-core/hls';
import { permitted } from '../../../packages/media-core/network';
import {audioExtensions} from '../../../packages/media-core/formats';
import { directExtension } from '../../../packages/media-core/classification';
import {matchingVariant} from '../../../packages/media-core/grouping';
import {destination} from '../../../packages/media-core/destination';
import {fileStem,taskExtension} from '../../../packages/media-core/filenames';
const URL = globalThis.URL;
const location = globalThis.location;
const popup = location.pathname.includes('popup');
const helpUrl=computed(()=>{const lang=language.value.replace('_','-').toLowerCase(),locale=lang.startsWith('zh')?'zh-cn':['en','es','fr','de','ar','ru','pt','hi','ur'].includes(lang.split('-')[0]!)?lang.split('-')[0]!:'en';return `https://drslid.github.io/Alcydeo/${locale}/`;});
async function openHelp(){try{const url=helpUrl.value,response=await fetch(url,{method:'HEAD',credentials:'omit',signal:AbortSignal.timeout(4000)});if(response.ok){await chrome.tabs.create({url});return;}}catch{/* Local help remains usable before publication or offline. */}if(popup)openManager('help');else{view.value='help';location.hash='help';}}
const navigation=[{key:'library',icon:'library'},{key:'tools',icon:'tools'},{key:'record',icon:'record'},{key:'cloud',icon:'cloud'},{key:'tv',icon:'cast'},{key:'settings',icon:'settings'}];
const countFormat=computed(()=>new Intl.NumberFormat(language.value));
const percentFormat=computed(()=>new Intl.NumberFormat(language.value,{style:'percent',maximumFractionDigits:0}));
const dateFormat=computed(()=>new Intl.DateTimeFormat(language.value,{dateStyle:'medium'}));
const activeTasks=computed(()=>tasks.value.filter(task=>['queued','fetching','assembling','converting','recording'].includes(task.state)).length);
function goTo(target:string){target=target==='queue'?'library':target;view.value=target;location.hash=target;window.scrollTo({top:0,behavior:'instant'});}
function focusContent(){document.getElementById('manager-content')?.focus();}
const recordMode=ref<'stream'|'capture'>(new URLSearchParams(location.search).has('capture')?'capture':'stream');
const version = chrome.runtime.getManifest().version;
const tvParams=new URLSearchParams(location.search);
const popupPane=ref<'sources'|'downloads'>('sources');const pageUrl=ref('');
const playlistPage=ref<PlaylistSummary>();const playlistTarget=computed(()=>{if(!LOCAL_BUILD)return false;try{const url=new URL(pageUrl.value);return url.protocol==='https:'&&/^(?:www\.|m\.)?youtube\.com$/.test(url.hostname)&&['/playlist','/watch'].includes(url.pathname)&&url.searchParams.has('list');}catch{return false;}});
const tabId = ref(-1); const pageHost = ref(''); const media = ref<Media[]>([]); const tasks = ref<Task[]>([]);
const prefs = ref<Settings>({ ...defaults }); const view = ref(['queue','library','record','cloud','tools','settings','help','tv'].includes(location.hash.slice(1)) &&location.hash.slice(1)!=='queue' ? location.hash.slice(1) : 'library');
const casting = ref('');
const error = ref(''); const notice = ref(''); const scanning = ref(false); const busy = ref(''); const preview = ref(''); const search = ref(''); const favorites = ref(false);
const selected = ref<Record<string,string>>({}); const brokenPosters=ref(new Set<string>());const blockedText = ref('');
const selectedAt:Record<string,number>={},preferredVariants=new Map<string,Media['variants'][number]>();let disposed=false;
function selectionPending(item:Media){const preferred=preferredVariants.get(item.id);return!!preferred&&!matchingVariant(item.kind,preferred,item.variants);}
function sourceChecking(item:Media){return selectionPending(item)&&sourcePending.value;}
const owner = crypto.randomUUID();const pageAccessBlocked=ref(false);
const sourceRejected=ref(0),sourcePending=ref(false);
interface RunningWorker{worker:Worker;origins:string[];conversion:boolean;phase:'running'|'saving'|'finishing'}
const workers=new Map<string,RunningWorker>(),starting=new Set<string>();const concurrentLimit=ref(defaults.maxConcurrentFiles);
let timer: ReturnType<typeof setInterval>;let refreshing=false,draining=false;
let toolsWaiting='';
const outputUrls = new Map<number,string>();
const savingOutputs=ref(new Set<string>());
const cloudTasks=ref<Task[]>([]);
const toolsDefaults=ref(conversionOptions(undefined));
const toolsKind=ref<EditOperation['kind']>('trim');
const toolsOpen=ref(false),toolsFiles=ref<File[]>([]),toolsSource=ref<Task>();
async function openTools(source?:Task,kind:EditOperation['kind']='trim'){toolsWaiting='';toolsDefaults.value=conversionOptions((await api('snapshot')).settings.conversion);toolsSource.value=source;toolsKind.value=kind;toolsFiles.value=[];if(source)try{toolsFiles.value=[await taskFile(source)];}catch{/* The editor offers an explicit file chooser. */};if(source){toolsOpen.value=false;view.value='tools';if(!location.hash.startsWith('#tools'))location.hash='tools';}else toolsOpen.value=view.value!=='tools';}
async function runPanelTool(files:File[],operation:EditOperation){await queueConversion(files[0]!,files.length===1?toolsSource.value:undefined,undefined,operation,files.slice(1));}
async function runTool(files:File[],operation:EditOperation){await queueConversion(files[0]!,files.length===1?toolsSource.value:undefined,undefined,operation,files.slice(1));toolsOpen.value=false;}
const importing=ref(false);let importAbort:AbortController|undefined;let importId='';
const pageSize = 20; const taskPage = ref(1);
const historySelection=ref(false);
const historyDialog = ref<HTMLDialogElement>(); const historyIds = ref<string[]>([]); const clearingHistory = ref(false); const historyNotice = ref('');
const filtered = computed(() => tasks.value.filter(task => (!favorites.value || task.favorite) && `${task.title} ${task.tags?.join(' ') ?? ''}`.toLowerCase().includes(search.value.toLowerCase())));
const taskPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));
const visibleTasks = computed(() => filtered.value.slice((taskPage.value - 1) * pageSize, taskPage.value * pageSize));
const historyAvailable = computed(() => tasks.value.some(task => clearableHistory(task)));
watch([view, search, favorites], () => { taskPage.value = 1; historyNotice.value = ''; });
watch(taskPages, pages => { taskPage.value = Math.min(taskPage.value, pages); });
const popupTasks=computed(()=>tasks.value.filter(task=>!task.conversion&&task.media.tabId===tabId.value&&task.media.pageUrl===pageUrl.value).slice(0,20));
const activeCapture=computed(()=>popupTasks.value.find(task=>task.recording?.active&&task.state==='recording'));
async function annotateCapture(){if(!activeCapture.value)return;await chrome.scripting.executeScript({target:{tabId:tabId.value},func:installAnnotations,args:[activeCapture.value.recording?.sessionKey??activeCapture.value.id,{draw:t('annotations'),undo:t('undoAnnotations'),clear:t('clearAnnotations'),close:t('close')}]});}
const popupCount=computed(()=>popupTasks.value.filter(task=>!task.saved&&!['failed','cancelled'].includes(task.state)).length);
const unfinished = computed(() => tasks.value.filter(x => !['completed','failed','cancelled'].includes(x.state)).length);
watch(() => prefs.value.theme, value => { document.documentElement.dataset.theme = value; }, { immediate: true });
async function act(fn: () => Promise<unknown>) { error.value = ''; try { return await fn(); } catch (e) { error.value = e instanceof Error ? e.message : 'unknown'; } }
function openManager(target='library',taskId?:string){void act(()=>api('openManager',{view:target,taskId}));}
async function openSiteAccess(){await chrome.tabs.create({url:`chrome://extensions/?id=${chrome.runtime.id}`});}
async function chooseChromeFolder(){await chrome.tabs.create({url:'chrome://settings/downloads'});}
async function startCast(id:string,source:Parameters<typeof quickCast>[0]){if(casting.value)return;casting.value=id;try{await act(()=>quickCast(source));}finally{casting.value='';}}
async function openTV(item:Media){const variant=variantOf(item);if(variant)await startCast(item.id,{sourceTabId:tabId.value,mediaId:item.id,variantId:variant.id});}
async function castTask(task:Task){await startCast(task.id,{taskId:task.id});}
function tvSource(item:Media){const variant=variantOf(item);return !item.captureOnly&&!!variant&&!/^audio\//.test(variant.contentType??item.contentType??'')&&!audioExtensions.some(ext=>ext===directExtension(variant.url,variant.contentType));}
function variantOf(item:Media){return item.variants.find(v=>v.id===selected.value[item.id])??item.variants[0];}
function sourceBytes(item:Media){if(selectionPending(item))return bytes(undefined);const variant=variantOf(item);const exact=item.kind==='direct'?variant?.check?.size:undefined;const estimated=variant?.check?.estimatedSize??(item.kind!=='direct'?variant?.check?.size:undefined);return exact!==undefined?bytes(exact):estimated!==undefined?`≈ ${bytes(estimated)}`:bytes(undefined);}
function chooseVariant(id:string,value:string){selected.value[id]=value;selectedAt[id]=performance.now();const variant=media.value.find(m=>m.id===id)?.variants.find(v=>v.id===value);if(variant)preferredVariants.set(id,variant);}
function reconcile(next:Media[]){
  for(const item of next){
    const ids=[...new Set([item.id,...(item.aliases??[]),...media.value.filter(old=>old.id===item.id||item.aliases?.includes(old.id)).map(old=>old.id)])].sort((a,b)=>(selectedAt[b]??0)-(selectedAt[a]??0));
    let preferred:Media['variants'][number]|undefined;let from:string|undefined;
    for(const id of ids){preferred=preferredVariants.get(id)??media.value.find(m=>m.id===id)?.variants.find(v=>v.id===selected.value[id]);if(preferred){from=id;break;}}
    if(preferred){const match=matchingVariant(item.kind,preferred,item.variants);selected.value[item.id]=match?.id??preferred.id;preferredVariants.set(item.id,match??preferred);selectedAt[item.id]=selectedAt[from!]??0;}
    else if(!item.variants.some(v=>v.id===selected.value[item.id]))delete selected.value[item.id];
  }
  media.value=next;
}
async function refresh() {
  if (refreshing) return; refreshing = true;
  try {
    if(popup&&tabId.value>=0){const tab=await chrome.tabs.get(tabId.value).catch(()=>undefined);if(tab?.url&&tab.url!==pageUrl.value){preferredVariants.clear();selected.value={};pageUrl.value=tab.url;pageHost.value=/^https?:\/\//.test(tab.url)?new URL(tab.url).origin:'';pageAccessBlocked.value=false;popupPane.value='sources';}}
    const snapshot = await api('snapshot', { tabId: tabId.value });playlistPage.value=snapshot.playlist; reconcile(snapshot.media);sourcePending.value=snapshot.sourcePending??false;sourceRejected.value=snapshot.sourceRejected??0; tasks.value = snapshot.tasks;concurrentLimit.value=downloadConcurrency(snapshot.settings.maxConcurrentFiles); prefs.value.globalDetection=snapshot.settings.globalDetection; if(pageAccessBlocked.value&&pageHost.value&&await permitted(pageHost.value))pageAccessBlocked.value=false;
    if(!popup&&view.value==='tools'&&toolsSource.value&&!toolsFiles.value.length){const current=tasks.value.find(task=>task.id===toolsSource.value?.id);if(current){toolsSource.value=current;if((current.saved||current.output)&&toolsWaiting!==current.id){toolsWaiting=current.id;try{toolsFiles.value=[await taskFile(current)];}catch{/* User grants access or selects the saved file. */}}}}
    if (!popup) {
      const running=await runningMediaTasks();
      for (const task of tasks.value) if (['fetching','assembling','converting','recording','validating'].includes(task.state) && managedTask(task) && !task.downloadId && !(task.validation && task.output) && !workers.has(task.id)&&!starting.has(task.id) && !running.has(task.id) && (task.leaseUntil ?? 0) < Date.now()) await setState(task.id, 'paused', { error: task.live?'liveInterrupted':task.recording?'recordingInterrupted':task.conversion&&!task.conversion.ready?'conversionInput':'interrupted', owner: undefined, leaseUntil: undefined,...(task.live?{live:JSON.parse(JSON.stringify({...task.live,active:false}))}:{}) });
      for(const task of tasks.value)if(task.state==='queued'&&task.media.kind==='direct'&&task.transfer?.mode==='native'&&task.notices?.includes('multipartUnavailable'))void api('nativeFallback',{id:task.id}).catch(()=>{});
      for(const task of tasks.value)if(automaticOutput(task)&&!workers.has(task.id)&&!starting.has(task.id)&&!savingOutputs.value.has(task.id))void act(()=>saveOutput(task.id));
      void act(drainQueue);
    }
  } finally { refreshing = false; }
}
async function scan(forceChecks=false) {
  // Chrome pages and unknown tab URLs have no downloadable web source. They
  // must not produce the former domain-permission error on every popup open.
  if(!pageHost.value||tabId.value<0)return;
  scanning.value=true;
  await act(async()=>{try{reconcile(await api('scan',{tabId:tabId.value,forceChecks}));pageAccessBlocked.value=false;}
    catch(e){if(!await permitted(pageHost.value)){pageAccessBlocked.value=true;return;}throw e;}});
  scanning.value=false;
}
async function setGlobalDetection(enabled:boolean) {
  await api('globalDetection',{enabled});prefs.value.globalDetection=enabled;await refresh();
}
async function toggleGlobal(event:Event){const input=event.target as HTMLInputElement;await act(async()=>{try{await setGlobalDetection(input.checked);}finally{input.checked=prefs.value.globalDetection;}});}

async function expand(m: Media) { busy.value = m.id; try { await api('expand', { tabId: tabId.value, id: m.id,force:true });await refresh(); } finally { busy.value = ''; } }
async function enqueue(m: Media) { busy.value = m.id; try { if(m.captureOnly||m.live){await recordSource(m);return;}await api(variantOf(m)?.check?.live?'startLive':'enqueue', { tabId: tabId.value, id: m.id, variantId: selected.value[m.id] ?? m.variants[0]?.id });popupPane.value='downloads'; } finally { busy.value = '';await refresh(); } }

async function drainQueue(){
  if(draining||disposed)return;draining=true;
  try{
    const queue=[...tasks.value].sort((a,b)=>a.createdAt-b.createdAt).filter(task=>task.state==='queued'&&managedTask(task)&&!workers.has(task.id)&&!starting.has(task.id));
    const conversion=queue.find(task=>task.conversion?.ready);
    if(conversion)await start(conversion);
    for(const task of queue){
      if(task.conversion)continue;
      const active=new Set([...workers].filter(([,entry])=>!entry.conversion).map(([id])=>id));
      for(const id of starting)if(!tasks.value.find(item=>item.id===id)?.conversion)active.add(id);
      if(active.size>=concurrentLimit.value)break;
      await start(task);
    }
  }finally{draining=false;}
}
async function start(task:Task){
  if(disposed||workers.has(task.id)||starting.has(task.id))return;starting.add(task.id);
  if(task.conversion){try{if(await acquireConversion(task.id,owner))launchTask(task,{tracks:[]});}finally{starting.delete(task.id);}return;}
  try{if(!await reserveDownload(task.id,owner,'managed')){starting.delete(task.id);return;}}
  catch(error){starting.delete(task.id);throw error;}
  void act(()=>prepareTask(task)).finally(()=>starting.delete(task.id));
}
async function prepareTask(task:Task){
  let launched=false;
  try{
    const current=await getTask(task.id);if(disposed||!current||current.state!=='queued'||!managedTask(current))return;task=current;
    if(task.live&&!task.live.active){launchTask(task,{tracks:[]});launched=true;return;}
    const missing:string[]=[];
    for(const url of[task.variant.url,...(task.variant.audioUrl?[task.variant.audioUrl]:[])])if(!await permitted(url))missing.push(`${new URL(url).origin}/*`);
    if(missing.length){await setState(task.id,'paused',{error:'permission',owner:undefined,leaseUntil:undefined});return;}
    const{buildPlan}=await import('../../../packages/media-core/plan'),plan=await buildPlan(task);
    const planOrigins=[...new Set(plan.tracks.flatMap(track=>track.segments.map(segment=>new URL(segment.url).origin)))];
    for(const origin of planOrigins)if(!await permitted(origin))missing.push(`${origin}/*`);
    if(missing.length){await setState(task.id,'paused',{error:'permission',owner:undefined,leaseUntil:undefined});return;}
    if(disposed||!await reserveDownload(task.id,owner,'managed'))return;
    const ready=await getTask(task.id);if(!ready||ready.state!=='queued'||ready.owner!==owner)return;
    launchTask(ready,plan,(await chrome.permissions.getAll()).origins??[],planOrigins);launched=true;
  }catch(error){const current=await getTask(task.id);if(current&&!['paused','cancelled','completed'].includes(current.state))await setState(task.id,'failed',{error:error instanceof Error&&/^[a-zA-Z]+$/.test(error.message)?error.message:'unsupported',owner:undefined,leaseUntil:undefined});}
  finally{if(!launched)await releaseDownload(task.id,owner);}
}
function launchTask(task:Task,plan:Plan,origins:string[]=[],planOrigins:string[]=[]){
  const worker=new Worker(new URL('./media.worker.ts',import.meta.url),{type:'module'});
  const entry:RunningWorker={worker,conversion:!!task.conversion,phase:'running',origins:[...new Set([task.media.pageUrl,task.variant.url,task.variant.audioUrl,...planOrigins].filter((url):url is string=>!!url&&/^https?:\/\//.test(url)).map(url=>new URL(url).origin))]};workers.set(task.id,entry);
  worker.onmessage=event=>{
    if(workers.get(task.id)!==entry||entry.phase!=='running')return;
    if(event.data.type==='pageMedia'){const data=event.data;void api('pageMedia',{id:task.id,owner,action:data.action}).then(value=>worker.postMessage({type:'pageMediaResult',requestId:data.requestId,value})).catch(error=>worker.postMessage({type:'pageMediaResult',requestId:data.requestId,error:error.message}));return;}
    if(event.data.type==='ready'){entry.phase='saving';void act(()=>saveOutput(task.id)).finally(()=>act(()=>finishWorker(task.id,true)));}
    if(['stopped','waiting'].includes(event.data.type))void act(()=>finishWorker(task.id));
  };
  worker.onerror=()=>{void act(async()=>{if(workers.get(task.id)!==entry||entry.phase!=='running')return;const current=await getTask(task.id);if(workers.get(task.id)!==entry||entry.phase!=='running')return;if(current&&!['paused','cancelled','completed'].includes(current.state))await setState(task.id,'failed',{error:'interrupted'});await finishWorker(task.id);});};
  worker.postMessage({type:'run',task:JSON.parse(JSON.stringify(task)),plan,owner,origins});
}
function videoTask(task:Task){if(task.validation)return task.validation.tracks.some(t=>t.type==='video');const mime=task.variant.contentType??task.media.contentType??'';return !/^audio\//.test(mime)&&!audioExtensions.some(ext=>ext===directExtension(task.variant.url,mime));}
async function conversionFile(event:Event,source?:Task,retry?:Task){
  const input=event.target as HTMLInputElement;const file=input.files?.[0];if(file)await act(()=>queueConversion(file,source,retry,retry?.conversion?.operation??{kind:'convert',...(view.value==='settings'?{options:conversionOptions(prefs.value.conversion)}:{})}));input.value='';
}
async function queueConversion(file:File,source?:Task,retry?:Task,operation:EditOperation={kind:'convert'},additional:File[]=[]){
  const inputs=[file,...additional];const inputBytes=inputs.reduce((sum,input)=>sum+input.size,0);if(inputs.some(input=>!input.size)||inputs.length>20||operation.kind==='merge'&&inputs.length<2||operation.kind!=='merge'&&inputs.length!==1)throw new Error('invalid');
  if(importing.value)throw new Error('busy');if(!file.size||source?.bytes&&file.size!==source.bytes)throw new Error('invalid');
  importing.value=true;importAbort=new AbortController();const signal=importAbort.signal;const id=retry?.id??crypto.randomUUID();importId=id;let stored=false,sourceHeld=false,ready=false;
  let heartbeat:ReturnType<typeof setInterval>|undefined;let lastRenew=Date.now();
  try{
    const estimate=await navigator.storage.estimate();if(estimate.quota!==undefined&&estimate.quota-(estimate.usage??0)<inputBytes*3+16*1024*1024)throw new Error('space');
    const savedPreferences=(await api('snapshot')).settings as Settings;
    operation={...operation,options:conversionOptions(operation.options??(operation.kind==='compress'?savedPreferences.compression??compressionDefaults:savedPreferences.conversion))};
    if(source){sourceHeld=await acquire(source.id,owner);if(!sourceHeld)throw new Error('busy');}
    const title=retry?.title??fileStem(file.name);const now=Date.now();
    const task:Task={id,title,media:{id,tabId:-1,pageUrl:'',url:'',title,kind:'direct',variants:[]},variant:{id:'mp4',url:'',label:'MP4'},state:'fetching',createdAt:retry?.createdAt??now,updatedAt:now,bytes:0,total:inputBytes,progress:0,checkpoints:{},destination:{folder:savedPreferences.folder,saveAs:savedPreferences.saveAs},conversion:{input:'input.original',inputBytes:file.size,ready:false,sourceTaskId:source?.id??retry?.conversion?.sourceTaskId,operation,inputs:inputs.map((input,i)=>({file:i?'input-'+i:'input.original',bytes:input.size,name:cleanName(input.name)}))},owner,leaseUntil:now+30000};
    await putTask(task);stored=true;view.value='library';location.hash='library';await refresh();
    heartbeat=setInterval(()=>{void getTask(id).then(async current=>{if(!current||['paused','cancelled'].includes(current.state)){importAbort?.abort();return;}if(Date.now()-lastRenew>=8000){lastRenew=Date.now();await renew(id,owner);if(sourceHeld)await renew(source!.id,owner);}}).catch(()=>importAbort?.abort());},1000);
    const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(id,{create:true});
    for(let i=0;i<inputs.length;i++){const handle=await dir.getFileHandle(i?'input-'+i:'input.original',{create:true});await inputs[i]!.stream().pipeTo(await handle.createWritable(),{signal});}if(signal.aborted)throw new Error('cancelled');
    const staged=await changeTask(id,t=>{if(t.state!=='fetching')return;t.conversion!.ready=true;t.state='queued';t.bytes=inputBytes;t.progress=0;t.owner=undefined;t.leaseUntil=undefined;});ready=staged.state==='queued';
  }catch(error){if(stored){const current=await getTask(id);if(current&&!['paused','cancelled'].includes(current.state))await setState(id,'failed',{error:(error as {name?:string})?.name==='QuotaExceededError'?'space':'conversionInput'});}throw error;}
  finally{clearInterval(heartbeat);if(stored&&!ready)await release(id,owner).catch(()=>{});if(sourceHeld)await release(source!.id,owner).catch(()=>{});importing.value=false;importAbort=undefined;importId='';await refresh();}
}
async function finishWorker(id:string,outputReady=false){
  const entry=workers.get(id);if(!entry||entry.phase==='finishing')return;entry.phase='finishing';entry.worker.terminate();
  try{const task=await getTask(id);if(!outputReady||!task||['completed','failed','paused','cancelled'].includes(task.state)||task.error&&!task.outputSave)await releaseDownload(id,owner);}
  finally{if(workers.get(id)===entry)workers.delete(id);await refresh();}
}
async function saveOutput(id: string) {
  if(popup||disposed||savingOutputs.value.has(id))return;savingOutputs.value.add(id);
  try{await navigator.locks.request(outputSaveLock(id),{ifAvailable:true},async lock=>{
    if(!lock)return;await navigator.locks.request(mediaTaskLock(id),()=>{});
    if(disposed||!await acquire(id,owner))return;
    try{
      const task=await getTask(id);if(!task||!automaticOutput(task))return;
      if(task.outputSave){
        // Reconcile a download created before a lost reply. Never guess that
        // an uncertain native invocation failed and silently create a duplicate.
        await api('snapshot');await changeTask(id,t=>{if(pendingOutput(t)&&t.outputSave)t.error='saveInterrupted';});return;
      }
      const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(id),file=await(await dir.getFileHandle(task.output!)).getFile();
      if(!file.size||file.size!==task.validation!.bytes)throw new Error('invalid');
      const current=await getTask(id);if(disposed||!current||!automaticOutput(current))return;
      const ext=taskExtension(task),mime:Record<string,string>={mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',mkv:'video/x-matroska',m4v:'video/x-m4v',mp3:'audio/mpeg',m4a:'audio/mp4',ogg:'audio/ogg',wav:'audio/wav'};
      const url=URL.createObjectURL(file.slice(0,file.size,mime[ext])),options=destination(task,prefs.value,ext);
      await changeTask(id,t=>{if(automaticOutput(t)){t.error=undefined;t.outputSave={url,startedAt:Date.now()};}});
      const intent=await getTask(id);if(!intent||!automaticOutput(intent)||intent.outputSave?.url!==url){URL.revokeObjectURL(url);return;}
      try{
        const downloadId=await chrome.downloads.download({url,...options});outputUrls.set(downloadId,url);
        const linked=await changeTask(id,t=>{t.downloadId=downloadId;t.error=undefined;});
        if(linked.state==='cancelled')await chrome.downloads.cancel(downloadId).catch(()=>{});else if(linked.state==='paused')await chrome.downloads.pause(downloadId).catch(()=>{});
        const[item]=await chrome.downloads.search({id:downloadId});if(item&&item.state!=='in_progress'){URL.revokeObjectURL(url);outputUrls.delete(downloadId);}
      }catch{
        URL.revokeObjectURL(url);await changeTask(id,t=>{if(pendingOutput(t)){delete t.outputSave;t.error=options.saveAs?'saveDialog':'network';}});
      }
    }catch(error){await changeTask(id,t=>{if(pendingOutput(t)){delete t.outputSave;t.error=error instanceof Error&&/^[a-zA-Z]+$/.test(error.message)?error.message:'missing';}});}
    finally{await release(id,owner);}
  });}finally{savingOutputs.value.delete(id);}
}
async function taskAction(type: string, task: Task) {
  await api(type, { id: task.id });
  if(type==='delete')selection.value.delete(task.id);
  if(['pause','cancel'].includes(type))workers.get(task.id)?.worker.postMessage({type:'abort'});
  if(['pause','cancel'].includes(type)&&importId===task.id)importAbort?.abort();
  await refresh();
}
function confirmClearHistory(ids?:string[]) {
  historySelection.value=!!ids;
  historyIds.value = tasks.value.filter(task => clearableHistory(task)&&(!ids||ids.includes(task.id))).map(task => task.id);
  if (historyIds.value.length) historyDialog.value?.showModal();
}
async function clearHistory() {
  if (clearingHistory.value) return; clearingHistory.value = true;
  try {
    await api('clearHistory', { ids: [...historyIds.value] });
    selection.value=new Set();historyNotice.value = t('historyCleared'); await refresh();
  } finally { clearingHistory.value = false; historyDialog.value?.close(); }
}
async function saveSettings() { prefs.value.blocked = blockedText.value.split('\n').map(s => s.trim()).filter(Boolean); await api('settings', { value: JSON.parse(JSON.stringify(prefs.value)) }); notice.value = t('saved'); }
async function exportMetadata() { const data = await api('export'); const url = URL.createObjectURL(new Blob([JSON.stringify({ version:1,items:data },null,2)], { type:'application/json' })); const a = document.createElement('a'); a.href=url; a.download='alcydeo-library.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); }
function downloadChanged(delta: chrome.downloads.DownloadDelta) { if (delta.state?.current === 'complete' || delta.state?.current === 'interrupted') { const url = outputUrls.get(delta.id); if (url) { URL.revokeObjectURL(url); outputUrls.delete(delta.id); } } }
function permissionsRemoved(permission:chrome.permissions.Permissions){
  if(!permission.origins?.some(origin=>!origin.startsWith('file:')))return;
  for(const[id,entry]of workers){
    if(entry.conversion||entry.phase!=='running')continue;
    void Promise.all(entry.origins.map(permitted)).then(async allowed=>{if(allowed.every(Boolean)||workers.get(id)!==entry||entry.phase!=='running')return;await setState(id,'paused',{error:'permission'});entry.worker.postMessage({type:'abort'});}).catch(()=>{});
  }
}
async function recoverRecording(task:Task){
 if(!await acquire(task.id,owner))throw new Error('busy');
 try{const file=await(await(await navigator.storage.getDirectory()).getDirectoryHandle(task.id)).getFileHandle(task.recording!.file).then(h=>h.getFile());const{validate}=await import('../../../packages/media-core/engine');const validation=await validate(file);await changeTask(task.id,t=>{t.state='validating';t.output=t.recording!.file;t.recording!.active=false;t.validation=validation;t.bytes=file.size;t.progress=1;t.error=undefined;t.notices=[...new Set([...(t.notices??[]),'recordingIncomplete' as const])];});}finally{await release(task.id,owner);}await saveOutput(task.id);await refresh();
}
function navigate(){const raw=location.hash.slice(1)||'library',target=raw==='queue'?'library':raw;if(!popup&&target.startsWith('tools/')){view.value='tools';void act(async()=>{const task=await getTask(decodeURIComponent(target.slice(6)));if(task)await openTools(task);});return;}if(['queue','library','tools','settings','help','record','cloud','tv'].includes(target))view.value=target;}
function downloadWake(message:any,sender:chrome.runtime.MessageSender){if(!popup&&message?.type==='downloadWake'&&sender.id===chrome.runtime.id&&sender.url===chrome.runtime.getURL('/background.js')){workers.get(message.id)?.worker.postMessage({type:message.finishLive?'finishLive':'abort'});if(message.route)void chrome.tabs.getCurrent().then(tab=>{if(tab?.id===message.targetTabId)navigate();});void act(refresh);}return false;}
onMounted(async () => {
  chrome.runtime.onMessage.addListener(downloadWake);
  window.addEventListener('hashchange',navigate);
  await act(async () => {
    const snapshot = await api('snapshot'); prefs.value = snapshot.settings; blockedText.value = prefs.value.blocked.join('\n');
    if (popup) {
      const requested = new URLSearchParams(location.search).get('tabId');
      const tab = requested ? await chrome.tabs.get(Number(requested)) : (await chrome.tabs.query({ active:true,currentWindow:true }))[0];
      tabId.value = tab?.id ?? -1;pageUrl.value=tab?.url??''; pageHost.value = /^https?:\/\//.test(tab?.url??'') ? new URL(tab!.url!).origin : '';
      await refresh();if(popupTasks.value.length&&!playlistTarget.value)popupPane.value='downloads'; await scan();
    } else { tasks.value = await allTasks(); await refresh();navigate(); }
    timer = setInterval(() => { if (!popup || !document.hidden) void act(refresh); },1000);
    chrome.downloads.onChanged.addListener(downloadChanged); chrome.permissions.onRemoved.addListener(permissionsRemoved);
  });
});
onUnmounted(() => { disposed=true;chrome.runtime.onMessage.removeListener(downloadWake);importAbort?.abort();window.removeEventListener('hashchange',navigate);clearInterval(timer);for(const entry of workers.values())entry.worker.terminate();workers.clear(); for (const url of outputUrls.values()) URL.revokeObjectURL(url); chrome.downloads.onChanged.removeListener(downloadChanged); chrome.permissions.onRemoved.removeListener(permissionsRemoved); });

const selection=ref(new Set<string>()),batchTasks=ref<Task[]>([]),batchAction=ref<'convert'|'compress'|'merge'>('convert'),batchNotice=ref('');
const selectedReady=computed(()=>tasks.value.filter(task=>selection.value.has(task.id)&&videoTask(task)&&(task.saved||task.output)&&!task.owner));
const selectedDeletable=computed(()=>tasks.value.filter(task=>selection.value.has(task.id)&&clearableHistory(task)));
function toggleTask(id:string){const next=new Set(selection.value);if(next.has(id))next.delete(id);else next.add(id);selection.value=next;}
function selectPage(checked:boolean){const next=new Set(selection.value);for(const task of visibleTasks.value)if(checked)next.add(task.id);else next.delete(task.id);selection.value=next;}
function openCloud(sources:Task[]){cloudTasks.value=[...sources];view.value='cloud';location.hash='cloud';}
function beginBatch(action:typeof batchAction.value|'cloud'){if(action==='cloud'){openCloud(selectedReady.value);return;}batchAction.value=action;batchTasks.value=[...selectedReady.value];}
async function runBatch(files:File[]){const action=batchAction.value,sources=[...batchTasks.value];batchTasks.value=[];if(action==='merge'){toolsFiles.value=files;toolsKind.value='merge';view.value='tools';location.hash='tools';return;}for(let index=0;index<files.length;index++){batchNotice.value=t('batchPreparing',[String(index+1),String(files.length)]);await queueConversion(files[index]!,sources[index],undefined,{kind:action,options:conversionOptions(action==='compress'?prefs.value.compression??compressionDefaults:prefs.value.conversion)});}selection.value=new Set();batchNotice.value=t('batchQueued',[String(files.length)]);}
async function recordSource(item:Media){
 const variant=variantOf(item);if(item.captureOnly){await captureTab();return;}
 const check=item.kind==='hls'&&variant?await api('checkSource',{tabId:tabId.value,id:item.id,variantId:variant.id}):undefined;
 if(item.kind==='hls'&&variant&&(item.live||check?.live||variant.check?.live)){
  try{await api('startLive',{tabId:tabId.value,id:item.id,variantId:variant.id});popupPane.value='downloads';await refresh();}
  catch(error){if(item.live&&item.providerId?.startsWith('youtube:')&&['liveAudio','unsupported'].includes((error as Error).message))await captureTab();else throw error;}
 }else await captureTab();
}
const captureOpening=ref(false);watch(activeCapture,(value,previous)=>{if(previous&&!value)captureOpening.value=false;});
async function captureTab(){if(captureOpening.value)return;captureOpening.value=true;try{await startTabCapture(tabId.value);}catch(error){captureOpening.value=false;throw error;}}
async function editDetected(item:Media){const variant=variantOf(item),existing=popupTasks.value.find(task=>task.saved&&task.media.id===item.id&&task.variant.url===variant?.url);const id=existing?.id??await api('enqueue',{tabId:tabId.value,id:item.id,variantId:variant?.id});openManager('tools',id);}

</script>

<template>
  <div class="shell">
    <header v-if="popup" class="header"><a class="brand" href="#" aria-label="Alcydeo" @click.prevent="scan()"><img src="/brand/kingfisher-icon.svg" alt="" width="40" height="40"><span>Alcydeo<small>{{ t('tagline') }}</small></span></a><div class="header-actions"><LanguagePicker /><button class="icon-button" :aria-label="t('help')" :title="t('help')" @click="act(openHelp)"><Icon name="help" /></button><button class="icon-button" :aria-label="t('settings')" :title="t('settings')" @click="openManager('settings')"><Icon name="settings" /></button></div></header>
    <a v-if="!popup" class="skip-link" href="#manager-content" @click.prevent="focusContent">{{ t('skipContent') }}</a>
    <aside v-if="!popup" class="manager-sidebar">
      <a class="brand sidebar-brand" aria-label="Alcydeo" href="#library" @click.prevent="goTo('queue')"><img src="/brand/kingfisher-icon.svg" alt="" width="42" height="42"><span>Alcydeo</span></a>
      <button class="primary sidebar-add" :aria-label="t('addVideo')" :title="t('addVideo')" @click="act(() => openTools())"><Icon name="add" /><span>{{ t('addVideo') }}</span></button>
      <nav class="manager-tabs" :aria-label="t('workspaceNavigation')"><button v-for="tab in navigation" :key="tab.key" :class="{active:view === tab.key}" :aria-label="t(tab.key)" :title="t(tab.key)" :aria-current="view === tab.key ? 'page' : undefined" @click="goTo(tab.key)"><Icon :name="tab.icon" /><span>{{ t(tab.key) }}</span><b v-if="tab.key === 'library' && activeTasks" class="nav-count" aria-hidden="true">{{ countFormat.format(activeTasks) }}</b></button></nav>
      <div class="sidebar-bottom"><button class="sidebar-help" :aria-label="t('help')" :title="t('help')" @click="act(openHelp)"><Icon name="help" /><span>{{ t('help') }}</span><Icon class="help-arrow" name="arrow" /></button><small class="sidebar-version">Alcydeo <bdi>{{ version }}</bdi></small></div>
    </aside>
    <MediaTools :compression="prefs.compression" :defaults="toolsDefaults" v-if="!popup && toolsOpen" :open="toolsOpen" :initial="toolsFiles" :initial-kind="toolsKind" :busy="importing" @close="toolsOpen = false" @submit="(files,operation) => act(() => runTool(files,operation))" />
    <component :is="PlaylistRunner" v-if="PlaylistRunner && !popup" />
    <main :id="popup ? undefined : 'manager-content'" :tabindex="popup ? undefined : -1">
      <div v-if="error" class="alert" role="alert"><span>{{ errorText(error) }}</span><button v-if="error === 'permission'" class="icon-button" :aria-label="t('chromeSiteAccess')" :title="t('chromeSiteAccess')" @click="act(openSiteAccess)"><Icon name="settings" /></button><button class="icon-button" :aria-label="t('close')" @click="error = ''"><Icon name="close" /></button></div>
      <template v-if="popup">
        <section class="page-intro"><div><p class="eyebrow">{{ t('detected') }}</p><h1 dir="auto" :title="pageHost ? new URL(pageHost).hostname : 'Alcydeo'">{{ pageHost ? new URL(pageHost).hostname : 'Alcydeo' }}</h1></div><span v-if="media.length && !playlistTarget && popupPane === 'sources'" class="page-media-count" aria-hidden="true">{{ countFormat.format(media.length) }}</span><button class="icon-button" :disabled="scanning || !pageHost" :aria-label="t('scan')" :title="t('scan')" @click="scan(true)"><Icon name="refresh" :class="{ spinning: scanning }" /></button></section>
        <nav v-if="popupTasks.length" class="popup-tabs" :aria-label="t('workspaceNavigation')"><button :aria-pressed="popupPane === 'sources'" @click="popupPane = 'sources'">{{ t('popupSources') }}</button><button :aria-pressed="popupPane === 'downloads'" @click="popupPane = 'downloads'">{{ t('popupActivity') }}<span v-if="popupCount" class="count">{{ countFormat.format(popupCount) }}</span></button></nav>
        <section v-show="popupPane === 'sources'">
        <component :is="PlaylistPanel" v-if="PlaylistPanel && playlistTarget" :key="pageUrl" :tab-id="tabId" :page-url="pageUrl" :tasks="tasks" :folder="prefs.folder" :save-as="prefs.saveAs" :revision="playlistPage?.revision" />
        <template v-if="!playlistTarget">
        <div v-if="!prefs.globalDetection" class="detection-mode"><button class="secondary" :title="t('globalDetectionHint')" @click="act(() => setGlobalDetection(true))"><Icon name="shield" />{{ t('globalDetection') }}</button></div>

        <div v-if="scanning || sourcePending && !media.length" class="scan-status" role="status"><span class="pulse" />{{ t(scanning ? 'scanning' : 'sourceChecking') }}</div>
        <section v-if="!media.length && !scanning && !sourcePending" class="empty-state"><div class="empty-bird"><img src="/brand/kingfisher.svg" alt="" width="80" height="80"></div><h2>{{ t(!pageHost ? 'openWebPage' : sourceRejected ? 'sourceNone' : 'empty') }}</h2><p>{{ t(!pageHost ? 'openWebPageHint' : pageAccessBlocked ? 'chromeAccessRestricted' : sourceRejected ? 'sourceRetryHint' : 'emptyHint') }}</p><button v-if="pageAccessBlocked" class="secondary" @click="act(openSiteAccess)"><Icon name="settings" />{{ t('chromeSiteAccess') }}</button></section>
        <DetectionDiagnostics v-if="pageHost && !media.length" :key="pageUrl" :tab-id="tabId" />
        <div class="media-list"><article v-for="item in media" :key="item.id" class="media-card">
          <div class="media-heading">
            <img v-if="item.poster && !brokenPosters.has(item.poster)" class="media-thumbnail" :src="item.poster" alt="" width="48" height="36" @error="brokenPosters.add(item.poster)">
            <div class="media-info"><h2 dir="auto" :title="item.title">{{ item.title }}</h2><p><span class="format">{{ item.live ? t('liveSource') : item.captureOnly ? t('captureMode') : ['hls','dash'].includes(item.kind) ? item.kind.toUpperCase() : directExtension(variantOf(item)!.url,variantOf(item)?.contentType)?.toUpperCase() || t('original') }}</span><bdi dir="ltr" v-if="!selectionPending(item) && variantOf(item)?.check?.width && variantOf(item)?.check?.height" :title="t('sourceCheckHint')">{{ variantOf(item)?.check?.width }} × {{ variantOf(item)?.check?.height }}</bdi><bdi v-if="item.duration">{{ duration(item.duration) }}</bdi><span>{{ sourceBytes(item) }}</span><span v-if="selectionPending(item) || variantOf(item)?.check" class="source-check" :class="{confirmed:!selectionPending(item) && variantOf(item)?.check?.state === 'ready'}" :title="t('sourceCheckHint')">{{ t(sourceChecking(item) ? 'sourceChecking' : !selectionPending(item) && variantOf(item)?.check?.state === 'ready' ? 'sourceReady' : 'sourceUnknown') }}</span></p></div>
            <div class="source-actions"><button v-if="item.kind === 'direct' && !item.captureOnly" class="icon-button" :aria-label="t('preview')" :title="t('preview')" :aria-expanded="preview === item.id" @click="preview = preview === item.id ? '' : item.id"><Icon :name="preview === item.id ? 'close' : 'play'" /></button><button v-else-if="['hls','dash'].includes(item.kind)" class="icon-button" :aria-label="t('qualities')" :title="t('qualities')" :disabled="busy === item.id" @click="act(() => expand(item))"><Icon name="refresh" /></button><ActionMenu v-if="!item.captureOnly && !item.live" :label="t('moreActions')"><button v-if="!item.captureOnly && !item.live" @click="act(()=>editDetected(item))"><Icon name="trim" />{{ t('trimTool') }}</button><button v-if="!item.captureOnly && !item.live" :title="t('recordDetectedHint')" @click="act(()=>recordSource(item))"><Icon name="record" />{{ t(item.kind === 'hls' ? 'recordStream' : 'captureTab') }}</button></ActionMenu></div>
          </div>
          <div class="media-controls"><span v-if="item.captureOnly" class="capture-source-hint">{{ t('captureMode') }}</span><label v-else class="quality"><span class="sr-only">{{ t('quality') }}</span><select :value="selected[item.id] ?? item.variants[0]?.id" @change="chooseVariant(item.id,($event.target as HTMLSelectElement).value)"><option v-if="selectionPending(item)" :value="selected[item.id]" disabled>{{ preferredVariants.get(item.id)?.label || t('original') }} · {{ t(sourcePending ? 'sourceChecking' : 'sourceUnknown') }}</option><option v-for="variant in item.variants" :key="variant.id" :value="variant.id">{{ variant.label || t('original') }}</option></select></label><button v-if="tvSource(item)" class="secondary source-cast" :disabled="!!casting || selectionPending(item)" :aria-busy="casting === item.id" :aria-label="t('castVideo')" :title="t(casting === item.id ? 'sourceChecking' : 'castVideo')" @click="openTV(item)"><Icon :name="casting === item.id ? 'refresh' : 'cast'" :class="{spinning:casting === item.id}" /><span>{{ t('castVideo') }}</span></button><button class="primary" :disabled="busy === item.id || selectionPending(item) || item.pending" @click="act(() => enqueue(item))"><Icon :name="item.live || item.captureOnly || variantOf(item)?.check?.live ? 'record' : 'download'" /><span>{{ t(item.live || item.captureOnly || variantOf(item)?.check?.live ? 'liveStart' : 'download') }}</span></button></div>
          <p v-if="item.pending" class="task-notice" role="status">{{ t('err_sourcePending') }}</p>
          <video v-if="preview === item.id" :src="variantOf(item)?.url" controls preload="metadata" class="preview" :aria-label="t('preview')" />
        </article></div>
        </template>
        </section>
        <section v-if="popupPane === 'downloads'" class="popup-downloads" :aria-label="t('popupActivity')">
          <article v-for="task in popupTasks" :key="task.id" class="popup-task" :data-task-id="task.id" :data-state="task.state">
            <div class="popup-task-heading"><h2 dir="auto" :title="task.title">{{ task.title }}</h2><span class="status-dot" :class="task.saved ? 'completed' : task.state" /></div>
            <p class="popup-task-meta"><span>{{ t(task.saved ? 'popupSaved' : task.live && !task.live.active && task.state === 'recording' ? 'liveStopping' : taskPhase(task)) }}</span><span v-if="task.variant.label">{{ task.variant.label }}</span><bdi>{{ bytes(task.bytes) }}<template v-if="task.total"> / {{ bytes(task.total) }}</template></bdi><bdi v-if="task.saved || task.total || task.progress > 0">{{ percentFormat.format(taskProgress(task)) }}</bdi></p>
            <progress v-if="!['failed','cancelled'].includes(task.state)" :value="task.saved || task.total || task.progress > 0 ? taskProgress(task) : undefined" max="1" :aria-label="t('queue')" />
            <p v-if="task.error" class="task-error" role="status">{{ errorText(task.error) }}</p>
            <p v-if="task.media.providerId?.startsWith('tiktok:') && !task.saved" class="task-notice">{{ t('tiktokHint') }}</p><div class="popup-task-actions"><button v-if="task.error === 'permission'" class="icon-button" :aria-label="t('chromeSiteAccess')" :title="t('chromeSiteAccess')" @click="act(openSiteAccess)"><Icon name="settings" /></button><button v-if="pendingOutput(task) && task.error && !automaticOutput(task)" class="text-button" @click="act(() => taskAction('retryOutput',task))"><Icon name="download" />{{ t('saveFile') }}</button><button v-if="task.recording?.active && task.state === 'recording'" class="text-button" @click="act(()=>changeTask(task.id,value=>{value.recording!.active=false;}))"><Icon name="stop" />{{ t('stopRecording') }}</button><button v-if="task.live?.segments && ['paused','failed'].includes(task.state)" class="text-button" @click="act(() => taskAction('recoverLive',task))">{{ t('recoverRecording') }}</button><button v-if="task.live?.active && task.state === 'recording'" class="text-button" @click="act(() => taskAction('stopLive',task))"><Icon name="stop" />{{ t('stopRecording') }}</button><button v-if="!task.saved && ['queued','fetching','assembling','validating'].includes(task.state)" class="text-button" @click="act(() => taskAction('pause',task))"><Icon name="pause" />{{ t('pause') }}</button><button v-if="!task.live && (task.state === 'paused' || task.state === 'failed')" class="text-button" @click="act(() => taskAction('resume',task))"><Icon name="play" />{{ t('resume') }}</button><button v-if="!task.saved && !['failed','cancelled','completed'].includes(task.state)" class="text-button danger" @click="act(() => taskAction('cancel',task))"><Icon name="close" />{{ t('cancel') }}</button><button v-if="task.saved && task.downloadId !== undefined" class="icon-button" :aria-label="t('show')" :title="t('show')" @click="act(() => taskAction('reveal',task))"><Icon name="folder" /></button><button v-if="videoTask(task) && (task.saved || task.output)" class="text-button" :disabled="!!casting" :aria-busy="casting === task.id" @click="castTask(task)"><Icon :name="casting === task.id ? 'refresh' : 'cast'" :class="{spinning:casting === task.id}" />{{ t('castVideo') }}</button><button v-if="videoTask(task) && (task.saved || task.output)" class="icon-button" :aria-label="t('trimTool')" :title="t('trimTool')" @click="openManager('tools',task.id)"><Icon name="trim" /></button><button v-if="task.saved || task.output" class="text-button popup-tools" @click="openManager('queue',task.id)"><Icon name="tools" />{{ t('mediaTools') }}</button></div>
          </article>
          <p class="popup-progress-hint">{{ t('popupContinue') }}</p>
        </section>
      </template>
      <template v-else>
        <section class="manager-intro"><div><h1>{{ t(view) }}</h1><p class="manager-description">{{ t(`manager_${view}_description`) }}</p></div><LanguagePicker /><span v-if="['queue','library'].includes(view)" class="result-count">{{ t('managerResults',[countFormat.format(filtered.length)]) }}</span></section>
        <div v-if="view === 'tools' && toolsSource && !toolsFiles.length" class="settings-card"><p dir="auto">{{ toolsSource.title }}</p><p>{{ t(toolsSource.saved || toolsSource.output ? 'chooseLocalFiles' : 'preparingConversion') }}</p><button v-if="toolsSource.saved || toolsSource.output" class="secondary" @click="act(async()=>{await allowFileAccess();toolsFiles=[await taskFile(toolsSource!)];})">{{ t('allowLocalFiles') }}</button></div><MediaTools v-if="view === 'tools'" embedded :open="true" :initial="toolsFiles" :initial-kind="toolsKind" :defaults="prefs.conversion" :compression="prefs.compression" :busy="importing" @submit="(files,operation) => act(() => runPanelTool(files,operation))" />
        <TVPanel v-if="view === 'tv'" :tab-id="Number(tvParams.get('sourceTabId'))" :media-id="tvParams.get('mediaId') || ''" :variant-id="tvParams.get('variantId') || ''" :task-id="tvParams.get('taskId') || undefined" />
        <CloudPanel :initial-tasks="cloudTasks" v-show="view === 'cloud'" />
        <nav v-if="view === 'record'" class="popup-tabs recording-modes" :aria-label="t('record')"><button :aria-pressed="recordMode === 'stream'" @click="recordMode = 'stream'">{{ t('liveMode') }}</button><button :aria-pressed="recordMode === 'capture'" @click="recordMode = 'capture'">{{ t('captureMode') }}</button></nav>
        <LivePanel v-show="view === 'record' && recordMode === 'stream'" :visible="view === 'record' && recordMode === 'stream'" :tasks="tasks" @changed="act(refresh)" />
        <RecordingPanel :capture-token="tvParams.get('capture') || undefined" :source-tab-id="tvParams.has('sourceTabId') ? Number(tvParams.get('sourceTabId')) : undefined" v-show="view === 'record' && recordMode === 'capture'" @ready="id => act(() => saveOutput(id))" @changed="act(refresh)" />
        <section v-if="view === 'help'" class="settings-card"><h2>{{ t('help') }}</h2><p>{{ t('helpLocal') }}</p><p>{{ t('conversionHint') }}</p><a class="primary" :href="helpUrl" target="_blank" rel="noreferrer">{{ t('helpOpen') }}</a></section>
        <template v-else-if="!['settings','record','cloud','tv','tools'].includes(view)">
          <component :is="PlaylistBatches" v-if="PlaylistBatches" :tasks="tasks" />
          <p v-if="view === 'library' && activeTasks" class="manager-notice"><Icon name="download" />{{ t('keepOpen') }}</p>
          <div class="toolbar"><div class="search"><Icon name="search" /><input v-model="search" :placeholder="t('search')" :aria-label="t('search')"><button v-if="search" class="icon-button" :aria-label="t('clearSearch')" @click="search = ''"><Icon name="close" /></button></div><div class="toolbar-actions"><button class="icon-button" :aria-label="t('allowLocalFiles')" :title="t('allowLocalFiles')" @click="act(allowFileAccess)"><Icon name="folder" /></button><button class="icon-button" :class="{starred:favorites}" :aria-label="t('favorite')" :title="t('favorite')" :aria-pressed="favorites" @click="favorites = !favorites"><Icon name="star" /></button><span class="toolbar-divider" aria-hidden="true" /><button class="icon-button" :aria-label="t('export')" :title="t('export')" @click="act(exportMetadata)"><Icon name="export" /></button><button class="icon-button danger" :aria-label="t('clearHistory')" :title="t('clearHistory')" :disabled="!historyAvailable || clearingHistory" @click="confirmClearHistory()"><Icon name="trash" /></button></div></div>
          <p v-if="batchNotice" role="status">{{ batchNotice }}</p><BatchFiles v-if="batchTasks.length" :tasks="batchTasks" :action="batchAction" @close="batchTasks=[]" @ready="files=>act(()=>runBatch(files))" /><p v-if="historyNotice" class="history-status" role="status">{{ historyNotice }}</p>
          <section v-if="!filtered.length" class="empty-state manager-empty"><div class="empty-illustration"><img src="/brand/kingfisher.svg" alt="" width="84" height="84"><span><Icon :name="search || favorites ? 'search' : 'download'" /></span></div><h2>{{ t(search || favorites ? 'managerNoResults' : 'noTasks') }}</h2><p>{{ t(search || favorites ? 'managerNoResultsHint' : 'managerEmptyHint') }}</p><button v-if="search || favorites" class="secondary" @click="search = ''; favorites = false">{{ t('resetFilters') }}</button></section>
          <div v-if="filtered.length" class="selection-bar"><label><input type="checkbox" :checked="visibleTasks.length > 0 && visibleTasks.every(task=>selection.has(task.id))" @change="selectPage(($event.target as HTMLInputElement).checked)">{{ t('selectPage') }}</label><span>{{ t('selectedCount',[String(selection.size)]) }}</span><template v-if="selection.size"><button class="secondary" :disabled="!selectedReady.length" @click="beginBatch('convert')"><Icon name="convert" />{{ t('convertTool') }}</button><button class="secondary" :disabled="!selectedReady.length" @click="beginBatch('compress')">{{ t('compressTool') }}</button><button class="secondary" :disabled="selectedReady.length < 2" @click="beginBatch('merge')"><Icon name="merge" />{{ t('mergeTool') }}</button><button class="secondary" :disabled="!selectedReady.length" @click="beginBatch('cloud')"><Icon name="cloud" />{{ t('cloud') }}</button><button class="secondary danger" :disabled="!selectedDeletable.length" @click="confirmClearHistory(selectedDeletable.map(task=>task.id))"><Icon name="trash" />{{ t('deleteSelection') }}</button><button class="text-button" @click="selection=new Set()">{{ t('clearSelection') }}</button></template></div><div class="task-list"><article v-for="task in visibleTasks" :key="task.id" class="task-card" :data-state="task.state" :data-task-id="task.id"><div class="task-top"><div class="task-title"><input type="checkbox" class="task-select" :aria-label="t('selectVideo') + ' · ' + task.title" :checked="selection.has(task.id)" @change="toggleTask(task.id)"><TaskThumbnail v-if="videoTask(task)" :task="task" /><Icon v-else name="play" /><div><h2 dir="auto" :title="task.title">{{ task.title }}</h2><p><span class="task-state" :data-state="task.state">{{ t(task.conversion && !task.conversion.ready && task.state === 'fetching' ? 'preparingConversion' : task.live && !task.live.active && task.state === 'recording' ? 'liveStopping' : taskPhase(task)) }}</span><bdi>{{ task.conversion ? t((task.conversion.operation?.kind ?? 'convert') + 'Tool') : task.variant.label || t('original') }}</bdi><bdi v-if="task.live">{{ duration(task.live.duration) }}</bdi><span>{{ bytes(task.bytes || undefined) }}</span><time :datetime="new Date(task.createdAt).toISOString()">{{ dateFormat.format(task.createdAt) }}</time></p></div></div><div class="task-header-actions"><button v-if="videoTask(task) && (task.saved || task.output)" class="icon-button library-cast" :disabled="!!casting" :aria-busy="casting === task.id" :aria-label="t('castVideo')" :title="t(casting === task.id ? 'sourceChecking' : 'castVideo')" @click="castTask(task)"><Icon :name="casting === task.id ? 'refresh' : 'cast'" :class="{spinning:casting === task.id}" /></button><button class="icon-button" :class="{ starred:task.favorite }" :aria-label="t('favorite')" :aria-pressed="!!task.favorite" @click="act(() => taskAction('favorite',task))"><Icon name="star" /></button></div></div>
            <progress v-if="['queued','fetching','assembling','converting','validating'].includes(task.state) && !task.saved" :value="task.total || managedTask(task) ? taskProgress(task) : undefined" max="1" :aria-label="t(task.state)" />
            <div v-if="task.error" class="task-error"><p>{{ errorText(task.error) }}</p><details><summary>{{ t('technicalDetails') }}</summary><bdi class="error-code">{{ task.error }}</bdi></details></div>
            <p v-if="task.validation" class="validation"><Icon name="check" />{{ t('verified') }} · <bdi>{{ duration(task.validation.duration) }} · {{ task.validation.tracks.map(x => x.codec).join(' + ') }}</bdi></p>
            <p v-for="noticeCode in (task.notices ?? []).filter(code => task.saved || code === 'multipartUnavailable')" :key="noticeCode" class="task-notice" role="note">{{ t(`notice_${noticeCode}`) }}</p>
            <p v-if="task.conversion?.operation?.kind === 'compress' && task.validation" class="task-notice">{{ bytes(task.conversion.inputBytes) }} → {{ bytes(task.bytes) }}</p>
            <p v-if="task.media.kind === 'sabr' && !task.saved" class="task-notice" role="note">{{ t('sabrRestartHint') }}</p><p v-if="task.media.providerId?.startsWith('tiktok:') && !task.saved" class="task-notice">{{ t('tiktokHint') }}</p>
            <p v-if="task.conversion && !task.saved" class="task-notice">{{ t('conversionRestartHint') }}</p>
            <div class="task-actions"><button v-if="task.live?.active && task.state === 'recording'" class="primary" @click="act(() => taskAction('stopLive',task))"><Icon name="stop" />{{ t('stopRecording') }}</button><button v-if="task.live?.segments && ['paused','failed'].includes(task.state)" class="secondary" @click="act(() => taskAction('recoverLive',task))">{{ t('recoverRecording') }}</button><button v-if="task.recording && task.state === 'paused'" class="secondary" @click="act(() => recoverRecording(task))"><Icon name="record" />{{ t('recoverRecording') }}</button><button v-if="task.recording && task.state === 'recording'" class="primary" @click="act(() => changeTask(task.id,t => { t.recording!.active = false }))"><Icon name="stop" />{{ t('stopRecording') }}</button><div v-if="task.saved || task.output" class="task-file-actions" role="group" :aria-label="t('mediaTools')">
              <button type="button" class="secondary task-icon-button" :aria-label="t('trimTool')" :title="t('trimTool')" :disabled="!videoTask(task) || importing" @click="act(() => openTools(task,'trim'))"><Icon name="trim" /></button>
              <button type="button" class="secondary task-icon-button" :aria-label="t('cropTool')" :title="t('cropTool')" :disabled="!videoTask(task) || importing" @click="act(() => openTools(task,'crop'))"><Icon name="crop" /></button>
              <button type="button" class="secondary task-icon-button" :aria-label="t('mergeTool')" :title="t('mergeTool')" :disabled="!videoTask(task) || importing" @click="act(() => openTools(task,'merge'))"><Icon name="merge" /></button>
              <button type="button" class="secondary task-icon-button" :aria-label="t('convertTool')" :title="t('convertTool')" :disabled="!videoTask(task) || importing" @click="batchTasks=[task];batchAction='convert'"><Icon name="convert" /></button>
              <button type="button" class="secondary task-icon-button" :aria-label="t('compressTool')" :title="t('compressTool')" :disabled="!videoTask(task) || importing" @click="batchTasks=[task];batchAction='compress'"><Icon name="compress" /></button>
              <button type="button" class="secondary task-icon-button" :aria-label="t('cloud')" :title="t('cloud')" :disabled="!!task.owner" @click="openCloud([task])"><Icon name="cloud" /></button>
              <button type="button" class="secondary task-icon-button" :aria-label="t('show')" :title="t('show')" :disabled="task.downloadId === undefined || !task.saved" @click="act(() => taskAction('reveal',task))"><Icon name="folder" /></button>
            </div><label v-if="task.conversion && !task.conversion.ready && ['paused','failed'].includes(task.state)" class="secondary file-picker">{{ t('chooseConversionFile') }}<input type="file" accept="video/*,.mkv,.mov,.webm,.ts,.m2ts,.m4v,.avi" :aria-label="t('chooseConversionFile')" :disabled="importing" @change="conversionFile($event,undefined,task)"></label><button v-if="pendingOutput(task) && task.error && !automaticOutput(task)" class="primary" :disabled="savingOutputs.has(task.id)" @click="act(() => taskAction('retryOutput',task))"><Icon name="download" />{{ t('saveFile') }}</button><button v-if="task.error === 'permission'" class="secondary" @click="act(openSiteAccess)"><Icon name="settings" />{{ t('chromeSiteAccess') }}</button><button v-if="['fetching','assembling','converting'].includes(task.state)" class="secondary" @click="act(() => taskAction('pause',task))"><Icon name="pause" />{{ t('pause') }}</button><button v-if="!task.recording && !task.live && (!task.conversion || task.conversion.ready) && (task.state === 'paused' || (task.state === 'failed' && !task.downloadId))" class="secondary" @click="act(() => taskAction('resume',task))"><Icon name="play" />{{ t('resume') }}</button><button v-if="['queued','fetching','assembling','converting','recording','paused','validating'].includes(task.state)" class="text-button" @click="act(() => taskAction('cancel',task))">{{ t('cancel') }}</button><button v-if="!task.saved && !task.output && ['completed','failed','cancelled','paused'].includes(task.state)" class="text-button danger task-icon-button" :aria-label="t('remove')" :title="t('remove')" :disabled="!!task.owner && (task.leaseUntil ?? 0) >= Date.now()" @click="act(() => taskAction('delete',task))"><Icon name="trash" /></button></div>
          </article></div>
          <nav v-if="taskPages > 1" class="pagination" :aria-label="t('pagination')"><button class="secondary" :disabled="taskPage === 1" @click="taskPage--">{{ t('previousPage') }}</button><span role="status">{{ t('pageStatus', [String(taskPage), String(taskPages)]) }}</span><button class="secondary" :disabled="taskPage === taskPages" @click="taskPage++">{{ t('nextPage') }}</button></nav>
        </template>
        <form v-else-if="view === 'settings'" class="settings-card manager-settings" @submit.prevent="act(saveSettings)">
          <section class="settings-section detection-settings"><div class="settings-section-heading"><span><Icon name="detection" /></span><div><h2>{{ t('detectionSettings') }}</h2><p>{{ t('detectionSettingsHint') }}</p></div></div>
            <label class="global-detection"><span><input type="checkbox" :aria-label="t('globalDetection')" aria-describedby="global-detection-description" :checked="prefs.globalDetection" @change="toggleGlobal"> {{ t('globalDetection') }}</span><small id="global-detection-description">{{ t('globalDetectionHint') }}</small></label>
            <div class="setting-columns"><label>{{ t('minimumSize') }}<select v-model.number="prefs.minSize" :aria-label="t('minimumSize')"><option v-for="size in sizePresets" :key="size" :value="size">{{ bytes(size) }}</option></select><small>{{ t('sizeFilterHint') }}</small></label><label>{{ t('badge') }}<select v-model="prefs.badge" :aria-label="t('badge')"><option v-for="badge in ['count','dot','hidden']" :key="badge" :value="badge">{{ t(badge) }}</option></select></label></div>
            <label class="blocked-setting">{{ t('blockedSites') }}<textarea v-model="blockedText" rows="3" dir="ltr" :aria-label="t('blockedSites')" :placeholder="t('blockedExample')" /><small>{{ t('blockedHint') }}</small></label>
          </section>
          <section class="settings-section appearance-settings"><div class="settings-section-heading"><span><Icon name="palette" /></span><div><h2>{{ t('appearanceSettings') }}</h2><p>{{ t('appearanceSettingsHint') }}</p></div></div><label>{{ t('theme') }}<select v-model="prefs.theme" :aria-label="t('theme')"><option v-for="theme in ['system','light','dark']" :key="theme" :value="theme">{{ t(theme) }}</option></select></label><div class="theme-preview" aria-hidden="true"><span class="theme-preview-nav"><i /><i /><i /></span><span class="theme-preview-body"><i /><i /><i /></span></div></section>
          <section class="settings-section destination-settings"><div class="settings-section-heading"><span><Icon name="folder" /></span><div><h2>{{ t('downloadDestination') }}</h2><p>{{ t('destinationSettingsHint') }}</p></div></div>
            <label class="download-mode"><input v-model="prefs.saveAs" type="radio" :value="false" name="save-mode"><span>{{ t('saveAutomatically') }}</span></label>
            <label class="download-mode"><input v-model="prefs.saveAs" type="radio" :value="true" name="save-mode"><span>{{ t('saveAsk') }}</span></label>
            <div v-if="!prefs.saveAs" class="automatic-folder"><label>{{ t('downloadSubfolder') }}<input v-model="prefs.folder" maxlength="120" dir="ltr" aria-describedby="download-folder-hint"></label><p id="download-folder-hint">{{ t('downloadFolderHint') }}</p><button type="button" class="text-button" @click="act(chooseChromeFolder)"><Icon name="folder" />{{ t('chromeDownloadSettings') }}</button></div>
          </section>
          <fieldset class="download-settings conversion-settings settings-section"><legend class="sr-only">{{ t('conversionSettings') }}</legend><div class="settings-section-heading"><span><Icon name="tools" /></span><div><h2>{{ t('conversionSettings') }}</h2></div></div><p>{{ t('conversionHint') }}</p><ConversionControls v-model="prefs.conversion" /><div class="settings-buttons"><button class="secondary" type="button" @click="act(() => openTools())"><Icon name="tools" />{{ t('mediaTools') }}</button><label class="primary file-picker"><Icon name="add" />{{ t('chooseConversionFile') }}<input type="file" accept="video/*,.mkv,.mov,.webm,.ts,.m2ts,.m4v,.avi" :aria-label="t('chooseConversionFile')" :disabled="importing" @change="conversionFile($event)"></label></div></fieldset>
          <fieldset class="download-settings settings-section"><legend>{{ t('compressionSettings') }}</legend><p>{{ t('compressionDefaultsHint') }}</p><ConversionControls v-model="prefs.compression" /></fieldset><fieldset class="download-settings settings-section"><legend>{{ t('captureQuality') }}</legend><select v-model="prefs.captureQuality" :aria-label="t('captureQuality')"><option value="source">{{ t('captureSource') }}</option><option value="high">1080p</option><option value="standard">720p</option></select><p>{{ t('captureQualityHint') }}</p></fieldset><fieldset class="download-settings concurrent-settings settings-section" data-concurrent-downloads><legend class="sr-only">{{ t('concurrentDownloads') }}</legend><div class="settings-section-heading"><span><Icon name="download" /></span><div><h2>{{ t('concurrentDownloads') }}</h2></div></div><label class="multipart-count"><span>{{ t('concurrentFiles') }}</span><select v-model.number="prefs.maxConcurrentFiles" :aria-label="t('concurrentFiles')"><option v-for="count in concurrentFileOptions" :key="count" :value="count">{{ count }}</option></select></label><p class="setting-hint">{{ t('concurrentFilesHint') }}</p><p class="setting-hint">{{ t('concurrentFilesChangeHint') }}</p></fieldset><fieldset class="download-settings multipart-settings settings-section"><legend class="sr-only">{{ t('multipartDownloads') }}</legend><div class="settings-section-heading"><span><Icon name="download" /></span><div><h2>{{ t('multipartDownloads') }}</h2></div></div><label class="multipart-enable"><input v-model="prefs.multipart" type="checkbox"><span>{{ t('multipartEnable') }}</span></label><label class="multipart-count"><span>{{ t('multipartConnections') }}</span><select :aria-label="t('multipartConnections')" v-model.number="prefs.connections" :disabled="!prefs.multipart"><option v-for="count in [2,4,8]" :key="count" :value="count">{{ count }}</option></select></label><p class="setting-hint">{{ t('multipartHint') }}</p></fieldset>
          <div class="settings-savebar"><span role="status">{{ notice }}</span><div><button class="text-button" type="button" @click="prefs = { ...defaults,conversion:{...conversionDefaults},compression:{...compressionDefaults} }; blockedText = ''; act(saveSettings)">{{ t('reset') }}</button><button class="primary" type="submit"><Icon name="check" />{{ t('save') }}</button></div></div>
        </form>
        <dialog ref="historyDialog" class="history-dialog" aria-labelledby="history-title" aria-describedby="history-description" @cancel="clearingHistory && $event.preventDefault()" @close="historyIds = []"><form @submit.prevent="act(clearHistory)"><h2 id="history-title">{{ t(historySelection ? 'deleteSelection' : 'clearHistoryTitle') }}<span v-if="historySelection"> · {{ historyIds.length }}</span></h2><p id="history-description">{{ t(historySelection ? 'deleteSelectionHint' : 'clearHistoryHint') }}</p><div class="dialog-actions"><button type="button" class="secondary" :disabled="clearingHistory" autofocus @click="historyDialog?.close()">{{ t('cancel') }}</button><button type="submit" class="primary" :disabled="clearingHistory">{{ t('confirmClearHistory') }}</button></div></form></dialog>
      </template>
    </main>
    <footer v-if="popup" class="popup-footer"><div class="popup-footer-actions"><div class="popup-quick-actions"><template v-if="activeCapture"><button class="icon-button" :aria-label="t('annotations')" :title="t('annotations')" @click="act(annotateCapture)"><Icon name="tools" /></button><button class="secondary" @click="act(()=>changeTask(activeCapture!.id,task=>{task.recording!.active=false;}))"><Icon name="stop" /><span>{{ t('stopRecording') }}</span></button></template><button v-else class="secondary" :disabled="tabId < 0 || !pageHost || captureOpening" @click="act(captureTab)"><Icon name="record" /><span>{{ t('captureTab') }}</span></button></div><button class="secondary popup-library" @click="openManager()"><Icon name="library" /><span>{{ t('library') }}</span><span v-if="unfinished" class="count">{{ countFormat.format(unfinished) }}</span><Icon name="arrow" /></button></div><span class="footer-brand">Alcydeo <bdi>{{ version }}</bdi></span></footer>
    <footer v-else class="manager-footer"><Icon name="shield" /><span>{{ t('privacy') }}</span></footer>
  </div>
</template>
