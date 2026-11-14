import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';import{mkdir,mkdtemp,readFile,writeFile,rm}from'node:fs/promises';import{tmpdir}from'node:os';
import{tiktokFixtureId,tiktokFixturePage,tiktokItem,tiktokTitle,tiktokUrl}from'../../scripts/tiktok-fixture.mjs';
const evidence='artifacts/evidence/tiktok-player-state52',high=await readFile('fixtures/media/high.mp4'),low=await readFile('fixtures/media/low.mp4');
let context:BrowserContext,ui:Page,source:Page,profile:string,base:string,tabId:number,mode:'player'|'refused'|'invalid';
let calls:{url:string;range?:string;origin?:string;referrer?:string}[];
function playerFixture(){
 const item:any=tiktokItem(high.length,low.length);item.author={secret:'original-fixture-author-not-retained'};item.stats={playCount:1000};
 if(mode==='invalid'){item.video.playAddr='https://unexpected-fixture.test/clip.mp4';for(const row of item.video.bitrateInfo)row.PlayAddr.UrlList=['https://unexpected-fixture.test/clip.mp4'];}
 const refusal=mode==='refused'?`<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${JSON.stringify({__DEFAULT_SCOPE__:{'webapp.video-detail':{statusCode:10204,itemInfo:{itemStruct:{...item,privateItem:true}}}}})}</script>`:'';
 return`<!doctype html><meta charset="utf-8"><title>Original player-state laboratory</title>${refusal}<video id="original" muted autoplay loop></video><script>
 window.__getterReads=0;
 window.__setPlayerItem=item=>{const video=document.getElementById('original'),children=[];Object.defineProperty(children,'0',{enumerable:true,get(){window.__getterReads++;throw new Error('Original fixture getter must not run');}});children[2]={props:{detail:{itemInfo:{itemStruct:item}}}};Object.defineProperty(video,'__reactFiber$originalFixture',{configurable:true,value:{memoizedProps:{children}}});video.dispatchEvent(new Event('playing'));};
 window.__setPlayerItem(${JSON.stringify(item).replaceAll('<','\\u003c')});
 (async()=>{const response=await fetch('/original-fixture-data');const video=document.getElementById('original');video.src=URL.createObjectURL(new Blob([await response.arrayBuffer()],{type:'video/mp4'}));await video.play();})();
 </script>`;
}
test.beforeEach(async()=>{
 mode='player';calls=[];await mkdir(evidence,{recursive:true});profile=await mkdtemp(resolve(tmpdir(),'alcydeo-tiktok-player52-'));await mkdir(resolve(profile,'Default'));await writeFile(resolve(profile,'Default/Preferences'),JSON.stringify({download:{default_directory:resolve(evidence,'downloads',crypto.randomUUID()),prompt_for_download:false}}));
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,headless:true,acceptDownloads:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 const cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});await cdp.detach();const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;
 await context.route('https://**/*',route=>route.abort());
 await context.route('https://www.tiktok.com/**',async route=>{if(new URL(route.request().url()).pathname==='/original-fixture-data')await route.fulfill({contentType:'application/octet-stream',body:high});else await route.fulfill({contentType:'text/html; charset=utf-8',body:playerFixture()});});
 await context.route('https://v16-webapp-prime.tiktok.com/**',async route=>{
  const request=route.request(),headers=await request.allHeaders(),data=request.url().includes('/low/')?low:high;calls.push({url:request.url(),range:headers.range,origin:headers.origin,referrer:headers.referer});
  const cors={'Access-Control-Allow-Origin':'https://www.tiktok.com','Access-Control-Allow-Credentials':'true','Access-Control-Expose-Headers':'Content-Range, Content-Length, Content-Type'};
  if(headers.origin!=='https://www.tiktok.com'){await route.fulfill({status:403,headers:cors,body:'Original fixture requires its own player frame'});return;}
  if(headers.range){expect(headers.range).toBe('bytes=0-4095');await route.fulfill({status:206,contentType:'video/mp4',headers:{...cors,'Content-Range':`bytes 0-4095/${data.length}`},body:data.subarray(0,4096)});}else await route.fulfill({contentType:'video/mp4',headers:cors,body:data});
 });
 ui=await context.newPage();await ui.setViewportSize({width:525,height:600});await ui.goto(base+'/manager.html');
 await ui.evaluate(async()=>{const{data}=await chrome.runtime.sendMessage({type:'snapshot'});await chrome.runtime.sendMessage({type:'settings',value:{...data.settings,saveAs:false,multipart:false}});});
 await expect.poll(()=>ui.evaluate(async()=>(await chrome.scripting.getRegisteredContentScripts()).some(script=>script.id==='alcydeo-observer'&&script.runAt==='document_start'))).toBe(true);source=await context.newPage();
});
test.afterEach(async({browserName},info)=>{if(info.status!=='passed'&&ui&&!ui.isClosed())await writeFile(`${evidence}/failure-${info.testId.replace(/\W/g,'_')}.json`,JSON.stringify({browserName,calls,session:await ui.evaluate(()=>chrome.storage.session.get(null))},null,2));await context?.close();await rm(profile,{recursive:true,force:true});});
async function state(){return(await ui.evaluate(id=>chrome.runtime.sendMessage({type:'snapshot',tabId:id}),tabId)).data;}
async function scan(){await ui.evaluate(id=>chrome.runtime.sendMessage({type:'scan',tabId:id}),tabId);}
async function open(){await source.goto(tiktokFixturePage);tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url)!.id!,source.url());await expect.poll(()=>source.locator('#original').evaluate((video:HTMLVideoElement)=>video.currentSrc.startsWith('blob:')&&!video.paused&&video.currentTime>0)).toBe(true);}
async function ready(id=tiktokFixtureId,title=tiktokTitle){await expect.poll(async()=>{const snapshot=await state();return !snapshot.sourcePending&&snapshot.media.length===1&&snapshot.media[0].providerId==='tiktok:'+id&&snapshot.media[0].title===title&&snapshot.media[0].variants.length===2&&snapshot.media[0].variants.every((variant:any)=>variant.check?.state==='ready');},{timeout:10000}).toBe(true);expect(await ui.evaluate(id=>chrome.action.getBadgeText({tabId:id}),tabId)).toBe('1');}

test('a scriptless native player supplies one checked card and saves only the chosen original file',async()=>{
 await open();expect(await source.locator('script#__UNIVERSAL_DATA_FOR_REHYDRATION__,script#SIGI_STATE,script#sigi-persisted-data').count()).toBe(0);await ready();expect(calls.every(call=>call.range==='bytes=0-4095')).toBe(true);expect(await source.evaluate(()=>(window as any).__getterReads)).toBe(0);
 await ui.goto(`${base}/popup.html?tabId=${tabId}`);await expect(ui.locator('.media-info h2')).toHaveText(tiktokTitle);await expect(ui.locator('.source-check.confirmed')).toHaveText('Accessible');await expect(ui.getByRole('combobox').locator('option')).toHaveText(['404p · H.264','180p · H.264']);await ui.getByRole('combobox').selectOption({label:'180p · H.264'});await ui.screenshot({path:`${evidence}/source.png`});await ui.locator('.media-controls .primary').click();
 await expect.poll(async()=>(await state()).tasks[0]?.state,{timeout:25000}).toBe('completed');const task=(await state()).tasks[0],download=await ui.evaluate(async id=>(await chrome.downloads.search({id}))[0],task.downloadId);
 expect(task.saved).toBe(true);expect(task.media.title).toBe(tiktokTitle);expect(task.title).toBe('Cours TikTok _ clip original 🌴');expect(download.exists).toBe(true);expect(download.filename).toMatch(/Alcydeo\/Cours TikTok _ clip original 🌴\.mp4$/);expect((await readFile(download.filename)).equals(low)).toBe(true);expect(task.validation.bytes).toBe(low.length);expect(task.validation.duration).toBeGreaterThan(5.9);expect(task.validation.tracks.map((track:any)=>track.type).sort()).toEqual(['audio','video']);expect(calls.filter(call=>!call.range).map(call=>call.url)).toEqual([tiktokUrl('low')]);expect(calls.every(call=>call.origin==='https://www.tiktok.com'&&call.referrer==='https://www.tiktok.com/')).toBe(true);expect(JSON.stringify(await state())).not.toContain('original-fixture-author-not-retained');expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(1);await expect(ui.locator('.popup-task').getByRole('button',{name:'Show in folder',exact:true})).toBeVisible();await ui.screenshot({path:`${evidence}/saved.png`});
});
test('SPA navigation rejects stale player props and discovers only the new exact post after playing',async()=>{
 await open();await ready();const nextId='7604511060657278231',nextTitle='Next original player clip';await source.evaluate(id=>history.pushState({},'','/@original/video/'+id),nextId);await scan();await expect.poll(async()=>(await state()).media.length).toBe(0);expect(await ui.evaluate(id=>chrome.action.getBadgeText({tabId:id}),tabId)).toBe('');
 await source.evaluate(item=>(window as any).__setPlayerItem(item),{...tiktokItem(high.length,low.length),id:nextId,desc:nextTitle});await ready(nextId,nextTitle);expect((await state()).media.map((media:any)=>media.providerId)).toEqual(['tiktok:'+nextId]);expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);
});
test('an exact native JSON refusal suppresses accessible player props without source requests',async()=>{
 mode='refused';await open();await scan();expect((await state()).media).toEqual([]);expect(await ui.evaluate(id=>chrome.action.getBadgeText({tabId:id}),tabId)).toBe('');expect(calls).toEqual([]);await source.evaluate(()=>document.getElementById('original')!.dispatchEvent(new Event('playing')));await scan();expect((await state()).media).toEqual([]);expect(calls).toEqual([]);expect(await source.evaluate(()=>(window as any).__getterReads)).toBe(0);
});
test('a provider blacklist prevents player-state proposals and all source sampling',async()=>{
 await ui.evaluate(async()=>{const{data}=await chrome.runtime.sendMessage({type:'snapshot'});await chrome.runtime.sendMessage({type:'settings',value:{...data.settings,blocked:['tiktok.com']}});});await open();await scan();expect((await state()).media).toEqual([]);expect(calls).toEqual([]);expect(await ui.evaluate(id=>chrome.action.getBadgeText({tabId:id}),tabId)).toBe('');expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);
});
test('invalid player CDN hosts are rejected and later valid props become detectable on playing',async()=>{
 mode='invalid';await open();await scan();expect((await state()).media).toEqual([]);expect(calls).toEqual([]);expect(await source.evaluate(()=>(window as any).__getterReads)).toBe(0);await source.evaluate(item=>(window as any).__setPlayerItem(item),tiktokItem(high.length,low.length));await ready();expect(calls.every(call=>call.url.startsWith('https://v16-webapp-prime.tiktok.com/'))).toBe(true);expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);
});
