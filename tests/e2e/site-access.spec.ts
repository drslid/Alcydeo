import{test,expect,chromium,type BrowserContext,type Page,type Worker}from'@playwright/test';
import{resolve}from'node:path';import{mkdir,readFile,mkdtemp,writeFile,rm}from'node:fs/promises';import{tmpdir}from'node:os';
let context:BrowserContext,sw:Worker,ui:Page,admin:Page,base:string,extensionId:string,profile:string;
const evidence='artifacts/evidence/site-access-0.1.42';
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')) as Record<string,Record<string,string>>;
test.beforeEach(async()=>{
 profile=await mkdtemp(resolve(tmpdir(),'alcydeo-access42-'));await mkdir(resolve(profile,'Default'));const downloads=resolve(evidence,'downloads',crypto.randomUUID());await mkdir(downloads,{recursive:true});await writeFile(resolve(profile,'Default/Preferences'),JSON.stringify({download:{default_directory:downloads,prompt_for_download:false}}));
 const ext=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,headless:true,acceptDownloads:true,args:[`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox','--test-type']});
 sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');extensionId=new URL(sw.url()).host;base=`chrome-extension://${extensionId}`;ui=await context.newPage();await ui.setViewportSize({width:525,height:600});admin=await context.newPage();await admin.goto('chrome://extensions/');await mkdir(evidence,{recursive:true});
 await sw.evaluate(async()=>{const{settings}=await chrome.storage.local.get('settings');await chrome.storage.local.set({settings:{...settings,saveAs:false,multipart:true,connections:4}});});
 const cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});await cdp.detach();
});
test.afterEach(async()=>{await context?.close();await rm(profile,{recursive:true,force:true});});
async function restrict(){await admin.evaluate(async id=>{await(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_SPECIFIC_SITES'});await(chrome as any).developerPrivate.addHostPermission(id,'http://127.0.0.1/*');},extensionId);}
async function grant(origin:string){await admin.evaluate(async({id,origin})=>(chrome as any).developerPrivate.addHostPermission(id,origin),{id:extensionId,origin});}
async function revoke(origin:string){await admin.evaluate(async({id,origin})=>(chrome as any).developerPrivate.removeHostPermission(id,origin),{id:extensionId,origin});}
async function open(source:Page){const tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());await ui.goto(`${base}/popup.html?tabId=${tabId}`);return tabId;}
async function task(){return ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks[0]);}
async function manager(){await expect.poll(()=>context.pages().some(p=>p.url().includes('manager.html'))).toBe(true);return context.pages().find(p=>p.url().includes('manager.html'))!;}
test('internal Chrome and extension pages do not trigger a domain prompt or a scan error',async()=>{
 for(const url of ['chrome://extensions/',base+'/manager.html']){
  const target=await sw.evaluate(url=>chrome.tabs.create({url,active:false}),url);
  await ui.goto(`${base}/popup.html?tabId=${target.id}`);await expect(ui.getByRole('heading',{name:'Open a web page',exact:true})).toBeVisible();await expect(ui.getByRole('alert')).toHaveCount(0);await expect(ui.getByRole('button',{name:'Scan page',exact:true})).toBeDisabled();await expect(ui.getByRole('button',{name:'Capture this tab',exact:true})).toBeDisabled();await expect(ui.getByRole('button',{name:/Allow source domains|Allow embedded players/})).toHaveCount(0);
  await ui.reload();await expect(ui.getByRole('alert')).toHaveCount(0);
 }
 await ui.screenshot({path:`${evidence}/internal-page.png`});
});
test('a real missing CDN grant pauses once, uses Chrome settings and resumes without domain requests',async()=>{
 await restrict();let cdn=0;context.on('request',r=>{if(r.url().startsWith('http://localhost:4179/'))cdn++;});
 const source=await context.newPage();await source.goto('http://127.0.0.1:4179/hls-permission.html');const tabId=await open(source);
 await expect.poll(async()=>(await ui.evaluate(id=>chrome.runtime.sendMessage({type:'snapshot',tabId:id}),tabId)).data.sourcePending).toBe(false);
 await expect(ui.locator('.media-card')).toHaveCount(0);expect(await sw.evaluate(id=>chrome.action.getBadgeText({tabId:id}),tabId)).toBe('');expect(cdn).toBe(0);expect(await task()).toBeUndefined();
 // Since0.1.50 an inaccessible candidate is not a downloadable card. Grant
 // and validate it first, then withdraw the real CDN before explicit enqueue.
 await grant('http://localhost/*');await ui.getByRole('button',{name:'Scan page',exact:true}).click();await expect(ui.locator('.media-card option')).toHaveText(['180p']);await expect(ui.getByRole('button',{name:'Download',exact:true})).toBeEnabled();
 await expect.poll(async()=>(await ui.evaluate(id=>chrome.runtime.sendMessage({type:'snapshot',tabId:id}),tabId)).data.sourcePending).toBe(false);expect(cdn).toBeGreaterThan(0);const checkedRequests=cdn;
 await revoke('http://localhost/*');await expect.poll(()=>sw.evaluate(()=>chrome.permissions.contains({origins:['http://localhost/*']}))).toBe(false);await ui.getByRole('button',{name:'Download',exact:true}).click();
 const owner=await manager();await expect.poll(async()=>(await task())?.state).toBe('paused');await expect.poll(async()=>(await task())?.owner??null).toBeNull();expect(cdn).toBe(checkedRequests);
 await expect(ui.locator('.popup-task').getByRole('button',{name:'Site access in Chrome',exact:true})).toBeVisible();
 const card=owner.locator('.task-card');await expect(card.locator('.task-error p')).toHaveText('This source is not accessible.');await expect(card.getByRole('button',{name:'Site access in Chrome',exact:true})).toBeVisible();await expect(card.getByRole('button',{name:'Allow source domains',exact:true})).toHaveCount(0);await expect(card.locator('.domains')).toHaveCount(0);
 await owner.setViewportSize({width:900,height:800});
 for(const[locale,c]of Object.entries(catalogs)){await owner.evaluate(locale=>chrome.storage.local.set({language:locale}),locale);await expect(card.locator('.task-error p')).toHaveText(c.err_permission!);await expect(card.getByRole('button',{name:c.chromeSiteAccess,exact:true})).toBeVisible();expect(await owner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await owner.screenshot({path:`${evidence}/cdn-${locale}.png`,fullPage:true});}
 await owner.evaluate(()=>chrome.storage.local.set({language:'en'}));await expect(card.locator('.task-error p')).toHaveText('This source is not accessible.');await owner.screenshot({path:`${evidence}/cdn-paused.png`,fullPage:true});await owner.waitForTimeout(1200);expect((await task()).state).toBe('paused');expect(cdn).toBe(checkedRequests);
 const next=context.waitForEvent('page');await card.getByRole('button',{name:'Site access in Chrome',exact:true}).click();const settings=await next;await expect(settings).toHaveURL(`chrome://extensions/?id=${extensionId}`);
 await grant('http://localhost/*');await card.getByRole('button',{name:'Resume',exact:true}).click();await expect.poll(async()=>(await task())?.saved,{timeout:15000}).toBe(true);expect((await task()).validation.tracks.map((track:any)=>track.codec)).toEqual(['avc','aac']);expect(cdn).toBeGreaterThan(0);
});
test('revoking an unrelated site keeps a transfer running; revoking its real source pauses it',async()=>{
 await restrict();await grant('http://localhost/*');const source=await context.newPage(),url=`http://127.0.0.1:4179/access-video.html?case=${crypto.randomUUID()}`;await source.route(url,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Original access fixture</title><video preload="none" src="/parts/source.mp4?case=access42&amp;pace=250"></video>'}));await source.goto(url);await open(source);await ui.getByRole('button',{name:'Download',exact:true}).click();await manager();await expect.poll(async()=>(await task())?.bytes??0).toBeGreaterThan(0);
 const before=(await task()).bytes;await revoke('http://localhost/*');await expect.poll(async()=>(await task())?.bytes??0).toBeGreaterThan(before);expect((await task()).error).toBeUndefined();expect((await task()).state).toBe('fetching');
 await revoke('http://127.0.0.1/*');await expect.poll(async()=>(await task())?.state).toBe('paused');await expect.poll(async()=>(await task())?.owner??null).toBeNull();expect((await task()).error).toBe('permission');
 await grant('http://127.0.0.1/*');const owner=await manager();await owner.locator('.task-card').getByRole('button',{name:'Resume',exact:true}).click();await expect.poll(async()=>(await task())?.saved,{timeout:20000}).toBe(true);const saved=await task(),item=await sw.evaluate(async id=>(await chrome.downloads.search({id}))[0],saved.downloadId);expect(await readFile(item.filename)).toEqual(await readFile('fixtures/media/high.mp4'));
});
