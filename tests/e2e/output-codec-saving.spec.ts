import {test,expect,chromium,type BrowserContext,type Page,type Worker} from '@playwright/test';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';

let context:BrowserContext,sw:Worker,base:string,profile:string,ui:Page,tabId:number;
let mediaRequests:string[]=[];
const evidence='artifacts/evidence/output-codec47';
const phase=process.env.ALCYDEO_OUTPUT_PHASE??'green';

test.beforeEach(async()=>{
 profile=await mkdtemp(resolve(tmpdir(),'alcydeo-codec-output-'));
 await mkdir(resolve(profile,'Default'));await mkdir(evidence,{recursive:true});
 await writeFile(resolve(profile,'Default/Preferences'),JSON.stringify({download:{default_directory:resolve(evidence,'downloads',crypto.randomUUID()),prompt_for_download:false}}));
 const ext=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');
 context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox','--test-type']});
 const cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});await cdp.detach();
 sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;
 await sw.evaluate(async()=>{const{settings}=await chrome.storage.local.get('settings');await chrome.storage.local.set({settings:{...settings,saveAs:false,multipart:false}});});
 mediaRequests=[];context.on('request',request=>{const path=new URL(request.url()).pathname;if(/\.(?:m3u8|ts|m4s|mp4)$/.test(path))mediaRequests.push(request.url());});
 const source=await context.newPage();await source.goto('http://127.0.0.1:4179/save-modes.html');
 tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url)!.id!,source.url());
 ui=await context.newPage();await ui.setViewportSize({width:525,height:600});await ui.goto(`${base}/popup.html?tabId=${tabId}`);
});
test.afterEach(async()=>{await context?.close();await rm(profile,{recursive:true,force:true});});

async function task(){return ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks[0]);}
async function start(){
 const card=ui.locator('.media-card').filter({has:ui.getByRole('heading',{name:'Save segmented video',exact:true})});
 await expect(card.getByRole('button',{name:'Download',exact:true})).toBeEnabled();await card.getByRole('button',{name:'Download',exact:true}).click();
 await expect.poll(()=>context.pages().find(page=>page.url().includes('/manager.html'))?.url()).toBeTruthy();
 return context.pages().find(page=>page.url().includes('/manager.html'))!;
}
async function forceHtmlVideoError(){
 await context.addInitScript(()=>{
  if(location.pathname!=='/manager.html')return;
  const descriptor=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src')!;
  Object.defineProperty(HTMLMediaElement.prototype,'src',{...descriptor,set(value:string){
   descriptor.set!.call(this,value);
   if(this instanceof HTMLVideoElement&&!this.isConnected&&value.startsWith('blob:'))void Promise.resolve().then(()=>{(window as any).forcedHtmlVideoErrors=((window as any).forcedHtmlVideoErrors??0)+1;this.dispatchEvent(new window.Event('error'));});
  }});
 });
}
async function outputDigest(id:string){
 return ui.evaluate(async id=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  const item=await new Promise<any>((resolve,reject)=>{const request=db.transaction('tasks').objectStore('tasks').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});db.close();
  const file=await(await(await navigator.storage.getDirectory()).getDirectoryHandle(id)).getFileHandle(item.output).then(handle=>handle.getFile());
  const hash=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
  return{bytes:file.size,sha256:[...new Uint8Array(hash)].map(value=>value.toString(16).padStart(2,'0')).join('')};
 },id);
}
async function report(name:string,data:Record<string,unknown>){await writeFile(`${evidence}/${phase}-${name}.json`,JSON.stringify({browser:context.browser()!.version(),build:await sw.evaluate(()=>chrome.runtime.getManifest().version),...data},null,2)+'\n');}
async function savedExactly(expected:{bytes:number;sha256:string}){
 await expect.poll(async()=>(await task())?.saved,{timeout:20000}).toBe(true);
 const current=await task(),items=await sw.evaluate(()=>chrome.downloads.search({}));expect(items).toHaveLength(1);
 const item=items[0]!;expect(current.downloadId).toBe(item.id);expect(item.state).toBe('complete');expect(item.exists).toBe(true);
 const bytes=await readFile(item.filename);expect(bytes.length).toBe(expected.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(expected.sha256);
 return{state:current.state,error:current.error,bytes:bytes.length,sha256:expected.sha256,exports:items.length};
}

test('a verified segmented output is saved automatically even if an HTML video probe fails',async()=>{
 await forceHtmlVideoError();const manager=await start();
 await expect.poll(async()=>{const current=await task();return!!current?.validation&&!!current.output&&(!!current.saved||!!current.error);},{timeout:20000}).toBe(true);
 const current=await task(),expected=await outputDigest(current.id);
 expect(current.validation.tracks.map((track:any)=>track.codec)).toEqual(['avc','aac']);expect(current.validation.bytes).toBe(expected.bytes);expect(current.validation.duration).toBeCloseTo(6,0);
 const probeErrors=await manager.evaluate(()=>(window as any).forcedHtmlVideoErrors??0);
 await report('new-hls',{state:current.state,error:current.error,saved:current.saved===true,validation:current.validation,expected,probeErrors,exports:(await sw.evaluate(()=>chrome.downloads.search({}))).length});
 await expect(ui.locator('.popup-task')).toHaveAttribute('data-state',current.state);
 await ui.screenshot({path:`${evidence}/${phase}-new-hls.png`});
 if(!current.saved){expect(current.state).toBe('validating');expect(current.error).toBe('codec');expect(probeErrors).toBeGreaterThan(0);}
 expect(current.saved).toBe(true);
 await savedExactly(expected);
});

// Prepare real media through the worker, hold only the native export, and then
// reopen the persisted result in the same state as the former HTML probe error.
async function legacyOutput(corruption?:'missing'|'empty'|'truncated'){
 await context.addInitScript(()=>{
  if(location.pathname!=='/manager.html'||new URL(location.href).searchParams.has('outputCodecRecovery'))return;
  chrome.downloads.download=(()=>{(window as any).outputSaveHeld=true;return new Promise<number>(()=>{});}) as typeof chrome.downloads.download;
 });
 const manager=await start();await expect.poll(()=>manager.evaluate(()=>(window as any).outputSaveHeld)).toBe(true);
 const checked=await task(),expected=await outputDigest(checked.id);expect(checked.validation.bytes).toBe(expected.bytes);expect(checked.validation.tracks.map((track:any)=>track.codec)).toEqual(['avc','aac']);expect(await sw.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);
 await manager.close();
 await ui.evaluate(async({id,corruption})=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  const item=await new Promise<any>((resolve,reject)=>{const request=db.transaction('tasks').objectStore('tasks').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(id);
  if(corruption==='missing')await dir.removeEntry(item.output);
  else if(corruption){const handle=await dir.getFileHandle(item.output);const file=await handle.getFile(),writer=await handle.createWritable();if(corruption==='truncated')await writer.write(file.slice(0,file.size-1));await writer.close();}
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('tasks','readwrite');item.state='validating';item.error='codec';item.leaseUntil=0;delete item.owner;delete item.outputSave;delete item.downloadId;delete item.saved;tx.objectStore('tasks').put(item);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
 },{id:checked.id,corruption});
 const requests=mediaRequests.length;await forceHtmlVideoError();const reopened=await context.newPage();await reopened.goto(`${base}/manager.html?outputCodecRecovery=1#library`);
 return{checked,expected,requests,reopened};
}

test('a reopened genuine legacy codec result saves once without fetching media or another click',async()=>{
 const{checked,expected,requests,reopened}=await legacyOutput();
 const result=await savedExactly(expected);expect((await task()).validation).toEqual(checked.validation);expect(mediaRequests).toHaveLength(requests);
 await reopened.reload();await expect(reopened.locator('.task-card')).toHaveAttribute('data-state','completed');expect(await sw.evaluate(()=>chrome.downloads.search({}))).toHaveLength(1);expect(mediaRequests).toHaveLength(requests);
 await report('legacy-codec',{...result,validationUnchanged:true,newMediaRequests:mediaRequests.length-requests});await reopened.screenshot({path:`${evidence}/${phase}-legacy-codec.png`,fullPage:true});
});

for(const corruption of ['missing','empty','truncated'] as const)test(`a ${corruption} legacy OPFS result never exports despite its previous validation`,async()=>{
 const{checked,requests}=await legacyOutput(corruption);
 await expect.poll(async()=>{const current=await task();return current.error&&current.error!=='codec'?current.error:undefined;},{timeout:10000}).toMatch(/^(?:missing|invalid)$/);
 const current=await task();expect(current.saved).not.toBe(true);expect(current.downloadId).toBeUndefined();expect(current.validation).toEqual(checked.validation);expect(await sw.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);expect(mediaRequests).toHaveLength(requests);
 await report(`legacy-${corruption}`,{state:current.state,error:current.error,exports:0,validationUnchanged:true,newMediaRequests:mediaRequests.length-requests});
});
