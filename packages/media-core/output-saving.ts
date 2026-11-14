import type {Task} from '../contracts';

// A checked OPFS result is still temporary until Chrome confirms the disk copy.
export const unsavedOutput=(task:Task)=>task.state==='validating'&&!!task.output&&!!task.validation&&!task.saved;
export const pendingOutput=(task:Task)=>unsavedOutput(task)&&task.downloadId===undefined;
// Recover only the old player veto; an uncertain native save still needs reconciliation.
export const automaticOutput=(task:Task)=>pendingOutput(task)&&(!task.error||task.error==='codec'&&!task.outputSave);
export function taskProgress(task:Task){return task.saved?1:Math.min(.99,Math.max(0,Number.isFinite(task.progress)?task.progress:0));}
export function taskPhase(task:Task){return unsavedOutput(task)?task.error&&!automaticOutput(task)?'saveRequired':'savingFile':task.state;}
