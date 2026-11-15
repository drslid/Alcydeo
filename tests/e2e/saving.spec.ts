import {test,expect,chromium,type BrowserContext,type Page,type Worker} from '@playwright/test';
import {resolve} from 'node:path';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
let context:BrowserContext,ui:Page,sw:Worker,base:string,profile:string;
const nativeFolder=resolve('artifacts/evidence/saving-native-downloads');
test.describe.configure({mode:'serial'});
test.beforeAll(async()=>{
  profile=await mkdtemp(resolve(tmpdir(),'alcydeo-saving-'));await mkdir(resolve(profile,'Default'));await mkdir(nativeFolder,{recursive:true});await writeFile(resolve(profile,'Default/Preferences'),JSON.stringify({download:{default_directory:nativeFolder,prompt_for_download:false}}));
  const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--test-type']});
  sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;ui=await context.newPage();await ui.setViewportSize({width:525,height:600});await mkdir('artifacts/evidence',{recursive:true});await mkdir('artifacts/benchmarks',{recursive:true});
});
test.afterAll(async()=>{await context?.close();if(profile)await rm(profile,{recursive:true,force:true});});
async function popup(source:Page){const tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());await ui.goto(`${base}/popup.html?tabId=${tabId}`);await ui.bringToFront();await expect(ui.locator('.media-card').first()).toBeAttached();const sources=ui.locator('.popup-tabs button').first();if(await sources.count())await sources.click();return tabId;}

test('compact proposals truncate long titles, remove filename fields and show only actual thumbnails',async()=>{
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/compact.html');await expect.poll(()=>source.locator('video').evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThan(1);await popup(source);
  const cards=ui.locator('.media-card');await expect(cards).toHaveCount(6);await expect(cards.getByRole('textbox')).toHaveCount(0);await expect(cards.locator('.media-art')).toHaveCount(0);await expect(cards.locator('.media-thumbnail')).toHaveCount(1);expect(await cards.locator('.media-thumbnail').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  const metrics=await cards.evaluateAll(els=>{const limit=document.querySelector('main')!.getBoundingClientRect();return els.map(el=>{const r=el.getBoundingClientRect(),h=el.querySelector('h2')!;return{height:r.height,visible:r.bottom<=limit.bottom&&r.top>=limit.top,title:h.textContent,tooltip:h.getAttribute('title'),truncated:h.scrollWidth>h.clientWidth};});});
  expect(await ui.evaluate(()=>document.documentElement.scrollWidth)).toBe(525);
  await writeFile(`artifacts/benchmarks/compact-${process.env.ALCYDEO_COMPACT_REPORT??'0.1.9'}.json`,JSON.stringify(metrics,null,2));expect(metrics.every(m=>m.height<=112)).toBe(true);expect(metrics.filter(m=>m.visible).length).toBeGreaterThanOrEqual(2);expect(metrics[0]?.truncated).toBe(true);expect(metrics[0]?.tooltip).toBe(metrics[0]?.title);
  await ui.screenshot({path:'artifacts/evidence/popup-compact-light.png',animations:'disabled'});await ui.evaluate(()=>document.documentElement.dataset.theme='dark');await ui.screenshot({path:'artifacts/evidence/popup-compact-dark.png',animations:'disabled'});
  const first=cards.first();await first.getByRole('combobox').selectOption({label:'180p'});await first.getByRole('button',{name:'Preview',exact:true}).click();await expect.poll(()=>first.locator('video').evaluate((v:HTMLVideoElement)=>v.videoHeight)).toBe(180);await first.getByRole('button',{name:'Preview',exact:true}).click();await expect(first.locator('video')).toHaveCount(0);
});

test('save mode, Chrome folder shortcut and subfolder persist without a page filename editor',async()=>{
  await ui.goto(`${base}/manager.html#settings`);await ui.getByRole('radio',{name:'Show Save As for every download',exact:true}).check();await expect(ui.getByLabel('Download subfolder')).toHaveCount(0);await ui.getByRole('button',{name:'Save settings',exact:true}).click();await ui.reload();await expect(ui.getByRole('radio',{name:'Show Save As for every download',exact:true})).toBeChecked();
  // Old callers omitting the added field must preserve the stored preference.
  expect(await ui.evaluate(async()=>{const r=await chrome.runtime.sendMessage({type:'snapshot'}),value=r.data.settings;delete value.saveAs;await chrome.runtime.sendMessage({type:'settings',value});return(await chrome.runtime.sendMessage({type:'snapshot'})).data.settings.saveAs;})).toBe(true);
  expect(await ui.evaluate(async()=>{const r=await chrome.runtime.sendMessage({type:'snapshot'});return(await chrome.runtime.sendMessage({type:'settings',value:{...r.data.settings,saveAs:'yes'}})).ok;})).toBe(false);
  await ui.getByRole('radio',{name:'Save automatically',exact:true}).check();await ui.getByLabel('Download subfolder').fill('Courses/2026');await ui.getByRole('button',{name:'Save settings',exact:true}).click();await ui.reload();await expect(ui.getByLabel('Download subfolder')).toHaveValue('Courses/2026');await expect(ui.getByRole('radio',{name:'Save automatically',exact:true})).toBeChecked();
  const opened=context.waitForEvent('page');await ui.getByRole('button',{name:'Choose the main download folder',exact:true}).click();const chromeSettings=await opened;await expect.poll(()=>chromeSettings.url()).toBe('chrome://settings/downloads');await chromeSettings.close();await ui.screenshot({path:'artifacts/evidence/settings-saving.png',fullPage:true});
});

test('direct and assembled downloads pass both native save modes and use the chosen relative folder',async()=>{
  // Automatic mode uses Chrome's real profile directory without interception.
  // Headless Save As uses CDP; a Windows chooser cannot be proved here.
  const cdp=await context.browser()!.newBrowserCDPSession(),downloadPath=resolve('artifacts/evidence/saving-downloads');await mkdir(downloadPath,{recursive:true});
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/save-modes.html');
  await sw.evaluate(()=>{const download=chrome.downloads.download.bind(chrome.downloads);(chrome.downloads as any).download=async(options:chrome.downloads.DownloadOptions)=>{const key='save-options',old=(await chrome.storage.session.get(key))[key]??[];await chrome.storage.session.set({[key]:[...old,{...options,url:options.url.startsWith('blob:')?'blob:output':options.url}]});return download(options);};});
  for(const saveAs of [false,true]){
    await cdp.send('Browser.setDownloadBehavior',saveAs?{behavior:'allow',downloadPath,eventsEnabled:true}:{behavior:'default'});
    await ui.evaluate(async saveAs=>{const r=await chrome.runtime.sendMessage({type:'snapshot'});await chrome.runtime.sendMessage({type:'settings',value:{...r.data.settings,saveAs,folder:'Courses/2026'}});},saveAs);
    for(const [title,kind] of [['Save direct video','direct'],['Save segmented video','hls']]){
      await popup(source);const card=ui.locator('.media-card').filter({has:ui.getByRole('heading',{name:title,exact:true})});await expect(card.getByRole('button',{name:'Download',exact:true})).toBeEnabled();const previous=await ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.map((t:any)=>t.id));await card.getByRole('button',{name:'Download',exact:true}).click();
      await ui.evaluate(()=>chrome.runtime.sendMessage({type:'openManager'}));await expect.poll(()=>context.pages().some(p=>p.url().includes('manager.html'))).toBe(true);const manager=context.pages().find(p=>p.url().includes('manager.html'))!;await manager.waitForLoadState();await manager.bringToFront();
      // Record the real blob-download call at the extension page boundary.
      if(!(await manager.evaluate(()=>!!(window as any).__saveOptionsWrapped)))await manager.evaluate(()=>{const download=chrome.downloads.download.bind(chrome.downloads);(window as any).__saveOptionsWrapped=true;(chrome.downloads as any).download=async(options:chrome.downloads.DownloadOptions)=>{const key='save-options',old=(await chrome.storage.session.get(key))[key]??[];await chrome.storage.session.set({[key]:[...old,{...options,url:options.url.startsWith('blob:')?'blob:output':options.url}]});return download(options);};});
      let id='';await expect.poll(async()=>{const tasks=await manager.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks);const task=tasks.find((t:any)=>!previous.includes(t.id)&&t.title===title);id=task?.id??'';return task?.saved;},{timeout:20000}).toBe(true);
      const actual=await manager.evaluate(async id=>{const r=await chrome.runtime.sendMessage({type:'snapshot'}),task=r.data.tasks.find((t:any)=>t.id===id);return{task,item:(await chrome.downloads.search({id:task.downloadId}))[0],options:(await chrome.storage.session.get('save-options'))['save-options']};},id);
      expect(actual.task.destination).toEqual({saveAs,folder:'Courses/2026'});if(!saveAs)expect(actual.item.filename.replaceAll('\\','/')).toContain(`${nativeFolder}/Courses/2026/${title}`);expect(actual.options.at(-1)?.saveAs).toBe(saveAs);expect(actual.options.at(-1)?.filename).toBe(`Courses/2026/${title}.mp4`);if(kind==='direct')expect((await readFile(actual.item.filename)).equals(await readFile('fixtures/media/low.mp4'))).toBe(true);else expect(actual.task.validation.tracks).toHaveLength(2);
    }
  }
  const options=await ui.evaluate(async()=>(await chrome.storage.session.get('save-options'))['save-options']);await writeFile('docs/benchmarks/save-modes-0.1.9.json',JSON.stringify({platform:'Linux Chrome for Testing',automaticDirectoryVerifiedWithoutCDPOverride:true,headlessSaveAsWithCDPOverride:true,nativeWindowsDialogTested:false,calls:options},null,2));
});

test('a dismissed save request can retry a direct file and reuse an assembled output',async()=>{
  // Simulate only the chooser rejection; the transfer and retry remain real.
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/save-modes.html');const manager=context.pages().find(p=>p.url().includes('manager.html'))!;
  for(const kind of ['direct','hls']){
    const target=kind==='direct'?sw:manager;
    await target.evaluate(()=>{const download=chrome.downloads.download.bind(chrome.downloads);(chrome.downloads as any).download=()=>{(chrome.downloads as any).download=download;return Promise.reject(new Error('Simulated dismissed save chooser'));};});
    const title=kind==='direct'?'Save direct video':'Save segmented video';await popup(source);const previous=await ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.map((t:any)=>t.id));const card=ui.locator('.media-card').filter({has:ui.getByRole('heading',{name:title,exact:true})});await expect(card.getByRole('button',{name:'Download',exact:true})).toBeEnabled();await card.getByRole('button',{name:'Download',exact:true}).click();await manager.bringToFront();
    let id='';await expect.poll(async()=>{const tasks=await manager.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks);const task=tasks.find((t:any)=>!previous.includes(t.id)&&t.title===title);id=task?.id??'';return task?.error;},{timeout:20000}).toBe('saveDialog');const task=manager.locator(`[data-task-id="${id}"]`);await expect(task).toHaveAttribute('data-state',kind==='direct'?'failed':'validating');
    const before=await manager.evaluate(async id=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.find((t:any)=>t.id===id),id);expect(before.downloadId).toBeUndefined();if(kind==='hls')expect(before.output).toBe('output.mp4');
    await task.getByRole('button',{name:kind==='direct'?'Resume':'Save file',exact:true}).click();await expect.poll(()=>manager.evaluate(async id=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.find((t:any)=>t.id===id)?.saved,id),{timeout:15000}).toBe(true);
    const after=await manager.evaluate(async id=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.find((t:any)=>t.id===id),id);expect(after.error).toBeUndefined();if(kind==='hls')expect(after.validation.checkedAt).toBe(before.validation.checkedAt);
  }
});
