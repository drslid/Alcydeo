import{test,expect,chromium,type BrowserContext}from'@playwright/test';
import{resolve}from'node:path';
import{mkdir,readFile}from'node:fs/promises';
import{historyTask,seedHistory}from'./history-fixture';
import type{Task}from'../../packages/contracts';
let context:BrowserContext;
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8'));
const sdk='https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
const stub=`window.__castRequests=0;window.chrome=window.chrome||{};window.chrome.cast={media:{DEFAULT_MEDIA_RECEIVER_APP_ID:'CC1AD845'},AutoJoinPolicy:{PAGE_SCOPED:'page'}};window.cast={framework:{CastContext:{getInstance:()=>({setOptions(){},getCurrentSession(){},addEventListener(){},requestSession(){window.__castRequests++;return Promise.reject('cancel');}})},RemotePlayer:class{},RemotePlayerController:class{addEventListener(){}},RemotePlayerEventType:{ANY_CHANGE:'change'},CastContextEventType:{SESSION_STATE_CHANGED:'session'},SessionState:{SESSION_STARTED:'started',SESSION_START_FAILED:'failed'}}};window.__onGCastApiAvailable(true);`;
test.afterEach(async()=>context?.close());
async function open(){
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??process.env.ALCYDEO_TEST_EXTENSION??'apps/extension/.output/chrome-mv3');
 context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker'),source=await context.newPage();await source.goto('http://127.0.0.1:4179/tv/index.html');
 const id=await worker.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url)!.id!,source.url()),popup=await context.newPage();await popup.goto(`chrome-extension://${new URL(worker.url()).host}/popup.html?tabId=${id}`);
 await expect(popup.locator('.media-card')).toHaveCount(1);await expect(popup.locator('.source-cast')).toBeEnabled();return{popup,id,base:`chrome-extension://${new URL(worker.url()).host}`};
}
async function savedOriginal(popup:import('@playwright/test').Page,id:number,base:string,extra:Partial<Task>={}){
 const media=await popup.evaluate(async tabId=>(await chrome.runtime.sendMessage({type:'snapshot',tabId})).data.media[0],id),variant=media.variants[0];
 const task=historyTask('Downloaded original fixture',{...extra,id:'cast-saved-original',media,variant,saved:true,state:'completed'});await seedHistory(popup,[task]);await popup.goto(base+'/manager.html#library');
 const card=popup.locator('[data-task-id="cast-saved-original"]');await expect(card).toBeVisible();return card;
}
test('the popup opens the official-SDK web player for a checked source without putting its URL in a server query',async()=>{
 const{popup}=await open();await popup.setViewportSize({width:525,height:600});const evidence=process.env.ALCYDEO_CAST_EVIDENCE_DIR??'.local/cloud-cast63/cast/evidence';await mkdir(evidence,{recursive:true});await popup.screenshot({path:`${evidence}/popup-source-light.png`,fullPage:true,animations:'disabled'});let sdkHash='not-checked';const serverQueries:string[]=[];
 context.on('request',request=>{const url=new URL(request.url());if(url.origin==='http://localhost:4180')serverQueries.push(url.search);});
 await context.route(sdk,async route=>{sdkHash=await route.request().frame().evaluate(()=>location.hash);await route.fulfill({contentType:'application/javascript',body:stub});});
 const opened=context.waitForEvent('page');await popup.locator('.source-cast').click();const player=await opened;await player.waitForLoadState('domcontentloaded');
 await expect(player).toHaveURL('http://localhost:4180/alcydeo/cast/');await expect(player.locator('#choose')).toBeEnabled();expect(sdkHash).toBe('');expect(serverQueries.every(query=>query==='')).toBe(true);
 await expect(player.locator('#player')).toHaveJSProperty('readyState',4);expect(await player.locator('#player').getAttribute('src')).toBe('http://127.0.0.1:4179/tv/long.mp4');expect(await player.evaluate(()=>(window as any).__castRequests)).toBe(0);
 await popup.close();await player.locator('#choose').click();expect(await player.evaluate(()=>(window as any).__castRequests)).toBe(1);await expect(player.locator('#error')).toBeHidden();await expect(player.locator('#diagnostic')).toBeHidden();await expect(player.locator('#choose')).toBeEnabled();await expect(player.locator('#source-page')).toHaveAttribute('href','http://127.0.0.1:4179/tv/index.html');
});
test('an old sender readiness protocol falls back to the persistent extension player and discloses no source to that web page',async()=>{
 const{popup}=await open();const requested:string[]=[];context.on('request',request=>{if(request.url().startsWith('http://localhost:4180'))requested.push(request.url());});
 await context.route('http://localhost:4180/alcydeo/cast/ready.json',route=>route.fulfill({contentType:'application/json',body:'{"app":"alcydeo-cast-web","protocol":1}'}));
 const opened=context.waitForEvent('page');await popup.locator('.source-cast').click();const player=await opened;await expect(player.locator('.tv-panel')).toBeVisible();expect(new URL(player.url()).protocol).toBe('chrome-extension:');expect(requested).toEqual(['http://localhost:4180/alcydeo/cast/ready.json']);
});
test('the library Cast button opens the checked source of an unchanged download without uploading or copying a file',async()=>{
 const{popup,id,base}=await open();const card=await savedOriginal(popup,id,base),methods:string[]=[];context.on('request',request=>methods.push(request.method()));
 await context.route(sdk,route=>route.fulfill({contentType:'application/javascript',body:stub}));
 const opened=context.waitForEvent('page');await card.locator('.task-header-actions').getByRole('button',{name:catalogs.en.castVideo,exact:true}).click();const player=await opened;await expect(player).toHaveURL('http://localhost:4180/alcydeo/cast/');await expect(player.locator('#choose')).toBeEnabled();await expect(player.locator('#source-kind')).toHaveText(catalogs.en.tvWebUsingOriginal);await expect(player.locator('#source-kind')).toBeVisible();
 expect(await player.locator('#player').getAttribute('src')).toBe('http://127.0.0.1:4179/tv/long.mp4');expect(await player.evaluate(()=>(window as any).__castRequests)).toBe(0);expect(await popup.evaluate(()=>chrome.downloads.search({}))).toEqual([]);expect(methods.some(method=>['POST','PUT','PATCH'].includes(method))).toBe(false);
 const evidence=process.env.ALCYDEO_CAST_EVIDENCE_DIR??'.local/player65/evidence';await mkdir(evidence,{recursive:true});await player.screenshot({path:`${evidence}/library-original-web.png`,fullPage:true,animations:'disabled'});
});
test('a transformed library result opens its local player without silently casting the original or triggering a native prompt',async()=>{
 const{popup,id,base}=await open();await context.addInitScript(()=>{const prototype=Object.getPrototypeOf(document.createElement('video').remote);prototype.prompt=function(){(window as any).__nativePrompts=((window as any).__nativePrompts??0)+1;return Promise.reject(new DOMException('Controlled fixture','NotFoundError'));};});
 const card=await savedOriginal(popup,id,base,{conversion:{input:'input.original',inputBytes:100,ready:true,sourceTaskId:'original',operation:{kind:'trim',start:0,end:1}}}),webRequests:string[]=[],methods:string[]=[];
 context.on('request',request=>{if(request.url().startsWith('http://localhost:4180/alcydeo/cast/'))webRequests.push(request.url());methods.push(request.method());});
 const opened=context.waitForEvent('page');await card.locator('.task-header-actions').getByRole('button',{name:catalogs.en.castVideo,exact:true}).click();const player=await opened;await expect(player.locator('.local-tv')).toBeVisible();expect(new URL(player.url()).protocol).toBe('chrome-extension:');expect(new URL(player.url()).searchParams.get('taskId')).toBe('cast-saved-original');expect(await player.evaluate(()=>(window as any).__nativePrompts??0)).toBe(0);expect(await player.evaluate(async()=>(await chrome.tabs.getCurrent())!.active)).toBe(true);expect(await player.evaluate(()=>chrome.downloads.search({}))).toEqual([]);expect(webRequests).toEqual([]);expect(methods.some(method=>['POST','PUT','PATCH'].includes(method))).toBe(false);
});
