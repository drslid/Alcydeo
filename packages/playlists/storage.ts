import type{PlaylistBatch,PlaylistCatalog}from'./contracts';
let database:Promise<IDBDatabase>|undefined;
function open(){return database??=new Promise((resolve,reject)=>{const r=indexedDB.open('alcydeo-youtube-playlists',1);r.onupgradeneeded=()=>{r.result.createObjectStore('catalogs',{keyPath:'tabId'});r.result.createObjectStore('batches',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function transaction<T>(name:string,mode:IDBTransactionMode,work:(s:IDBObjectStore)=>IDBRequest<T>){const db=await open(),tx=db.transaction(name,mode),r=work(tx.objectStore(name));const value=new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});const result=await value;await done;return result;}
export const catalog=(tabId:number)=>transaction('catalogs','readonly',s=>s.get(tabId))as Promise<PlaylistCatalog|undefined>;
export const catalogs=()=>transaction('catalogs','readonly',s=>s.getAll())as Promise<PlaylistCatalog[]>;
export const putCatalog=(value:PlaylistCatalog)=>transaction('catalogs','readwrite',s=>s.put(value));
export const removeCatalog=(tabId:number)=>transaction('catalogs','readwrite',s=>s.delete(tabId));
export const batches=()=>transaction('batches','readonly',s=>s.getAll())as Promise<PlaylistBatch[]>;
export const batch=(id:string)=>transaction('batches','readonly',s=>s.get(id))as Promise<PlaylistBatch|undefined>;
export const putBatch=(value:PlaylistBatch)=>transaction('batches','readwrite',s=>s.put(value));
export const removeBatch=(id:string)=>transaction('batches','readwrite',s=>s.delete(id));
export async function changeBatch(id:string,update:(job:PlaylistBatch)=>void,touch=true){const db=await open();return new Promise<PlaylistBatch>((resolve,reject)=>{const tx=db.transaction('batches','readwrite'),store=tx.objectStore('batches'),r=store.get(id);let value:PlaylistBatch;r.onsuccess=()=>{value=r.result;if(!value){tx.abort();return;}try{update(value);if(touch)value.updatedAt=Date.now();store.put(value);}catch(error){reject(error);tx.abort();}};tx.oncomplete=()=>resolve(value);tx.onerror=tx.onabort=()=>reject(tx.error??new Error('missing'));});}
