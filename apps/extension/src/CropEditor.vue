<script setup lang="ts">
import{ref,computed,watch,nextTick,onBeforeUnmount,useId}from'vue';
import type{CropRegion}from'../../../packages/contracts';
import{t,duration}from'./i18n';
import Icon from'./Icon.vue';
const props=defineProps<{file:File}>(),emit=defineEmits<{change:[region:CropRegion|undefined]}>();
const player=ref<HTMLVideoElement>(),surface=ref<HTMLElement>(),selection=ref<HTMLElement>(),canvas=ref<HTMLCanvasElement>();
const url=ref(''),width=ref(0),height=ref(0),length=ref(0),position=ref(0),playing=ref(false),failed=ref(false),region=ref<CropRegion>();
const hintId=useId(),handles=['nw','ne','se','sw']as const;
type Handle=typeof handles[number];type Point={x:number;y:number};
let drag:{mode:'draw'|'move'|Handle;point:Point;before?:CropRegion;pointerId:number}|undefined,frame:number|undefined;
const valid=computed(()=>{const r=region.value;return!failed.value&&!!r&&[r.x,r.y,r.width,r.height].every(Number.isSafeInteger)&&r.x>=0&&r.y>=0&&r.width>=2&&r.height>=2&&r.x+r.width<=width.value&&r.y+r.height<=height.value;});
const style=computed(()=>{const r=region.value;return r?{left:`${r.x/width.value*100}%`,top:`${r.y/height.value*100}%`,width:`${r.width/width.value*100}%`,height:`${r.height/height.value*100}%`}:{};});
function stopFrame(){if(frame!==undefined)player.value?.cancelVideoFrameCallback(frame);frame=undefined;}
function clean(){stopFrame();player.value?.pause();if(url.value)URL.revokeObjectURL(url.value);}
watch(()=>props.file,file=>{clean();drag=undefined;region.value=undefined;width.value=height.value=length.value=position.value=0;playing.value=failed.value=false;url.value=URL.createObjectURL(file);emit('change',undefined);},{immediate:true});
function loaded(){const video=player.value;if(!video||video.currentSrc!==url.value)return;failed.value=false;width.value=video.videoWidth;height.value=video.videoHeight;length.value=Number.isFinite(video.duration)?video.duration:0;}
function render(){const r=region.value,video=player.value,target=canvas.value;if(!valid.value||!r||!video||!target||video.readyState<2)return;
 const scale=Math.min(1,320/r.width,200/r.height);target.width=Math.max(1,Math.round(r.width*scale));target.height=Math.max(1,Math.round(r.height*scale));
 target.getContext('2d')?.drawImage(video,r.x,r.y,r.width,r.height,0,0,target.width,target.height);
}
watch(region,async()=>{emit('change',valid.value?{...region.value!}:undefined);await nextTick();render();},{deep:true});
function tick(){position.value=player.value?.currentTime??0;render();}
function livePreview(){stopFrame();render();if(player.value&&!player.value.paused)frame=player.value.requestVideoFrameCallback(()=>{frame=undefined;livePreview();});}
async function play(){const video=player.value;if(!video)return;if(!video.paused)video.pause();else try{await video.play();}catch{failed.value=true;}}
function seek(event:Event){if(player.value)player.value.currentTime=Number((event.target as HTMLInputElement).value);}
function point(event:PointerEvent):Point{const box=surface.value!.getBoundingClientRect();return{x:Math.round(Math.max(0,Math.min(width.value,(event.clientX-box.left)/box.width*width.value))),y:Math.round(Math.max(0,Math.min(height.value,(event.clientY-box.top)/box.height*height.value)))};}
function begin(event:PointerEvent){if(event.button!==0||!width.value||failed.value)return;event.preventDefault();const p=point(event),before=valid.value?{...region.value!}:undefined,handle=(event.target as HTMLElement).closest<HTMLElement>('[data-handle]')?.dataset.handle as Handle|undefined;
 const inside=before&&p.x>=before.x&&p.x<=before.x+before.width&&p.y>=before.y&&p.y<=before.y+before.height;
 drag={mode:handle??(inside?'move':'draw'),point:p,before,pointerId:event.pointerId};surface.value!.setPointerCapture(event.pointerId);player.value?.pause();
 if(drag.mode==='draw')region.value={x:p.x,y:p.y,width:0,height:0};else if(handle)(event.target as HTMLElement).focus();else selection.value?.focus();
}
function resized(before:CropRegion,handle:Handle,p:Point){const west=handle.includes('w'),north=handle.includes('n'),anchorX=west?before.x+before.width:before.x,anchorY=north?before.y+before.height:before.y;
 const x=west?Math.max(0,Math.min(p.x,anchorX-2)):Math.max(anchorX+2,Math.min(width.value,p.x));
 const y=north?Math.max(0,Math.min(p.y,anchorY-2)):Math.max(anchorY+2,Math.min(height.value,p.y));
 return{x:Math.min(x,anchorX),y:Math.min(y,anchorY),width:Math.abs(anchorX-x),height:Math.abs(anchorY-y)};
}
function update(event:PointerEvent){if(!drag||drag.pointerId!==event.pointerId)return;const p=point(event),before=drag.before;
 if(drag.mode==='draw')region.value={x:Math.min(p.x,drag.point.x),y:Math.min(p.y,drag.point.y),width:Math.abs(p.x-drag.point.x),height:Math.abs(p.y-drag.point.y)};
 else if(drag.mode==='move'&&before)region.value={...before,x:Math.max(0,Math.min(width.value-before.width,before.x+p.x-drag.point.x)),y:Math.max(0,Math.min(height.value-before.height,before.y+p.y-drag.point.y))};
 else if(before)region.value=resized(before,drag.mode as Handle,{x:before.x+(drag.mode.includes('e')?before.width:0)+p.x-drag.point.x,y:before.y+(drag.mode.includes('s')?before.height:0)+p.y-drag.point.y});
}
function finish(event:PointerEvent,cancel=false){if(!drag||drag.pointerId!==event.pointerId)return;if(cancel)region.value=drag.before;else{update(event);if(!valid.value)region.value=undefined;}
 drag=undefined;if(surface.value?.hasPointerCapture(event.pointerId))surface.value.releasePointerCapture(event.pointerId);if(!cancel)void nextTick(()=>selection.value?.focus());
}
function key(event:KeyboardEvent,handle?:Handle){if(event.key==='Escape'&&drag){event.preventDefault();region.value=drag.before;drag=undefined;return;}
 if(!valid.value||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const step=event.shiftKey?10:1,dx=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,dy=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0,r=region.value!;
 if(handle)region.value=resized(r,handle,{x:r.x+(handle.includes('e')?r.width:0)+dx,y:r.y+(handle.includes('s')?r.height:0)+dy});
 else region.value={...r,x:Math.max(0,Math.min(width.value-r.width,r.x+dx)),y:Math.max(0,Math.min(height.value-r.height,r.y+dy))};
}
function full(){if(width.value&&height.value)region.value={x:0,y:0,width:width.value,height:height.value};}
onBeforeUnmount(clean);
</script>
<template>
 <section class="crop-editor" :aria-label="t('cropTool')">
  <p :id="hintId" class="crop-hint">{{ t('cropDrawHint') }}</p>
  <div class="crop-screen">
   <div ref="surface" class="crop-surface" :style="{aspectRatio:width && height ? `${width}/${height}` : '16/9',maxWidth:width && height ? `${380*width/height}px` : undefined}" @pointerdown="begin" @pointermove="update" @pointerup="finish($event)" @pointercancel="finish($event,true)" @lostpointercapture="finish($event,true)">
    <video ref="player" :src="url" preload="auto" playsinline :aria-label="t('preview')" @loadedmetadata="loaded" @loadeddata="render" @seeked="tick" @timeupdate="tick" @play="playing=true;livePreview()" @pause="playing=false;stopFrame();render()" @error="failed=true;emit('change',undefined)" />
    <div v-if="region && width && height" ref="selection" class="crop-selection" :style="style" tabindex="0" role="group" :aria-label="t('cropArea')" :aria-describedby="hintId" @keydown="key($event)">
     <span class="crop-grid" aria-hidden="true" />
     <button v-for="handle in handles" :key="handle" class="crop-handle" :data-handle="handle" type="button" :aria-label="`${t('cropResize')} · ${handle.includes('w') ? region.x : region.x+region.width}, ${handle.includes('n') ? region.y : region.y+region.height}`" @keydown.stop="key($event,handle)" />
    </div>
    <span v-else-if="width && !failed" class="crop-instruction"><Icon name="crop" />{{ t('cropArea') }}</span>
   </div>
  </div>
  <div class="crop-player-controls"><button type="button" class="icon-button" :aria-label="t(playing ? 'pause' : 'preview')" :disabled="!width || failed" @click="play"><Icon :name="playing ? 'pause' : 'play'" /></button><input type="range" min="0" :max="length || 1" step="0.01" :value="position" :disabled="!width || failed" :aria-label="t('preview')" @input="seek"><span dir="ltr">{{ duration(position) }} / {{ duration(length) }}</span></div>
  <p v-if="failed" class="error" role="alert">{{ t('previewUnavailable') }}</p>
  <div class="crop-adjustments"><div class="crop-fields">
   <label v-for="[field,label] in [['x','cropLeft'],['y','cropTop'],['width','cropWidth'],['height','cropHeight']] as const" :key="field">{{ t(label) }}<input v-if="region" v-model.number="region[field]" type="number" :min="field === 'width' || field === 'height' ? 2 : 0" :max="field === 'x' || field === 'width' ? width : height" step="1" dir="ltr" required :disabled="failed"><input v-else type="number" disabled :value="0" dir="ltr"></label>
   <button type="button" class="secondary" :disabled="!width || failed" @click="full"><Icon name="crop" />{{ t('cropReset') }}</button>
  </div><figure v-show="valid && !failed" class="crop-preview"><canvas ref="canvas" :aria-label="t('cropPreview')" /><figcaption>{{ t('cropPreview') }}<span v-if="region" dir="ltr">{{ Math.floor(region.width/2)*2 }} × {{ Math.floor(region.height/2)*2 }} px</span></figcaption></figure></div>
  <p v-if="region && !valid && !failed" class="error" role="alert">{{ t('cropRange') }}</p>
 </section>
</template>
<style scoped>
.crop-editor{margin-block:20px}.crop-hint{font-size:12px;color:var(--muted);line-height:1.6}.crop-screen{display:flex;justify-content:center;border-radius:18px;background:var(--background-dark,#071b2d);overflow:hidden}.crop-surface{position:relative;width:100%;margin-inline:auto;touch-action:none;user-select:none;direction:ltr;cursor:crosshair}.crop-surface video{position:absolute;width:100%;height:100%;inset:0;pointer-events:none;object-fit:contain}.crop-selection{position:absolute;border:2px solid var(--accent);box-shadow:0 0 0 100vmax #071b2d99;cursor:move;box-sizing:border-box}.crop-selection:focus-visible{outline:2px solid white;outline-offset:3px}.crop-grid{position:absolute;inset:0;background:linear-gradient(to right,transparent calc(33.333% - .5px),#ffffff70 33.333%,transparent calc(33.333% + .5px),transparent calc(66.667% - .5px),#ffffff70 66.667%,transparent calc(66.667% + .5px)),linear-gradient(to bottom,transparent calc(33.333% - .5px),#ffffff70 33.333%,transparent calc(33.333% + .5px),transparent calc(66.667% - .5px),#ffffff70 66.667%,transparent calc(66.667% + .5px));pointer-events:none}.crop-handle{position:absolute;width:24px;height:24px;min-width:0;min-height:0;border:2px solid var(--accent);background:white;padding:0;border-radius:5px;box-shadow:0 1px 5px #071b2d66;transform:translate(-50%,-50%)}.crop-handle[data-handle=nw]{left:0;top:0;cursor:nwse-resize}.crop-handle[data-handle=ne]{left:100%;top:0;cursor:nesw-resize}.crop-handle[data-handle=se]{left:100%;top:100%;cursor:nwse-resize}.crop-handle[data-handle=sw]{left:0;top:100%;cursor:nesw-resize}.crop-instruction{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:8px;color:white;pointer-events:none;text-shadow:0 1px 5px #071b2d}.crop-instruction svg{width:28px;height:28px}.crop-player-controls{display:flex;align-items:center;gap:12px;margin-block:10px 18px}.crop-player-controls input{flex:1;min-width:0;accent-color:var(--primary)}.crop-player-controls span{font-size:11px;white-space:nowrap;color:var(--muted);font-variant-numeric:tabular-nums}.crop-adjustments{display:flex;gap:24px;align-items:flex-start;justify-content:space-between}.crop-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;flex:1;max-width:360px}.crop-fields label{display:flex;flex-direction:column;gap:6px;font-size:11px;color:var(--muted)}.crop-fields input{width:100%;min-width:0;box-sizing:border-box}.crop-fields button{grid-column:1/-1;justify-self:start;font-size:12px}.crop-preview{margin:0;flex:0 1 320px;min-width:0}.crop-preview canvas{display:block;max-width:100%;height:auto;max-height:200px;border-radius:10px;background:var(--subtle)}.crop-preview figcaption{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:var(--muted);font-size:11px;margin-top:8px}.crop-preview figcaption span{font-variant-numeric:tabular-nums}.crop-editor .error{font-size:12px}@media(max-width:640px){.crop-adjustments{flex-direction:column;gap:18px}.crop-fields{max-width:none;width:100%}.crop-preview{flex-basis:auto;width:100%}.crop-player-controls{gap:8px}}
</style>
