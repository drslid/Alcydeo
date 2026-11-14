import { test, expect, chromium, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
let context: BrowserContext; let background: Worker; let base: string; let page: Page; let tabId: number;
test.beforeAll(async () => {
  const extension = resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');
  context = await chromium.launchPersistentContext('',{
    executablePath:process.env.CHROMIUM_PATH,
    channel:process.env.CHROMIUM_PATH?undefined:'chromium', headless:true, acceptDownloads:true,
    args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--test-type','--disable-dev-shm-usage'],
  });
  background = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  base = `chrome-extension://${new URL(background.url()).host}`;
  expect(await background.evaluate(()=>chrome.permissions.contains({origins:['https://example.com/*']}))).toBe(true);
  page = await context.newPage();
  await page.goto(`${base}/manager.html`);
  // The production manifest grants HTTP/HTTPS access at installation. No
  // synthetic permission button or developerPrivate grant is needed here.
  const source=await context.newPage(); await source.goto('http://127.0.0.1:4179/'); await source.locator('video').evaluate((v:HTMLVideoElement)=>new Promise<void>(r=>{if(v.readyState>=1)r();else v.onloadedmetadata=()=>r();}));
  tabId=await background.evaluate(async()=>{const tabs=await chrome.tabs.query({});return tabs.find(t=>t.url==='http://127.0.0.1:4179/')!.id!;});
});
test.afterAll(async()=>{await context?.close();});
test('detect, choose quality, download and find the saved file',async()=>{
  await page.goto(`${base}/popup.html?tabId=${tabId}`);
  const card=page.locator('.media-card').filter({has:page.getByRole('heading',{name:'Kingfisher study — direct video'})});
  await expect(card).toBeVisible(); await expect(card.locator('option')).toHaveCount(2);
  await card.getByRole('combobox').selectOption({label:'180p'});
  await card.getByRole('button',{name:'Download',exact:true}).click();
  await page.evaluate(()=>chrome.runtime.sendMessage({type:'openManager'}));
  const manager=context.pages().find(p=>p.url().includes('manager.html'))!;
  const current=manager??context.pages().find(p=>p.url().includes('manager.html'))!;
  await current.waitForLoadState();
  const task=current.locator('.task-card').filter({has:current.getByRole('heading',{name:'Kingfisher study — direct video'})});
  await expect(task).toHaveAttribute('data-state','completed');
  const item=await background.evaluate(async()=>{const files=await chrome.downloads.search({});return files.find(f=>f.state==='complete');});
  expect(item?.bytesReceived).toBeGreaterThan(1000);
  // Use the bytes actually downloaded by Chrome, not the source fixture.
  const actual=await readFile(item!.filename);
  await mkdir('artifacts/evidence',{recursive:true}); await writeFile('artifacts/evidence/direct.mp4',actual);
  
  await expect(task).toHaveAttribute('data-state','completed');
  await expect(task.getByRole('button',{name:'Show in folder',exact:true})).toBeVisible();expect(await current.evaluate(async id=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.find((t:any)=>t.id===id).validation,await task.getAttribute('data-task-id'))).toBeUndefined();
  await current.getByRole('button',{name:'Library',exact:true}).click();
  await current.setViewportSize({width:1280,height:800});
  await expect(task).toBeVisible(); await current.screenshot({animations:'disabled',path:'artifacts/evidence/manager-light.png',fullPage:true});
});
test('HLS TS, HLS fMP4 separate audio, and DASH create playable MP4 files',async()=>{
  for(const title of ['Kingfisher study — HLS TS','Kingfisher study — HLS separate audio','Kingfisher study — DASH']) {
    await page.goto(`${base}/popup.html?tabId=${tabId}`);
    await page.getByRole('button',{name:'Sources',exact:true}).click();
    const card=page.locator('.media-card').filter({has:page.getByRole('heading',{name:title,exact:true})});
    await card.getByRole('button',{name:'Find qualities',exact:true}).click();
    await expect(card.locator('option')).not.toHaveCount(0);
    await card.getByRole('button',{name:'Download',exact:true}).click();
    await expect.poll(()=>context.pages().filter(p=>p.url().includes('manager.html')).length).toBeGreaterThan(0);const manager=context.pages().filter(p=>p.url().includes('manager.html')).at(-1)!;
    await manager.bringToFront();
    await manager.getByRole('button',{name:'Library',exact:true}).click();
    const task=manager.locator('.task-card').filter({has:manager.getByRole('heading',{name:title,exact:true})});
    await expect(task).toHaveAttribute('data-state','completed',{timeout:30000});
    await expect(task.locator('.validation')).toContainText(/avc.*aac/);
    const result=await manager.evaluate(async id=>{const snapshot=await chrome.runtime.sendMessage({type:'snapshot'});const task=snapshot.data.tasks.find((t:any)=>t.id===id);return (await chrome.downloads.search({id:task.downloadId}))[0];},await task.getAttribute('data-task-id'));
    expect(result?.state).toBe('complete');
    await writeFile(`artifacts/evidence/${title.includes('DASH')?'dash':title.includes('separate')?'hls-fmp4':'hls-ts'}.mp4`,await readFile(result!.filename));
  }
});
test('popup closes and service worker restarts without losing the library',async()=>{
  await page.close(); const session=await context.browser()!.newBrowserCDPSession();
  const targets=await session.send('Target.getTargets');
  const sw=targets.targetInfos.find(t=>t.type==='service_worker'&&t.url.startsWith(base));
  if(sw)await session.send('Target.closeTarget',{targetId:sw.targetId});
  page=await context.newPage();await page.goto(`${base}/manager.html#library`);
  await expect(page.locator('.task-card[data-state="completed"]')).toHaveCount(4);
});
test('empty and dark popup states at actual dimensions',async()=>{
  const empty=await context.newPage();await empty.goto('http://127.0.0.1:4179/empty.html');
  const emptyId=await page.evaluate(async()=>{const tabs=await chrome.tabs.query({});return tabs.find(t=>t.url?.endsWith('/empty.html'))!.id!;});
  await page.setViewportSize({width:525,height:600});await page.goto(`${base}/popup.html?tabId=${emptyId}`);
  await expect(page.getByRole('heading',{name:'Play a video to get started'})).toBeVisible();
  await page.screenshot({animations:'disabled',path:'artifacts/evidence/popup-empty.png'});
  await page.goto(`${base}/popup.html?tabId=${tabId}`);await expect(page.locator('.media-card')).toHaveCount(4);
  await page.screenshot({animations:'disabled',path:'artifacts/evidence/popup-light.png'});
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.screenshot({animations:'disabled',path:'artifacts/evidence/popup-dark.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(525);
});
test('protected and missing sources are rejected by preflight without creating downloads or requesting keys',async()=>{
  const requests:string[]=[];const observe=(request:any)=>requests.push(request.url());context.on('request',observe);
  try{
    const previous=await background.evaluate(()=>chrome.downloads.search({}));
    const source=await context.newPage();await source.goto('http://127.0.0.1:4179/errors.html');
    const id=await page.evaluate(async()=>{const tabs=await chrome.tabs.query({});return tabs.find(t=>t.url?.endsWith('/errors.html'))!.id!;});
    await page.goto(`${base}/popup.html?tabId=${id}`);
    await expect.poll(()=>page.evaluate(async id=>{const list=(await chrome.storage.session.get(`tab:${id}`))[`tab:${id}`]??[];return list.flatMap((m:any)=>m.variants.map((v:any)=>v.check?.error)).filter(Boolean).sort();},id)).toEqual(['encrypted','missing']);
    await expect(page.locator('.media-card')).toHaveCount(0);expect(requests.some(x=>x.includes('must-not-fetch.key'))).toBe(false);
    expect(await background.evaluate(()=>chrome.downloads.search({}))).toHaveLength(previous.length);
  }finally{context.off('request',observe);}
});
test('pause checkpoints, concurrent managers, resume and cancellation',async()=>{
  const requests:{url:string;method:string}[]=[];const observe=(r:any)=>{if(r.headers().range!=='bytes=0-4095')requests.push({url:r.url(),method:r.method()});};context.on('request',observe);
  try{
    const source=await context.newPage();await source.goto('http://127.0.0.1:4179/lifecycle.html');const id=await page.evaluate(async()=>{const tabs=await chrome.tabs.query({});return tabs.find(t=>t.url?.endsWith('/lifecycle.html'))!.id!;});
    await page.goto(`${base}/popup.html?tabId=${id}`);await page.getByRole('button',{name:'Download',exact:true}).click();
    await expect.poll(()=>context.pages().filter(p=>p.url().includes('manager.html')).length).toBeGreaterThan(0);const manager=context.pages().filter(p=>p.url().includes('manager.html')).at(-1)!;await manager.getByRole('button',{name:'Library',exact:true}).click();
    const task=manager.locator('.task-card').filter({has:manager.getByRole('heading',{name:'Lifecycle video',exact:true})}).first();
    await expect(task).toHaveAttribute('data-state','fetching');await expect.poll(async()=>Number(await task.locator('progress').getAttribute('value'))).toBeGreaterThan(0);
    const taskId=await task.getAttribute('data-task-id');
    const session=await context.browser()!.newBrowserCDPSession();const targets=await session.send('Target.getTargets');const liveSw=targets.targetInfos.find(t=>t.type==='service_worker'&&t.url.startsWith(base));if(liveSw)await session.send('Target.closeTarget',{targetId:liveSw.targetId});
    await task.getByRole('button',{name:'Pause',exact:true}).click();await expect(task).toHaveAttribute('data-state','paused');
    const duplicate=await context.newPage();await duplicate.goto(`${base}/manager.html`);await expect(duplicate.locator(`[data-task-id="${taskId}"]`)).toHaveAttribute('data-state','paused');
    await manager.bringToFront();await task.getByRole('button',{name:'Resume',exact:true}).click();await duplicate.bringToFront();
    await expect(duplicate.locator(`[data-task-id="${taskId}"]`)).toHaveAttribute('data-state','completed',{timeout:20000});
    expect(requests.filter(r=>r.url.includes('segment-0.ts?delay=100')&&r.method==='GET')).toHaveLength(1);
    expect(requests.filter(r=>r.url.includes('segment-0.ts?delay=100')&&r.method==='HEAD')).toHaveLength(1);
    const ids=await duplicate.evaluate(async()=>{const result=await chrome.runtime.sendMessage({type:'snapshot'});return result.data.tasks.filter((t:any)=>t.title==='Lifecycle video'&&t.downloadId!==undefined);});expect(ids).toHaveLength(1);
    await page.bringToFront();await page.getByRole('button',{name:'Sources',exact:true}).click();await page.getByRole('button',{name:'Download',exact:true}).click();await duplicate.bringToFront();
    const newest=duplicate.locator('.task-card').filter({has:duplicate.getByRole('heading',{name:'Lifecycle video',exact:true})}).first();await expect(newest).toHaveAttribute('data-state','fetching');await newest.getByRole('button',{name:'Cancel',exact:true}).click();await expect(newest).toHaveAttribute('data-state','cancelled');
    const cancelledId=await newest.getAttribute('data-task-id');await expect.poll(()=>duplicate.evaluate(async id=>{const r=await chrome.runtime.sendMessage({type:'snapshot'});return r.data.tasks.find((t:any)=>t.id===id).owner??null;},cancelledId)).toBeNull();
  }finally{context.off('request',observe);}
});
test('closing the manager recovers a persisted checkpoint after lease expiry',async()=>{
  test.setTimeout(65_000);
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/lifecycle.html');const id=await page.evaluate(async()=>{const tabs=await chrome.tabs.query({});return tabs.filter(t=>t.url?.endsWith('/lifecycle.html')).at(-1)!.id!;});
  await page.goto(`${base}/popup.html?tabId=${id}`);await page.getByRole('button',{name:'Download',exact:true}).click();
  await expect.poll(()=>context.pages().filter(p=>p.url().includes('manager.html')).length).toBeGreaterThan(0);const manager=context.pages().filter(p=>p.url().includes('manager.html')).at(-1)!;await manager.getByRole('button',{name:'Library',exact:true}).click();
  const task=manager.locator('.task-card').filter({has:manager.getByRole('heading',{name:'Lifecycle video',exact:true})}).first();await expect(task).toHaveAttribute('data-state','fetching');await expect.poll(async()=>Number(await task.locator('progress').getAttribute('value'))).toBeGreaterThan(0);
  const taskId=await task.getAttribute('data-task-id');await manager.screenshot({path:'artifacts/evidence/manager-downloading.png',animations:'disabled',fullPage:true});
  for(const p of context.pages().filter(p=>p.url().includes('manager.html')))await p.close();
  const recovered=await context.newPage();await recovered.goto(`${base}/manager.html`);const record=recovered.locator(`[data-task-id="${taskId}"]`);
  await expect(record).toHaveAttribute('data-state','paused',{timeout:35000});await record.getByRole('button',{name:'Resume',exact:true}).click();await expect(record).toHaveAttribute('data-state','completed',{timeout:15000});
});
test('dynamic DOM observation rescans an authorized page',async()=>{
  const source=context.pages().find(p=>p.url()==='http://127.0.0.1:4179/')!;
  await page.evaluate(async tabId=>{const r=await chrome.runtime.sendMessage({type:'observe',tabId});if(!r.ok)throw new Error(r.error);},tabId);
  await source.evaluate(()=>{const a=document.createElement('a');a.href='/media/low.mp4?dynamic=1';a.textContent='Dynamic source';document.body.append(a);});
  await expect.poll(()=>page.evaluate(async tabId=>{const r=await chrome.runtime.sendMessage({type:'snapshot',tabId});return r.data.media.some((m:any)=>m.title==='Dynamic source');},tabId)).toBe(true);
});
test('revoked host permissions stop manifest access without a domain-validation prompt',async()=>{
  const admin=await context.newPage();await admin.goto('chrome://extensions/');await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_CLICK'}),new URL(base).host);await admin.close();
  await page.goto(`${base}/popup.html?tabId=${tabId}`);
  await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByText('Allow the source domains, then try again.',{exact:true})).toHaveCount(0);
  await page.screenshot({path:'artifacts/evidence/popup-permission.png',animations:'disabled'});
});
