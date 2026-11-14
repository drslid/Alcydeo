import{test,expect,chromium,type BrowserContext,type Page,type Request as PlaywrightRequest}from'@playwright/test';
import{resolve}from'node:path';
import{readFile}from'node:fs/promises';
import type{Task}from'../../packages/contracts';
import type{CloudJob}from'../../packages/cloud/contracts';
import{historyTask,seedHistory}from'./history-fixture';

const providers=['gofile','megaup','onefichier','turbobit']as const;
type Provider=typeof providers[number];
interface Upload{name:string;bytes:Buffer}
interface Source{task:Task;bytes:Buffer}
const original=await readFile('fixtures/media/low.mp4'),otherOriginal=await readFile('fixtures/media/high.mp4');
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')),c=catalogs.en;
let context:BrowserContext,ui:Page,base:string,unexpected:string[],uploads:Record<Provider,Upload[]>;
let initializations:Record<'megaup'|'onefichier'|'turbobit',number>,failOnce:Provider|undefined;
let gate:{provider?:Provider;promise:Promise<void>;release:()=>void}|undefined;
const reports=new Map<string,Upload>();

async function fileFrom(request:PlaywrightRequest,key:string){
 const form=await new Request(request.url(),{method:'POST',headers:{'Content-Type':request.headers()['content-type']!},body:new Uint8Array(request.postDataBuffer()!)}).formData();
 const file=form.get(key)as File;expect(file).toBeTruthy();
 return{name:file.name,bytes:Buffer.from(await file.arrayBuffer())};
}
async function received(provider:Provider,request:PlaywrightRequest,key:string){
 const file=await fileFrom(request,key);uploads[provider].push(file);
 if(gate&&(!gate.provider||gate.provider===provider))await gate.promise;
 const fail=failOnce===provider;if(fail)failOnce=undefined;
 return{file,fail};
}
function holdUpload(provider?:Provider){let release:()=>void=()=>{};const promise=new Promise<void>(resolve=>{release=resolve;});gate={provider,promise,release};}
const all=()=>ui.locator('[data-cloud-all]');
const cards=()=>ui.locator('.cloud-jobs .task-card');
const counts=()=>Object.fromEntries(providers.map(provider=>[provider,uploads[provider].length]));

test.beforeEach(async()=>{
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??process.env.ALCYDEO_TEST_EXTENSION??'apps/extension/.output/chrome-mv3');
 context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 unexpected=[];uploads={gofile:[],megaup:[],onefichier:[],turbobit:[]};initializations={megaup:0,onefichier:0,turbobit:0};failOnce=undefined;gate=undefined;reports.clear();
 await context.route('https://**/*',route=>{unexpected.push(route.request().url());return route.abort();});
 await context.route('https://upload.gofile.io/uploadfile',async route=>{
  const{file,fail}=await received('gofile',route.request(),'file');
  await route.fulfill(fail?{status:500}:{contentType:'application/json',body:JSON.stringify({status:'ok',data:{size:file.bytes.length,downloadPage:`https://gofile.io/d/Fixture${uploads.gofile.length}`}})}).catch(()=>{});
 });
 await context.route('https://megaup.net/',route=>{
  const attempt=++initializations.megaup;
  return route.fulfill({contentType:'text/html',body:`<!doctype html><script>const uploadEndpoints=["https://f106.mupload.store/ajax/file_upload_handler"];var maxChunkSize=100000000;var uploaderMaxSize=5368709120;var fields={_sessionid:'fixture-cloud-all-session-${attempt}',cTracker:'fixture-cloud-all-tracker'};</script>`});
 });
 await context.route('https://f106.mupload.store/ajax/file_upload_handler',async route=>{
  const{file,fail}=await received('megaup',route.request(),'files[]');
  await route.fulfill(fail?{status:500}:{contentType:'application/json',body:JSON.stringify([{name:file.name,size:file.bytes.length,url:`https://megaup.net/fixture/${uploads.megaup.length}`}])}).catch(()=>{});
 });
 await context.route('https://api.1fichier.com/v1/upload/get_upload_server.cgi',route=>{
  const id=`TestId${String(++initializations.onefichier).padStart(4,'0')}`;
  return route.fulfill({contentType:'application/json',body:JSON.stringify({url:'ru-3.1fichier.com',id})});
 });
 await context.route('https://ru-3.1fichier.com/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/upload.cgi'){
   const{file,fail}=await received('onefichier',route.request(),'file[]'),id=url.searchParams.get('id')!;reports.set(id,file);
   await route.fulfill(fail?{status:500}:{status:302,headers:{Location:`/end.pl?xid=${id}`}}).catch(()=>{});
  }else{
   expect(url.pathname).toBe('/end.pl');const file=reports.get(url.searchParams.get('xid')!)!;expect(file).toBeTruthy();
   await route.fulfill({contentType:'application/json',body:JSON.stringify({incoming:0,links:[{filename:file.name,size:file.bytes.length,download:`https://1fichier.com/?fixture${initializations.onefichier}`} ]})});
  }
 });
 await context.route('https://app.torbobit.net/api/upload/urls',route=>{
  const attempt=++initializations.turbobit;
  return route.fulfill({contentType:'application/json',body:JSON.stringify({urls:[`https://s${327+attempt}.fdfiles.net/uploadfile`]})});
 });
 await context.route('https://*.fdfiles.net/uploadfile',async route=>{
  const{file,fail}=await received('turbobit',route.request(),'Filedata');
  await route.fulfill(fail?{status:500}:{contentType:'application/json',body:JSON.stringify({id:`Fixture${uploads.turbobit.length}`,name:file.name,size:file.bytes.length})}).catch(()=>{});
 });
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(worker.url()).host}`;
 ui=await context.newPage();await ui.goto(base+'/manager.html#cloud');
});
test.afterEach(async()=>{gate?.release();await context?.close();expect(unexpected).toEqual([]);});
async function choose(name='Étude-all-converted.mp4',bytes=original){await ui.getByLabel(c.cloudChooseFile,{exact:true}).setInputFiles({name,mimeType:'video/mp4',buffer:bytes});}
async function jobs(){return ui.evaluate(async()=>{
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo-cloud',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 try{return await new Promise<CloudJob[]>((resolve,reject)=>{const request=db.transaction('jobs').objectStore('jobs').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}
});}
async function providerCard(provider:Provider){const job=(await jobs()).find(job=>job.provider===provider)!;expect(job).toBeTruthy();return ui.locator(`[data-cloud-id="${job.id}"]`);}
function source(name:string,bytes=original):Source{const task=historyTask(name,{filename:`Synthetic/${name}`,bytes:bytes.length});task.output=`source-${task.id}.mp4`;return{task,bytes};}
async function seed(sources:Source[]){
 await ui.evaluate(async entries=>{const root=await navigator.storage.getDirectory();for(const entry of entries){const dir=await root.getDirectoryHandle(entry.id,{create:true}),writer=await(await dir.getFileHandle(entry.output,{create:true})).createWritable();await writer.write(new Uint8Array(entry.bytes));await writer.close();}},sources.map(({task,bytes})=>({id:task.id,output:task.output!,bytes:[...bytes]})));
 await seedHistory(ui,sources.map(entry=>entry.task));await ui.reload();
}
async function selectCloud(source:Source){
 await ui.locator('.manager-tabs').getByRole('button',{name:c.library,exact:true}).click();
 const clear=ui.locator('.selection-bar').getByRole('button',{name:c.clearSelection,exact:true});if(await clear.count())await clear.click();
 await ui.locator(`[data-task-id="${source.task.id}"]`).getByRole('checkbox').check();
 await ui.locator('.selection-bar').getByRole('button',{name:c.cloud,exact:true}).click();await expect(ui).toHaveURL(base+'/manager.html#cloud');
}
async function holdFirstCopy(){await ui.evaluate(()=>{
 const prototype=(window as any).FileSystemFileHandle.prototype,original=prototype.createWritable;let first=true;
 const state=window as unknown as{__cloudCopyHeld?:boolean;__releaseCloudCopy?:()=>void};const gate=new Promise<void>(resolve=>{state.__releaseCloudCopy=resolve;});
 prototype.createWritable=async function(this:FileSystemFileHandle,...args:any[]){if(this.name==='input'&&first){first=false;state.__cloudCopyHeld=true;await gate;}return original.apply(this,args);};
});}

test('all destinations sends four exact copies only after click, without a pCloud link',async()=>{
 await choose();await ui.getByRole('button',{name:'pCloud',exact:true}).click();
 await expect(ui.getByRole('button',{name:c.cloudPcloudSend,exact:true})).toBeDisabled();await expect(all()).toBeEnabled();
 expect(await jobs()).toEqual([]);expect(counts()).toEqual({gofile:0,megaup:0,onefichier:0,turbobit:0});expect(initializations).toEqual({megaup:0,onefichier:0,turbobit:0});
 await all().click();await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(4,{timeout:20000});
 expect(counts()).toEqual({gofile:1,megaup:1,onefichier:1,turbobit:1});
 for(const provider of providers){expect(uploads[provider][0]!.name).toBe('Étude-all-converted.mp4');expect(uploads[provider][0]!.bytes).toEqual(original);}
 expect((await jobs()).map(job=>job.provider).sort()).toEqual([...providers].sort());await expect(ui.locator('.selected-cloud-file')).toHaveCount(0);
 expect(await ui.evaluate(()=>chrome.permissions.contains({permissions:['identity']}))).toBe(false);
});

test('a remote failure leaves the other destinations complete and resumes only that provider',async()=>{
 failOnce='turbobit';await choose();await all().click();await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(3,{timeout:20000});
 const failed=await providerCard('turbobit');await expect(failed).toHaveAttribute('data-state','paused');await expect(ui.locator('.selected-cloud-file')).toHaveCount(0);
 expect(counts()).toEqual({gofile:1,megaup:1,onefichier:1,turbobit:1});await failed.getByRole('button',{name:c.resume,exact:true}).click();
 await expect(failed).toHaveAttribute('data-state','completed');expect(counts()).toEqual({gofile:1,megaup:1,onefichier:1,turbobit:2});expect(initializations.turbobit).toBe(2);expect(uploads.turbobit[1]!.bytes).toEqual(original);expect(await jobs()).toHaveLength(4);
});

test('an old all-destinations click cannot consume a later Library selection',async()=>{
 const alpha=source('First batch.mp4'),beta=source('Next batch.mp4',otherOriginal);await seed([alpha,beta]);await selectCloud(alpha);await expect(all()).toBeEnabled();
 await holdFirstCopy();await all().click();await expect.poll(()=>ui.evaluate(()=>(window as unknown as{__cloudCopyHeld?:boolean}).__cloudCopyHeld)).toBe(true);
 await selectCloud(beta);await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Next batch.mp4');await expect(all()).toBeDisabled();
 const owners=await ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.map((task:Task)=>({id:task.id,owner:task.owner})));
 expect(owners.find((task:{id:string;owner?:string})=>task.id===alpha.task.id)?.owner).toBeTruthy();expect(owners.find((task:{id:string;owner?:string})=>task.id===beta.task.id)?.owner).toBeUndefined();
 await ui.evaluate(()=>(window as unknown as{__releaseCloudCopy:()=>void}).__releaseCloudCopy());
 await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(4,{timeout:20000});await expect(all()).toBeEnabled();await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Next batch.mp4');
 for(const provider of providers){expect(uploads[provider].map(file=>file.name)).toEqual(['First batch.mp4']);expect(uploads[provider][0]!.bytes).toEqual(original);}
 await all().click();await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(8,{timeout:20000});
 for(const provider of providers){expect(uploads[provider].map(file=>file.name)).toEqual(['First batch.mp4','Next batch.mp4']);expect(uploads[provider][1]!.bytes).toEqual(otherOriginal);}
 await expect(ui.locator('.selected-cloud-file')).toHaveCount(0);
});

test('retrying a partial local preparation creates only the previously missing destination',async()=>{
 await choose();await ui.evaluate(()=>{
  const prototype=(window as any).FileSystemFileHandle.prototype,original=prototype.createWritable;let copies=0;
  prototype.createWritable=async function(this:FileSystemFileHandle,...args:any[]){if(this.name==='input'&&++copies===2)throw new window.DOMException('Synthetic second copy failure','NotReadableError');return original.apply(this,args);};
 });
 await all().click();await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(3,{timeout:20000});await expect(ui.locator('.cloud-jobs [data-state="failed"]')).toHaveCount(1);
 await expect(ui.locator('.cloud-preparation-messages[role="status"]')).toContainText('MegaUp');await expect(ui.locator('.selected-cloud-file')).toHaveCount(1);await expect(all()).toBeEnabled();
 expect(counts()).toEqual({gofile:1,megaup:0,onefichier:1,turbobit:1});await all().click();
 await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(4,{timeout:20000});expect(counts()).toEqual({gofile:1,megaup:1,onefichier:1,turbobit:1});
 expect(await jobs()).toHaveLength(5);for(const provider of providers)expect(uploads[provider][0]!.bytes).toEqual(original);await expect(ui.locator('.selected-cloud-file')).toHaveCount(0);
});

test('cancelling one queued destination preserves the other staged copies',async()=>{
 holdUpload();await choose();await all().click();await expect.poll(()=>providers.reduce((sum,provider)=>sum+uploads[provider].length,0)).toBe(1);await expect(cards()).toHaveCount(4);
 const active=(await jobs()).find(job=>job.state==='uploading')!,cancelTarget=providers.find(provider=>provider!==active.provider)!;
 const cancelled=await providerCard(cancelTarget);await expect(cancelled).toHaveAttribute('data-state','queued');await cancelled.getByRole('button',{name:c.cancel,exact:true}).click();await expect(cancelled).toHaveAttribute('data-state','cancelled');
 const pending=(await jobs()).filter(job=>job.provider!==active.provider&&job.provider!==cancelTarget);expect(pending).toHaveLength(2);
 const sizes=await ui.evaluate(async ids=>{const root=await navigator.storage.getDirectory();return Promise.all(ids.map(async id=>(await(await(await root.getDirectoryHandle(`cloud-${id}`)).getFileHandle('input')).getFile()).size));},pending.map(job=>job.id));expect(sizes).toEqual([original.length,original.length]);
 gate!.release();await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(3,{timeout:20000});await expect(cancelled).toHaveAttribute('data-state','cancelled');
 for(const provider of providers)expect(uploads[provider]).toHaveLength(provider===cancelTarget?0:1);await ui.reload();await expect(ui.locator('.cloud-jobs [data-state="cancelled"]')).toHaveCount(1);await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(3);
});

test('a late heartbeat error from the previous copy cannot abort the next destination',async()=>{
 await choose();await ui.evaluate(()=>{
  const state:any={copies:0,arm:false,heldHeartbeat:false};(window as any).__cloudHeartbeatRace=state;
  const interval=window.setInterval.bind(window);window.setInterval=((callback:any,delay?:number,...args:any[])=>{
   if(delay===5000&&typeof callback==='function'){state.fireHeartbeat??=()=>{state.arm=true;callback(...args);};return interval(()=>{},delay);}
   return interval(callback,delay,...args);
  })as typeof window.setInterval;
  const files=(window as any).FileSystemFileHandle.prototype,createWritable=files.createWritable;
  files.createWritable=async function(this:FileSystemFileHandle,...args:any[]){
   if(this.name==='input'&&++state.copies<=2)await new Promise<void>(resolve=>{state[`releaseCopy${state.copies}`]=resolve;});
   return createWritable.apply(this,args);
  };
  const databases=(window as any).IDBDatabase.prototype,transaction=databases.transaction;
  databases.transaction=function(this:IDBDatabase,...args:any[]){
   const current:IDBTransaction=transaction.apply(this,args);
   if(this.name!=='alcydeo-cloud'||args[1]!=='readwrite'||!state.arm)return current;
   state.arm=false;state.heldHeartbeat=true;current.addEventListener('error',event=>event.preventDefault());
   // Abort the real heartbeat transaction, but deliver its error after copy 2 starts.
   window.queueMicrotask(()=>current.abort());
   return new Proxy(current,{
    get(target,key){const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},
    set(target,key,value){if(key==='onerror'||key==='onabort'){state.failHeartbeat=()=>value.call(current,new Event('abort'));return true;}return Reflect.set(target,key,value,target);},
   });
  };
 });
 await all().click();await expect.poll(()=>ui.evaluate(()=>(window as any).__cloudHeartbeatRace.copies)).toBe(1);
 await ui.evaluate(()=>(window as any).__cloudHeartbeatRace.fireHeartbeat());await expect.poll(()=>ui.evaluate(()=>(window as any).__cloudHeartbeatRace.heldHeartbeat)).toBe(true);
 await ui.evaluate(()=>(window as any).__cloudHeartbeatRace.releaseCopy1());await expect.poll(()=>ui.evaluate(()=>(window as any).__cloudHeartbeatRace.copies)).toBe(2);
 const chooser=ui.getByLabel(c.cloudChooseFile,{exact:true});await expect(chooser).toBeDisabled();
 await ui.evaluate(async()=>{const state=(window as any).__cloudHeartbeatRace;state.failHeartbeat();await Promise.resolve();await Promise.resolve();await Promise.resolve();state.releaseCopy2();});
 await expect(chooser).toBeEnabled();expect((await jobs()).filter(job=>job.state==='failed').map(job=>job.provider)).toEqual([]);
 await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(4,{timeout:20000});expect(counts()).toEqual({gofile:1,megaup:1,onefichier:1,turbobit:1});
 for(const provider of providers)expect(uploads[provider][0]!.bytes).toEqual(original);
});
