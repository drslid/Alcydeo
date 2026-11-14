import {test,expect,chromium,type BrowserContext,type Page,type Worker} from '@playwright/test';
import {resolve} from 'node:path';
import {readFile,mkdir} from 'node:fs/promises';
let context:BrowserContext,ui:Page,sw:Worker,base:string;
test.describe.configure({mode:'serial'});
test.beforeAll(async()=>{
  const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--test-type']});
  sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;ui=await context.newPage();await ui.setViewportSize({width:525,height:600});
});
test.afterAll(async()=>{await context?.close();});
async function idOf(url:string){return sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,url);}
async function manager(){await ui.evaluate(()=>chrome.runtime.sendMessage({type:'openManager'}));await expect.poll(()=>context.pages().filter(p=>p.url().includes('manager.html')).length).toBeGreaterThan(0);const page=context.pages().filter(p=>p.url().includes('manager.html')).at(-1)!;await page.waitForLoadState();await page.bringToFront();return page;}
async function saved(page:Page,taskId:string){return page.evaluate(async id=>{const r=await chrome.runtime.sendMessage({type:'snapshot'});const t=r.data.tasks.find((t:any)=>t.id===id);return(await chrome.downloads.search({id:t.downloadId}))[0];},taskId);}
async function height(page:Page,bytes:Buffer){return page.evaluate(async data=>{
  const video=document.createElement('video');const url=URL.createObjectURL(new Blob([Uint8Array.from(data)],{type:'video/mp4'}));
  try{await new Promise<void>((resolve,reject)=>{video.onloadedmetadata=()=>resolve();video.onerror=()=>reject(new Error('decode'));video.src=url;});return video.videoHeight;}finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
},Array.from(bytes));}

test('direct quality links share a card, retain the selection and save the chosen file',async()=>{
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/grouping.html');const id=await idOf(source.url());await ui.goto(`${base}/popup.html?tabId=${id}`);
  await expect(ui.locator('.media-card')).toHaveCount(2);const card=ui.locator('.media-card').first();await expect(card.locator('option')).toHaveText(['404p','180p']);await card.getByRole('combobox').selectOption({label:'180p'});await expect(card.getByRole('textbox')).toHaveCount(0);const chosen=await card.getByRole('combobox').inputValue();
  // The player reports the other quality after the user's selection. Its size
  // must neither replace the selection nor be shown as the chosen file's size.
  await source.evaluate(()=>fetch('/quality/lesson-404p.mp4').then(r=>r.arrayBuffer()));await ui.getByRole('button',{name:'Scan page',exact:true}).click();await expect(card.getByRole('combobox')).toHaveValue(chosen);await expect(card.getByRole('textbox')).toHaveCount(0);await expect(card).toContainText('Accessible');
  await mkdir('artifacts/evidence',{recursive:true});await ui.screenshot({path:'artifacts/evidence/popup-grouped-direct.png',animations:'disabled'});
  await card.getByRole('button',{name:'Download',exact:true}).click();const page=await manager();const task=page.locator('.task-card').filter({has:page.getByRole('heading',{name:'Same lesson',exact:true})});await expect(task).toHaveAttribute('data-state','completed');const item=await saved(page,(await task.getAttribute('data-task-id'))!);const actual=await readFile(item.filename);
  expect(actual.equals(await readFile('fixtures/media/low.mp4'))).toBe(true);await expect(task).toHaveAttribute('data-state','completed');expect(await height(page,actual)).toBe(180);
});
test('master and observed HLS qualities become one card without a manual lookup',async()=>{
  // Keep repeated runs independent when the shared fixture server is reused.
  await context.request.get('http://127.0.0.1:4179/quality-generation?value=1');
  const requests:string[]=[];context.on('request',r=>{if(r.url().includes('/segment-')&&!r.headers().range)requests.push(r.url());});
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/grouped-hls.html');const id=await idOf(source.url());await ui.goto(`${base}/popup.html?tabId=${id}`);
  await expect(ui.locator('.media-card')).toHaveCount(1,{timeout:15000});const card=ui.locator('.media-card');await expect(card.locator('option')).toHaveText(['404p','180p']);await expect.poll(()=>sw.evaluate(id=>chrome.action.getBadgeText({tabId:id}),id)).toBe('1');await card.getByRole('combobox').selectOption({label:'180p'});const chosen=await card.getByRole('combobox').inputValue();
  await source.evaluate(()=>{const a=document.createElement('a');a.href='/hls-high/index.m3u8?signature=g1';a.textContent='One segmented lesson';document.body.append(a);});await ui.getByRole('button',{name:'Scan page',exact:true}).click();await expect(ui.locator('.media-card')).toHaveCount(1);await expect(card.getByRole('combobox')).toHaveValue(chosen);
  await source.evaluate(()=>fetch('/quality-generation?value=2').then(r=>r.text()));await card.getByRole('button',{name:'Find qualities',exact:true}).click();await expect(card.locator('option:checked')).toHaveText('180p');
  expect(requests).toEqual([]);await ui.screenshot({path:'artifacts/evidence/popup-grouped-hls.png',animations:'disabled'});await ui.evaluate(()=>document.documentElement.dataset.theme='dark');await ui.screenshot({path:'artifacts/evidence/popup-grouped-hls-dark.png',animations:'disabled'});
  await card.getByRole('button',{name:'Download',exact:true}).click();const page=await manager();const task=page.locator('.task-card').filter({has:page.getByRole('heading',{name:'One segmented lesson',exact:true})});await expect(task).toHaveAttribute('data-state','completed',{timeout:20000});const taskId=(await task.getAttribute('data-task-id'))!;expect(await page.evaluate(async id=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.find((t:any)=>t.id===id).variant.url,taskId)).toContain('signature=g2');const item=await saved(page,taskId);expect(await height(page,await readFile(item.filename))).toBe(180);expect(requests.filter(url=>url.includes('/hls-low/segment-'))).toHaveLength(3);expect(requests.some(url=>url.includes('/hls-high/segment-'))).toBe(false);
});
