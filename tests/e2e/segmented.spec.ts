import {test,expect,chromium,type BrowserContext,type Page} from '@playwright/test';
import {resolve} from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
let context:BrowserContext,ui:Page,admin:Page,base:string,id:string;
const metadataWarnings:string[]=[];
test.describe.configure({mode:'serial'});
test.beforeAll(async()=>{
  const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--test-type']});
  context.on('console',message=>{if(/stream_type 0x15/.test(message.text()))metadataWarnings.push(message.text());});
  const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');id=new URL(sw.url()).host;base=`chrome-extension://${id}`;ui=await context.newPage();await ui.setViewportSize({width:525,height:600});await ui.goto(`${base}/manager.html`);admin=await context.newPage();await admin.goto('chrome://extensions/');await admin.evaluate(()=>(chrome as any).developerPrivate.updateProfileConfiguration({inDeveloperMode:true}));
});
test.afterAll(async()=>{await context?.close();});
async function errors(){return admin.evaluate(async id=>((await(chrome as any).developerPrivate.getExtensionInfo(id)).runtimeErrors??[]).map((e:any)=>e.message),id);}
async function tabId(page:Page){return ui.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,page.url());}
async function popup(page:Page){const id=await tabId(page);await ui.goto(`${base}/popup.html?tabId=${id}`);await ui.bringToFront();await expect(ui.locator('.media-card').first()).toBeAttached();const sources=ui.locator('.popup-tabs button').first();if(await sources.count())await sources.click();return id;}
async function download(title:string){const card=ui.locator('.media-card').filter({has:ui.getByRole('heading',{name:title,exact:true})});await expect(card).toBeVisible();await expect(card.getByRole('button',{name:'Download',exact:true})).toBeEnabled();await card.getByRole('button',{name:'Download',exact:true}).click();await expect.poll(()=>context.pages().some(p=>p.url().includes('manager.html'))).toBe(true);const page=context.pages().find(p=>p.url().includes('manager.html'))!;await page.waitForLoadState();await page.bringToFront();return{page,task:page.locator('.task-card').filter({has:page.getByRole('heading',{name:title,exact:true})})};}
async function saved(page:Page,taskId:string){return page.evaluate(async id=>{const r=await chrome.runtime.sendMessage({type:'snapshot'});const task=r.data.tasks.find((t:any)=>t.id===id);return{task,item:task.downloadId===undefined?undefined:(await chrome.downloads.search({id:task.downloadId}))[0]};},taskId);}

test('TS with timed ID3 keeps audio/video, reports metadata omission and has no native warning',async()=>{
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/segmented.html');await popup(source);const{page,task}=await download('Timed metadata lesson');await expect(task).toHaveAttribute('data-state','completed',{timeout:20000});await expect(task.locator('.validation')).toContainText(/avc.*aac/);expect((await errors()).filter((e:string)=>/stream_type 0x15|Unchecked runtime.lastError/.test(e))).toEqual([]);await expect(task.getByRole('note')).toContainText('Timed metadata (0x15)');
  const actual=await saved(page,(await task.getAttribute('data-task-id'))!);expect(actual.task.notices).toEqual(['timedMetadataSkipped']);expect(actual.task.validation.tracks.map((t:any)=>t.type).sort()).toEqual(['audio','video']);await mkdir('artifacts/evidence',{recursive:true});await writeFile('artifacts/evidence/hls-id3.mp4',await readFile(actual.item.filename));await page.screenshot({path:'artifacts/evidence/manager-timed-metadata.png',fullPage:true});
  expect((await errors()).filter((e:string)=>/stream_type 0x15|Unchecked runtime.lastError/.test(e))).toEqual([]);
  expect(metadataWarnings).toEqual([]);
});
test('initialization and media byte ranges from one MP4 produce a complete file',async()=>{
  const ranges:string[]=[];const listener=(r:any)=>{if(r.url().includes('/hls-ranges/shared.mp4'))ranges.push(r.headers().range??'');};context.on('request',listener);
  try{const source=await context.newPage();await source.goto('http://127.0.0.1:4179/segmented.html');await popup(source);const{page,task}=await download('Byte range lesson');await expect(task).toHaveAttribute('data-state','completed',{timeout:20000});
    // The current availability check reads the init and at most 4 KiB of the
    // first media range before the worker fetches the fixture's four full parts.
    const prefixRanges=['bytes=0-1311','bytes=1312-5407'],downloadRanges=['bytes=0-1311','bytes=1312-599681','bytes=599682-1231104','bytes=1231105-1837424'];
    expect(ranges.slice(0,prefixRanges.length)).toEqual(prefixRanges);expect(ranges.slice(prefixRanges.length)).toEqual(downloadRanges);expect(ranges).toHaveLength(prefixRanges.length+downloadRanges.length);
    const actual=await saved(page,(await task.getAttribute('data-task-id'))!);expect(actual.task.validation.tracks).toHaveLength(2);expect(actual.task.validation.duration).toBeGreaterThan(5.9);await writeFile('artifacts/evidence/hls-byte-ranges.mp4',await readFile(actual.item.filename));}finally{context.off('request',listener);}
});
test('observed playlists identify opaque MP4 fragments before opening the popup',async()=>{
  const requests:string[]=[];const listener=(r:any)=>{if(r.url().includes('/opaque/')&&!r.headers().range)requests.push(r.url());};context.on('request',listener);
  try{const source=await context.newPage();await source.goto('http://127.0.0.1:4179/opaque-player.html');const id=await tabId(source);await expect.poll(()=>ui.evaluate(async id=>{const r=await chrome.runtime.sendMessage({type:'snapshot',tabId:id});const assets=await chrome.storage.session.get(`fragments:${id}`);return{media:r.data.media.map((m:any)=>m.kind),fragments:(assets[`fragments:${id}`]??[]).length};},id)).toEqual({media:['hls'],fragments:4});expect(await ui.evaluate(id=>chrome.action.getBadgeText({tabId:id}),id)).toBe('1');await expect.poll(()=>requests.length).toBe(4);
    await popup(source);await expect(ui.locator('.media-card')).toHaveCount(1);await ui.screenshot({path:'artifacts/evidence/popup-segmented-source.png'});
    await source.evaluate(()=>{const a=document.createElement('a');a.href='/media/low.mp4?unrelated=1';a.textContent='Unrelated complete video';document.body.append(a);});await ui.getByRole('button',{name:'Scan page',exact:true}).click();await expect(ui.locator('.media-card')).toHaveCount(2);
    const{page,task}=await download('Opaque segmented lesson');await expect(task).toHaveAttribute('data-state','completed',{timeout:20000});const actual=await saved(page,(await task.getAttribute('data-task-id'))!);expect(actual.task.validation.tracks).toHaveLength(2);expect(requests).toHaveLength(8);await writeFile('artifacts/evidence/hls-opaque.mp4',await readFile(actual.item.filename));
  }finally{context.off('request',listener);}
});
test('an unsupported video track is refused instead of silently saving only audio',async()=>{
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/segmented.html');await popup(source);const{page,task}=await download('Unsupported video codec');await expect(task).toHaveAttribute('data-state','failed',{timeout:15000});await expect(task.locator('.error-code')).toHaveText('codec');const actual=await saved(page,(await task.getAttribute('data-task-id'))!);expect(actual.task.saved).not.toBe(true);expect(actual.item).toBeUndefined();
});
test('rejecting an HTML native transfer does not suggest a filename after cancellation',async()=>{
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/preflight/native-guard.html');await popup(source);await expect(ui.locator('.source-check')).toHaveText('Accessible');const{task}=await download('Session video');await expect(task).toHaveAttribute('data-state','failed');await expect(task.locator('.error-code')).toHaveText('html');expect((await errors()).filter((e:string)=>/Download must be in progress|Unchecked runtime.lastError|stream_type 0x15/.test(e))).toEqual([]);
});
