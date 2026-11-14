import {test,expect,chromium} from '@playwright/test';
import {resolve} from 'node:path';
import {readFile,mkdir} from 'node:fs/promises';

test('redirected player and final file share one real quality; HTML sources stay excluded',async()=>{
  const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');const context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--test-type']});
  try{
    const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');const base=`chrome-extension://${new URL(sw.url()).host}`;const ui=await context.newPage();await ui.setViewportSize({width:525,height:600});await ui.goto(`${base}/manager.html`);
    const source=await context.newPage();await source.goto('http://127.0.0.1:4179/redirected-player.html');await expect.poll(()=>source.locator('video').evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThan(0);
    // The original player endpoint really does return HTML outside playback.
    expect(await source.evaluate(()=>fetch('/reader-video.mp4').then(r=>r.headers.get('content-type')))).toContain('text/html');
    const tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());await ui.goto(`${base}/popup.html?tabId=${tabId}`);
    await expect(ui.locator('.media-card')).toHaveCount(1);await expect(ui.locator('option')).toHaveText(['404p']);await expect(ui.getByRole('heading',{name:'One redirected lesson',exact:true})).toBeVisible();expect(await ui.evaluate(tabId=>chrome.action.getBadgeText({tabId}),tabId)).toBe('1');
    await ui.getByRole('button',{name:'Scan page',exact:true}).click();await expect(ui.locator('.media-card')).toHaveCount(1);await expect(ui.locator('option')).toHaveText(['404p']);
    await source.evaluate(()=>fetch('/reader-generation?value=2').then(r=>r.text()));const renewed=source.waitForResponse(r=>r.url().includes('/direct-stream?')&&r.url().includes('generation=2'));await source.locator('video').evaluate((v:HTMLVideoElement)=>v.load());await renewed;await expect.poll(()=>source.locator('video').evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThan(0);
    await ui.getByRole('button',{name:'Scan page',exact:true}).click();await expect(ui.locator('.media-card')).toHaveCount(1);await expect(ui.locator('option')).toHaveText(['404p']);
    await mkdir('artifacts/evidence',{recursive:true});await ui.screenshot({path:'artifacts/evidence/popup-real-source.png'});
    await ui.getByRole('button',{name:'Download',exact:true}).click();await ui.evaluate(()=>chrome.runtime.sendMessage({type:'openManager'}));await expect.poll(()=>context.pages().some(p=>p.url().includes('manager.html'))).toBe(true);const manager=context.pages().find(p=>p.url().includes('manager.html'))!;await manager.waitForLoadState();await manager.bringToFront();const task=manager.locator('.task-card');await expect(task).toHaveAttribute('data-state','completed');
    const actual=await manager.evaluate(async()=>{const r=await chrome.runtime.sendMessage({type:'snapshot'});const t=r.data.tasks[0];return{url:t.variant.url,item:(await chrome.downloads.search({id:t.downloadId}))[0]};});expect(actual.url).toBe('http://127.0.0.1:4179/direct-stream?signature=keep%2Bthis%2Fvalue&generation=2');expect(actual.item.mime).toBe('video/mp4');const bytes=await readFile(actual.item.filename);expect(bytes.equals(await readFile('fixtures/media/high.mp4'))).toBe(true);
    await expect(task).toHaveAttribute('data-state','completed');
    // The redirect association survives service-worker replacement.
    const session=await context.browser()!.newBrowserCDPSession();const targets=await session.send('Target.getTargets');const worker=targets.targetInfos.find(t=>t.type==='service_worker'&&t.url.startsWith(base))!;await session.send('Target.closeTarget',{targetId:worker.targetId});await ui.goto(`${base}/popup.html?tabId=${tabId}`);await ui.getByRole('button',{name:'Scan page',exact:true}).click();await expect(ui.locator('.media-card')).toHaveCount(1);await expect(ui.locator('option')).toHaveText(['404p']);
  }finally{await context.close();}
});
