import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';
import{tmpdir}from'node:os';
import{mkdtemp,rm,readFile}from'node:fs/promises';
import{historyTask,seedHistory}from'./history-fixture';

const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')),c=catalogs.en;
let context:BrowserContext,sender:Page,base:string,directory:string;
test.beforeEach(async()=>{
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??process.env.ALCYDEO_TEST_EXTENSION??'apps/extension/.output/chrome-mv3');
 directory=await mkdtemp(resolve(tmpdir(),'alcydeo-cast-activation-'));
 context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 await context.route('https://**/*',route=>route.abort());
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(worker.url()).host}`;
 sender=await context.newPage();await sender.goto(base+'/manager.html#library');
});
test.afterEach(async()=>{await context?.close();await rm(directory,{recursive:true,force:true});});

async function messageButton(token:string){
 await sender.evaluate(token=>{const button=document.createElement('button');button.id='cast-activation-start';button.textContent='Start controlled Cast shortcut';button.onclick=()=>{void chrome.runtime.sendMessage({type:'alcydeo.quickCast',token}).then(result=>{(window as any).__activationReply=result;});};document.body.append(button);},token);
 // Install one in-page observer before the click. Repeated CDP evaluations
 // during this wait can themselves carry a user gesture in Playwright.
 const reply=sender.waitForFunction(()=>(window as any).__activationReply!==undefined,undefined,{timeout:12000});
 await sender.locator('#cast-activation-start').click();await reply;
 return sender.evaluate(()=>(window as any).__activationReply);
}

async function sourceController(delay:number){
 const snapshot=await sender.evaluate(()=>chrome.runtime.sendMessage({type:'snapshot',tabId:-1}));
 const media={id:'cast-activation-fixture',tabId:123,pageUrl:'http://127.0.0.1:4179/tv/index.html',title:'Original Cast activation fixture',url:'http://127.0.0.1:4179/tv/long.mp4',kind:'direct',variants:[{id:'original',url:'http://127.0.0.1:4179/tv/long.mp4',label:'180p'}]};
 await context.addInitScript(({delay,snapshot,media})=>{
  if(!new URLSearchParams(location.search).has('castToken'))return;
  const probe=(window as any).__activation={messages:[]as boolean[],starts:[]as boolean[],checks:0,errors:[]as string[],preparedAfterMessageMs:0};
  let receivedAt=0,release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  chrome.runtime.onMessage.addListener(message=>{if(message?.type==='alcydeo.quickCast'){probe.messages.push(navigator.userActivation.isActive);if(!receivedAt){receivedAt=performance.now();setTimeout(release,delay);}}return false;});
  const send=chrome.runtime.sendMessage.bind(chrome.runtime);
  chrome.runtime.sendMessage=((message:any,...args:any[])=>{
   if(message?.type==='snapshot')return Promise.resolve({...snapshot,data:{...snapshot.data,media:[media]}});
   if(message?.type==='checkSource'){probe.checks++;return gate.then(()=>{probe.preparedAfterMessageMs=performance.now()-receivedAt;return{ok:true,data:{state:'ready',checkedAt:Date.now(),contentType:'video/mp4'}};});}
   return(send as any)(message,...args);
  })as typeof chrome.runtime.sendMessage;
  const prototype=(window as any).PresentationRequest.prototype,start=prototype.start;
  prototype.start=function(){probe.starts.push(navigator.userActivation.isActive);return start.call(this).catch((error:DOMException)=>{probe.errors.push(error.name);throw error;});};
 },{delay,snapshot,media});
 const token=crypto.randomUUID(),page=await context.newPage();await page.goto(`${base}/manager.html?castToken=${token}&sourceTabId=123&mediaId=${media.id}&variantId=original#tv`);
 await page.waitForFunction(()=>(window as any).__activation.checks===1);return{page,token};
}

test('a fast source preparation preserves activation for the real native request',async()=>{
 const{page,token}=await sourceController(100);expect(await messageButton(token)).toEqual({started:true});
 await expect.poll(()=>page.evaluate(()=>(window as any).__activation.starts)).toEqual([true]);expect(await page.evaluate(()=>(window as any).__activation.messages)).toEqual([true]);
});

test('source preparation that outlives activation returns setup without a native request; a manual click stays usable',async()=>{
 const{page,token}=await sourceController(6600),reply=await messageButton(token);
 await test.info().attach('native-activation',{body:JSON.stringify(await page.evaluate(()=>(window as any).__activation)),contentType:'application/json'});expect(reply).toEqual({setup:true});
 const elapsed=await page.evaluate(()=>(window as any).__activation.preparedAfterMessageMs);test.info().annotations.push({type:'message-to-prepared-ms',description:String(elapsed)});expect(elapsed).toBeGreaterThanOrEqual(6500);
 expect(await page.evaluate(()=>(window as any).__activation.messages)).toEqual([true]);expect(await page.evaluate(()=>(window as any).__activation.starts)).toEqual([]);
 await expect(page.locator('.tv-panel [role="alert"]')).toHaveCount(0);const button=page.getByRole('button',{name:c.castVideo,exact:true});await expect(button).toBeEnabled();await button.click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__activation.starts)).toEqual([true]);
});

test('a file metadata wait rechecks activation before prompting and keeps the prepared player available',async()=>{
 const driver=await context.browser()!.newBrowserCDPSession();await driver.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:directory,eventsEnabled:true});
 const downloadId=await sender.evaluate(()=>chrome.downloads.download({url:'http://127.0.0.1:4179/tv/long.mp4',filename:'Original cast fixture.mp4',saveAs:false}));
 await expect.poll(()=>sender.evaluate(async id=>(await chrome.downloads.search({id}))[0]?.state,downloadId)).toBe('complete');
 await sender.evaluate(()=>{const button=document.createElement('button');button.id='cast-activation-file-access';button.textContent='Grant fixture file access';button.onclick=()=>{void chrome.permissions.request({origins:['file:///*']}).then(value=>{(window as any).__fileAccess=value;});};document.body.append(button);});
 await sender.locator('#cast-activation-file-access').click();await expect.poll(()=>sender.evaluate(()=>(window as any).__fileAccess)).toBe(true);
 const task=historyTask('Original cast fixture',{downloadId});await seedHistory(sender,[task]);
 await context.addInitScript(({downloadId})=>{
  if(!new URLSearchParams(location.search).has('castToken'))return;
  const probe=(window as any).__activation={messages:[]as boolean[],starts:[]as boolean[],searches:0,preparedAfterMessageMs:0};
  let receivedAt=0,release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  chrome.runtime.onMessage.addListener(message=>{if(message?.type==='alcydeo.quickCast'){probe.messages.push(navigator.userActivation.isActive);if(!receivedAt){receivedAt=performance.now();setTimeout(release,6600);}}return false;});
  const search=chrome.downloads.search.bind(chrome.downloads);chrome.downloads.search=(async query=>{if(query.id===downloadId){probe.searches++;await gate;}return search(query);})as typeof chrome.downloads.search;
  const get=chrome.storage.session.get.bind(chrome.storage.session);chrome.storage.session.get=(async keys=>{if(keys==='capture-status'){await gate;await new Promise<void>(resolve=>{const ready=()=>{const player=document.querySelector<HTMLVideoElement>('.local-tv video');if(player&&player.readyState>=1){probe.preparedAfterMessageMs=performance.now()-receivedAt;resolve();}else setTimeout(ready,20);};ready();});}return get(keys);})as typeof chrome.storage.session.get;
  const prototype=Object.getPrototypeOf(document.createElement('video').remote),prompt=prototype.prompt;prototype.prompt=function(){probe.starts.push(navigator.userActivation.isActive);return prompt.call(this);};
 },{downloadId});
 const token=crypto.randomUUID(),page=await context.newPage();await page.goto(`${base}/manager.html?castToken=${token}&taskId=${task.id}#tv`);await page.waitForFunction(()=>(window as any).__activation.searches===1);
 const reply=await messageButton(token);await test.info().attach('native-activation',{body:JSON.stringify(await page.evaluate(()=>(window as any).__activation)),contentType:'application/json'});expect(reply).toEqual({setup:true});const elapsed=await page.evaluate(()=>(window as any).__activation.preparedAfterMessageMs);test.info().annotations.push({type:'message-to-prepared-ms',description:String(elapsed)});expect(elapsed).toBeGreaterThanOrEqual(6500);expect(await page.evaluate(()=>(window as any).__activation.messages)).toEqual([true]);expect(await page.evaluate(()=>(window as any).__activation.starts)).toEqual([]);
 const button=page.locator('.local-cast-button');await expect(button).toBeEnabled();await button.click();await expect.poll(()=>page.evaluate(()=>(window as any).__activation.starts)).toEqual([true]);
 expect(await page.evaluate(async()=>(await chrome.downloads.search({})).length)).toBe(1);
});
