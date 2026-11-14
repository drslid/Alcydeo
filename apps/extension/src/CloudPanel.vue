<script setup lang="ts">
import Icon from './Icon.vue';
import CloudProviderIcon from './CloudProviderIcon.vue';
import{clearCloudTemporary,hasCloudOwner}from'../../../packages/cloud/temporary';
import{pcloudDestination}from'../../../packages/cloud/pcloud';
import{noSetupCloudProviders,cloudFileLimit,planCloudTargets}from'../../../packages/cloud/destinations';
import{ref,computed,watch,onMounted,onUnmounted}from'vue';import{t,bytes,errorText}from'./i18n';import{cleanName,type Task}from'../../../packages/contracts';import{taskFile}from'./task-files';import{cloudJobs,putCloudJob,changeCloudJob,removeCloudJob}from'../../../packages/cloud/storage';import{cancelCloudSession}from'../../../packages/cloud/transport';import{cloudNames,cloudRequiresAccount,type CloudProvider,type CloudJob,type PcloudDestination}from'../../../packages/cloud/contracts';import{acquire,renew,release}from'../../../packages/storage';
const props=defineProps<{initialTasks?:Task[]}>();const provider=ref<CloudProvider>('gofile'),jobs=ref<CloudJob[]>([]),error=ref(''),preparing=ref(false);const owner=crypto.randomUUID();let worker:Worker|undefined,active='',timer:ReturnType<typeof setInterval>,refreshing=false,disposed=false,importAbort:AbortController|undefined;
const cleaning=ref(false),cleanupDone=ref(false),cleanupError=ref(''),working=computed(()=>preparing.value||cleaning.value),cleanupBusy=computed(()=>preparing.value||jobs.value.some(job=>hasCloudOwner(job)));
const depositLink=ref(''),depositRegion=ref<'eu'|'us'>('eu');watch(depositLink,value=>{try{if(new URL(value.trim()).hostname==='e.pcloud.com')depositRegion.value='eu';}catch{/* Codes keep the explicitly selected region. */}});
const providers:CloudProvider[]=[...noSetupCloudProviders,'pcloud'];
interface CloudFile{id:string;task?:Task;file?:File;resolving:boolean;prepared?:CloudProvider[]}
const files=ref<CloudFile[]>([]),canSend=computed(()=>files.value.length>0&&files.value.every(entry=>entry.file&&entry.file.size>0&&!entry.resolving));let selectionGeneration=0,selectionAbort:AbortController|undefined;
const preparationMessages=ref<string[]>([]),canSendSelected=computed(()=>canSend.value&&files.value.some(entry=>!entry.prepared?.includes(provider.value))),canSendAll=computed(()=>canSend.value&&files.value.some(entry=>planCloudTargets(entry.file!.size,noSetupCloudProviders,entry.prepared).send.length>0));
function name(entry:CloudFile){return entry.file?.name??entry.task?.filename?.split(/[\\/]/).pop()??entry.task?.title??'';}
function resetSelection(){selectionGeneration++;selectionAbort?.abort();}
watch(()=>props.initialTasks,async tasks=>{
 resetSelection();error.value='';const generation=selectionGeneration,controller=new AbortController();selectionAbort=controller;files.value=(tasks??[]).map(task=>({id:crypto.randomUUID(),task,resolving:true}));const pending=[...files.value];
 for(const entry of pending){
  if(controller.signal.aborted||disposed)return;if(!files.value.includes(entry))continue;
  try{const selected=await taskFile(entry.task!,controller.signal);if(generation===selectionGeneration&&!controller.signal.aborted&&files.value.includes(entry))entry.file=selected;}
  catch{/* An inline chooser provides explicit access to a missing local copy. */}
  finally{if(generation===selectionGeneration&&!controller.signal.aborted&&files.value.includes(entry))entry.resolving=false;}
 }
},{immediate:true});
async function act(fn:()=>Promise<unknown>){error.value='';try{await fn();}catch(e){error.value=e instanceof Error?e.message:'cloudNetwork';}}
function select(event:Event){const input=event.target as HTMLInputElement,selected=[...input.files??[]];input.value='';if(!selected.length)return;resetSelection();error.value='';files.value=selected.map(file=>({id:crypto.randomUUID(),file,resolving:false}));}
function choose(id:string,event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];input.value='';if(file)files.value=files.value.map(entry=>entry.id===id?{...entry,file,resolving:false,prepared:[]}:entry);}
function removeFile(id:string){files.value=files.value.filter(entry=>entry.id!==id);}
async function stage(all=false){
 if(working.value||!canSend.value)throw new Error('invalid');
 const selected=files.value.map(entry=>({entry,file:entry.file!,sourceId:entry.task?.id,prepared:[...(entry.prepared??[])]})),targets=all?[...noSetupCloudProviders]:[provider.value];
 const destination=targets.includes('pcloud')?pcloudDestination(depositLink.value,depositRegion.value):undefined;
 preparationMessages.value=[];preparing.value=true;
 try{await navigator.locks.request('alcydeo:cloud-files',{mode:'shared'},async()=>{for(const input of selected){
  const plan=planCloudTargets(input.file.size,targets,input.prepared);let failed=false;
  if(!all&&plan.tooLarge.length)throw new Error('cloudFileTooLarge');
  if(!plan.send.length&&!plan.tooLarge.length)continue;
  for(const target of plan.tooLarge)preparationMessages.value.push(t('cloudTargetTooLarge',[input.file.name,cloudNames[target],bytes(cloudFileLimit(target))]));
  for(const target of plan.send){
   try{await stageOne(input.file,input.sourceId,target,destination,()=>{input.prepared.push(target);if(files.value.includes(input.entry))input.entry.prepared=[...input.prepared];});if(!input.prepared.includes(target))throw new Error('cancelled');}
   catch(e){if(input.prepared.includes(target))continue;failed=true;if(!all)throw e;preparationMessages.value.push(t('cloudTargetPreparationFailed',[input.file.name,cloudNames[target],errorText(e instanceof Error?e.message:'cloudInput')]));}
  }
  if(!failed)files.value=files.value.filter(current=>current!==input.entry);
 }});}finally{preparing.value=false;await refresh();}
}
async function stageOne(selected:File,sourceId:string|undefined,target:CloudProvider,destination:PcloudDestination|undefined,onPrepared:()=>void){
 if(disposed)throw new Error('cancelled');if(!selected.size)throw new Error('invalid');
 if(selected.size>cloudFileLimit(target))throw new Error('cloudFileTooLarge');
 const controller=new AbortController();importAbort=controller;const signal=controller.signal;const id=crypto.randomUUID(),now=Date.now();let held=false;let heartbeat:ReturnType<typeof setInterval>|undefined;
 const job:CloudJob={id,provider:target,destination,name:cleanName(selected.name),size:selected.size,mime:selected.type||'application/octet-stream',state:'preparing',bytes:0,createdAt:now,updatedAt:now,ready:false,owner,leaseUntil:now+30000,...(target==='onefichier'?{uploadAttempted:false}:{})};
 try{
  if(cloudRequiresAccount(job.provider))throw new Error('cloudProviderRemoved');
  if(destination)await chrome.storage.local.set({cloudPcloudLink:depositLink.value.trim(),cloudPcloudRegion:destination.region});
  if(sourceId){held=await acquire(sourceId,owner);if(!held)throw new Error('busy');}
  const estimate=await navigator.storage.estimate();if(estimate.quota!==undefined&&estimate.quota-(estimate.usage??0)<selected.size+16*1024*1024)throw new Error('space');await putCloudJob(job);
  heartbeat=setInterval(()=>{void changeCloudJob(id,t=>{if(t.state!=='preparing')controller.abort();t.leaseUntil=Date.now()+30000;}).then(()=>held?renew(sourceId!,owner):undefined).catch(()=>controller.abort());},5000);
  const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(`cloud-${id}`,{create:true});await selected.stream().pipeTo(await(await dir.getFileHandle('input',{create:true})).createWritable(),{signal});
  const staged=await changeCloudJob(id,t=>{if(t.state!=='preparing')return;t.state='queued';t.ready=true;t.owner=undefined;t.leaseUntil=undefined;});if(staged.state==='queued'&&staged.ready)onPrepared();
 }catch(e){await changeCloudJob(id,t=>{t.state='failed';t.error='cloudInput';t.owner=undefined;t.leaseUntil=undefined;}).catch(()=>{});throw e;}
 finally{clearInterval(heartbeat);if(held)await release(sourceId!,owner);if(importAbort===controller)importAbort=undefined;}
}
async function clearTemporary(){
 cleanupError.value='';error.value='';if(working.value){cleanupError.value='cloudTemporaryBusy';return;}cleaning.value=true;cleanupDone.value=false;
 try{await clearCloudTemporary();resetSelection();files.value=[];preparationMessages.value=[];cleanupDone.value=true;}
 catch(e){cleanupError.value=e instanceof Error?e.message:'cloudTemporaryFailed';}
 finally{cleaning.value=false;try{await refresh();}catch{cleanupDone.value=false;cleanupError.value='cloudTemporaryFailed';}}
}
async function refresh(){
 if(refreshing||disposed)return;refreshing=true;
 try{
  let list=await cloudJobs();for(const job of list)if(['preparing','uploading'].includes(job.state)&&(job.leaseUntil??0)<Date.now())await changeCloudJob(job.id,t=>{if((t.leaseUntil??0)<Date.now()){t.state=t.ready?'paused':'failed';t.error=t.ready?'cloudInterrupted':'cloudInput';t.owner=undefined;t.leaseUntil=undefined;}});
  list=await cloudJobs();jobs.value=list.sort((a,b)=>b.createdAt-a.createdAt);
  for(const job of list)if(cloudRequiresAccount(job.provider)&&['queued','uploading'].includes(job.state))await changeCloudJob(job.id,t=>{t.state='paused';t.error='cloudProviderRemoved';});
  const next=list.find(j=>j.state==='queued'&&j.ready&&!cloudRequiresAccount(j.provider));if(!worker&&next){active=next.id;worker=new Worker(new URL('./cloud.worker.ts',import.meta.url),{type:'module'});worker.onmessage=()=>{worker?.terminate();worker=undefined;active='';};worker.onerror=()=>{worker?.terminate();worker=undefined;const id=active;active='';void changeCloudJob(id,t=>{if(t.state==='uploading'){t.state='paused';t.error='cloudInterrupted';t.owner=undefined;t.leaseUntil=undefined;}});};worker.postMessage({type:'run',id:next.id});
  }
 }finally{refreshing=false;}
}
async function pause(job:CloudJob){await changeCloudJob(job.id,t=>{t.state='paused';});if(active===job.id)worker?.postMessage({type:'abort'});await refresh();}
async function resume(job:CloudJob){if(cleaning.value)throw new Error('busy');if(cloudRequiresAccount(job.provider))throw new Error('cloudProviderRemoved');const current=await changeCloudJob(job.id,t=>{if(!t.ready||t.state!=='paused'||hasCloudOwner(t))return;if(t.error==='cloudExpired')t.checkpoint=undefined;t.state='queued';t.error=undefined;});await refresh();if(!current.ready)throw new Error('cloudInput');if(current.state!=='queued')throw new Error('busy');}
async function cancel(job:CloudJob){await changeCloudJob(job.id,t=>{t.state='cancelled';});if(active===job.id)worker?.postMessage({type:'abort'});else if(!job.owner||(job.leaseUntil??0)<Date.now()){await cancelCloudSession(job.provider,job.checkpoint).catch(()=>{});await(await navigator.storage.getDirectory()).removeEntry(`cloud-${job.id}`,{recursive:true}).catch(()=>{});await changeCloudJob(job.id,t=>{t.checkpoint=undefined;t.destination=undefined;});}await refresh();}
async function remove(job:CloudJob){try{await removeCloudJob(job.id);await(await navigator.storage.getDirectory()).removeEntry(`cloud-${job.id}`,{recursive:true}).catch(()=>{});}finally{await refresh();}}
onMounted(()=>{void chrome.storage.local.get(['cloudPcloudLink','cloudPcloudRegion']).then(data=>{depositLink.value=typeof data.cloudPcloudLink==='string'?data.cloudPcloudLink:'';depositRegion.value=data.cloudPcloudRegion==='us'?'us':'eu';});void refresh();timer=setInterval(()=>{void refresh();},1000);});
onUnmounted(()=>{disposed=true;resetSelection();clearInterval(timer);importAbort?.abort();worker?.terminate();});
</script>
<template>
 <section class="cloud-panel">
  <form class="settings-card cloud-composer" @submit.prevent="act(stage)">
   <div class="cloud-composer-heading">
    <h2 class="panel-title"><Icon name="cloud" />{{ t('cloudSendTitle') }}</h2>
    <label class="secondary file-picker"><Icon name="add" />{{ t('cloudChooseFile') }}<input type="file" multiple :aria-label="t('cloudChooseFile')" :disabled="working" @change="select"></label>
   </div>
   <div v-if="error" class="alert" role="alert">{{ errorText(error) }}</div>
   <div class="cloud-selection">
    <ul v-if="files.length" class="cloud-selected-files"><li v-for="entry in files" :key="entry.id" class="cloud-selected-entry" :aria-busy="entry.resolving">
     <Icon :name="entry.resolving ? 'refresh' : entry.file ? 'check' : 'folder'" />
     <div class="cloud-file-name"><p class="selected-cloud-file" dir="auto" :title="name(entry)">{{ name(entry) }}</p><p v-if="entry.prepared?.length" class="cloud-file-status">{{ t('cloudPreparedDestinations',[entry.prepared.map(target=>cloudNames[target]).join(' · ')]) }}</p><span v-if="entry.resolving" class="cloud-file-status" role="status">{{ t('cloud_preparing') }}</span><label v-else-if="!entry.file" class="secondary file-picker">{{ t('cloudChooseFile') }}<input type="file" :aria-label="t('cloudChooseFile') + ' · ' + name(entry)" :disabled="working" @change="choose(entry.id,$event)"></label></div>
     <span v-if="entry.file" class="cloud-file-size">{{ bytes(entry.file.size) }}</span>
     <button type="button" class="icon-button" :aria-label="t('remove') + ' · ' + name(entry)" :title="t('remove')" :disabled="working" @click="removeFile(entry.id)"><Icon name="close" /></button>
    </li></ul>
   </div>
   <fieldset class="cloud-destinations" :disabled="working">
    <legend>{{ t('cloudProvider') }}</legend>
    <div class="cloud-provider-options" role="group" :aria-label="t('cloudProvider')">
     <button v-for="id in providers" :key="id" type="button" class="cloud-provider" :data-provider="id" :aria-label="cloudNames[id]" :aria-pressed="provider === id" :title="cloudNames[id] + ' · ' + t(['megaup','onefichier','turbobit'].includes(id) ? 'cloudExperimental' : id === 'gofile' ? 'cloudNoAccount' : 'cloudUploadLink')" @click="provider=id;error=''">
      <span class="cloud-provider-mark"><CloudProviderIcon :provider="id" /><Icon v-if="provider === id" name="check" /></span><strong>{{ cloudNames[id] }}</strong>
     </button>
    </div>
   </fieldset>
   <div v-if="provider === 'pcloud'" class="cloud-deposit-fields">
    <label>{{ t('cloudPcloudDestination') }}<input v-model="depositLink" type="text" dir="ltr" autocomplete="off" spellcheck="false" :disabled="working" placeholder="https://e.pcloud.com/#/puplink?code=…"></label>
    <label>{{ t('cloudPcloudRegion') }}<select v-model="depositRegion" :aria-label="t('cloudPcloudRegion')" :disabled="working || depositLink.trim().startsWith('https://e.pcloud.com/')"><option value="eu">{{ t('cloudRegionEu') }}</option><option value="us">{{ t('cloudRegionUs') }}</option></select></label>
   </div>
   <details class="cloud-provider-details">
    <summary>{{ cloudNames[provider] }} · {{ t('cloudProviderDetails') }}</summary>
    <p v-if="provider === 'gofile'">{{ t('gofilePublic') }}</p>
    <p v-else-if="provider === 'megaup'">{{ t('cloudMegaupHint') }} <a href="https://megaup.net/" target="_blank" rel="noopener noreferrer">{{ t('cloudMegaupOpen') }}</a></p>
    <p v-else-if="provider === 'onefichier'">{{ t('cloudOnefichierHint') }} <a href="https://1fichier.com/" target="_blank" rel="noopener noreferrer">{{ t('cloudOnefichierOpen') }}</a></p>
    <p v-else-if="provider === 'turbobit'">{{ t('cloudTurbobitHint') }} <a href="https://torbobit.net/" target="_blank" rel="noopener noreferrer">{{ t('cloudTurbobitOpen') }}</a></p>
    <p v-else-if="provider === 'pcloud'">{{ t('cloudPcloudHint') }}</p>
    <p>{{ t('cloudKeepOpen') }}</p><p>{{ t('cloudValidation') }}</p>
   </details>
   <div class="cloud-file-controls">
    <div class="cloud-send-actions" role="group" :aria-label="t('cloudSendActions')">
     <button class="primary" :disabled="!canSendSelected || working || (provider === 'pcloud' && !depositLink.trim())"><Icon name="cloud" /><span>{{ t(provider === 'turbobit' ? 'cloudTurbobitSend' : provider === 'onefichier' ? 'cloudOnefichierSend' : provider === 'megaup' ? 'cloudMegaupSend' : provider === 'gofile' ? 'cloudShare' : 'cloudPcloudSend') }}<span v-if="files.length > 1"> · {{ files.length }}</span></span></button>
     <button type="button" class="secondary cloud-send-all" data-cloud-all :aria-label="t('cloudSendAll')" :title="t('cloudSendAll')" :disabled="!canSendAll || working" @click="act(()=>stage(true))"><Icon name="cloud" />{{ t('cloudSendAllCompact') }}</button>
     <p class="cloud-file-status">{{ t('cloudSendAllHint') }}</p>
    </div>
   </div>
   <p class="cloud-keep-open">{{ t('cloudKeepOpenShort') }}</p>
   <ul v-if="preparationMessages.length" class="cloud-preparation-messages" role="status"><li v-for="(message,index) in preparationMessages" :key="index">{{ message }}</li></ul>
   <section class="cloud-cleanup">
    <button type="button" class="secondary danger" data-cloud-cleanup :aria-label="t('cloudClearTemporary')" :title="t('cloudClearTemporary')" :disabled="working || cleanupBusy" @click="clearTemporary"><Icon name="trash" />{{ t('cloudClearTemporaryCompact') }}</button>
    <p>{{ t('cloudClearTemporaryHint') }}</p>
    <p v-if="cleanupBusy" class="task-notice">{{ t('cloudTemporaryBusy') }}</p>
    <p v-if="cleanupError" class="alert" role="alert">{{ errorText(cleanupError) }}</p>
    <p v-if="cleanupDone" class="cloud-cleanup-result" role="status">{{ t('cloudTemporaryCleared') }}</p>
   </section>
  </form>
  <div class="task-list cloud-jobs">
   <h2 v-if="jobs.length" class="cloud-history-title">{{ t('cloudHistory') }} <span>{{ jobs.length }}</span></h2>
   <article v-for="job in jobs" :key="job.id" class="task-card" :data-cloud-id="job.id" :data-state="job.state">
    <div class="cloud-job-heading"><CloudProviderIcon :provider="job.provider" /><div><h3 dir="auto" :title="job.name">{{ job.name }}</h3><p>{{ cloudNames[job.provider] }} · {{ t('cloud_' + job.state) }} · {{ bytes(job.bytes) }} / {{ bytes(job.size) }}</p></div></div>
    <div class="task-actions">
     <a v-if="job.link" class="secondary" :href="job.link" target="_blank" rel="noreferrer">{{ t('cloudOpen') }}</a>
     <button v-if="job.state === 'uploading' && cloudRequiresAccount(job.provider)" class="secondary" @click="act(() => pause(job))">{{ t('pause') }}</button>
     <button v-if="job.state === 'paused' && job.ready && !cloudRequiresAccount(job.provider)" class="secondary" :disabled="!!job.owner && (job.leaseUntil ?? 0) >= Date.now()" @click="act(() => resume(job))">{{ t('resume') }}</button>
     <button v-if="['queued','uploading','paused'].includes(job.state)" class="text-button" @click="act(() => cancel(job))">{{ t('cancel') }}</button>
     <button v-if="['completed','cancelled','failed','paused'].includes(job.state)" class="icon-button danger" :aria-label="t('remove')" :title="t('remove')" :disabled="!!job.owner && (job.leaseUntil ?? 0) >= Date.now()" @click="act(() => remove(job))"><Icon name="trash" /></button>
    </div>
    <progress v-if="['preparing','queued','uploading'].includes(job.state)" :value="job.state === 'preparing' || ['onefichier','turbobit'].includes(job.provider) && job.state === 'uploading' ? undefined : job.bytes / job.size" max="1" />
    <p v-if="['onefichier','turbobit'].includes(job.provider) && job.state === 'uploading'" class="task-notice">{{ t('cloudOnefichierPending') }}</p>
    <p v-if="job.error" class="task-error">{{ errorText(job.error) }}</p>
    <p v-if="!cloudRequiresAccount(job.provider) && job.state === 'paused' && job.uploadAttempted !== false" class="task-notice">{{ t(job.provider === 'gofile' ? 'gofileRestart' : 'cloudRestart') }}</p>
    <p v-if="job.provider === 'pcloud' && job.state === 'completed'" class="task-notice">{{ t('cloudPcloudSent') }}</p>
    <p v-if="!job.ready && !['preparing','queued','uploading'].includes(job.state)" class="cloud-copy-unavailable">{{ t('cloudCopyUnavailable') }}</p>
   </article>
  </div>
 </section>
</template>

<style scoped>
.cloud-panel{display:grid;gap:16px;min-inline-size:0}
.cloud-panel .settings-card.cloud-composer{display:flex;flex-direction:column;gap:12px;min-inline-size:0;padding:20px;border-radius:16px}
.cloud-panel .cloud-composer-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;min-inline-size:0}
.cloud-panel .cloud-composer .panel-title{font-size:14px;font-weight:600;gap:8px}.cloud-panel .panel-title>.material-symbol{inline-size:20px;block-size:20px}
.cloud-panel .cloud-composer .file-picker{min-inline-size:0;inline-size:auto;max-inline-size:100%;margin:0;font-size:11px;min-block-size:34px;padding:7px 10px}
.cloud-panel .cloud-destinations{margin:0;padding:0}.cloud-panel .cloud-destinations legend{font-size:11px;margin-block-end:8px}
.cloud-panel .cloud-provider-options{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.cloud-panel .cloud-provider{min-block-size:64px;padding:8px 4px;gap:5px;border-radius:10px}
.cloud-panel .cloud-provider-mark{margin:0}.cloud-panel .cloud-provider-icon{inline-size:26px;block-size:26px}
.cloud-panel .cloud-provider strong{font-size:11px;line-height:1.3}.cloud-panel .cloud-provider-mark>.material-symbol{inline-size:12px;block-size:12px;inset-block-start:-2px;inset-inline-end:-7px}
.cloud-panel .cloud-composer .cloud-provider-details{font-size:11px;min-inline-size:0;color:var(--muted)}.cloud-provider-details summary{cursor:pointer;inline-size:fit-content;max-inline-size:100%;border-radius:4px}.cloud-provider-details summary:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
.cloud-panel .cloud-composer .cloud-provider-details p{font-size:11px;line-height:1.6;margin-block-start:8px;max-inline-size:none;overflow-wrap:anywhere}
.cloud-panel .cloud-deposit-fields{grid-template-columns:minmax(0,1fr) minmax(110px,180px);gap:12px}.cloud-panel .cloud-deposit-fields label{display:grid;gap:5px;font-size:11px;margin:0}.cloud-panel .cloud-deposit-fields input,.cloud-panel .cloud-deposit-fields select{font-size:11px;padding:8px}
.cloud-panel .cloud-selection{min-inline-size:0}.cloud-selected-files{list-style:none;padding:0;margin:0;display:grid;gap:6px}
.cloud-selected-entry{display:flex;align-items:center;gap:8px;min-inline-size:0;padding:6px 8px;background:var(--subtle);border-radius:8px}.cloud-selected-entry>.material-symbol{inline-size:16px;block-size:16px;flex-shrink:0;color:var(--muted)}
.cloud-file-name{min-inline-size:0;flex:1}.cloud-panel .cloud-composer .selected-cloud-file{font-size:12px;line-height:1.5;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-inline-size:none}.cloud-file-size{font-size:10px;color:var(--muted);white-space:nowrap}.cloud-selected-entry>.icon-button{inline-size:30px;block-size:30px;padding:5px;flex-shrink:0}
.cloud-panel .cloud-composer .cloud-file-status{font-size:10px;color:var(--muted);line-height:1.5;max-inline-size:none;overflow-wrap:anywhere}.cloud-selected-entry .file-picker{margin-block-start:5px!important}
.cloud-panel .cloud-file-controls{display:block;margin:0}.cloud-panel .cloud-send-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;min-inline-size:0}.cloud-send-actions button{inline-size:100%;min-inline-size:0;white-space:normal;justify-content:center;text-align:center;font-size:11px;padding:8px 10px}.cloud-send-actions .cloud-file-status{grid-column:1/-1}
.cloud-panel .cloud-composer .cloud-keep-open{font-size:10px;line-height:1.5;color:var(--muted);max-inline-size:none}.cloud-preparation-messages{font-size:11px;line-height:1.6;color:var(--muted);margin:0;padding-inline-start:18px;overflow-wrap:anywhere}
.cloud-cleanup{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:8px 12px;padding-block-start:12px;border-block-start:1px solid var(--workspace-line)}.cloud-cleanup button{white-space:normal;font-size:11px;padding:7px 10px;min-block-size:34px;max-inline-size:100%}
.cloud-panel .cloud-composer .cloud-cleanup p{font-size:10px;line-height:1.6;max-inline-size:none;overflow-wrap:anywhere}.cloud-cleanup .task-notice,.cloud-cleanup .alert,.cloud-cleanup-result{grid-column:1/-1}.cloud-cleanup .alert{margin:0}.cloud-cleanup-result{color:var(--success)}
.cloud-panel .cloud-jobs{margin:0;min-inline-size:0;border-radius:14px}.cloud-panel .cloud-history-title{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;padding:12px 14px;border-block-end:1px solid var(--workspace-line)}.cloud-history-title span{font-size:10px;color:var(--muted)}
.cloud-panel .cloud-jobs .task-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px 12px;padding:12px 14px;min-inline-size:0;border-radius:0}.cloud-job-heading{display:flex;align-items:center;gap:9px;min-inline-size:0}.cloud-job-heading>.cloud-provider-icon{inline-size:24px;block-size:24px;flex-shrink:0}.cloud-job-heading>div{min-inline-size:0}.cloud-job-heading h3{font-size:12px;line-height:1.5;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cloud-job-heading p{font-size:10px;color:var(--muted);line-height:1.6;overflow-wrap:anywhere}
.cloud-panel .cloud-jobs .task-actions{margin:0;gap:9px;justify-content:flex-end}.cloud-jobs .task-actions .secondary{font-size:10px;min-block-size:30px;padding:5px 8px}.cloud-jobs .task-actions .icon-button{inline-size:30px;block-size:30px;padding:6px}.cloud-jobs progress,.cloud-jobs .task-notice,.cloud-jobs .task-error,.cloud-copy-unavailable{grid-column:1/-1;margin:0}.cloud-jobs .task-notice,.cloud-jobs .task-error,.cloud-copy-unavailable{font-size:11px;line-height:1.6;overflow-wrap:anywhere}.cloud-copy-unavailable{color:var(--muted)}
@media(max-width:760px){.cloud-panel .settings-card.cloud-composer{padding:14px;gap:10px}.cloud-panel .cloud-composer-heading{flex-wrap:wrap;gap:8px}.cloud-panel .cloud-composer-heading .file-picker{inline-size:100%}.cloud-panel .cloud-provider-options{gap:5px}.cloud-panel .cloud-provider{min-block-size:60px;padding:7px 2px}.cloud-panel .cloud-provider strong{font-size:10px}.cloud-panel .cloud-deposit-fields{grid-template-columns:minmax(0,1fr);gap:8px}.cloud-cleanup{grid-template-columns:minmax(0,1fr);gap:7px}.cloud-cleanup button{justify-self:start}.cloud-panel .cloud-jobs .task-card{grid-template-columns:minmax(0,1fr);gap:8px}.cloud-panel .cloud-jobs .task-actions{justify-content:flex-start}.cloud-panel .cloud-jobs .task-actions .secondary{max-inline-size:100%;white-space:normal}}
</style>
