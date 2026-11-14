<script setup lang="ts">
import{computed,ref,useId,watch}from'vue';import{t}from'./i18n';import{formatTrimTime,parseTrimTime,validTrimRange}from'./trim-time';
const props=defineProps<{start:number;end:number;length:number}>(),emit=defineEmits<{change:[start:number,end:number,edge:'start'|'end'];valid:[value:boolean]}>();
type Edge='start'|'end';
const id=useId(),focused=ref<Edge>(),draft=ref({start:formatTrimTime(props.start,props.length>=3600),end:formatTrimTime(props.end,props.length>=3600)}),dirty=ref({start:false,end:false}),touched=ref({start:false,end:false});let published:{start:number;end:number}|undefined;
const parsed=computed(()=>({start:parseTrimTime(draft.value.start),end:parseTrimTime(draft.value.end)})),valid=computed(()=>validTrimRange(parsed.value.start,parsed.value.end,props.length)),showError=computed(()=>!valid.value&&(touched.value.start||touched.value.end));
const clock=(value:number)=>formatTrimTime(value,props.length>=3600);
const invalid=(edge:Edge)=>{const value=parsed.value[edge];return value===undefined||value<0||value>props.length||parsed.value.start!==undefined&&parsed.value.end!==undefined&&parsed.value.start>=parsed.value.end;};
watch(valid,value=>emit('valid',value),{immediate:true,flush:'sync'});
watch(()=>[props.start,props.end]as const,(values,old)=>{for(const[index,edge]of(['start','end']as const).entries()){if(focused.value===edge)continue;if(!dirty.value[edge]||values[index]!==old[index]&&values[index]!==published?.[edge]){draft.value[edge]=clock(values[index]!);dirty.value[edge]=false;touched.value[edge]=false;}}});
function publish(edge:Edge){if(!valid.value)return;published={start:parsed.value.start!,end:parsed.value.end!};emit('change',published.start,published.end,edge);}
function input(edge:Edge,event:Event){draft.value[edge]=(event.target as HTMLInputElement).value;dirty.value[edge]=true;publish(edge);}
function commit(edge:Edge){touched.value[edge]=true;if(valid.value){publish(edge);draft.value[edge]=clock(parsed.value[edge]!);dirty.value[edge]=false;}focused.value=undefined;}
function restore(edge:Edge){draft.value[edge]=clock(props[edge]);dirty.value[edge]=false;touched.value[edge]=false;publish(edge);}
function sync(start:number,end:number){published={start,end};draft.value={start:clock(start),end:clock(end)};dirty.value={start:false,end:false};touched.value={start:false,end:false};}
defineExpose({sync});
</script>
<template>
 <div class="trim-time-range" role="group" :aria-label="t('preciseTimes')">
  <div class="trim-time-fields" dir="ltr">
   <template v-for="edge in (['start','end'] as const)" :key="edge">
    <span v-if="edge === 'end'" class="trim-time-separator" aria-hidden="true">—</span>
    <label :for="`${id}-${edge}`"><span dir="auto">{{ t(edge === 'start' ? 'trimStartTime' : 'trimEndTime') }}</span><input :id="`${id}-${edge}`" class="trim-time-input" :data-edge="edge" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="32" dir="ltr" :value="draft[edge]" :aria-invalid="dirty[edge] && invalid(edge) ? 'true' : 'false'" :aria-describedby="`${id}-hint${showError ? ' '+id+'-error' : ''}`" @focus="focused=edge" @input="input(edge,$event)" @blur="commit(edge)" @keydown.enter.stop.prevent="commit(edge)" @keydown.esc.stop.prevent="restore(edge)"></label>
   </template>
   <output class="trim-duration" :aria-label="t('totalDuration')"><span aria-hidden="true">· </span><bdi>{{ valid ? clock(parsed.end! - parsed.start!) : '—' }}</bdi></output>
  </div>
  <p :id="`${id}-hint`" class="trim-time-hint">{{ t('trimTimeHint') }}</p>
  <p v-if="showError" :id="`${id}-error`" class="error trim-time-error" role="alert">{{ t('trimRange') }}</p>
 </div>
</template>
<style scoped>
.trim-time-range{flex:1 1 300px;min-inline-size:0}.trim-time-fields{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}.trim-time-fields label{display:grid;gap:4px;margin:0;flex:0 1 118px;min-inline-size:0;font-size:11px;color:var(--muted)}.trim-time-fields label>span{line-height:1.4}.trim-time-input{inline-size:100%;min-inline-size:0;padding:8px 9px;font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;text-align:center}.trim-time-input[aria-invalid=true]{border-color:var(--error-border)}.trim-time-separator{align-self:flex-end;padding-block-end:8px;color:var(--muted)}.trim-duration{align-self:flex-end;padding-block-end:9px;white-space:nowrap;font-size:12px;font-variant-numeric:tabular-nums;color:var(--muted)}.trim-time-hint{margin-block-start:7px;font-size:11px;line-height:1.5;color:var(--muted)}.trim-time-error{margin-block-start:7px;font-size:12px}@media(max-width:420px){.trim-time-fields label{flex-basis:103px}.trim-time-fields{gap:6px}.trim-time-input{padding-inline:6px;font-size:14px}}
</style>
