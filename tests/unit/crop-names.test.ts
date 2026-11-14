import{describe,it,expect}from'vitest';
import type{Task}from'../../packages/contracts';
import{outputFilename}from'../../packages/media-core/filenames';
const task=(name:string)=>({title:'Internal title',conversion:{inputs:[{name}],operation:{kind:'crop'}}})as Task;
describe('cropped result names',()=>{
 it('keeps the chosen source name and adds the spatial-edit suffix',()=>expect(outputFilename(task('Vacances.été.2026.MOV'))).toBe('Vacances.été.2026-cropped.mp4'));
 it('keeps one suffix when cropping a cropped result again',()=>{expect(outputFilename(task('Vacances-cropped.mp4'))).toBe('Vacances-cropped.mp4');expect(outputFilename(task('Vacances-cropped (2).mp4'))).toBe('Vacances-cropped (2).mp4');});
});
