import {test,expect,chromium,type BrowserContext,type Page,type Worker} from '@playwright/test';
import {resolve} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
let context:BrowserContext,ui:Page,sw:Worker,base:string;
test.describe.configure({mode:'serial'});
test.beforeAll(async()=>{
  const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');
  context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--test-type']});
  sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;ui=await context.newPage();await ui.setViewportSize({width:525,height:600});
});

test('a removed quality gives a specific recovery message and expandable diagnostics',async()=>{
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/changing-quality.html');await source.evaluate(()=>fetch('/nested-quality?value=1'));
  try{
    const tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());await ui.goto(`${base}/popup.html?tabId=${tabId}`);const card=ui.locator('.media-card');await expect(card.locator('option')).toHaveText(['404p','180p']);await card.getByRole('combobox').selectOption({label:'180p'});await source.evaluate(()=>fetch('/nested-quality?value=2'));
    await card.getByRole('button',{name:'Download',exact:true}).click();await expect.poll(()=>context.pages().some(p=>p.url().includes('manager.html'))).toBe(true);const manager=context.pages().find(p=>p.url().includes('manager.html'))!;await manager.waitForLoadState();await manager.bringToFront();const task=manager.locator('.task-card').filter({has:manager.getByRole('heading',{name:'Updated product video',exact:true})});await expect(task).toHaveAttribute('data-state','failed',{timeout:15000});
    await expect(task.locator('.task-error p')).toHaveText('This source now lists several qualities. Reopen Alcydeo on the video page, find qualities and select one again.');await expect(task.locator('.error-code')).toBeHidden();await task.locator('summary').click();await expect(task.locator('.error-code')).toBeVisible();await expect(task.locator('.error-code')).toHaveText('chooseQuality');await task.locator('summary').click();await manager.setViewportSize({width:980,height:700});await manager.screenshot({path:'artifacts/evidence/manager-changed-quality.png',fullPage:true});
    const actual=await manager.evaluate(async id=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.find((t:any)=>t.id===id),(await task.getAttribute('data-task-id'))!);expect(actual.downloadId).toBeUndefined();expect(actual.saved).not.toBe(true);
  }finally{await source.evaluate(()=>fetch('/nested-quality?value=1'));}
});
test.afterAll(async()=>context?.close());

test('nested HLS lists expose actual qualities and save the selected complete video',async()=>{
  const requests:string[]=[];context.on('request',r=>{if(r.headers().range!=='bytes=0-4095')requests.push(r.url());});
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/nested-hls.html');const tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());
  await expect.poll(()=>sw.evaluate(id=>chrome.action.getBadgeText({tabId:id}),tabId)).toBe('1');
  await ui.goto(`${base}/popup.html?tabId=${tabId}`);const card=ui.locator('.media-card');await expect(card).toHaveCount(1);await expect(card.locator('option')).toHaveText(['404p','180p']);
  await card.getByRole('combobox').selectOption({label:'180p'});const selected=await card.getByRole('combobox').inputValue();
  await source.evaluate(()=>fetch('/nested-hls/options.m3u8?signature=entry%2Bsource').then(r=>r.text()));await ui.getByRole('button',{name:'Scan page',exact:true}).click();await expect(card).toHaveCount(1);await expect(card.getByRole('combobox')).toHaveValue(selected);
  expect(requests.some(url=>url.includes('/segment-'))).toBe(false);await mkdir('artifacts/evidence',{recursive:true});await ui.screenshot({path:'artifacts/evidence/popup-nested-hls.png'});
  await card.getByRole('button',{name:'Download',exact:true}).click();await expect.poll(()=>context.pages().some(p=>p.url().includes('manager.html'))).toBe(true);const manager=context.pages().find(p=>p.url().includes('manager.html'))!;await manager.waitForLoadState();await manager.bringToFront();
  const task=manager.locator('.task-card').filter({has:manager.getByRole('heading',{name:'Nested product video',exact:true})});await expect(task).toHaveAttribute('data-state','completed',{timeout:20000});await expect(task.locator('.validation')).toContainText(/avc.*aac/);
  const actual=await manager.evaluate(async id=>{const r=await chrome.runtime.sendMessage({type:'snapshot'});const task=r.data.tasks.find((t:any)=>t.id===id);return{task,item:(await chrome.downloads.search({id:task.downloadId}))[0]};},(await task.getAttribute('data-task-id'))!);
  expect(actual.task.variant.url).toContain('/nested-hls/low.m3u8?signature=low%2Bquality');expect(requests).toContain('http://127.0.0.1:4179/hls-low/index.m3u8?signature=low%2Bleaf');expect(requests.filter(url=>url.includes('/hls-low/segment-'))).toHaveLength(3);expect(requests.some(url=>url.includes('/hls-high/segment-'))).toBe(false);
  const output=await readFile(actual.item.filename);await writeFile('artifacts/evidence/hls-nested.mp4',output);
  expect(await manager.evaluate(async data=>{const video=document.createElement('video'),url=URL.createObjectURL(new Blob([Uint8Array.from(data)]));try{await new Promise<void>((resolve,reject)=>{video.onloadedmetadata=()=>resolve();video.onerror=()=>reject(new Error('decode'));video.src=url;});return video.videoHeight;}finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}},Array.from(output))).toBe(180);
});

test('a unique HLS rendition on a restricted CDN stays visible until Chrome grants access',async()=>{
  const id=new URL(base).host,admin=await context.newPage();await admin.goto('chrome://extensions/');await admin.evaluate(()=>(chrome as any).developerPrivate.updateProfileConfiguration({inDeveloperMode:true}));
  await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_CLICK'}),id);await expect.poll(()=>ui.evaluate(async()=>(await chrome.permissions.getAll()).origins??[])).toEqual([]);
  await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_SPECIFIC_SITES'}),id);await admin.evaluate(id=>(chrome as any).developerPrivate.addHostPermission(id,'http://127.0.0.1/*'),id);
  const cdnRequests:string[]=[];context.on('request',r=>{if(r.url().startsWith('http://localhost:4179/'))cdnRequests.push(r.url());});
  try{
    const source=await context.newPage();await source.goto('http://127.0.0.1:4179/hls-permission.html');const tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());await ui.goto(`${base}/popup.html?tabId=${tabId}`);const card=ui.locator('.media-card');await expect(card.locator('option')).toHaveText(['180p']);await expect(card.getByRole('button',{name:'Download',exact:true})).toBeEnabled();
    await expect.poll(()=>ui.evaluate(async tabId=>(await chrome.runtime.sendMessage({type:'snapshot',tabId})).data.media[0]?.variants[0]?.url,tabId)).toBe('http://localhost:4179/hls-low/index.m3u8');expect(cdnRequests).toEqual([]);await expect(card.getByRole('button',{name:'Allow source domains',exact:true})).toHaveCount(0);
    await admin.evaluate(id=>(chrome as any).developerPrivate.addHostPermission(id,'http://localhost/*'),id);await card.getByRole('button',{name:'Find qualities',exact:true}).click();await expect.poll(()=>cdnRequests.length).toBe(1);await expect(card.locator('option')).toHaveText(['180p']);await expect(card.getByRole('button',{name:'Download',exact:true})).toBeEnabled();
  }finally{await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_ALL_SITES'}),id);await admin.close();}
});
