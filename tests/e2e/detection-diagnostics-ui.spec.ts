import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';import{mkdir,readFile}from'node:fs/promises';
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8'))as Record<string,Record<string,string>>,evidence='artifacts/evidence/detection-diagnostics-ui53';
const report={version:'0.1.53-fixture',distribution:'local',pageType:'web',limitedReason:null,autoEnabled:true,minSize:10000,pageGranted:true,allSitesGranted:true,pageBlocked:false,rawMediaCount:1,eligibleCount:1,visibleCount:0,pending:false,budget:{checks:2,limit:32},sources:[{kind:'direct',state:'unknown',error:'network',sourceGranted:true}],tiktok:{probeStatus:'missing',frames:[]}};
let context:BrowserContext,ui:Page,source:Page,base:string,tabId:number;
test.beforeEach(async()=>{
 const ext=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,headless:true,args:[`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox','--test-type']});
 const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;
 source=await context.newPage();await source.goto('http://127.0.0.1:4179/empty.html?privateFixtureToken=NOT-FOR-REPORT');await source.evaluate(()=>document.title='PRIVATE VIDEO TITLE NOT FOR REPORT');
 tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());
 ui=await context.newPage();await ui.setViewportSize({width:525,height:600});
 await ui.addInitScript(report=>{
  const w=window as any;w.diagnosticRequests=0;w.diagnosticCopies=[];w.diagnosticReport=report;w.diagnosticMode='ready';w.diagnosticClipboard='native';w.diagnosticPending=false;w.diagnosticOpenedAccess=[];
  const send=chrome.runtime.sendMessage.bind(chrome.runtime);
  chrome.runtime.sendMessage=((...args:any[])=>{
   const message=args[0];
   if(message?.type==='detectionDiagnostics'){
    w.diagnosticRequests++;
    if(w.diagnosticMode==='fail')return Promise.resolve({ok:false,error:'PRIVATE ERROR https://private.invalid/video?signature=DO-NOT-EXPOSE'});
    if(w.diagnosticMode==='waiting')return new Promise(resolve=>{w.finishDiagnostic=()=>resolve({ok:true,data:w.diagnosticReport});});
    return Promise.resolve({ok:true,data:w.diagnosticReport});
   }
   const result=(send as any)(...args);
   return message?.type==='snapshot'?result.then((reply:any)=>{if(w.diagnosticPending){reply.data.sourcePending=true;reply.data.media=[];}return reply;}):result;
  })as typeof chrome.runtime.sendMessage;
  const copy=navigator.clipboard.writeText.bind(navigator.clipboard);
  Object.defineProperty(navigator.clipboard,'writeText',{value:(text:string)=>{w.diagnosticCopies.push(text);return w.diagnosticClipboard==='denied'?Promise.reject(new globalThis.DOMException('Fixture denial','NotAllowedError')):copy(text);}});
  const create=chrome.tabs.create.bind(chrome.tabs);
  chrome.tabs.create=((options:any)=>{if(options.url?.startsWith('chrome://extensions/')){w.diagnosticOpenedAccess.push(options.url);return Promise.resolve({id:-1});}return(create as any)(options);})as typeof chrome.tabs.create;
 },report);
 await mkdir(evidence,{recursive:true});
});
test.afterEach(async()=>{await context?.close();});
async function open(locale='en'){
 await ui.goto(base+'/popup.html?tabId='+tabId);await ui.evaluate(locale=>chrome.storage.local.set({language:locale}),locale);
 await expect(ui.getByRole('button',{name:catalogs[locale]!.detectionDiagnostics!,exact:true})).toBeVisible();
}
async function load(locale='en'){
 const c=catalogs[locale]!;await ui.getByRole('button',{name:c.detectionDiagnostics!,exact:true}).click();
 await expect(ui.getByRole('textbox',{name:c.detectionDiagnosticsReport!,exact:true})).toHaveValue(JSON.stringify(report,null,2));
}
for(const[locale,c]of Object.entries(catalogs))test(`local report stays compact, private and explicit in ${locale}`,async()=>{
 await open(locale);expect(await ui.evaluate(()=>(window as any).diagnosticRequests)).toBe(0);expect(await ui.evaluate(()=>(window as any).diagnosticCopies)).toEqual([]);
 await load(locale);expect(await ui.evaluate(()=>(window as any).diagnosticRequests)).toBe(1);
 const field=ui.getByRole('textbox',{name:c.detectionDiagnosticsReport!,exact:true});await expect(field).toHaveAttribute('readonly','');await expect(field).toHaveAttribute('dir','ltr');
 await expect(ui.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(locale)?'rtl':'ltr');
 const arrow=await ui.locator('.diagnostics-chevron').evaluate(el=>{const m=new globalThis.DOMMatrixReadOnly(window.getComputedStyle(el).transform);return{a:m.a,b:m.b,c:m.c,d:m.d};});expect(arrow.a).toBeCloseTo(0);expect(arrow.b).toBeCloseTo(-1);expect(arrow.c).toBeCloseTo(1);expect(arrow.d).toBeCloseTo(0);
 const text=await field.inputValue();expect(text).not.toContain('NOT-FOR-REPORT');expect(text).not.toContain('PRIVATE VIDEO TITLE');expect(text).not.toContain('signature');
 expect(await ui.evaluate(()=>(window as any).diagnosticCopies)).toEqual([]);
 const copy=ui.getByRole('button',{name:c.detectionDiagnosticsCopy!,exact:true});await expect(copy).toBeVisible();
 await expect.poll(()=>copy.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
 await expect(ui.getByText(c.detectionDiagnosticsPrivacy!,{exact:true})).toBeVisible();expect(await field.evaluate(el=>el.getBoundingClientRect().height)).toBeLessThanOrEqual(180);
 for(const theme of ['light','dark']){
  await ui.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await field.scrollIntoViewIfNeeded();
  expect(await ui.evaluate(()=>document.documentElement.scrollWidth)).toBe(525);
  expect(await ui.locator('.shell').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThanOrEqual(600);
  expect(await ui.locator('.popup-footer').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
  await ui.screenshot({path:`${evidence}/${locale}-${theme}.png`,animations:'disabled'});
 }
 await ui.getByRole('button',{name:c.detectionDiagnosticsRefresh!,exact:true}).click();await expect.poll(()=>ui.evaluate(()=>(window as any).diagnosticRequests)).toBe(2);
 expect(await ui.evaluate(()=>(window as any).diagnosticCopies)).toEqual([]);
});
test('a pending source scan keeps diagnostics reachable; loading and errors preserve a manual retry',async()=>{
 await open();await ui.evaluate(()=>{(window as any).diagnosticPending=true;(window as any).diagnosticMode='waiting';});
 await expect(ui.locator('.scan-status')).toBeVisible({timeout:5000});await ui.getByRole('button',{name:catalogs.en!.detectionDiagnostics!,exact:true}).click();
 await expect(ui.getByText(catalogs.en!.detectionDiagnosticsLoading!,{exact:true})).toBeVisible();await expect(ui.getByRole('button',{name:catalogs.en!.detectionDiagnosticsRefresh!,exact:true})).toBeDisabled();
 await ui.evaluate(()=>(window as any).finishDiagnostic());await expect(ui.locator('.diagnostics-panel textarea')).toBeVisible();
 await ui.evaluate(()=>(window as any).diagnosticMode='fail');await ui.getByRole('button',{name:catalogs.en!.detectionDiagnosticsRefresh!,exact:true}).click();
 await expect(ui.getByRole('alert')).toContainText(catalogs.en!.detectionDiagnosticsError!);expect(await ui.locator('.diagnostics-panel').innerText()).not.toContain('PRIVATE ERROR');
 expect(await ui.locator('.diagnostics-panel textarea').count()).toBe(0);await expect(ui.getByRole('button',{name:catalogs.en!.detectionDiagnosticsRefresh!,exact:true})).toBeEnabled();
});
test('Copy uses native clipboard only after the report is shown; denied access selects its text',async()=>{
 await open();await load();const button=ui.getByRole('button',{name:catalogs.en!.detectionDiagnosticsCopy!,exact:true});await button.click();
 await expect(ui.getByText(catalogs.en!.detectionDiagnosticsCopied!,{exact:true})).toBeVisible();expect(await ui.evaluate(()=>(window as any).diagnosticCopies)).toEqual([JSON.stringify(report,null,2)]);
 await ui.evaluate(()=>(window as any).diagnosticClipboard='denied');await button.click();await expect(ui.getByText(catalogs.en!.detectionDiagnosticsCopyHint!,{exact:true})).toBeVisible();
 expect(await ui.locator('.diagnostics-panel textarea').evaluate((el:HTMLTextAreaElement)=>document.activeElement===el&&el.selectionStart===0&&el.selectionEnd===el.value.length)).toBe(true);
});
test('only real page or source access restrictions offer Chrome settings on an explicit click',async()=>{
 await open();await load();const access=ui.getByRole('button',{name:catalogs.en!.chromeSiteAccess!,exact:true});await expect(access).toHaveCount(0);
 await ui.evaluate(()=>(window as any).diagnosticReport.sources[0].sourceGranted=false);await ui.getByRole('button',{name:catalogs.en!.detectionDiagnosticsRefresh!,exact:true}).click();
 await expect(access).toBeVisible();expect(await ui.evaluate(()=>(window as any).diagnosticOpenedAccess)).toEqual([]);await access.click();
 expect(await ui.evaluate(()=>(window as any).diagnosticOpenedAccess)).toEqual([base.replace('chrome-extension://','chrome://extensions/?id=')]);
 await ui.evaluate(()=>{(window as any).diagnosticReport.sources[0].sourceGranted=true;(window as any).diagnosticReport.pageGranted=false;});
 await ui.getByRole('button',{name:catalogs.en!.detectionDiagnosticsRefresh!,exact:true}).click();await expect(access).toBeVisible();
});
