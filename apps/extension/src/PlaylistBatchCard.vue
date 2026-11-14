<script setup lang="ts">
import{computed,ref}from'vue';import Icon from'./Icon.vue';import{api}from'./api';import{t,errorText,language}from'./i18n';import{taskProgress,taskPhase}from'../../../packages/media-core/output-saving';import type{Task}from'../../../packages/contracts';import type{PlaylistBatchView}from'../../../packages/playlists/contracts';
const props=defineProps<{job:PlaylistBatchView;tasks:Task[];compact?:boolean}>(),emit=defineEmits<{changed:[]}>();const busy=ref(false),error=ref('');
const current=computed(()=>props.tasks.find(t=>t.id===props.job.current?.taskId)),percent=computed(()=>new Intl.NumberFormat(language.value,{style:'percent',maximumFractionDigits:0}).format(current.value?taskProgress(current.value):0));
const saved=computed(()=>[...props.tasks].reverse().find(t=>t.playlist?.batchId===props.job.id&&t.saved&&t.downloadId!==undefined));
async function control(action:string){if(busy.value)return;busy.value=true;error.value='';try{await api('youtubePlaylistControl',{id:props.job.id,action});emit('changed');}catch(e){error.value=errorText((e as Error).message);}finally{busy.value=false;}}
</script>
<template>
 <article class="playlist-batch" :data-playlist-id="job.id" :data-state="job.state">
  <h3 v-if="!compact" dir="auto" :title="job.title">{{ job.title }}</h3>
  <p class="playlist-batch-status"><strong>{{ t(job.state === 'completed' && job.failed ? 'playlistPartial' : job.state === 'running' ? 'fetching' : job.state) }}</strong><span>{{ t('playlistProgress',[String(job.completed),String(job.total),String(job.failed)]) }}</span></p>
  <template v-if="job.current && !['completed','cancelled'].includes(job.state)">
   <p class="playlist-current" dir="auto" :title="job.current.title">{{ job.current.title }}</p>
   <p class="playlist-phase">{{ current ? t(taskPhase(current)) : t('playlistPreparing') }} <bdi v-if="current">{{ percent }}</bdi></p>
   <progress :value="current && (current.saved || current.progress > 0) ? taskProgress(current) : undefined" max="1" :aria-label="t('queue')" />
  </template>
  <p v-if="job.error || error" class="task-error" role="status">{{ error || errorText(job.error!) }}</p>
  <details v-if="job.errors.length" class="playlist-errors"><summary>{{ t('playlistPartial') }} · {{ job.failed }}</summary><p v-for="(item,index) in job.errors" :key="index"><bdi>{{ item.title }}</bdi> — {{ errorText(item.error ?? 'interrupted') }}</p></details>
  <div class="playlist-batch-actions">
   <button v-if="['queued','running'].includes(job.state)" class="text-button" :disabled="busy" @click="control('pause')"><Icon name="pause" />{{ t('pause') }}</button>
   <button v-if="job.state === 'paused'" class="text-button" :disabled="busy" @click="control('resume')"><Icon name="play" />{{ t('resume') }}</button>
   <button v-if="!['completed','cancelled'].includes(job.state)" class="text-button danger" :disabled="busy" @click="control('cancel')"><Icon name="close" />{{ t('cancel') }}</button>
   <button v-if="job.failed && ['completed','paused'].includes(job.state)" class="text-button" :disabled="busy" @click="control('retry')"><Icon name="refresh" />{{ t('playlistRetry') }}</button>
   <button v-if="saved" class="text-button" @click="api('reveal',{id:saved!.id}).catch(e=>error=errorText(e.message))"><Icon name="folder" />{{ t('show') }}</button>
  </div>
 </article>
</template>
