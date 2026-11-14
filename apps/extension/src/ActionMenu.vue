<script setup lang="ts">
import { ref,useId } from 'vue';
defineProps<{label:string}>();
const id=useId(),trigger=ref<HTMLButtonElement>(),panel=ref<HTMLElement>();
function place(event:Event){
 // Chrome 156 anchors the native popover, including scrolling and edge flips.
 // Keep bounded placement for older Chrome versions without CSS anchor areas.
 if((event as ToggleEvent).newState!=='open'||CSS.supports('position-area','bottom span-left')||!trigger.value||!panel.value)return;
 const anchor=trigger.value.getBoundingClientRect(),menu=panel.value;
 menu.style.visibility='hidden';menu.style.display='block';
 const width=menu.offsetWidth,height=menu.offsetHeight,rtl=document.documentElement.dir==='rtl';
 menu.style.left=`${Math.max(12,Math.min(innerWidth-width-12,rtl?anchor.left:anchor.right-width))}px`;
 const below=anchor.bottom+6;menu.style.top=`${below+height<=innerHeight-12?below:Math.max(12,anchor.top-height-6)}px`;
 menu.style.removeProperty('display');menu.style.removeProperty('visibility');
}
function close(event:MouseEvent){if((event.target as Element).closest('button:not(:disabled)'))panel.value?.hidePopover();}
</script>
<template><button ref="trigger" type="button" class="icon-button more-actions" :popovertarget="id" :aria-label="label" :title="label"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg></button><div :id="id" ref="panel" popover="auto" class="action-popover" role="group" :aria-label="label" @beforetoggle="place" @click="close"><slot /></div></template>
