import{test,expect,chromium,type BrowserContext,type Page,type Worker}from'@playwright/test';
import{resolve}from'node:path';
import{readFile}from'node:fs/promises';
let context:BrowserContext,sw:Worker,ui:Page,base:string;
test.beforeAll(async()=>{
 const dir=resolve('apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--disable-extensions-except=${dir}`,`--load-extension=${dir}`,'--no-sandbox','--test-type','--host-resolver-rules=MAP auto-detection.test 127.0.0.1']});sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;
 await context.grantPermissions(['local-network-access']);
 ui=await context.newPage();await ui.goto(`${base}/manager.html`);await expect.poll(()=>sw.evaluate(()=>chrome.permissions.contains({origins:['http://127.0.0.1/*','http://localhost/*']}))).toBe(true);
});
test.afterAll(async()=>{await context?.close();});
async function tabId(url:string){return sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,url);}
test('empty src attributes never become the HTML page URL',async()=>{
 const page=await context.newPage();await page.goto('http://127.0.0.1:4179/empty-sources.html');const id=await tabId(page.url());await ui.goto(`${base}/popup.html?tabId=${id}`);await expect(ui.locator('.media-card')).toHaveCount(0);
});
test('authorized pages populate their badge with the popup closed',async()=>{
 await ui.close();const page=await context.newPage();await page.goto('http://127.0.0.1:4179/');const id=await tabId(page.url());await expect.poll(()=>sw.evaluate(id=>chrome.action.getBadgeText({tabId:id}),id)).not.toBe('');
 ui=await context.newPage();await ui.goto(`${base}/popup.html?tabId=${id}`);await expect(ui.locator('.media-card')).toHaveCount(4);
});
test('HLS in an authorized cross-origin iframe is detected and downloadable',async()=>{
 const page=await context.newPage();await page.goto('http://127.0.0.1:4179/embed.html');const id=await tabId(page.url());await expect.poll(()=>sw.evaluate(id=>chrome.action.getBadgeText({tabId:id}),id)).not.toBe('');
 await ui.goto(`${base}/popup.html?tabId=${id}`);const card=ui.locator('.media-card').filter({hasText:'HLS'}).first();await expect(card).toBeVisible();await card.getByRole('button',{name:'Find qualities',exact:true}).click();await expect(card.locator('option')).toHaveCount(2);await card.getByRole('button',{name:'Download',exact:true}).click();
 await expect.poll(()=>context.pages().filter(p=>p.url().includes('manager.html')).length).toBeGreaterThan(0);const manager=context.pages().filter(p=>p.url().includes('manager.html')).at(-1)!;await manager.waitForLoadState();await manager.bringToFront();await expect(manager.locator('.task-card').first()).toHaveAttribute('data-state','completed',{timeout:20000});
});
test('cross-origin MIME-only sources include Range totals and download as media',async()=>{
 const page=await context.newPage();await page.goto('http://127.0.0.1:4179/network-only.html');const id=await tabId(page.url());
 const sources=()=>ui.evaluate(async tabId=>(await chrome.runtime.sendMessage({type:'snapshot',tabId})).data.media,id);
 await expect.poll(async()=> (await sources()).map((m:any)=>m.kind).sort()).toEqual(['direct','hls']);
 const direct=(await sources()).find((m:any)=>m.kind==='direct');expect(direct.size).toBeGreaterThan(1024);expect(direct.contentType).toBe('video/mp4');expect((await sources()).find((m:any)=>m.kind==='hls').size).toBeUndefined();
 await ui.goto(`${base}/popup.html?tabId=${id}`);const card=ui.locator('.media-card').filter({hasText:'MP4'});await expect(card).toHaveCount(1);await card.getByRole('button',{name:'Download',exact:true}).click();
 await ui.evaluate(()=>chrome.runtime.sendMessage({type:'openManager'}));const manager=context.pages().filter(p=>p.url().includes('manager.html')).at(-1)!;await manager.bringToFront();const task=manager.locator('.task-card').first();await expect(task).toHaveAttribute('data-state','completed');
 const item=await manager.evaluate(async taskId=>{const r=await chrome.runtime.sendMessage({type:'snapshot'});const task=r.data.tasks.find((t:any)=>t.id===taskId);return(await chrome.downloads.search({id:task.downloadId}))[0];},await task.getAttribute('data-task-id'));
 expect(item.mime).toBe('video/mp4');expect(item.bytesReceived).toBe(direct.size);expect((await readFile(item.filename)).equals(await readFile('fixtures/media/high.mp4'))).toBe(true);await expect(task).toHaveAttribute('data-state','completed');
});
test('automatic detection is enabled by default and stops when disabled',async()=>{
 await ui.goto(`${base}/manager.html#settings`);await expect(ui.getByRole('checkbox',{name:'Automatic media detection',exact:true})).toBeChecked();
 const page=await context.newPage();await page.goto('http://auto-detection.test:4179/');const id=await tabId(page.url());await expect.poll(()=>sw.evaluate(id=>chrome.action.getBadgeText({tabId:id}),id)).not.toBe('');
 await ui.bringToFront();await ui.getByRole('checkbox',{name:'Automatic media detection',exact:true}).uncheck();await expect.poll(()=>sw.evaluate(async()=>((await chrome.storage.local.get('settings')).settings as any)?.globalDetection)).toBe(false);await page.reload();await expect.poll(()=>sw.evaluate(id=>chrome.action.getBadgeText({tabId:id}),id)).toBe('');
});
test('an HTML session is rejected by preflight without creating a native download',async()=>{
 const before=await ui.evaluate(()=>chrome.downloads.search({}));const page=await context.newPage();await page.goto('http://127.0.0.1:4179/session-video.html');await page.locator('video').evaluate((v:HTMLVideoElement)=>new Promise<void>(r=>{if(v.readyState>=1)r();else v.onloadedmetadata=()=>r();}));const id=await tabId(page.url());await ui.goto(`${base}/popup.html?tabId=${id}`);
 await expect.poll(()=>ui.evaluate(async id=>{const list=(await chrome.storage.session.get(`tab:${id}`))[`tab:${id}`]??[];return list.some((m:any)=>m.variants.some((v:any)=>v.check?.error==='html'));},id)).toBe(true);await expect(ui.locator('.media-card')).toHaveCount(0);expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(before.length);
 await ui.getByRole('button',{name:'Scan page',exact:true}).click();await expect(ui.locator('.media-card')).toHaveCount(0);
});
