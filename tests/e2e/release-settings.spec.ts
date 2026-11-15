import{test,expect,chromium,type BrowserContext}from'@playwright/test';
import{resolve}from'node:path';import{readFile,mkdir}from'node:fs/promises';
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8'));
let context:BrowserContext;
test.afterEach(async()=>{await context?.close();});
async function open(){
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');
 context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,locale:'en',env:{...process.env,LANG:'C.UTF-8',LC_ALL:'C.UTF-8'},args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--lang=en','--no-sandbox','--test-type']});
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker'),base=`chrome-extension://${new URL(worker.url()).host}`;
 const source=await context.newPage();await source.goto('http://127.0.0.1:4179/empty.html?diagnostic_secret=original-fixture-only');
 const id=await worker.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url)!.id!,source.url());
 const popup=await context.newPage();await popup.setViewportSize({width:525,height:600});await popup.goto(base+'/popup.html?tabId='+id);
 const manager=await context.newPage();await manager.goto(base+'/manager.html#settings');
 return{worker,popup,manager,id};
}
test('fresh settings use four files and four-part transfers while diagnostics live only in the manager',async()=>{
 const{popup,manager,id}=await open(),c=catalogs.en;
 await expect(popup.locator('.detection-diagnostics,[data-detection-diagnostics]')).toHaveCount(0);
 await expect(manager.getByRole('combobox',{name:c.concurrentFiles,exact:true})).toHaveValue('4');
 await expect(manager.getByRole('checkbox',{name:c.multipartEnable,exact:true})).toBeChecked();
 await expect(manager.getByRole('combobox',{name:c.multipartConnections,exact:true})).toHaveValue('4');
 const diagnostics=manager.locator('[data-detection-diagnostics]');await diagnostics.getByRole('combobox',{name:c.detectionDiagnosticsPage,exact:true}).selectOption(String(id));
 await diagnostics.getByRole('button',{name:c.detectionDiagnostics,exact:true}).click();
 const report=diagnostics.getByRole('textbox',{name:c.detectionDiagnosticsReport,exact:true});await expect(report).not.toHaveValue('');
 const raw=await report.inputValue();expect(()=>JSON.parse(raw)).not.toThrow();
 for(const value of['diagnostic_secret','original-fixture-only','127.0.0.1','http://'])expect(raw).not.toContain(value);
 await expect(diagnostics.getByRole('button',{name:c.detectionDiagnosticsCopy,exact:true})).toBeVisible();
 await mkdir('artifacts/evidence/release100',{recursive:true});await popup.screenshot({path:'artifacts/evidence/release100/popup-empty-en.png',animations:'disabled'});await manager.screenshot({path:'artifacts/evidence/release100/manager-settings-en.png',fullPage:true,animations:'disabled'});
});
test('explicit settings remain selected after reopening and reset restores the requested defaults',async()=>{
 const{manager}=await open(),c=catalogs.en;
 await manager.getByRole('combobox',{name:c.concurrentFiles,exact:true}).selectOption('2');
 await manager.getByRole('checkbox',{name:c.multipartEnable,exact:true}).uncheck();
 await manager.getByRole('button',{name:c.save,exact:true}).click();
 await expect.poll(()=>manager.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.settings)).toMatchObject({maxConcurrentFiles:2,multipart:false});
 await manager.reload();await expect(manager.getByRole('combobox',{name:c.concurrentFiles,exact:true})).toHaveValue('2');await expect(manager.getByRole('checkbox',{name:c.multipartEnable,exact:true})).not.toBeChecked();
 await manager.getByRole('button',{name:c.reset,exact:true}).click();
 await expect.poll(()=>manager.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.settings)).toMatchObject({maxConcurrentFiles:4,multipart:true,connections:4});
});
test('the manager diagnostic selector and report stay usable in ten languages and RTL',async()=>{
 const{manager,id}=await open();
 for(const[locale,c]of Object.entries(catalogs)as[string,Record<string,string>][]){
  await manager.evaluate(async language=>chrome.storage.local.set({language}),locale);await expect(manager.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(locale)?'rtl':'ltr');
  await manager.setViewportSize({width:390,height:900});
  const diagnostics=manager.locator('[data-detection-diagnostics]');await diagnostics.getByRole('combobox',{name:c.detectionDiagnosticsPage,exact:true}).selectOption(String(id));
  const toggle=diagnostics.getByRole('button',{name:c.detectionDiagnostics,exact:true});if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
  await expect(diagnostics.getByRole('textbox',{name:c.detectionDiagnosticsReport,exact:true})).not.toHaveValue('');
  expect(await manager.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(['fr','ar'].includes(locale)){await mkdir('artifacts/evidence/release100',{recursive:true});await diagnostics.screenshot({path:`artifacts/evidence/release100/diagnostic-${locale}-narrow.png`,animations:'disabled'});}
 }
});
