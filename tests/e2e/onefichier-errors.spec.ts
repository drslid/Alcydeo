import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';
import{readFile}from'node:fs/promises';
import type{CloudJob}from'../../packages/cloud/contracts';

const original=await readFile('fixtures/media/low.mp4');
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')),c=catalogs.en;
const initialization='https://api.1fichier.com/v1/upload/get_upload_server.cgi',upload='https://ru-3.1fichier.com/upload.cgi?id=TestId0056',report='https://ru-3.1fichier.com/end.pl?xid=TestId0056';
let context:BrowserContext,ui:Page,unexpected:string[];
test.beforeEach(async()=>{
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');
 context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 unexpected=[];await context.route('https://**/*',route=>{unexpected.push(route.request().url());return route.abort();});
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');ui=await context.newPage();await ui.goto(`chrome-extension://${new URL(worker.url()).host}/manager.html#cloud`);
});
test.afterEach(async()=>{await context?.close();expect(unexpected).toEqual([]);});
async function send(){
 await ui.getByRole('button',{name:'1fichier',exact:true}).click();await ui.getByLabel(c.cloudChooseFile,{exact:true}).setInputFiles('fixtures/media/low.mp4');await ui.getByRole('button',{name:c.cloudOnefichierSend,exact:true}).click();
}
async function persistedJobs(){return ui.evaluate(async()=>{
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo-cloud',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 try{return await new Promise<CloudJob[]>((resolve,reject)=>{const request=db.transaction('jobs').objectStore('jobs').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}
});}
test('the native ru-3 node uploads the original fixture and confirms its fixed-node report; all provider traffic intercepted',async()=>{
 let initialized=0,uploaded=0,reported=0;
 await context.route(initialization,async route=>{initialized++;const request=route.request();expect(request.method()).toBe('POST');expect(request.headers().cookie).toBeUndefined();expect(request.headers().authorization).toBeUndefined();expect(request.postDataJSON()).toEqual({pretty:1});await route.fulfill({contentType:'application/json',body:JSON.stringify({url:'ru-3.1fichier.com',id:'TestId0056'})});});
 await context.route(upload,async route=>{
  uploaded++;const request=route.request();expect(request.method()).toBe('POST');expect(request.headers().cookie).toBeUndefined();expect(request.headers().authorization).toBeUndefined();
  const form=await new Request(request.url(),{method:'POST',headers:{'Content-Type':request.headers()['content-type']!},body:new Uint8Array(request.postDataBuffer()!)}).formData(),file=form.get('file[]')as File;
  expect(form.get('domain')).toBe('0');expect(file.name).toBe('low.mp4');expect(Buffer.from(await file.arrayBuffer())).toEqual(original);
  expect((await persistedJobs())[0]?.uploadAttempted).toBe(true);
  await route.fulfill({status:302,headers:{Location:'https://ignored-upload-redirect.invalid/not-followed'}});
 });
 await context.route(report,async route=>{reported++;expect(route.request().headers().json).toBe('1');await route.fulfill({contentType:'application/json',body:JSON.stringify({incoming:0,links:[{filename:'low.mp4',size:String(original.length),download:'https://1fichier.com/?original0056'}]})});});
 await send();const job=ui.locator('.cloud-jobs .task-card').first();await expect(job).toHaveAttribute('data-state','completed');await expect(job.getByRole('link',{name:c.cloudOpen,exact:true})).toHaveAttribute('href','https://1fichier.com/?original0056');expect({initialized,uploaded,reported}).toEqual({initialized:1,uploaded:1,reported:1});
 expect((await persistedJobs())[0]).toMatchObject({state:'completed',bytes:original.length,uploadAttempted:true});
});
test('invalid initialization is localized and sends no file or duplicate warning',async()=>{
 let initialized=0,uploaded=0;
 await context.route(initialization,async route=>{initialized++;await route.fulfill({contentType:'application/json',body:JSON.stringify({url:'untrusted.invalid',id:'TestId0056'})});});
 await context.route('https://ru-3.1fichier.com/**',async route=>{uploaded++;await route.abort();});
 await send();const job=ui.locator('.cloud-jobs .task-card').first();await expect(job).toHaveAttribute('data-state','paused');await expect(job.locator('.task-error')).toHaveText(c.err_cloudOnefichierUnavailable);await expect(job).not.toContainText('cloudOnefichierUnavailable');await expect(job.getByText(c.cloudRestart,{exact:true})).toHaveCount(0);
 expect((await persistedJobs())[0]).toMatchObject({error:'cloudOnefichierUnavailable',bytes:0,uploadAttempted:false});expect({initialized,uploaded}).toEqual({initialized:1,uploaded:0});
 await ui.reload();await expect(job).toHaveAttribute('data-state','paused');await expect(job.locator('.task-error')).toHaveText(c.err_cloudOnefichierUnavailable);await expect(job.getByText(c.cloudRestart,{exact:true})).toHaveCount(0);expect(initialized).toBe(1);
});
test('a lost upload response keeps duplicate uncertainty at zero bytes through reload and a failed initialization retry',async()=>{
 let initialized=0,uploaded=0;
 await context.route(initialization,async route=>{initialized++;await route.fulfill({contentType:'application/json',body:JSON.stringify({url:initialized===1?'ru-3.1fichier.com':'untrusted.invalid',id:'TestId0056'})});});
 await context.route(upload,async route=>{uploaded++;expect((await persistedJobs())[0]?.uploadAttempted).toBe(true);await route.abort('failed');});
 await send();const job=ui.locator('.cloud-jobs .task-card').first();await expect(job).toHaveAttribute('data-state','paused');await expect(job.locator('.task-error')).toHaveText(c.cloudNetwork);await expect(job.getByText(c.cloudRestart,{exact:true})).toBeVisible();expect((await persistedJobs())[0]).toMatchObject({bytes:0,uploadAttempted:true});
 await ui.reload();await expect(job.getByText(c.cloudRestart,{exact:true})).toBeVisible();const resume=job.getByRole('button',{name:c.resume,exact:true});await expect(resume).toBeEnabled();await resume.click();
 await expect(job.locator('.task-error')).toHaveText(c.err_cloudOnefichierUnavailable);await expect(job).toHaveAttribute('data-state','paused');await expect(job.getByText(c.cloudRestart,{exact:true})).toBeVisible();expect((await persistedJobs())[0]).toMatchObject({error:'cloudOnefichierUnavailable',bytes:0,uploadAttempted:true});expect({initialized,uploaded}).toEqual({initialized:2,uploaded:1});
});
test('an old paused task with no upload evidence preserves the duplicate warning',async()=>{
 await ui.evaluate(async size=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo-cloud',1);request.onupgradeneeded=()=>request.result.createObjectStore('jobs',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('jobs','readwrite'),now=Date.now();tx.objectStore('jobs').put({id:'legacy-cloud-0056',provider:'onefichier',name:'Legacy fixture.mp4',size,mime:'video/mp4',state:'paused',bytes:0,ready:true,error:'cloudOnefichierUnavailable',createdAt:now,updatedAt:now});tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}finally{db.close();}
 },original.length);
 await ui.reload();const job=ui.locator('[data-cloud-id="legacy-cloud-0056"]');await expect(job).toHaveAttribute('data-state','paused');await expect(job.locator('.task-error')).toHaveText(c.err_cloudOnefichierUnavailable);await expect(job.getByText(c.cloudRestart,{exact:true})).toBeVisible();expect((await persistedJobs())[0]?.uploadAttempted).toBeUndefined();
});
