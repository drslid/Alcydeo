<script setup lang="ts">
import{computed,nextTick,onUnmounted,ref,useId,watch}from'vue';
import{api}from'./api';import{t}from'./i18n';import Icon from'./Icon.vue';
const props=defineProps<{tabId:number}>(),id=useId(),open=ref(false),busy=ref(false),report=ref<Record<string,unknown>>(),reportText=ref(''),problem=ref(false),feedback=ref(''),field=ref<HTMLTextAreaElement>(),panel=ref<HTMLDivElement>();let generation=0;
const restricted=computed(()=>report.value?.pageGranted===false||Array.isArray(report.value?.sources)&&report.value.sources.some(source=>source&&typeof source==='object'&&source.sourceGranted===false));
watch(()=>props.tabId,()=>{generation++;open.value=false;busy.value=false;report.value=undefined;reportText.value='';problem.value=false;feedback.value='';});
onUnmounted(()=>{generation++;});
async function load(){
 if(busy.value)return;const current=++generation;busy.value=true;problem.value=false;feedback.value='';report.value=undefined;reportText.value='';
 try{const value=await api<unknown>('detectionDiagnostics',{tabId:props.tabId});if(current!==generation)return;if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)throw new Error('invalid');reportText.value=JSON.stringify(value,null,2);report.value=value as Record<string,unknown>;}
 catch{if(current===generation)problem.value=true;}finally{if(current===generation){busy.value=false;void reveal();}}
}
async function reveal(){await nextTick();if(open.value)panel.value?.scrollIntoView({block:'nearest',inline:'nearest'});}
function toggle(){open.value=!open.value;if(open.value){if(!report.value&&!busy.value)void load();else void reveal();}}
async function copy(){
 if(!reportText.value||busy.value)return;feedback.value='';
 try{await navigator.clipboard.writeText(reportText.value);feedback.value='detectionDiagnosticsCopied';}
 catch{field.value?.focus();field.value?.select();feedback.value='detectionDiagnosticsCopyHint';}
}
async function openAccess(){try{await chrome.tabs.create({url:`chrome://extensions/?id=${chrome.runtime.id}`});}catch{feedback.value='detectionDiagnosticsAccessError';}}
</script>
<template>
 <div class="detection-diagnostics">
  <button :id="`${id}-toggle`" type="button" class="secondary diagnostics-toggle" :aria-expanded="open" :aria-controls="`${id}-panel`" @click="toggle"><Icon name="help" />{{ t('detectionDiagnostics') }}<Icon name="chevron" class="diagnostics-chevron" :class="{expanded:open}" /></button>
  <div v-if="open" :id="`${id}-panel`" ref="panel" class="diagnostics-panel" role="region" :aria-labelledby="`${id}-toggle`" :aria-busy="busy">
   <p v-if="busy" class="diagnostics-loading" role="status">{{ t('detectionDiagnosticsLoading') }}</p>
   <p v-if="problem" class="diagnostics-error" role="alert">{{ t('detectionDiagnosticsError') }}</p>
   <template v-if="reportText"><label class="sr-only" :for="`${id}-report`">{{ t('detectionDiagnosticsReport') }}</label><textarea :id="`${id}-report`" ref="field" :value="reportText" readonly dir="ltr" spellcheck="false" autocomplete="off" :aria-describedby="`${id}-privacy`" /></template>
   <div class="diagnostics-actions"><button v-if="reportText" type="button" class="secondary" :disabled="busy" @click="copy">{{ t('detectionDiagnosticsCopy') }}</button><button type="button" class="text-button" :disabled="busy" @click="load"><Icon name="refresh" />{{ t('detectionDiagnosticsRefresh') }}</button></div>
   <p v-if="feedback" class="diagnostics-feedback" role="status">{{ t(feedback) }}</p>
   <button v-if="restricted" type="button" class="text-button diagnostics-access" @click="openAccess"><Icon name="settings" />{{ t('chromeSiteAccess') }}</button>
   <p :id="`${id}-privacy`" class="diagnostics-privacy">{{ t('detectionDiagnosticsPrivacy') }}</p>
  </div>
 </div>
</template>
<style scoped>
.detection-diagnostics{display:grid;gap:10px;min-inline-size:0;margin-block-start:12px;text-align:start}.diagnostics-toggle{justify-self:center;min-block-size:34px;padding:7px 10px;font-size:11px;line-height:1.4;max-inline-size:100%}.diagnostics-toggle svg{inline-size:16px;block-size:16px}.diagnostics-toggle .diagnostics-chevron{transform:rotate(90deg)}.diagnostics-toggle .diagnostics-chevron.expanded{transform:rotate(-90deg)}.diagnostics-panel{min-inline-size:0;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}.diagnostics-panel textarea{display:block;inline-size:100%;min-inline-size:0;block-size:160px;min-block-size:96px;max-block-size:180px;resize:vertical;background:var(--background);font:11px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;text-align:start;white-space:pre;overflow:auto}.diagnostics-actions{display:flex;flex-wrap:wrap;align-items:center;gap:16px;margin-block-start:10px}.diagnostics-actions .secondary{min-block-size:32px;padding:6px 12px;font-size:11px}.diagnostics-actions .text-button{min-block-size:32px}.diagnostics-loading,.diagnostics-error,.diagnostics-feedback,.diagnostics-privacy{font-size:11px;line-height:1.6;overflow-wrap:anywhere}.diagnostics-loading,.diagnostics-privacy{color:var(--muted)}.diagnostics-error{color:var(--error)}.diagnostics-feedback{margin-block-start:8px;color:var(--link)}.diagnostics-privacy{margin-block-start:10px;font-size:10px}.diagnostics-access{margin-block-start:10px;max-inline-size:100%;text-align:start}
</style>
