import type {Page} from '@playwright/test';
import type {Task} from '../../packages/contracts';

export function historyTask(title: string, fields: Partial<Task> = {}): Task {
  const url = 'http://127.0.0.1:4179/media/high.mp4';
  return {id:crypto.randomUUID(),title,media:{id:'history-fixture',tabId:-1,pageUrl:'http://127.0.0.1:4179/',title,url,kind:'direct',variants:[]},variant:{id:'original',url,label:'404p'},state:'completed',saved:true,createdAt:Date.now(),updatedAt:Date.now(),bytes:1837555,progress:1,checkpoints:{},...fields};
}

// Persist synthetic history through the real extension-origin IndexedDB.
// These entries exercise organization; they are not downloaded-file evidence.
export async function seedHistory(page: Page, tasks: Task[], temporaryIds: string[] = []) {
  await page.evaluate(async ({tasks,temporaryIds}) => {
    const db = await new Promise<IDBDatabase>((resolve,reject) => {const r=indexedDB.open('alcydeo',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    try {await new Promise<void>((resolve,reject) => {const tx=db.transaction('tasks','readwrite');for(const task of tasks)tx.objectStore('tasks').put(task);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});} finally {db.close();}
    const root=await navigator.storage.getDirectory();
    for(const id of temporaryIds){const dir=await root.getDirectoryHandle(id,{create:true});const file=await dir.getFileHandle('checkpoint.bin',{create:true});const output=await file.createWritable();await output.write('persisted checkpoint');await output.close();}
  },{tasks,temporaryIds});
}
