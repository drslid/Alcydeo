import {test,expect,chromium,type BrowserContext,type Page,type Worker} from '@playwright/test';
import {resolve} from 'node:path';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
let context:BrowserContext,sw:Worker,base:string,profile:string,source:Page,ui:Page,tabId:number;
const evidence='artifacts/evidence/output-saving-0.1.32';
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')) as Record<string,Record<string,string>>;
test.beforeEach(async()=>{
 profile=await mkdtemp(resolve(tmpdir(),'alcydeo-output-'));await mkdir(resolve(profile,'Default'));await mkdir(evidence,{recursive:true});
 await writeFile(resolve(profile,'Default/Preferences'),JSON.stringify({download:{default_directory:resolve(evidence,'downloads',crypto.randomUUID()),prompt_for_download:false}}));
 const ext=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox','--test-type']});
 const cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});await cdp.detach();
 sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;
 await sw.evaluate(async()=>{const{settings}=await chrome.storage.local.get('settings');await chrome.storage.local.set({settings:{...settings,saveAs:false,multipart:false}});});
 source=await context.newPage();await source.goto('http://127.0.0.1:4179/save-modes.html');tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());
 ui=await context.newPage();await ui.setViewportSize({width:525,height:600});await ui.goto(`${base}/popup.html?tabId=${tabId}`);
});
test.afterEach(async()=>{await context?.close();await rm(profile,{recursive:true,force:true});});
async function task(){return ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks[0]);}
async function start(){await ui.locator('.media-card').filter({has:ui.getByRole('heading',{name:'Save segmented video',exact:true})}).locator('.media-controls .primary').click();await expect.poll(()=>context.pages().find(p=>p.url().includes('/manager.html'))?.url()).toBeTruthy();return context.pages().find(p=>p.url().includes('/manager.html'))!;}
async function saved(){await expect.poll(async()=>(await task())?.saved,{timeout:20000}).toBe(true);const t=await task();const item=await sw.evaluate(async id=>(await chrome.downloads.search({id}))[0],t.downloadId);expect(item.state).toBe('complete');expect(item.exists).toBe(true);expect((await readFile(item.filename)).length).toBe(t.validation.bytes);return t;}
test('a lost final worker notification automatically saves the verified output after manager reload',async()=>{
 await context.addInitScript(()=>{
  if(location.pathname!=='/manager.html')return;
  const descriptor=Object.getOwnPropertyDescriptor(Worker.prototype,'onmessage')!;
  Object.defineProperty(Worker.prototype,'onmessage',{configurable:true,get:descriptor.get,set(listener){descriptor.set!.call(this,(event:MessageEvent)=>{if(event.data?.type==='ready'){(window as any).droppedReady=true;return;}listener.call(this,event);});}});
 });
 const manager=await start();await expect.poll(()=>manager.evaluate(()=>(window as any).droppedReady)).toBe(true);const ready=await task();expect(ready.validation.tracks).toHaveLength(2);expect(ready.output).toBe('output.mp4');expect(ready.downloadId).toBeUndefined();await manager.reload();
 await manager.screenshot({path:`${evidence}/after-reload.png`,fullPage:true});
 const second=await context.newPage();await second.goto(`${base}/manager.html#library`);
 await saved();expect((await task()).validation.checkedAt).toBe(ready.validation.checkedAt);
 expect((await sw.evaluate(()=>chrome.downloads.search({})))).toHaveLength(1);
 await ui.reload();await expect(ui.locator('.popup-task-meta')).toContainText('Saved');await expect(ui.locator('.popup-task-actions').getByRole('button',{name:'Show in folder',exact:true})).toBeVisible();
});
test('a created Chrome download survives a lost reply without a second disk copy',async()=>{
 await context.addInitScript(()=>{
  if(location.pathname!=='/manager.html')return;const original=chrome.downloads.download.bind(chrome.downloads);
  chrome.downloads.download=(async options=>{const id=await original(options);(window as any).createdDownloadId=id;return new Promise<number>(()=>{});}) as typeof chrome.downloads.download;
 });
 const manager=await start();await expect.poll(()=>manager.evaluate(()=>(window as any).createdDownloadId)).toBeGreaterThan(0);const id=await manager.evaluate(()=>(window as any).createdDownloadId);await manager.close();
 await saved();expect((await task()).downloadId).toBe(id);const other=await context.newPage();await other.goto(`${base}/manager.html#library`);await other.waitForTimeout(1300);expect(await sw.evaluate(()=>chrome.downloads.search({}))).toHaveLength(1);
});
test('saving stays below 100 percent; dismissing Save As requires an explicit save retry only',async()=>{
 await ui.evaluate(async()=>{const{data}=await chrome.runtime.sendMessage({type:'snapshot'});await chrome.runtime.sendMessage({type:'settings',value:{...data.settings,saveAs:true,folder:'My lessons'}});});
 await context.addInitScript(()=>{
  if(location.pathname!=='/manager.html')return;const original=chrome.downloads.download.bind(chrome.downloads);(window as any).saveCalls=0;
  chrome.downloads.download=(async options=>{(window as any).saveCalls++;(window as any).saveOptions={filename:options.filename,saveAs:options.saveAs};await new Promise<void>((resolve,reject)=>{(window as any).dismissSave=()=>reject(new Error('Dismissed chooser'));});return original(options);}) as typeof chrome.downloads.download;
  (window as any).restoreSave=()=>{chrome.downloads.download=original;};
 });
 let mediaRequests=0;context.on('request',r=>{if(r.url().includes('/hls/')||r.url().includes('/media/seg'))mediaRequests++;});
 const manager=await start();await expect.poll(()=>manager.evaluate(()=>(window as any).saveCalls)).toBe(1);await expect(ui.locator('.popup-task-meta')).toContainText('Saving file');await expect(ui.locator('.popup-task progress')).toHaveAttribute('value','0.99');await expect(manager.locator('.task-card progress')).toHaveAttribute('value','0.99');await expect(ui.locator('.popup-task').getByRole('button',{name:'Download',exact:true})).toHaveCount(0);
 await ui.screenshot({path:`${evidence}/saving-en.png`});const ready=await task();expect(ready.saved).not.toBe(true);expect(ready.downloadId).toBeUndefined();expect(await manager.evaluate(()=>(window as any).saveOptions)).toEqual({filename:'My lessons/Save segmented video.mp4',saveAs:true});
 await manager.evaluate(()=>(window as any).dismissSave());await expect.poll(async()=>(await task()).error).toBe('saveDialog');await expect(ui.locator('.popup-task').getByRole('button',{name:'Save file',exact:true})).toBeVisible();await manager.waitForTimeout(1500);expect(await manager.evaluate(()=>(window as any).saveCalls)).toBe(1);
 const requests=mediaRequests,cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:resolve(evidence,'chosen')});await manager.evaluate(()=>(window as any).restoreSave());await ui.locator('.popup-task').getByRole('button',{name:'Save file',exact:true}).click();await saved();expect((await task()).validation.checkedAt).toBe(ready.validation.checkedAt);expect(mediaRequests).toBe(requests);expect(await sw.evaluate(()=>chrome.downloads.search({}))).toHaveLength(1);await cdp.detach();
});
test('an interrupted native invocation is reconciled before an explicit retry',async()=>{
 await context.addInitScript(()=>{
  if(location.pathname!=='/manager.html'||sessionStorage.getItem('saveGateSeen'))return;sessionStorage.setItem('saveGateSeen','1');
  chrome.downloads.download=(()=>{(window as any).saveStarted=true;return new Promise<number>(()=>{});}) as typeof chrome.downloads.download;
 });
 const manager=await start();await expect.poll(()=>manager.evaluate(()=>(window as any).saveStarted)).toBe(true);const ready=await task();expect(ready.outputSave).toBeTruthy();await manager.reload();
 // Model an expired owner after the document disappeared, without a 30s sleep.
 await ui.evaluate(async id=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('alcydeo',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise<void>((resolve,reject)=>{const tx=db.transaction('tasks','readwrite'),store=tx.objectStore('tasks'),r=store.get(id);r.onsuccess=()=>{r.result.leaseUntil=0;store.put(r.result);};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();},ready.id);
 await expect.poll(async()=>(await task()).error).toBe('saveInterrupted');expect(await sw.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);await ui.locator('.popup-task').getByRole('button',{name:'Save file',exact:true}).click();await saved();expect((await task()).validation.checkedAt).toBe(ready.validation.checkedAt);expect(await sw.evaluate(()=>chrome.downloads.search({}))).toHaveLength(1);
});
test('the French popup reopens on the saved disk result at 100 percent',async()=>{
 const c=catalogs.fr!;await ui.evaluate(()=>chrome.storage.local.set({language:'fr'}));await ui.reload();await start();await saved();await ui.reload();await expect(ui.locator('.popup-task-meta')).toContainText(c.popupSaved!);await expect(ui.locator('.popup-task progress')).toHaveAttribute('value','1');await expect(ui.locator('.popup-task').getByRole('button',{name:c.show!,exact:true})).toBeVisible();await expect(ui.locator('.popup-task').getByRole('button',{name:c.saveFile!,exact:true})).toHaveCount(0);await ui.screenshot({path:`${evidence}/saved-fr.png`});
});
for(const[code,c]of Object.entries(catalogs))test(`saving and dismissed-chooser states are clear in ${code}`,async()=>{
 await ui.evaluate(async code=>{const{data}=await chrome.runtime.sendMessage({type:'snapshot'});await chrome.runtime.sendMessage({type:'settings',value:{...data.settings,saveAs:true}});await chrome.storage.local.set({language:code});},code);await ui.reload();
 await context.addInitScript(()=>{if(location.pathname==='/manager.html')chrome.downloads.download=(()=>new Promise<number>((resolve,reject)=>{(window as any).dismissSave=()=>reject(new Error('Dismissed chooser'));})) as typeof chrome.downloads.download;});
 const manager=await start();await expect.poll(()=>manager.evaluate(()=>typeof(window as any).dismissSave)).toBe('function');await expect(ui.locator('.popup-task-meta')).toContainText(c.savingFile!);await expect(ui.locator('.popup-task progress')).toHaveAttribute('value','0.99');await expect(ui.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(code)?'rtl':'ltr');expect(await ui.evaluate(()=>document.documentElement.scrollWidth)).toBe(525);
 await ui.screenshot({path:`${evidence}/saving-${code}.png`});await manager.evaluate(()=>(window as any).dismissSave());await expect(ui.locator('.popup-task-meta')).toContainText(c.saveRequired!);await expect(ui.locator('.popup-task').getByRole('button',{name:c.saveFile!,exact:true})).toBeVisible();await expect(ui.locator('.popup-task .task-error')).toHaveText(c.err_saveDialog!);await ui.screenshot({path:`${evidence}/retry-${code}.png`});expect(await sw.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);
});
