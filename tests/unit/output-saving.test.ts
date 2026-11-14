import {describe,it,expect} from 'vitest';
import type {Task} from '../../packages/contracts';
import {automaticOutput,pendingOutput,taskPhase,taskProgress} from '../../packages/media-core/output-saving';
const ready={state:'validating',output:'output.mp4',validation:{bytes:42},progress:1} as Task;
describe('disk-saving status',()=>{
 it('does not present a checked temporary result as saved',()=>{expect(taskProgress(ready)).toBe(.99);expect(taskPhase(ready)).toBe('savingFile');expect(automaticOutput(ready)).toBe(true);});
 it('keeps a native disk copy at 100 percent even before optional content verification',()=>{const native={...ready,output:undefined,saved:true};expect(taskProgress(native)).toBe(1);expect(pendingOutput(native)).toBe(false);});
 it('does not automatically repeat a dismissed chooser or paused/cancelled task',()=>{for(const task of [{...ready,error:'saveDialog'},{...ready,state:'paused' as const},{...ready,state:'cancelled' as const},{...ready,downloadId:7}])expect(automaticOutput(task)).toBe(false);expect(taskPhase({...ready,error:'saveDialog'})).toBe('saveRequired');});
 it('keeps incomplete and invalid progress from claiming disk completion',()=>{expect(taskProgress({...ready,progress:.4})).toBe(.4);expect(taskProgress({...ready,progress:NaN})).toBe(0);expect(taskProgress({...ready,progress:2})).toBe(.99);expect(automaticOutput({...ready,validation:undefined})).toBe(false);});
 it('automatically saves an already checked output blocked only by the old local player',()=>{const task={...ready,error:'codec'};expect(automaticOutput(task)).toBe(true);expect(taskPhase(task)).toBe('savingFile');});
 it('does not recover a codec error without a complete output or with an uncertain native save',()=>{
  for(const task of [{...ready,error:'codec',output:undefined},{...ready,error:'codec',validation:undefined},{...ready,error:'codec',state:'failed' as const},{...ready,error:'codec',state:'paused' as const},{...ready,error:'codec',saved:true},{...ready,error:'codec',downloadId:0},{...ready,error:'codec',outputSave:{url:'blob:pending',startedAt:1}}])expect(automaticOutput(task)).toBe(false);
 });
 it('keeps genuine source, file and save errors explicit',()=>{for(const error of ['unsupported','invalid','missing','network','saveDialog','saveInterrupted','cancelled']){expect(automaticOutput({...ready,error})).toBe(false);expect(taskPhase({...ready,error})).toBe('saveRequired');}});
});
