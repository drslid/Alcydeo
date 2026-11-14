import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';
import{readFile}from'node:fs/promises';
import type{CloudJob}from'../../packages/cloud/contracts';
import{historyTask,seedHistory}from'./history-fixture';

const original=await readFile('fixtures/media/low.mp4'),catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')),c=catalogs.en;
let context:BrowserContext,ui:Page,base:string,unexpected:string[];
const cleanup=(page=ui)=>page.locator('[data-cloud-cleanup]');
function job(name:string,state:CloudJob['state'],fields:Partial<CloudJob>={}):CloudJob{
 const now=Date.now();return{id:crypto.randomUUID(),provider:'gofile',name,size:original.length,mime:'video/mp4',state,bytes:state==='completed'?original.length:25,createdAt:now,updatedAt:now,ready:true,uploadAttempted:true,...fields};
}
test.beforeEach(async()=>{
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??process.env.ALCYDEO_TEST_EXTENSION??'apps/extension/.output/chrome-mv3');
 context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 unexpected=[];await context.route('https://**/*',route=>{unexpected.push(route.request().url());return route.abort();});
 // Exercise queued cleanup before any fixture job is dispatched to a provider.
 await context.addInitScript(()=>{const send=Worker.prototype.postMessage;Worker.prototype.postMessage=function(message:any,...args:any[]){if(message?.type==='run'&&typeof message.id==='string'&&!(window as any).__runRealCloud)return;return send.apply(this,[message,...args]as any);};});
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(worker.url()).host}`;
 ui=await context.newPage();ui.on('dialog',dialog=>dialog.accept());await ui.goto(base+'/manager.html#cloud');await expect(cleanup()).toBeVisible();
});
test.afterEach(async()=>{await context?.close();expect(unexpected).toEqual([]);});
async function seed(entries:CloudJob[],extraDirectories:string[]=[]){
 await ui.evaluate(async({entries,bytes,extraDirectories})=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo-cloud',1);request.onupgradeneeded=()=>request.result.createObjectStore('jobs',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('jobs','readwrite');for(const entry of entries)tx.objectStore('jobs').put(entry);tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}finally{db.close();}
  const root=await navigator.storage.getDirectory();for(const name of[...entries.map(entry=>`cloud-${entry.id}`),...extraDirectories]){const directory=await root.getDirectoryHandle(name,{create:true}),writer=await(await directory.getFileHandle('input',{create:true})).createWritable();await writer.write(new Uint8Array(bytes));await writer.close();}
 },{entries,bytes:[...original],extraDirectories});
}
async function jobs(page=ui){return page.evaluate(async()=>{
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo-cloud',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 try{return await new Promise<CloudJob[]>((resolve,reject)=>{const request=db.transaction('jobs').objectStore('jobs').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}
});}
async function directories(){return ui.evaluate(async()=>{const names:string[]=[];for await(const[name,handle]of(await navigator.storage.getDirectory()as any).entries())if(handle.kind==='directory'&&name.startsWith('cloud-'))names.push(name);return names.sort();});}
async function holdLock(page:Page,name:string,mode:'shared'|'exclusive'='exclusive'){
 await page.evaluate(async({name,mode})=>{const state=window as any;await new Promise<void>(entered=>{void navigator.locks.request(name,{mode},async()=>{entered();await new Promise<void>(release=>{state.__releaseCloudCleanupLock=release;});});});},{name,mode});
}
async function secondManager(freezeRefresh=false){
 const page=await context.newPage();if(freezeRefresh)await page.addInitScript(()=>{const interval=window.setInterval.bind(window);window.setInterval=((callback:any,delay?:number,...args:any[])=>interval(delay===1000?()=>{}:callback,delay,...args))as typeof window.setInterval;});
 page.on('dialog',dialog=>dialog.accept());await page.goto(base+'/manager.html#cloud');await expect(cleanup(page)).toBeVisible();return page;
}

test('cleanup removes only Cloud inputs and orphans, retaining links, original files and non-resumable history after reload',async()=>{
 const completed=job('Completed.mp4','completed',{link:'https://gofile.io/d/Fixture58'}),queued=job('Queued.mp4','queued'),paused=job('Paused.mp4','paused',{checkpoint:{url:'https://fixture.invalid/upload',offset:25},destination:{code:'fixture-deposit',region:'eu'},error:'cloudInterrupted'}),failed=job('Failed.mp4','failed',{error:'cloudResponse'}),cancelled=job('Cancelled.mp4','cancelled',{error:'cloudInterrupted'}),expired=job('Expired owner.mp4','paused',{owner:'expired-fixture-owner',leaseUntil:Date.now()-60_000});
 const entries=[completed,queued,paused,failed,cancelled,expired],originalTask=historyTask('Original retained',{filename:'Original.mp4',bytes:original.length});originalTask.output='Original.mp4';
 await seed(entries,['cloud-orphan-fixture']);await seedHistory(ui,[originalTask]);
 await ui.evaluate(async({id,bytes})=>{const root=await navigator.storage.getDirectory(),directory=await root.getDirectoryHandle(id,{create:true}),writer=await(await directory.getFileHandle('Original.mp4',{create:true})).createWritable();await writer.write(new Uint8Array(bytes));await writer.close();const rootFile=await(await root.getFileHandle('cloud-preserved-file',{create:true})).createWritable();await rootFile.write('preserve root files');await rootFile.close();},{id:originalTask.id,bytes:[...original]});
 await cleanup().click();await expect.poll(directories).toEqual([]);const saved=await jobs();expect(saved).toHaveLength(entries.length);
 for(const entry of saved){expect(entry.ready).toBe(false);expect(entry.checkpoint).toBeUndefined();expect(entry.destination).toBeUndefined();expect(entry.owner).toBeUndefined();expect(entry.leaseUntil).toBeUndefined();expect(entry.uploadAttempted).toBe(true);}
 expect(saved.find(entry=>entry.id===completed.id)).toMatchObject({state:'completed',link:completed.link,bytes:original.length});expect(saved.find(entry=>entry.id===failed.id)).toMatchObject({state:'failed',error:'cloudResponse'});
 for(const entry of saved.filter(entry=>![completed.id,failed.id].includes(entry.id))){expect(entry.state).toBe('cancelled');expect(entry.error).toBeUndefined();}
 const retained=await ui.evaluate(async id=>{const root=await navigator.storage.getDirectory(),file=await(await(await root.getDirectoryHandle(id)).getFileHandle('Original.mp4')).getFile();return{bytes:[...new Uint8Array(await file.arrayBuffer())],rootFile:await(await(await root.getFileHandle('cloud-preserved-file')).getFile()).text()};},originalTask.id);expect(Buffer.from(retained.bytes)).toEqual(original);expect(retained.rootFile).toBe('preserve root files');
 await ui.reload();await expect(ui.locator(`[data-cloud-id="${completed.id}"]`).getByRole('link')).toHaveAttribute('href',completed.link!);await expect(ui.locator('.cloud-jobs').getByRole('button',{name:c.resume,exact:true})).toHaveCount(0);expect((await jobs()).every(entry=>!entry.ready)).toBe(true);
 const library=await ui.evaluate(async id=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.find((task:any)=>task.id===id),originalTask.id);expect(library).toMatchObject({state:'completed',saved:true,output:'Original.mp4'});expect(await readFile('fixtures/media/low.mp4')).toEqual(original);
});

test('an upload lock in another manager blocks cleanup without changing inputs or history',async()=>{
 const paused=job('Preserved during upload.mp4','paused');await seed([paused]);const other=await secondManager();await holdLock(other,'alcydeo:cloud-upload');
 await cleanup().click();await expect(ui.getByRole('alert')).toHaveText(c.cloudTemporaryBusy);expect(await directories()).toEqual([`cloud-${paused.id}`]);expect((await jobs())[0]).toMatchObject({state:'paused',ready:true});
 await other.evaluate(()=>(window as any).__releaseCloudCleanupLock());await cleanup().click();await expect.poll(directories).toEqual([]);expect((await jobs())[0]).toMatchObject({state:'cancelled',ready:false});
});

test('a shared preparation lock in another manager protects even orphan Cloud copies',async()=>{
 await seed([],['cloud-orphan-in-progress']);const other=await secondManager();await holdLock(other,'alcydeo:cloud-files','shared');
 await cleanup().click();await expect(ui.getByRole('alert')).toHaveText(c.cloudTemporaryBusy);expect(await directories()).toEqual(['cloud-orphan-in-progress']);expect(await jobs()).toEqual([]);
 await other.evaluate(()=>(window as any).__releaseCloudCleanupLock());await cleanup().click();await expect.poll(directories).toEqual([]);
});

test('a failed deletion does not stop other removals and retry clears the remaining local copy',async()=>{
 const one=job('One.mp4','paused'),two=job('Two.mp4','paused');await seed([one,two],['cloud-orphan-cleanable']);const blocked=`cloud-${one.id}`;
 await ui.evaluate(blocked=>{const prototype=(window as any).FileSystemDirectoryHandle.prototype,remove=prototype.removeEntry;let first=true;prototype.removeEntry=async function(this:FileSystemDirectoryHandle,name:string,...args:any[]){if(name===blocked&&first){first=false;throw new window.DOMException('Synthetic deletion refusal','NoModificationAllowedError');}return remove.apply(this,[name,...args]);};},blocked);
 await cleanup().click();await expect(ui.getByRole('alert')).toHaveText(c.cloudTemporaryFailed);expect(await directories()).toEqual([blocked]);expect((await jobs()).every(entry=>!entry.ready&&entry.state==='cancelled')).toBe(true);
 await cleanup().click();await expect.poll(directories).toEqual([]);expect(await jobs()).toHaveLength(2);
});

test('a stale Resume button in another manager cannot requeue a purged input',async()=>{
 const paused=job('Stale resume.mp4','paused');await seed([paused]);const other=await secondManager(true),card=other.locator(`[data-cloud-id="${paused.id}"]`),resume=card.getByRole('button',{name:c.resume,exact:true});await expect(resume).toBeEnabled();
 await cleanup().click();await expect.poll(directories).toEqual([]);await expect(resume).toBeVisible();await resume.click();
 expect((await jobs())[0]).toMatchObject({state:'cancelled',ready:false});await expect(card).toHaveAttribute('data-state','cancelled');await expect(card.getByRole('button',{name:c.resume,exact:true})).toHaveCount(0);
});

test('a real preparation holds its shared lock before persisting any job or lease',async()=>{
 await seed([],['cloud-orphan-before-staging']);const other=await secondManager();
 await ui.evaluate(()=>{
  const state=window as any,estimate=navigator.storage.estimate.bind(navigator.storage);let first=true;
  const gate=new Promise<void>(release=>{state.__releaseCloudEstimate=release;});navigator.storage.estimate=async()=>{if(first){first=false;state.__cloudEstimateHeld=true;await gate;}return estimate();};
 });
 await ui.getByLabel(c.cloudChooseFile,{exact:true}).setInputFiles({name:'Original.mp4',mimeType:'video/mp4',buffer:original});await ui.getByRole('button',{name:c.cloudShare,exact:true}).click();await expect.poll(()=>ui.evaluate(()=>(window as any).__cloudEstimateHeld)).toBe(true);
 expect(await jobs()).toEqual([]);await cleanup(other).click();await expect(other.getByRole('alert')).toHaveText(c.cloudTemporaryBusy);expect(await directories()).toEqual(['cloud-orphan-before-staging']);expect(await jobs()).toEqual([]);
 await ui.evaluate(()=>(window as any).__releaseCloudEstimate());await expect.poll(async()=>{const saved=await jobs();return saved.length===1&&saved[0]?.state==='queued'&&saved[0]?.ready;}).toBe(true);await expect(ui.getByLabel(c.cloudChooseFile,{exact:true})).toBeEnabled();
 await cleanup(other).click();await expect.poll(directories).toEqual([]);expect((await jobs())[0]).toMatchObject({state:'cancelled',ready:false});
});

test('a live owner independently blocks the atomic purge, including a stale manager without held Web Locks',async()=>{
 const paused=job('Ordinary paused.mp4','paused');await seed([paused],['cloud-orphan-lease-protected']);const stale=await secondManager(true);await expect(stale.locator(`[data-cloud-id="${paused.id}"]`)).toBeVisible();
 const owned=job('Live owner.mp4','paused',{owner:'live-fixture-owner',leaseUntil:Date.now()+60_000});await seed([owned]);const before=await jobs(),beforeDirectories=await directories();
 await expect(cleanup(stale)).toBeEnabled();await cleanup(stale).click();await expect(stale.getByRole('alert')).toHaveText(c.cloudTemporaryBusy);expect(await jobs()).toEqual(before);expect(await directories()).toEqual(beforeDirectories);
 expect(await ui.evaluate(async()=>(await navigator.locks.query()).held?.filter(lock=>['alcydeo:cloud-upload','alcydeo:cloud-files'].includes(lock.name!)))).toEqual([]);await expect(cleanup()).toBeDisabled();
 await ui.evaluate(async id=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo-cloud',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('jobs','readwrite'),store=tx.objectStore('jobs'),request=store.get(id);request.onsuccess=()=>{const current=request.result;current.leaseUntil=Date.now()-1000;store.put(current);};tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}finally{db.close();}
 },owned.id);
 await stale.reload();await cleanup(stale).click();await expect.poll(directories).toEqual([]);expect((await jobs()).every(entry=>entry.state==='cancelled'&&!entry.ready&&!entry.owner)).toBe(true);await expect(cleanup()).toBeEnabled();
});

test('a real prepared upload failure is purged from OPFS without sending again or deleting the selected original',async()=>{
 let uploads=0;
 await context.route('https://upload.gofile.io/uploadfile',async route=>{
  const request=route.request(),form=await new Request(request.url(),{method:'POST',headers:{'Content-Type':request.headers()['content-type']!},body:new Uint8Array(request.postDataBuffer()!)}).formData(),file=form.get('file')as File;
  expect(Buffer.from(await file.arrayBuffer())).toEqual(original);uploads++;await route.fulfill({status:500});
 });
 await ui.evaluate(()=>(window as any).__runRealCloud=true);
 await ui.getByLabel(c.cloudChooseFile,{exact:true}).setInputFiles('fixtures/media/low.mp4');await ui.getByRole('button',{name:c.cloudShare,exact:true}).click();
 await expect.poll(async()=>{const saved=await jobs();return saved.length===1&&saved[0]?.state==='paused'&&!saved[0]?.owner;}).toBe(true);
 const prepared=(await jobs())[0]!;expect(uploads).toBe(1);expect(prepared.ready).toBe(true);
 const staged=await ui.evaluate(async id=>{const root=await navigator.storage.getDirectory(),file=await(await(await root.getDirectoryHandle(`cloud-${id}`)).getFileHandle('input')).getFile();return[...new Uint8Array(await file.arrayBuffer())];},prepared.id);expect(Buffer.from(staged)).toEqual(original);
 await cleanup().click();await expect.poll(directories).toEqual([]);expect((await jobs())[0]).toMatchObject({id:prepared.id,state:'cancelled',ready:false});expect(uploads).toBe(1);
 await ui.reload();await expect(ui.locator(`[data-cloud-id="${prepared.id}"]`)).toHaveAttribute('data-state','cancelled');await expect(ui.locator('.cloud-jobs').getByRole('button',{name:c.resume,exact:true})).toHaveCount(0);
 expect(await readFile('fixtures/media/low.mp4')).toEqual(original);expect(uploads).toBe(1);
 await test.info().attach('opfs-cleanup-proof',{contentType:'application/json',body:JSON.stringify({originalBytes:original.length,preparedBytes:staged.length,remainingCloudDirectories:await directories(),history:await jobs(),interceptedUploads:uploads})});
});

test('cancelling a real active upload releases cleanup protection in another manager',async()=>{
 let uploads=0,release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await context.route('https://upload.gofile.io/uploadfile',async route=>{uploads++;await gate;await route.fulfill({status:500}).catch(()=>{});});
 try{
  await seed([],['cloud-orphan-after-cancel']);await ui.evaluate(()=>(window as any).__runRealCloud=true);
  await ui.getByLabel(c.cloudChooseFile,{exact:true}).setInputFiles('fixtures/media/low.mp4');await ui.getByRole('button',{name:c.cloudShare,exact:true}).click();
  await expect.poll(async()=>{const saved=await jobs();return uploads===1&&saved[0]?.state==='uploading'&&!!saved[0]?.owner;}).toBe(true);
  const active=(await jobs())[0]!,other=await secondManager();await expect(cleanup(other)).toBeDisabled();expect(await directories()).toEqual([`cloud-${active.id}`,'cloud-orphan-after-cancel'].sort());
  await ui.locator(`[data-cloud-id="${active.id}"]`).getByRole('button',{name:c.cancel,exact:true}).click();
  await expect.poll(async()=>{const saved=await jobs();return saved[0]?.state==='cancelled'&&!saved[0]?.owner;}).toBe(true);release();
  await expect(cleanup(other)).toBeEnabled();await cleanup(other).click();await expect.poll(directories).toEqual([]);
  expect((await jobs())[0]).toMatchObject({state:'cancelled',ready:false});expect(uploads).toBe(1);expect(await readFile('fixtures/media/low.mp4')).toEqual(original);
 }finally{release();}
});

test('cleanup removes a large real directory listing without skipping entries during deletion',async()=>{
 const names=Array.from({length:205},(_,index)=>`cloud-orphan-${String(index).padStart(4,'0')}`);await seed([],names);expect(await directories()).toHaveLength(names.length);
 await cleanup().click();await expect.poll(directories).toEqual([]);expect(await jobs()).toEqual([]);await ui.reload();expect(await directories()).toEqual([]);
});

for(const failure of['root','listing']as const)test(`an OPFS ${failure} failure is reported as a cleanup failure and remains retryable`,async()=>{
 const paused=job('Storage refusal.mp4','paused');await seed([paused]);
 await ui.evaluate(failure=>{
  if(failure==='root'){
   const original=navigator.storage.getDirectory.bind(navigator.storage);let first=true;
   navigator.storage.getDirectory=async()=>{if(first){first=false;throw new window.DOMException('Synthetic OPFS root refusal','UnknownError');}return original();};
  }else{
   const prototype=(window as any).FileSystemDirectoryHandle.prototype,original=prototype.entries;let first=true;
   prototype.entries=async function*(this:FileSystemDirectoryHandle,...args:any[]){if(first){first=false;throw new window.DOMException('Synthetic OPFS listing refusal','UnknownError');}yield*original.apply(this,args);};
  }
 },failure);
 await cleanup().click();await expect(ui.getByRole('alert')).toHaveText(c.cloudTemporaryFailed);expect(await directories()).toEqual([`cloud-${paused.id}`]);
 await cleanup().click();await expect.poll(directories).toEqual([]);expect((await jobs())[0]).toMatchObject({state:'cancelled',ready:false});
});

test('a stale individual Remove cannot delete an upload resumed in another manager',async()=>{
 const paused=job('Concurrent remove.mp4','paused');await seed([paused]);const stale=await secondManager(true),staleCard=stale.locator(`[data-cloud-id="${paused.id}"]`),remove=staleCard.getByRole('button',{name:c.remove,exact:true});await expect(remove).toBeEnabled();
 let uploads=0,release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await context.route('https://upload.gofile.io/uploadfile',async route=>{uploads++;await gate;await route.fulfill({contentType:'application/json',body:JSON.stringify({status:'ok',data:{size:original.length,downloadPage:'https://gofile.io/d/ConcurrentRemove63'}})}).catch(()=>{});});
 try{
  await ui.evaluate(()=>(window as any).__runRealCloud=true);await ui.locator(`[data-cloud-id="${paused.id}"]`).getByRole('button',{name:c.resume,exact:true}).click();
  await expect.poll(async()=>{const saved=await jobs();return uploads===1&&saved[0]?.state==='uploading'&&!!saved[0]?.owner;}).toBe(true);
  await remove.click();await expect(stale.getByRole('alert')).toHaveText(c.cloudTemporaryBusy);expect((await jobs())[0]).toMatchObject({id:paused.id,state:'uploading',ready:true});expect(await directories()).toContain(`cloud-${paused.id}`);
  await expect(staleCard).toHaveAttribute('data-state','uploading');await expect(staleCard.getByRole('button',{name:c.remove,exact:true})).toHaveCount(0);
  release();await expect.poll(async()=>(await jobs())[0]?.state).toBe('completed');expect((await jobs())[0]?.link).toBe('https://gofile.io/d/ConcurrentRemove63');expect(uploads).toBe(1);
  const current=ui.locator(`[data-cloud-id="${paused.id}"]`);await expect(current).toHaveAttribute('data-state','completed');await expect.poll(()=>ui.evaluate(async()=>(await navigator.locks.query()).held?.some(lock=>lock.name==='alcydeo:cloud-upload'))).toBe(false);await current.getByRole('button',{name:c.remove,exact:true}).click();await expect.poll(jobs).toEqual([]);await expect.poll(directories).toEqual([]);expect(await readFile('fixtures/media/low.mp4')).toEqual(original);
 }finally{release();}
});

for(const protection of['queued','live lease']as const)test(`individual Remove atomically rechecks ${protection} even without a held upload lock`,async()=>{
 const paused=job('Atomic remove.mp4','paused');await seed([paused]);const stale=await secondManager(true),card=stale.locator(`[data-cloud-id="${paused.id}"]`),remove=card.getByRole('button',{name:c.remove,exact:true});await expect(remove).toBeEnabled();
 const protectedJob:CloudJob={...paused,...(protection==='queued'?{state:'queued' as const}:{owner:'concurrent-live-owner',leaseUntil:Date.now()+60_000})};await seed([protectedJob]);
 expect(await ui.evaluate(async()=>(await navigator.locks.query()).held?.filter(lock=>['alcydeo:cloud-upload','alcydeo:cloud-files'].includes(lock.name!)))).toEqual([]);
 await remove.click();await expect(stale.getByRole('alert')).toHaveText(c.cloudTemporaryBusy);expect((await jobs())[0]).toEqual(protectedJob);expect(await directories()).toEqual([`cloud-${paused.id}`]);
});
