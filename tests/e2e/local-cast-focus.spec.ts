import{test,expect,chromium}from'@playwright/test';
import{resolve}from'node:path';
import{readFile,mkdtemp,rm}from'node:fs/promises';
import{tmpdir}from'node:os';
import{historyTask,seedHistory}from'./history-fixture';
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')),c=catalogs.en;

test('a file shortcut without a matching source opens its player and waits for an explicit native attempt; receiver result simulated',async()=>{
 const extension=resolve(process.env.ALCYDEO_TEST_EXTENSION??'apps/extension/.output/chrome-mv3'),directory=await mkdtemp(resolve(tmpdir(),'alcydeo-cast-focus-'));
 const context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 try{
  await context.addInitScript(()=>{const prototype=Object.getPrototypeOf(document.createElement('video').remote);prototype.prompt=function(){(window as any).__nativeCastPrompts=((window as any).__nativeCastPrompts??0)+1;return Promise.reject(new DOMException('Fixture has no receiver','NotFoundError'));};HTMLMediaElement.prototype.play=function(){return Promise.resolve();};});
  const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker'),base=`chrome-extension://${new URL(sw.url()).host}`,driver=await context.browser()!.newBrowserCDPSession();await driver.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:directory,eventsEnabled:true});
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/tv/index.html');
  const sourceId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url)!.id!,source.url());
  const setup=await context.newPage();await setup.goto(base+'/manager.html#tv');await setup.getByLabel(c.tvFileChoose,{exact:true}).setInputFiles(resolve('fixtures/tv/long.mp4'));await setup.locator('.local-cast-prepare').click();await expect(setup.locator('.local-cast-button')).toBeVisible();
  const item=await setup.evaluate(async()=>(await chrome.downloads.search({state:'complete',exists:true}))[0]!);expect(await readFile(item.filename)).toEqual(await readFile('fixtures/tv/long.mp4'));
  const task=historyTask('Original local Cast',{filename:item.filename,downloadId:item.id,bytes:item.fileSize});task.media.tabId=sourceId;task.media.pageUrl=source.url();task.media.url='http://127.0.0.1:4179/tv/long.mp4';task.variant.url=task.media.url;
  await seedHistory(setup,[task]);await setup.close();const popup=await context.newPage();await popup.goto(`${base}/popup.html?tabId=${sourceId}`);await expect(popup.locator('.popup-downloads')).toBeVisible();
  const next=context.waitForEvent('page');await popup.locator('.popup-downloads').getByRole('button',{name:c.castVideo,exact:true}).click();const controller=await next;await expect(controller.locator('.local-cast-button')).toBeEnabled();await expect(controller.locator('.local-tv [role="alert"]')).toHaveCount(0);expect(await controller.evaluate(()=>(window as any).__nativeCastPrompts??0)).toBe(0);await controller.locator('.local-cast-button').click();await expect(controller.locator('.local-tv [role="alert"]')).toHaveText(c.tvNoDevice);expect(await controller.evaluate(()=>(window as any).__nativeCastPrompts)).toBe(1);await expect.poll(()=>controller.evaluate(async()=>(await chrome.tabs.getCurrent())!.active)).toBe(true);expect(new URL(controller.url()).searchParams.get('taskId')).toBe(task.id);expect(await controller.evaluate(async()=>(await chrome.downloads.search({})).length)).toBe(1);
  await expect(controller.locator('.local-tv [data-local-cast-limits]')).toHaveText(c.tvFileReceiverLimit);await expect(controller.getByRole('button',{name:c.tvFileCastTabSteps,exact:true})).toBeEnabled();await expect(controller.locator('.local-cast-guide')).toBeFocused();
 }finally{await context.close();await rm(directory,{recursive:true,force:true});}
});

test('the file receiver limitation is localized in ten languages without claiming a hardware connection',async()=>{
 const extension=resolve(process.env.ALCYDEO_TEST_EXTENSION??'apps/extension/.output/chrome-mv3'),context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 try{
  const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker'),page=await context.newPage();await page.goto(`chrome-extension://${new URL(sw.url()).host}/manager.html#tv`);
  for(const[locale,messages]of Object.entries(catalogs)as[string,Record<string,string>][]){
   await page.evaluate(language=>chrome.storage.local.set({language}),locale);await expect(page.locator('[data-local-cast-limits]')).toHaveCount(1);await expect(page.locator('.local-tv [data-local-cast-limits]')).toHaveText(messages.tvFileReceiverLimit!);
   const guide=page.locator('.local-cast-guide-button');await expect(guide).toBeEnabled();await guide.click();await expect(guide).toHaveText(messages.tvFileCastTabSteps!);await expect(guide).toHaveAttribute('aria-expanded','true');await expect(page.locator('.local-cast-guide')).toBeFocused();await expect(page.locator('.local-cast-guide li')).toHaveCount(3);
   const details=page.locator('.tv-compatibility');await expect(details).not.toHaveAttribute('open','');await details.locator('summary').focus();await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');await expect(details).toContainText(messages.tvExperimental!);await expect(details).toContainText(messages[await page.evaluate(()=>/Windows/i.test(navigator.userAgent))?'tvAirplayWindows':'tvNoAirplay']!);await page.keyboard.press('Enter');await expect(details).not.toHaveAttribute('open','');
   await expect(page.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(locale)?'rtl':'ltr');await page.setViewportSize({width:390,height:950});await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  expect(await page.evaluate(()=>chrome.downloads.search({}))).toEqual([]);
  await expect(page.locator('.local-cast-button')).toHaveCount(0);await expect(page.locator('.local-tv video')).toHaveCount(0);
 }finally{await context.close();}
});
