<script setup lang="ts">
import{nextTick,onBeforeUnmount,onMounted,ref,watch,type ComponentPublicInstance}from'vue';
import{LocalCast,localFileUrl,type LocalRemote,type LocalCastState}from'../../../packages/media-core/local-cast';
import{downloadedFileUrl,saveCastCopy,taskCastFile}from'./local-cast-file';
import{getTask,changeTask}from'../../../packages/storage';
import{namedTaskFile}from'../../../packages/media-core/filenames';
import{videoExtensions,formatMime}from'../../../packages/media-core/formats';
import{t,bytes}from'./i18n';import Icon from'./Icon.vue';
import{supportsNativeCast}from'./platform';
const props=defineProps<{taskId?:string}>();
const emit=defineEmits<{attention:[]}>();
const video=ref<HTMLVideoElement>(),guide=ref<HTMLElement>(),url=ref(''),name=ref(''),size=ref(0),ready=ref(false),error=ref(''),showGuide=ref(false),loading=ref(false),expectedName=ref('');
const nativePath=ref(''),candidates=ref<chrome.downloads.DownloadItem[]>([]);
const nativeFile=ref(false),copying=ref(false),castState=ref<LocalCastState>({phase:'disconnected'}),mediaDuration=ref(0);
let disposed=false,selection=0,savedId:number|undefined,sourceFile:File|undefined,associatedTaskId:string|undefined,controller:LocalCast|undefined,copyAbort:AbortController|undefined,blobUrl='';
watch([error,()=>castState.value.error],values=>{if(values.some(Boolean))emit('attention');});
watch(()=>castState.value.phase,phase=>{if(phase==='error')void instructions();});
function bind(element:Element|ComponentPublicInstance|null){const player=element as HTMLVideoElement|null;if(player===video.value&&controller)return;controller?.dispose();video.value=player??undefined;if(player){const remote=(player as HTMLVideoElement&{remote?:LocalRemote}).remote;if(remote)controller=new LocalCast(remote,value=>{if(!disposed)castState.value=value;});}}
function cast(){if(!supportsNativeCast){error.value='firefoxCastUnavailable';return;}error.value='';if(!controller){error.value='tvNotSupported';return;}void controller.choose();}
function metadata(){ready.value=true;mediaDuration.value=video.value?.duration??0;}
async function waitMetadata(player:HTMLVideoElement,signal:AbortSignal){
 if(signal.aborted||player.readyState>=1||player.error)return;
 await new Promise<void>(resolve=>{
  const finish=()=>{clearTimeout(timeout);player.removeEventListener('loadedmetadata',finish);player.removeEventListener('error',finish);signal.removeEventListener('abort',finish);resolve();},timeout=setTimeout(finish,10000);
  player.addEventListener('loadedmetadata',finish,{once:true});player.addEventListener('error',finish,{once:true});signal.addEventListener('abort',finish,{once:true});if(signal.aborted)finish();
 });
}
async function prepareCast(){
 if(!supportsNativeCast){error.value='firefoxCastUnavailable';return;}
 if(copying.value)return;const current=selection,abort=new AbortController();error.value='';copying.value=true;copyAbort=abort;
 try{
  if(!await chrome.extension.isAllowedFileSchemeAccess()){error.value='tvFileAccess';await chrome.tabs.create({url:`chrome://extensions/?id=${chrome.runtime.id}`});return;}
  if(!await chrome.permissions.request({origins:['file:///*']})){error.value='tvFileAccess';return;}
  if(disposed||selection!==current)return;
  let next:string;
  if(nativePath.value.trim())next=localFileUrl(nativePath.value.trim().replace(/^"|"$/g,''));
  else if(savedId!==undefined){try{next=await downloadedFileUrl(savedId);}catch{savedId=undefined;throw new Error('tvFileChooseAgain');}}
  else{if(!sourceFile)throw new Error('tvFileChooseAgain');const copy=await saveCastCopy(sourceFile,abort.signal);if(disposed||selection!==current)return;next=copy.url;savedId=copy.id;const taskId=associatedTaskId;if(taskId)await changeTask(taskId,task=>{if(!disposed&&selection===current&&associatedTaskId===taskId)task.castDownloadId=copy.id;}).catch(()=>{/* History can be cleared independently of this player. */});}
  if(disposed||selection!==current)return;
  controller?.dispose();controller=undefined;if(video.value){video.value.pause();video.value.removeAttribute('src');video.value.load();}
  if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl='';}ready.value=false;url.value=next;nativeFile.value=true;castState.value={phase:'disconnected'};await nextTick();bind(video.value??null);if(video.value)await waitMetadata(video.value,abort.signal);
  if(!disposed&&selection===current&&!abort.signal.aborted&&ready.value&&mediaDuration.value>15&&navigator.userActivation.isActive)cast();
 }catch(e){if(!disposed&&selection===current)error.value=e instanceof Error&&['tvFileChooseAgain','tvFilePath'].includes(e.message)?e.message:'tvFileCopyFailed';}
 finally{if(selection===current){copying.value=false;copyAbort=undefined;}}
}
function release(){copyAbort?.abort();copyAbort=undefined;copying.value=false;associatedTaskId=undefined;controller?.dispose();controller=undefined;nativeFile.value=false;castState.value={phase:'disconnected'};const player=video.value;if(player){player.pause();player.removeAttribute('src');player.load();}if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl='';url.value='';ready.value=false;showGuide.value=false;}
function select(file:File,taskId?:string){
 release();sourceFile=undefined;error.value='';name.value='';size.value=0;
 const ext=file.name.split('.').pop()?.toLowerCase()??'';
 if(!file.size||!videoExtensions.some(value=>value===ext)&&!file.type.startsWith('video/')){error.value='tvFileInvalid';return;}
 // Blob URLs retain the selected File without reading the video into JS memory.
 sourceFile=file;associatedTaskId=taskId;blobUrl=URL.createObjectURL(file.type?file:new File([file],file.name,{type:formatMime[ext]??'video/mp4'}));url.value=blobUrl;name.value=file.name;size.value=file.size;
}
async function choose(event:Event){selection++;const input=event.target as HTMLInputElement,file=input.files?.[0];input.value='';if(file){savedId=undefined;nativePath.value='';select(file);candidates.value=(await chrome.downloads.search({state:'complete',exists:true,limit:100})).filter(item=>item.filename.split(/[\\/]/).pop()===file.name&&item.fileSize===file.size).slice(0,8);}}
function clear(){selection++;release();savedId=undefined;sourceFile=undefined;name.value='';size.value=0;error.value='';}
async function instructions(){showGuide.value=true;await nextTick();guide.value?.focus();guide.value?.scrollIntoView({behavior:'smooth',block:'nearest'});}
const permissionsRemoved=(permission:chrome.permissions.Permissions)=>{if(permission.origins?.some(origin=>origin.startsWith('file:'))&&nativeFile.value){release();error.value='tvFileAccess';}};
onMounted(async()=>{
 chrome.permissions.onRemoved.addListener(permissionsRemoved);
 if(!props.taskId)return;const current=selection;loading.value=true;
 try{
  const task=await getTask(props.taskId);if(!task)throw new Error();if(disposed||selection!==current)return;
  expectedName.value=task.filename?.split(/[\\/]/).pop()||task.title;
  const local=await taskCastFile(task);if(disposed||selection!==current)return;savedId=local?.id;
  if(supportsNativeCast&&local&&await chrome.extension.isAllowedFileSchemeAccess()&&await chrome.permissions.contains({origins:['file:///*']})){if(disposed||selection!==current)return;associatedTaskId=task.id;url.value=local.url;nativeFile.value=true;name.value=expectedName.value;size.value=task.bytes;return;}
  if(!task.output)return;
  const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(task.id),file=await(await dir.getFileHandle(task.output)).getFile();
  if(!disposed&&selection===current)select(namedTaskFile(task,file),task.id);
 }catch{if(!disposed&&selection===current&&savedId===undefined)error.value='tvFileChooseAgain';}
 finally{loading.value=false;}
});
onBeforeUnmount(()=>{chrome.permissions.onRemoved.removeListener(permissionsRemoved);disposed=true;selection++;release();});

async function quickCast(){if(!supportsNativeCast)return false;for(let n=0;n<250;n++){if(disposed)return false;if(!loading.value&&nativeFile.value&&ready.value){if(!navigator.userActivation.isActive)return false;void cast();return true;}if(!loading.value&&!nativeFile.value)return false;await chrome.storage.session.get('capture-status');}return false;}
defineExpose({quickCast});
</script>
<template>
 <section class="local-tv">
  <h3>{{ t('tvLocalFile') }}</h3><p v-if="supportsNativeCast">{{ t('tvFileIntro') }}</p>
  <p v-if="!supportsNativeCast" class="task-notice">{{ t('firefoxCastUnavailable') }}</p>
  <p v-if="supportsNativeCast" class="task-notice" data-local-cast-limits>{{ t('tvFileReceiverLimit') }}</p>
  <button v-if="supportsNativeCast" class="local-cast-guide-button" :class="showGuide ? 'primary' : 'text-button'" :aria-expanded="showGuide" @click="instructions">{{ t(showGuide ? 'tvFileCastTabSteps' : 'tvFileCastGuide') }}</button>
  <section v-if="showGuide" ref="guide" tabindex="-1" class="local-cast-guide" :aria-label="t('tvFileCastGuide')"><h4>{{ t('tvFileCastGuide') }}</h4><ol><li>{{ t('tvFileStepPlay') }}</li><li>{{ t('tvFileStepMenu') }}</li><li>{{ t('tvFileStepTab') }}</li></ol><p>{{ t('tvFileKeepOpen') }}</p></section>
  <p v-if="loading" role="status">{{ t('tvPreparing') }}</p>
  <p v-if="expectedName && !url" class="task-notice">{{ t('tvFileChooseSaved') }} <bdi>{{ expectedName }}</bdi></p>
  <label class="secondary file-picker"><Icon name="folder" />{{ t('tvFileChoose') }}<input type="file" accept="video/*,.mp4,.webm,.m4v,.mkv,.ts,.mov,.avi,.ogg,.mpg,.mpeg,.wmv,.flv,.3gp,.m2ts,.mts" :aria-label="t('tvFileChoose')" @change="choose"></label>
  <button v-if="supportsNativeCast && !url && savedId !== undefined" class="local-cast-prepare" :class="showGuide ? 'secondary' : 'primary'" :disabled="copying" @click="prepareCast"><Icon name="cast" />{{ t(copying ? 'tvFileCopying' : 'tvFilePrepare') }}</button>
  <template v-if="url">
   <div v-if="supportsNativeCast && !nativeFile && candidates.length" class="cast-existing"><p>{{ t('castReuseFile') }}</p><button v-for="item in candidates" :key="item.id" class="secondary" @click="savedId=item.id;prepareCast()"><Icon name="folder" /><bdi>{{ item.filename }}</bdi></button></div><details v-if="supportsNativeCast && !nativeFile" class="cast-path"><summary>{{ t('castLocalPath') }}</summary><label>{{ t('castLocalPath') }}<input v-model="nativePath" type="text" dir="ltr" :aria-label="t('castLocalPath')" placeholder="C:\Videos\video.mp4"></label></details><div class="local-file-heading"><h4 dir="auto" :title="name">{{ name }}</h4><bdi>{{ bytes(size) }}</bdi></div>
   <video :ref="bind" :src="url" :aria-label="t('tvLocalFile')" controls preload="metadata" playsinline @loadedmetadata="metadata" @error="ready=false;error='tvFileCodec'" />
   <div class="tv-actions"><button v-if="supportsNativeCast && nativeFile" class="local-cast-button" :class="showGuide ? 'secondary' : 'primary'" :disabled="!ready || mediaDuration <= 15 || ['choosing','connecting'].includes(castState.phase)" @click="cast"><Icon name="cast" />{{ t(castState.phase === 'connected' ? 'tvFileCastChange' : showGuide ? 'tvFileCastNative' : 'castVideo') }}</button><button v-else-if="supportsNativeCast" class="local-cast-prepare" :class="showGuide ? 'secondary' : 'primary'" :disabled="copying || !ready" @click="prepareCast"><Icon name="cast" />{{ t(copying ? 'tvFileCopying' : 'tvFilePrepare') }}</button><button class="text-button" @click="clear"><Icon name="close" />{{ t('tvFileClose') }}</button></div>
   <p v-if="nativeFile" class="cast-status" role="status" :data-phase="castState.phase">{{ t('tvFileState_' + castState.phase) }}</p><p v-if="nativeFile && ready && mediaDuration <= 15" class="task-notice">{{ t('tvFileShort') }}</p><p v-if="supportsNativeCast && !nativeFile" class="task-notice">{{ t(savedId !== undefined ? 'tvFileAccessHint' : 'tvFileCopyHint') }}</p>
  </template>
  <p v-if="error || castState.error" class="error" role="alert">{{ t(error || castState.error || '') }} <a v-if="error === 'tvFileCodec'" href="#tools">{{ t('mediaTools') }}</a></p>
  <p class="task-notice">{{ t('tvFilePrivacy') }}</p>
 </section>
</template>
<style scoped>
.local-tv h3{font-size:18px;margin-block:24px 10px}.local-tv p{font-size:13px;line-height:1.7;margin-block:12px}.local-tv video{display:block;width:100%;max-height:470px;aspect-ratio:16/9;object-fit:contain;background:#071b2d;border-radius:16px}.local-file-heading{display:flex;align-items:baseline;gap:16px;margin-block:24px 12px}.local-file-heading h4{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:15px}.local-file-heading bdi{font-size:12px;color:var(--muted);flex-shrink:0}.tv-actions{display:flex;flex-wrap:wrap;gap:12px;margin-block:20px}.local-cast-guide-button{display:block;margin-block:0 16px}.local-cast-guide{padding:20px;border:1px solid var(--border);background:var(--subtle);border-radius:16px;margin-block:0 20px}.local-cast-guide h4{margin:0}.local-cast-guide ol{padding-inline-start:24px;font-size:13px;line-height:1.8}.local-cast-guide li{padding-inline-start:6px;margin-block:10px}.file-picker{max-width:100%;width:fit-content}.local-tv .task-notice{color:var(--muted);font-size:12px}a{color:var(--primary)}
</style>
