import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';
import{readFile,mkdir}from'node:fs/promises';
import type{Task}from'../../packages/contracts';
import{historyTask,seedHistory}from'./history-fixture';

const original=await readFile('fixtures/media/low.mp4'),secondOriginal=await readFile('fixtures/media/high.mp4');
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')),c=catalogs.en;
const sourceTimestamp=Date.now();let sourceOrder=0;
let context:BrowserContext,ui:Page,base:string,unexpected:string[],uploads:{name:string;bytes:Buffer}[];
interface Source{task:Task;bytes:Buffer;retained:boolean}
function source(title:string,filename:string,retained=true,bytes=original):Source{
 const task=historyTask(title,{filename:`Synthetic/${filename}`,bytes:bytes.length,createdAt:sourceTimestamp-sourceOrder++});task.output=`source-${task.id}.mp4`;
 return{task,bytes,retained};
}
test.beforeEach(async()=>{
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');
 context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 unexpected=[];uploads=[];
 await context.route('https://**/*',route=>{unexpected.push(route.request().url());return route.abort();});
 await context.route('https://eapi.pcloud.com/uploadtolink',async route=>{
  const request=route.request(),form=await new Request(request.url(),{method:'POST',headers:{'Content-Type':request.headers()['content-type']!},body:new Uint8Array(request.postDataBuffer()!)}).formData(),file=form.get('file')as File;
  expect(form.get('code')).toBe('OriginalFixture55');expect(form.get('nopartial')).toBe('1');
  uploads.push({name:file.name,bytes:Buffer.from(await file.arrayBuffer())});
  await route.fulfill({contentType:'application/json',body:'{"result":0}'});
 });
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(worker.url()).host}`;
 ui=await context.newPage();await ui.goto(base+'/manager.html#library');
});
test.afterEach(async()=>{await context?.close();expect(unexpected).toEqual([]);});
async function seed(sources:Source[]){
 await ui.evaluate(async entries=>{const root=await navigator.storage.getDirectory();for(const entry of entries){const dir=await root.getDirectoryHandle(entry.id,{create:true}),writer=await(await dir.getFileHandle(entry.output,{create:true})).createWritable();await writer.write(new Uint8Array(entry.bytes));await writer.close();}},sources.filter(entry=>entry.retained).map(({task,bytes})=>({id:task.id,output:task.output!,bytes:[...bytes]})));
 await seedHistory(ui,sources.map(entry=>entry.task));await ui.reload();
 for(const entry of sources){const card=ui.locator(`[data-task-id="${entry.task.id}"]`);await expect(card).toBeVisible();if(entry.retained)await expect(card.locator('.task-thumbnail img')).toHaveCount(1);}
}
async function selectCloud(...sources:Source[]){
 await ui.locator('.manager-tabs').getByRole('button',{name:c.library,exact:true}).click();
 const clear=ui.locator('.selection-bar').getByRole('button',{name:c.clearSelection,exact:true});if(await clear.count())await clear.click();
 for(const entry of sources)await ui.locator(`[data-task-id="${entry.task.id}"]`).getByRole('checkbox').check();
 await ui.locator('.selection-bar').getByRole('button',{name:c.cloud,exact:true}).click();
 await expect(ui).toHaveURL(base+'/manager.html#cloud');await expect(ui.getByRole('dialog',{name:c.selectedFiles,exact:true})).toHaveCount(0);
}
async function choosePcloud(){
 await ui.getByRole('button',{name:'pCloud',exact:true}).click();await ui.getByLabel(c.cloudPcloudDestination,{exact:true}).fill('https://e.pcloud.com/#/puplink?code=OriginalFixture55');
}
const send=()=>ui.locator('.cloud-file-controls').getByRole('button',{name:/^Send to pCloud/});
async function persistedJobs(){return ui.evaluate(async()=>{
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo-cloud',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 try{return await new Promise<any[]>((resolve,reject)=>{const request=db.transaction('jobs').objectStore('jobs').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}
});}
async function holdNextCloudCopy(){await ui.evaluate(()=>{
 const prototype=(window as any).FileSystemFileHandle.prototype,original=prototype.createWritable;
 let first=true;const gate=new Promise<void>(resolve=>{(window as any).__releaseCloudCopy=resolve;});
 prototype.createWritable=async function(this:FileSystemFileHandle,...args:any[]){if(this.name==='input'&&first){first=false;(window as any).__cloudCopyHeld=true;await gate;}return original.apply(this,args);};
});}
async function sourceOwners(){return ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.map((task:any)=>({id:task.id,owner:task.owner})));}
async function stagedCloudDirectories(){return ui.evaluate(async()=>{const names:string[]=[],root=await navigator.storage.getDirectory();for await(const name of(root as any).keys())if(name.startsWith('cloud-'))names.push(name);return names.sort();});}

test('Library Cloud opens its destination page directly and resolves retained files without preparing or contacting a provider',async()=>{
 const alpha=source('Alpha','Étude.A-converted.mp4'),beta=source('Beta','Beta lesson.mp4',true,secondOriginal);await seed([alpha,beta]);await selectCloud(alpha,beta);
 await expect(ui.locator('.selected-cloud-file')).toHaveCount(2);await expect(ui.locator('.cloud-selected-entry[aria-busy="true"]')).toHaveCount(0);
 expect(await ui.locator('.selected-cloud-file').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('title')).sort())).toEqual(['Beta lesson.mp4','Étude.A-converted.mp4']);
 await choosePcloud();await expect(send()).toBeEnabled();expect(await persistedJobs()).toEqual([]);expect(uploads).toEqual([]);expect((await sourceOwners()).every((task:any)=>!task.owner)).toBe(true);
});

test('a card Cloud icon opens only that file without checking it and preserves the grouped selection',async()=>{
 const alpha=source('Alpha','Only.this-converted.mp4'),beta=source('Beta','Other selected.mp4',true,secondOriginal);await seed([alpha,beta]);
 const alphaCard=ui.locator(`[data-task-id="${alpha.task.id}"]`),betaCard=ui.locator(`[data-task-id="${beta.task.id}"]`);
 await expect(alphaCard.getByRole('checkbox')).not.toBeChecked();await expect(betaCard.getByRole('checkbox')).not.toBeChecked();
 await alphaCard.locator('.task-file-actions').getByRole('button',{name:c.cloud,exact:true}).click();
 await expect(ui).toHaveURL(base+'/manager.html#cloud');await expect(ui.getByRole('dialog')).toHaveCount(0);
 await expect(ui.locator('.selected-cloud-file')).toHaveCount(1);await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Only.this-converted.mp4');await expect(ui.locator('.cloud-selected-entry[aria-busy="true"]')).toHaveCount(0);
 expect(await persistedJobs()).toEqual([]);expect(await stagedCloudDirectories()).toEqual([]);expect(uploads).toEqual([]);expect((await sourceOwners()).every((task:any)=>!task.owner)).toBe(true);
 await ui.locator('.manager-tabs').getByRole('button',{name:c.library,exact:true}).click();await expect(alphaCard.getByRole('checkbox')).not.toBeChecked();await expect(betaCard.getByRole('checkbox')).not.toBeChecked();
 await betaCard.getByRole('checkbox').check();await alphaCard.locator('.task-file-actions').getByRole('button',{name:c.cloud,exact:true}).click();
 await expect(ui).toHaveURL(base+'/manager.html#cloud');await expect(ui.locator('.selected-cloud-file')).toHaveCount(1);await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Only.this-converted.mp4');
 await ui.locator('.manager-tabs').getByRole('button',{name:c.library,exact:true}).click();await expect(alphaCard.getByRole('checkbox')).not.toBeChecked();await expect(betaCard.getByRole('checkbox')).toBeChecked();
 await ui.locator('.selection-bar').getByRole('button',{name:c.cloud,exact:true}).click();await expect(ui).toHaveURL(base+'/manager.html#cloud');await expect(ui.getByRole('dialog')).toHaveCount(0);
 await expect(ui.locator('.selected-cloud-file')).toHaveCount(1);await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Other selected.mp4');await expect(ui.locator('.cloud-selected-entry[aria-busy="true"]')).toHaveCount(0);
 expect(await persistedJobs()).toEqual([]);expect(await stagedCloudDirectories()).toEqual([]);expect(uploads).toEqual([]);expect((await sourceOwners()).every((task:any)=>!task.owner)).toBe(true);
});

test('a card Cloud icon keeps a missing local copy inline until an explicit file choice and Send',async()=>{
 const missing=source('Missing card','Missing selected.mp4',false),other=source('Other card','Other available.mp4');await seed([missing,other]);
 const missingCard=ui.locator(`[data-task-id="${missing.task.id}"]`);await expect(missingCard.getByRole('checkbox')).not.toBeChecked();
 await missingCard.locator('.task-file-actions').getByRole('button',{name:c.cloud,exact:true}).click();
 await expect(ui).toHaveURL(base+'/manager.html#cloud');await expect(ui.getByRole('dialog')).toHaveCount(0);await expect(ui.locator('.selected-cloud-file')).toHaveCount(1);await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Missing selected.mp4');
 const chooser=ui.getByLabel(c.cloudChooseFile+' · Missing selected.mp4',{exact:true});await expect(chooser).toBeVisible();await expect(ui.locator('.cloud-selected-entry[aria-busy="true"]')).toHaveCount(0);
 await expect(ui.locator('.cloud-send-actions > .primary')).toBeDisabled();await expect(ui.locator('[data-cloud-all]')).toBeDisabled();expect(await persistedJobs()).toEqual([]);expect(await stagedCloudDirectories()).toEqual([]);expect(uploads).toEqual([]);
 await chooser.setInputFiles({name:'Chosen.été-converted.mp4',mimeType:'video/mp4',buffer:secondOriginal});
 await expect(ui.locator('.selected-cloud-file')).toHaveCount(1);await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Chosen.été-converted.mp4');await expect(ui.getByRole('dialog')).toHaveCount(0);
 await expect(ui.locator('.cloud-send-actions > .primary')).toBeEnabled();await expect(ui.locator('[data-cloud-all]')).toBeEnabled();expect(await persistedJobs()).toEqual([]);expect(await stagedCloudDirectories()).toEqual([]);expect(uploads).toEqual([]);expect((await sourceOwners()).every((task:any)=>!task.owner)).toBe(true);
});

test('an inline file choice keeps its source lease and actual name after an earlier selected row is removed',async()=>{
 const alpha=source('Alpha','Alpha.mp4'),missing=source('Missing copy','Missing copy.mp4',false);await seed([alpha,missing]);await selectCloud(alpha,missing);
 const chooser=ui.getByLabel(c.cloudChooseFile+' · Missing copy.mp4',{exact:true});await expect(chooser).toBeVisible();await choosePcloud();await expect(send()).toBeDisabled();expect(await persistedJobs()).toEqual([]);expect(uploads).toEqual([]);
 await chooser.setInputFiles({name:'Picked.été-converted.mp4',mimeType:'video/mp4',buffer:secondOriginal});
 await expect(ui.locator('.selected-cloud-file').first()).toHaveAttribute('title','Alpha.mp4');
 await ui.getByRole('button',{name:c.remove+' · Alpha.mp4',exact:true}).click();await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Picked.été-converted.mp4');
 await holdNextCloudCopy();await send().click();await expect.poll(()=>ui.evaluate(()=>(window as any).__cloudCopyHeld)).toBe(true);
 const owners=await sourceOwners();expect(owners.find((task:any)=>task.id===missing.task.id)?.owner).toBeTruthy();expect(owners.find((task:any)=>task.id===alpha.task.id)?.owner).toBeUndefined();expect(uploads).toEqual([]);
 await ui.evaluate(()=>(window as any).__releaseCloudCopy());await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(1);
 expect(uploads.map(file=>file.name)).toEqual(['Picked.été-converted.mp4']);expect(uploads[0]!.bytes).toEqual(secondOriginal);await expect(ui.locator('.selected-cloud-file')).toHaveCount(0);expect((await sourceOwners()).every((task:any)=>!task.owner)).toBe(true);
});

test('a delayed OPFS read cannot reinsert an old file after a new Library selection',async()=>{
 const alpha=source('Alpha','Previous.mp4'),beta=source('Beta','Current.mp4',true,secondOriginal);await seed([alpha,beta]);
 await ui.evaluate(output=>{
  const prototype=(window as any).FileSystemFileHandle.prototype,original=prototype.getFile;let first=true;const gate=new Promise<void>(resolve=>{(window as any).__releaseCloudRead=resolve;});
  prototype.getFile=async function(this:FileSystemFileHandle){const file=await original.call(this);if(this.name===output&&location.hash==='#cloud'&&first){first=false;(window as any).__cloudReadHeld=true;await gate;(window as any).__cloudReadReleased=true;}return file;};
 },alpha.task.output!);
 await selectCloud(alpha);await expect.poll(()=>ui.evaluate(()=>(window as any).__cloudReadHeld)).toBe(true);await expect(ui.locator('.cloud-selected-entry')).toHaveAttribute('aria-busy','true');
 await selectCloud(beta);await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Current.mp4');await expect(ui.locator('.cloud-selected-entry[aria-busy="true"]')).toHaveCount(0);
 await ui.evaluate(()=>(window as any).__releaseCloudRead());await expect.poll(()=>ui.evaluate(()=>(window as any).__cloudReadReleased)).toBe(true);
 await expect(ui.locator('.selected-cloud-file')).toHaveCount(1);await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Current.mp4');expect(await persistedJobs()).toEqual([]);expect(uploads).toEqual([]);
});

test('a fresh Library selection survives an earlier Send that is still copying its original file',async()=>{
 const alpha=source('Alpha','First send.mp4'),beta=source('Beta','Next selection.mp4',true,secondOriginal);await seed([alpha,beta]);await selectCloud(alpha);await choosePcloud();await expect(send()).toBeEnabled();await holdNextCloudCopy();await send().click();
 await expect.poll(()=>ui.evaluate(()=>(window as any).__cloudCopyHeld)).toBe(true);await selectCloud(beta);await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Next selection.mp4');await expect(send()).toBeDisabled();expect(uploads).toEqual([]);
 await ui.evaluate(()=>(window as any).__releaseCloudCopy());await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(1);await expect(send()).toBeEnabled();await expect(ui.locator('.selected-cloud-file')).toHaveAttribute('title','Next selection.mp4');
 expect(uploads.map(file=>file.name)).toEqual(['First send.mp4']);expect(uploads[0]!.bytes).toEqual(original);expect((await persistedJobs()).map(job=>job.name)).toEqual(['First send.mp4']);
 await send().click();await expect(ui.locator('.cloud-jobs [data-state="completed"]')).toHaveCount(2);expect(uploads.map(file=>file.name)).toEqual(['First send.mp4','Next selection.mp4']);expect(uploads[1]!.bytes).toEqual(secondOriginal);await expect(ui.locator('.selected-cloud-file')).toHaveCount(0);
});

test('the inline Cloud selection remains usable in ten languages, RTL, narrow layouts and both themes',async()=>{
 const alpha=source('Alpha','Étude.A-converted.mp4'),missing=source('Missing','Missing copy.mp4',false),evidence='artifacts/evidence/cloud-direct-0.1.55';
 await seed([alpha,missing]);await selectCloud(alpha,missing);await choosePcloud();await mkdir(evidence,{recursive:true});
 for(const[locale,messages]of Object.entries(catalogs)as[string,Record<string,string>][]){
  await ui.evaluate(language=>chrome.storage.local.set({language}),locale);await expect(ui.locator('html')).toHaveAttribute('lang',locale.replace('_','-'));await expect(ui.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(locale)?'rtl':'ltr');
  await expect(ui).toHaveURL(base+'/manager.html#cloud');await expect(ui.getByRole('dialog')).toHaveCount(0);await expect(ui.locator('.selected-cloud-file')).toHaveCount(2);
  const chooser=ui.getByLabel(messages.cloudChooseFile+' · Missing copy.mp4',{exact:true});await expect(chooser).toBeVisible();await expect(ui.locator('.cloud-send-actions > .primary')).toBeDisabled();
  for(const width of[1280,390]){
   await ui.setViewportSize({width,height:950});await ui.evaluate(()=>document.fonts.ready);expect(await ui.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   expect(await chooser.evaluate(element=>{const bounds=element.closest('label')!.getBoundingClientRect();return bounds.left>=0&&bounds.right<=innerWidth;})).toBe(true);
   if(['fr','ur'].includes(locale))for(const theme of['light','dark']){await ui.evaluate(value=>document.documentElement.dataset.theme=value,theme);await ui.mouse.move(0,0);await ui.screenshot({path:`${evidence}/${locale}-${theme}-${width}.png`,fullPage:true,animations:'disabled'});}
  }
 }
 expect(await persistedJobs()).toEqual([]);expect(uploads).toEqual([]);
});
