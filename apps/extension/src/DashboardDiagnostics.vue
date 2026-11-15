<script setup lang="ts">
import{computed,onMounted,onUnmounted,ref}from'vue';
import DetectionDiagnostics from'./DetectionDiagnostics.vue';
import Icon from'./Icon.vue';
import{t}from'./i18n';
const tabs=ref<chrome.tabs.Tab[]>([]),selected=ref(-1),busy=ref(false),failed=ref(false);
const current=computed(()=>tabs.value.find(tab=>tab.id===selected.value));
let generation=0,disposed=false;
async function loadTabs(){
 const attempt=++generation;busy.value=true;failed.value=false;
 try{
  const values=(await chrome.tabs.query({})).filter(tab=>tab.id!==undefined&&!tab.incognito&&/^https?:\/\//.test(tab.url??'')).sort((a,b)=>Number(b.active)-Number(a.active)||(b.lastAccessed??0)-(a.lastAccessed??0)).slice(0,200);
  if(disposed||attempt!==generation)return;
  tabs.value=values;if(!values.some(tab=>tab.id===selected.value))selected.value=values[0]?.id??-1;
 }catch{if(!disposed&&attempt===generation)failed.value=true;}
 finally{if(!disposed&&attempt===generation)busy.value=false;}
}
function label(tab:chrome.tabs.Tab){return(tab.title?.trim()||new URL(tab.url!).hostname).slice(0,160);}
function removed(id:number){if(tabs.value.some(tab=>tab.id===id))void loadTabs();}
function updated(id:number,change:chrome.tabs.OnUpdatedInfo){if(change.url&&tabs.value.some(tab=>tab.id===id))void loadTabs();}
onMounted(()=>{void loadTabs();chrome.tabs.onRemoved.addListener(removed);chrome.tabs.onUpdated.addListener(updated);});
onUnmounted(()=>{disposed=true;generation++;chrome.tabs.onRemoved.removeListener(removed);chrome.tabs.onUpdated.removeListener(updated);});
</script>
<template>
 <div class="dashboard-diagnostics" data-detection-diagnostics>
  <p class="setting-hint">{{ t('detectionDiagnosticsChoose') }}</p>
  <div class="diagnostic-source">
   <label>{{ t('detectionDiagnosticsPage') }}<select v-model.number="selected" :aria-label="t('detectionDiagnosticsPage')" :disabled="busy || !tabs.length"><option v-for="tab in tabs" :key="tab.id" :value="tab.id">{{ label(tab) }}</option></select></label>
   <button type="button" class="icon-button" :aria-label="t('detectionDiagnosticsTabsRefresh')" :title="t('detectionDiagnosticsTabsRefresh')" :disabled="busy" @click="loadTabs"><Icon name="refresh" :class="{spinning:busy}" /></button>
  </div>
  <p v-if="failed" role="alert">{{ t('detectionDiagnosticsError') }}</p>
  <p v-else-if="!busy && !tabs.length" role="status">{{ t('detectionDiagnosticsNoPage') }}</p>
  <DetectionDiagnostics v-if="current" :key="`${current.id}:${current.url}`" :tab-id="selected" />
 </div>
</template>
<style scoped>
.dashboard-diagnostics{padding-block-start:20px;margin-block-start:20px;border-block-start:1px solid var(--border);min-inline-size:0}.diagnostic-source{display:flex;align-items:end;gap:12px;margin-block-start:12px}.diagnostic-source label{flex:1;min-inline-size:0}.diagnostic-source select{inline-size:100%;min-inline-size:0;text-overflow:ellipsis}.diagnostic-source .icon-button{flex:none}.dashboard-diagnostics>p{font-size:13px;line-height:1.6;color:var(--muted)}
</style>
