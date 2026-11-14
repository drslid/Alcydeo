import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';
import{tmpdir}from'node:os';
import{mkdtemp,readFile,rm}from'node:fs/promises';
import type{Task}from'../../packages/contracts';
import{historyTask,seedHistory}from'./history-fixture';

const video=await readFile('fixtures/tv/long.mp4'),catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')),c=catalogs.en;
let context:BrowserContext,ui:Page,base:string,directory:string,unexpected:string[];
test.beforeEach(async()=>{
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??process.env.ALCYDEO_TEST_EXTENSION??'apps/extension/.output/chrome-mv3');directory=await mkdtemp(resolve(tmpdir(),'alcydeo-cast59-'));
 context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 unexpected=[];await context.route('https://**/*',route=>{unexpected.push(route.request().url());return route.abort();});
 await context.addInitScript(()=>{const state=window as any;state.__nativeCastCalls=[];const prototype=Object.getPrototypeOf(document.createElement('video').remote),prompt=prototype.prompt;prototype.prompt=function(){state.__nativeCastCalls.push({activation:navigator.userActivation.isActive});return prompt.call(this);};});
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(worker.url()).host}`;
 const driver=await context.browser()!.newBrowserCDPSession();await driver.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:directory,eventsEnabled:true});
 ui=await context.newPage();await ui.goto(base+'/manager.html#tv');
});
test.afterEach(async()=>{await context?.close();await rm(directory,{recursive:true,force:true});expect(unexpected).toEqual([]);});
async function allowFileAccess(){
 await ui.evaluate(()=>{const button=document.createElement('button');button.id='fixture-file-access';button.textContent='Grant fixture file access';button.onclick=()=>{void chrome.permissions.request({origins:['file:///*']}).then(value=>{(window as any).__fixtureFileAccess=value;});};document.body.append(button);});
 await ui.locator('#fixture-file-access').click();await expect.poll(()=>ui.evaluate(()=>(window as any).__fixtureFileAccess)).toBe(true);expect(await ui.evaluate(()=>chrome.extension.isAllowedFileSchemeAccess())).toBe(true);await ui.locator('#fixture-file-access').evaluate(element=>element.remove());
}
async function savedDownload(){
 const id=await ui.evaluate(async bytes=>{const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'video/mp4'}));(window as any).__fixtureDownloadUrl=url;return chrome.downloads.download({url,filename:'Original source.mp4',saveAs:false});},[...video]);
 await expect.poll(()=>ui.evaluate(async id=>(await chrome.downloads.search({id}))[0]?.state,id)).toBe('complete');await ui.evaluate(()=>URL.revokeObjectURL((window as any).__fixtureDownloadUrl));return id;
}
async function openTask(task:Task){await seedHistory(ui,[task]);await ui.goto(`${base}/manager.html?taskId=${task.id}#tv`);}

test('the direct local Cast click invokes the real native prompt even when play never resolves',async()=>{
 await allowFileAccess();const id=await savedDownload(),task=historyTask('Direct native click',{filename:'Original source.mp4',downloadId:id,bytes:video.length});await openTask(task);const cast=ui.locator('.local-cast-button');await expect(cast).toBeEnabled();
 await ui.evaluate(()=>{HTMLMediaElement.prototype.play=function(){return new Promise<void>(()=>{});};});await cast.click();
 await expect.poll(()=>ui.evaluate(()=>(window as any).__nativeCastCalls)).toEqual([{activation:true}]);await expect(ui.locator('.local-tv [role="alert"]')).toBeVisible();await expect(ui.locator('.local-tv .cast-status')).not.toHaveAttribute('data-phase','connected');
});

test('a real native failure promotes the focused Chrome tab guide without another copy or automatic retry',async()=>{
 await allowFileAccess();const id=await savedDownload(),task=historyTask('Native fallback guide',{filename:'Original source.mp4',downloadId:id,bytes:video.length});await openTask(task);
 const native=ui.locator('.local-cast-button'),guide=ui.locator('.local-cast-guide'),steps=ui.locator('.local-cast-guide-button'),player=ui.locator('.local-tv video');await expect(native).toBeEnabled();await expect(guide).toHaveCount(0);const originalSource=await player.getAttribute('src');
 await native.click();await expect.poll(()=>ui.evaluate(()=>(window as any).__nativeCastCalls)).toEqual([{activation:true}]);await expect(ui.locator('.local-tv [role="alert"]')).toBeVisible();
 await expect(guide).toBeVisible();await expect(guide).toBeFocused();await expect(guide.locator('li')).toHaveCount(3);await expect(steps).toHaveClass(/\bprimary\b/);await expect(steps).toHaveText(c.tvFileCastTabSteps);await expect(native).toHaveClass(/\bsecondary\b/);await expect(native).toHaveText(c.tvFileCastNative);
 await steps.click();await expect(guide).toBeFocused();expect(await ui.evaluate(()=>(window as any).__nativeCastCalls)).toEqual([{activation:true}]);expect(await player.getAttribute('src')).toBe(originalSource);expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(1);
 await player.evaluate((video:HTMLVideoElement)=>video.play());await expect.poll(()=>player.evaluate((video:HTMLVideoElement)=>video.currentTime)).toBeGreaterThan(0.1);
 await native.click();await expect.poll(()=>ui.evaluate(()=>(window as any).__nativeCastCalls)).toEqual([{activation:true},{activation:true}]);await expect(guide).toBeFocused();expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(1);expect(await readFile((await ui.evaluate(async id=>(await chrome.downloads.search({id}))[0]!.filename,id)))).toEqual(video);
 await player.evaluate((video:HTMLVideoElement)=>video.pause());
 for(const locale of['fr','ur']){
  await ui.evaluate(language=>chrome.storage.local.set({language}),locale);await expect(steps).toHaveText(catalogs[locale].tvFileCastTabSteps);await expect(native).toHaveText(catalogs[locale].tvFileCastNative);await ui.setViewportSize({width:390,height:950});await ui.evaluate(async locale=>{document.documentElement.dataset.theme=locale==='ur'?'dark':'light';await document.fonts.ready;window.scrollTo({top:0,behavior:'instant'});},locale);
  expect(await ui.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const flavor=process.env.ALCYDEO_EXTENSION_PATH?.includes('/store/')?'store':'local';await ui.screenshot({path:`.local/cast64/${flavor}-file-guide-${locale}-390.png`,fullPage:true,animations:'disabled'});
 }
});

for(const valid of['original','cast-copy']as const)test(`a valid ${valid} download is reused despite a missing other record and OPFS output`,async()=>{
 await allowFileAccess();const id=await savedDownload(),task=historyTask('Recover native source',{filename:'Original source.mp4',downloadId:valid==='original'?id:987654321,castDownloadId:valid==='cast-copy'?id:987654321,output:'missing-output.mp4',bytes:video.length});await openTask(task);
 await expect(ui.locator('.local-cast-button')).toBeEnabled();expect(await ui.locator('.local-tv video').evaluate((player:HTMLVideoElement)=>player.currentSrc.startsWith('file:///'))).toBe(true);expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(1);await expect(ui.locator('.local-tv [role="alert"]')).toHaveCount(0);
});

test('choosing file B from task A detaches the copy from A without changing its retained original',async()=>{
 const task=historyTask('Original A',{filename:'Original A.mp4',output:'original-a.mp4',bytes:video.length});
 await ui.evaluate(async({id,bytes})=>{const root=await navigator.storage.getDirectory(),dir=await root.getDirectoryHandle(id,{create:true}),writer=await(await dir.getFileHandle('original-a.mp4',{create:true})).createWritable();await writer.write(new Uint8Array(bytes));await writer.close();},{id:task.id,bytes:[...video]});await openTask(task);await expect(ui.locator('.local-file-heading h4')).toHaveText('Original A.mp4');
 await ui.getByLabel(c.tvFileChoose,{exact:true}).setInputFiles({name:'Different B.mp4',mimeType:'video/mp4',buffer:video});await expect(ui.locator('.local-file-heading h4')).toHaveText('Different B.mp4');await ui.locator('.local-cast-prepare').click();await expect(ui.locator('.local-cast-button')).toBeEnabled();
 const retained=await ui.evaluate(async id=>{const task=(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.find((task:Task)=>task.id===id),root=await navigator.storage.getDirectory(),file=await(await(await root.getDirectoryHandle(id)).getFileHandle('original-a.mp4')).getFile();return{task,bytes:[...new Uint8Array(await file.arrayBuffer())]};},task.id);
 expect(retained.task.castDownloadId).toBeUndefined();expect(retained.task.filename).toBe('Original A.mp4');expect(Buffer.from(retained.bytes)).toEqual(video);const copies=await ui.evaluate(()=>chrome.downloads.search({}));expect(copies).toHaveLength(1);expect(copies[0]).toMatchObject({state:'complete',exists:true,fileSize:video.length});expect(await readFile(copies[0]!.filename)).toEqual(video);
});
