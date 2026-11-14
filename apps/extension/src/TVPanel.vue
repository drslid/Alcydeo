<script setup lang="ts">
import{onMounted,onBeforeUnmount,ref,watch}from'vue';
import LocalTVPanel from './LocalTVPanel.vue';
import{api}from'./api';import{t,errorText}from'./i18n';import Icon from'./Icon.vue';
import{mediaMatches,matchingVariant}from'../../../packages/media-core/grouping';import{directExtension}from'../../../packages/media-core/classification';import{audioExtensions}from'../../../packages/media-core/formats';import{permitted}from'../../../packages/media-core/network';
import{CastSession,castMime,type CastSnapshot,type CastMedia}from'../../../packages/media-core/cast-session';
import type{Media}from'../../../packages/contracts';
const props=defineProps<{tabId:number;mediaId:string;variantId:string;taskId?:string}>();
const mode=ref(props.mediaId&&!props.taskId?'source':'file');
const localPlayer=ref<InstanceType<typeof LocalTVPanel>>();let becameReady!:()=>void;const ready=new Promise<void>(resolve=>{becameReady=resolve;});
const title=ref(''),pageUrl=ref(''),sourceKind=ref(''),prepared=ref(false),error=ref(''),media=ref<CastMedia>(),status=ref<CastSnapshot>({phase:'idle',connected:false}),preview=ref(false);
watch(mode,()=>{preview.value=false;});
const supported=typeof(window as unknown as{PresentationRequest?:unknown}).PresentationRequest==='function'&&window.isSecureContext;
const windows=/Windows/i.test(navigator.userAgent);let controller:CastSession|undefined,disposed=false;let selectedMedia:Media|undefined;let selectedVariant:Media['variants'][number]|undefined;const reloading=ref(false);
async function cast(){if(!media.value||!controller||reloading.value)return;error.value='';
 if(!status.value.connected){await controller.choose();return;}
 reloading.value=true;try{await api('scan',{tabId:props.tabId,forceChecks:true});const next=await resolveSource();if(!next||disposed)return;media.value=next;controller.load(next);}catch(e){error.value=e instanceof Error&&/^[a-zA-Z]+$/.test(e.message)?e.message:'unsupported';}finally{reloading.value=false;}
}
async function original(){error.value='';try{const tab=await chrome.tabs.get(props.tabId);if(tab.incognito||tab.url!==pageUrl.value)throw new Error();await chrome.tabs.update(props.tabId,{active:true});await chrome.windows.update(tab.windowId,{focused:true});}catch{error.value='tvOriginalMissing';}}
async function resolveSource(){
 const snapshot=await api('snapshot',{tabId:props.tabId}),item=(snapshot.media as Media[]).find(m=>mediaMatches(m,props.mediaId)||!!selectedMedia?.providerId&&m.providerId===selectedMedia.providerId),variant=selectedVariant&&item?matchingVariant(item.kind,selectedVariant,item.variants):item?.variants.find(v=>v.id===props.variantId);
 if(!item||!variant)throw new Error('missing');title.value=item.title;pageUrl.value=item.pageUrl;sourceKind.value=item.kind;selectedMedia=item;selectedVariant=variant;
 if(!['direct','hls','dash'].includes(item.kind)||item.captureOnly)return;
 if(item.kind==='direct'&&(variant.audioUrl||audioExtensions.some(ext=>ext===directExtension(variant.url,variant.contentType??item.contentType))))throw new Error('unsupported');
 const result=await api('checkSource',{tabId:props.tabId,id:item.id,variantId:variant.id});if(result.state==='unavailable')throw new Error(result.error??'notMedia');
 // Complete manifests retain their associated audio. The selected receiver
 // chooses a supported rendition; no session cookies are forwarded.
 const url=item.kind==='direct'?variant.url:item.url;if(!await permitted(url))throw new Error('permission');
 const mime=item.kind==='hls'?'application/vnd.apple.mpegurl':item.kind==='dash'?'application/dash+xml':castMime(url,result.contentType??variant.contentType??item.contentType);
 return{url,mime,title:item.title,live:!!result.live||item.live};
}
onMounted(async()=>{
 try{if(!props.mediaId)return;const candidate=await resolveSource();if(!candidate||disposed)return;controller=new CastSession(candidate,value=>{if(!disposed)status.value=value;});media.value=candidate;}
 catch(e){error.value=e instanceof Error&&/^[a-zA-Z]+$/.test(e.message)?e.message:'unsupported';}finally{prepared.value=true;becameReady();}
});
const quickMessage=(message:any,sender:chrome.runtime.MessageSender,reply:(value:unknown)=>void)=>{const token=new URLSearchParams(location.search).get('castToken');if(message?.type!=='alcydeo.quickCast'||!token||message.token!==token||sender.id!==chrome.runtime.id||!sender.url||!['/popup.html','/manager.html'].includes(new URL(sender.url).pathname))return false;void(async()=>{await ready;if(disposed)return;if(!navigator.userActivation.isActive){reply({setup:true});return;}if(mode.value==='file'){const started=await localPlayer.value?.quickCast();reply(started?{started:true}:{setup:true});}else if(controller&&media.value){void cast();reply({started:true});}else reply({setup:true});})().catch(()=>reply({setup:true}));return true;};
chrome.runtime.onMessage.addListener(quickMessage);
async function focusOwner(){if(!new URLSearchParams(location.search).has('castToken'))return;try{const tab=await chrome.tabs.getCurrent();if(tab?.id!==undefined)await chrome.tabs.update(tab.id,{active:true});}catch{/* The controller may have closed independently. */}}
watch(()=>status.value.phase,phase=>{if(phase==='error')void focusOwner();});
onBeforeUnmount(()=>{chrome.runtime.onMessage.removeListener(quickMessage);disposed=true;controller?.dispose();});
</script>
<template>
 <section class="settings-card tv-panel">
  <nav v-if="mediaId" class="popup-tabs" :aria-label="t('tv')"><button :aria-pressed="mode === 'source'" @click="mode='source'">{{ t('tvDetectedVideo') }}</button><button :aria-pressed="mode === 'file'" @click="mode='file'">{{ t('tvLocalFile') }}</button></nav>
  <LocalTVPanel v-if="mode === 'file'" ref="localPlayer" :task-id="taskId" @attention="focusOwner" />
  <div v-show="mode === 'source'">
  <h2 class="panel-title"><Icon name="cast" />{{ t('castVideo') }}</h2><h3 dir="auto">{{ title || t('tv') }}</h3>
  <p v-if="!prepared" role="status">{{ t('tvPreparing') }}</p>
  <template v-if="media">
   <p>{{ t('tvCastBuiltIn') }}</p><p v-if="sourceKind !== 'direct'" class="task-notice">{{ t('tvCastAutoQuality') }}</p>
   <div class="tv-actions"><button class="primary" :disabled="!supported || reloading || ['choosing','connecting','loading'].includes(status.phase)" @click="cast"><Icon name="cast" />{{ t(status.connected ? 'tvWebLoad' : 'castVideo') }}</button><button v-if="status.connected && ['playing','paused'].includes(status.phase)" class="secondary" @click="controller?.playPause()"><Icon :name="status.phase === 'paused' ? 'play' : 'pause'" />{{ t(status.phase === 'paused' ? 'tvWebPlay' : 'pause') }}</button><button v-if="status.connected" class="secondary" @click="controller?.stop()"><Icon name="stop" />{{ t('tvWebStop') }}</button></div>
   <p class="cast-status" role="status" :data-phase="status.phase">{{ t('tvCast_' + status.phase) }}<bdi v-if="status.receiver"> · {{ status.receiver }}</bdi></p>
   <p v-if="!supported" class="task-notice">{{ t('tvNotSupported') }}</p>
   <details class="tv-preview" @toggle="preview=($event.target as HTMLDetailsElement).open"><summary>{{ t('preview') }}</summary><video v-if="preview" :src="media.url" controls preload="metadata" playsinline :aria-label="t('preview')" /></details>
  </template>
  <p v-else-if="prepared && !error" class="task-notice">{{ t('tvStreamTab') }}</p>
  <p v-if="error || status.error" class="error" role="alert">{{ (error || status.error || '').startsWith('tv') ? t(error || status.error || '') : errorText(error) }}</p>
  <div class="tv-tab-fallback"><h3>{{ t('tvCastTab') }}</h3><p>{{ t('tvChromeSteps') }}</p><button class="secondary" :disabled="!pageUrl" @click="original"><Icon name="arrow" />{{ t('tvOriginal') }}</button></div>
  </div>
  <details class="tv-compatibility"><summary>{{ t('technicalDetails') }}</summary><p class="task-notice">{{ t(windows ? 'tvAirplayWindows' : 'tvNoAirplay') }}</p><p class="task-notice">{{ t('tvExperimental') }}</p></details>
 </section>
</template>
<style scoped>
.tv-panel{max-width:960px}.tv-panel h3{font-size:16px;overflow-wrap:anywhere;margin-block:20px 12px}.tv-panel p{font-size:13px;line-height:1.7;max-inline-size:82ch;margin-block:14px}.tv-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-block:22px}.cast-status{padding:12px 16px;border-radius:12px;background:var(--subtle)}.tv-compatibility{margin-block:22px;color:var(--muted);font-size:12px}.tv-compatibility summary{cursor:pointer;padding-block:8px}.tv-preview{margin-block:18px;color:var(--muted);font-size:12px}.tv-preview summary{cursor:pointer}.tv-preview video{display:block;width:100%;max-height:400px;aspect-ratio:16/9;object-fit:contain;background:#071b2d;border-radius:14px;margin-block:14px}.tv-tab-fallback{border:1px solid var(--border);border-radius:16px;padding:18px;margin-block:24px}.tv-tab-fallback h3{margin:0;font-size:14px}.tv-tab-fallback p{font-size:12px;color:var(--muted)}@media(max-width:680px){.tv-tab-fallback{padding:14px}.tv-panel p{font-size:12px}.tv-actions button{max-inline-size:100%}}
</style>
