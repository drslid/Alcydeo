import {test,expect,chromium,type BrowserContext,type Page} from '@playwright/test';
import {resolve} from 'node:path';

let context:BrowserContext,admin:Page,ui:Page,base:string,id:string;
test.describe.configure({mode:'serial'});
test.beforeAll(async()=>{
  const extension=resolve('apps/extension/.output/chrome-mv3');
  context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--test-type']});
  const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');id=new URL(worker.url()).host;base=`chrome-extension://${id}`;
  admin=await context.newPage();await admin.goto('chrome://extensions/');
  await admin.evaluate(()=> (chrome as any).developerPrivate.updateProfileConfiguration({inDeveloperMode:true}));
});
test.afterAll(async()=>{await context?.close();});
async function errors(){return admin.evaluate(async id=>((await(chrome as any).developerPrivate.getExtensionInfo(id)).runtimeErrors??[]).map((e:any)=>e.message),id);}
async function reload(){await admin.evaluate(id=>(chrome as any).developerPrivate.reload(id),id);ui=await context.newPage();await ui.goto(`${base}/manager.html`);await expect(ui.getByRole('heading',{name:'Library',exact:true})).toBeVisible();}
async function listening(){const worker=context.serviceWorkers().find(w=>w.url().startsWith(base));return worker?.evaluate(()=>({headers:chrome.webRequest.onHeadersReceived.hasListeners(),navigation:chrome.webRequest.onBeforeRequest.hasListeners()}));}

test('fresh install detects before opening the popup without extra activation',async()=>{
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/network-only.html');
  const worker=context.serviceWorkers().find(w=>w.url().startsWith(base))!;
  await expect.poll(()=>worker.evaluate(async()=>{const tab=(await chrome.tabs.query({})).find(t=>t.url==='http://127.0.0.1:4179/network-only.html')!;return chrome.action.getBadgeText({tabId:tab.id});})).toBe('2');
  const tabId=await worker.evaluate(async()=>(await chrome.tabs.query({})).find(t=>t.url==='http://127.0.0.1:4179/network-only.html')!.id!);
  ui=await context.newPage();await ui.goto(`${base}/popup.html?tabId=${tabId}`);await expect(ui.locator('.media-card')).toHaveCount(2);await expect(ui.locator('.detection-mode')).toHaveCount(0);await expect(ui.locator('.reader-permissions')).toHaveCount(0);await expect(ui.getByRole('button',{name:'Allow source domains',exact:true})).toHaveCount(0);
  await source.close();await ui.close();await reload();await expect.poll(()=>ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.settings.globalDetection)).toBe(true);
  expect(await errors()).toEqual([]);await expect.poll(listening).toEqual({headers:true,navigation:true});
});
test('Chrome site restrictions, scoped grants and worker termination are respected',async()=>{
  await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_CLICK'}),id);
  await expect.poll(()=>ui.evaluate(async()=>(await chrome.permissions.getAll()).origins??[])).toEqual([]);await expect.poll(listening).toEqual({headers:false,navigation:false});
  await ui.close();await reload();await expect.poll(listening).toEqual({headers:false,navigation:false});expect(await errors()).toEqual([]);
  await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_SPECIFIC_SITES'}),id);
  await admin.evaluate(async id=>{for(const origin of ['http://127.0.0.1/*','http://localhost/*'])await(chrome as any).developerPrivate.addHostPermission(id,origin);},id);
  await expect.poll(listening).toEqual({headers:true,navigation:true});expect(await ui.evaluate(()=>chrome.permissions.contains({origins:['http://*/*','https://*/*']}))).toBe(false);
  // Only trusted extension pages can request snapshots. Keep the source URLs
  // entirely inside the real extension and inspect its transient cache here.
  async function media(page:Page){return ui.evaluate(async url=>{const tab=(await chrome.tabs.query({})).find(t=>t.url===url)!;const r=await chrome.runtime.sendMessage({type:'snapshot',tabId:tab.id});return r.data.media.map((m:any)=>m.kind).sort();},page.url());}
  const first=await context.newPage();await first.goto('http://127.0.0.1:4179/network-only.html');await expect.poll(()=>media(first)).toEqual(['direct','hls']);await first.close();
  await ui.close();const session=await context.browser()!.newBrowserCDPSession();const targets=await session.send('Target.getTargets');const worker=targets.targetInfos.find(t=>t.type==='service_worker'&&t.url.startsWith(base))!;await session.send('Target.closeTarget',{targetId:worker.targetId});
  const next=await context.newPage();await next.goto('http://127.0.0.1:4179/network-only.html');
  // Read the badge through the extension worker only after the page has had
  // the chance to wake it through native tab/request events.
  await expect.poll(()=>context.serviceWorkers().some(w=>w.url().startsWith(base))).toBe(true);
  const live=context.serviceWorkers().find(w=>w.url().startsWith(base))!;
  await expect.poll(()=>live.evaluate(async()=>{const tab=(await chrome.tabs.query({})).find(t=>t.url==='http://127.0.0.1:4179/network-only.html')!;const data=await chrome.storage.session.get(`tab:${tab.id}`);return(data[`tab:${tab.id}`]??[]).map((m:any)=>m.kind).sort();})).toEqual(['direct','hls']);
  ui=await context.newPage();await ui.goto(`${base}/manager.html`);await expect.poll(listening).toEqual({headers:true,navigation:true});expect(await errors()).toEqual([]);
  await next.close();await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_CLICK'}),id);await expect.poll(listening).toEqual({headers:false,navigation:false});
  await ui.close();await reload();await expect.poll(listening).toEqual({headers:false,navigation:false});expect(await errors()).toEqual([]);
});
test('old preferences migrate once and a later explicit pause survives reload',async()=>{
  await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_ALL_SITES'}),id);
  await ui.evaluate(async()=>{await chrome.storage.local.set({settings:{theme:'dark',folder:'Courses',badge:'dot',blocked:[],minSize:0,globalDetection:false}});await chrome.storage.local.remove('automaticDetectionDefault');});await ui.close();await reload();
  expect(await ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.settings)).toMatchObject({theme:'dark',folder:'Courses',badge:'dot',globalDetection:true});
  await ui.goto(`${base}/manager.html#settings`);await ui.getByRole('checkbox',{name:'Automatic media detection',exact:true}).uncheck();await expect.poll(listening).toEqual({headers:false,navigation:false});
  await ui.close();await reload();expect(await ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.settings.globalDetection)).toBe(false);await expect.poll(listening).toEqual({headers:false,navigation:false});expect(await errors()).toEqual([]);
});
