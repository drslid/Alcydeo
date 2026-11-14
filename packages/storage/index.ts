import type { Task, State } from '../contracts';
import { transitions, clearableHistory } from '../contracts';
const request = <T>(r: IDBRequest<T>) => new Promise<T>((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
let database: Promise<IDBDatabase> | undefined;
function open() {
  return database ??= new Promise((resolve, reject) => {
    const r = indexedDB.open('alcydeo', 1);
    r.onupgradeneeded = () => { const store = r.result.createObjectStore('tasks', { keyPath: 'id' }); store.createIndex('createdAt', 'createdAt'); };
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
}
async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  const db = await open(); const tx = db.transaction('tasks', mode);
  const done = new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('storage')); });
  const result = await operation(tx.objectStore('tasks')); await done; return result;
}
export const allTasks = () => transaction('readonly', s => request<Task[]>(s.getAll()));
export const mediaTaskLock=(id:string)=>`alcydeo:running-media:${id}`;
export const outputSaveLock=(id:string)=>`alcydeo:save-output:${id}`;
export async function runningMediaTasks(){return new Set((await navigator.locks.query()).held?.flatMap(lock=>lock.name?.startsWith('alcydeo:running-media:')?[lock.name.slice('alcydeo:running-media:'.length)]:[])??[]);}
export const getTask = (id: string) => transaction('readonly', s => request<Task | undefined>(s.get(id)));
export const putTask = (task: Task) => transaction('readwrite', async s => { await request(s.put(task)); return task; });
export const removeTask = (id: string) => transaction('readwrite', async s => { await request(s.delete(id)); });
export function removeHistory(ids: string[]) {
  const selected = new Set(ids);
  return transaction('readwrite', store => new Promise<string[]>((resolve, reject) => {
    const removed: string[] = []; const now = Date.now(); const cursor = store.openCursor();
    cursor.onerror = () => reject(cursor.error);
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (!entry) { resolve(removed); return; }
      const task = entry.value as Task;
      if (selected.has(task.id) && clearableHistory(task, now)) { entry.delete(); removed.push(task.id); }
      entry.continue();
    };
  }));
}
export function changeTask(id: string, update: (task: Task) => void) {
  return transaction('readwrite', async s => { const t = await request<Task | undefined>(s.get(id)); if (!t) throw new Error('missing'); update(t); t.updatedAt = Date.now(); await request(s.put(t)); return t; });
}
export const setState = (id: string, state: State, fields: Partial<Task> = {}) => changeTask(id, task => {
  if (task.state !== state && !transitions[task.state].includes(state)) throw new Error('transition');
  Object.assign(task, fields, { state });
});
export async function acquire(id: string, owner: string, now = Date.now()) {
  if((await runningMediaTasks()).has(id))return false;
  let acquired = false;
  await changeTask(id, t => { if (!t.owner || t.owner === owner || (t.leaseUntil ?? 0) < now) { t.owner = owner; t.leaseUntil = now + 30_000; acquired = true; } });
  return acquired;
}
export function acquireConversion(id:string,owner:string,now=Date.now()) {
  return transaction('readwrite',async store=>{
    const tasks=await request<Task[]>(store.getAll());const task=tasks.find(t=>t.id===id);
    if(!task?.conversion?.ready||task.state!=='queued'||tasks.some(t=>t.id!==id&&t.conversion&&t.owner&&(t.leaseUntil??0)>=now))return false;
    if(task.owner&&task.owner!==owner&&(task.leaseUntil??0)>=now)return false;
    task.owner=owner;task.leaseUntil=now+30000;task.updatedAt=now;await request(store.put(task));return true;
  });
}
export const renew = (id: string, owner: string) => changeTask(id, t => { if (t.owner !== owner) throw new Error('lease'); t.leaseUntil = Date.now() + 30_000;if(t.downloadSlot?.owner===owner)t.downloadSlot.expiresAt=t.leaseUntil; });
export const release = (id: string, owner: string) => changeTask(id, t => { if (t.owner === owner) { delete t.owner; delete t.leaseUntil; } });
