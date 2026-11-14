import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';import{readFile,writeFile,mkdir}from'node:fs/promises';
let context:BrowserContext,ui:Page,base:string;
test.beforeEach(async()=>{
 const ext=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,headless:true,acceptDownloads:true,args:[`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox','--test-type']});
 const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;ui=await context.newPage();await ui.setViewportSize({width:525,height:600});await ui.goto(`${base}/manager.html`);
 const cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});await cdp.detach();
});
test.afterEach(async()=>context?.close());
async function open(source:Page){const tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());await ui.goto(`${base}/popup.html?tabId=${tabId}`);return tabId;}
async function output(){
 const manager=await expect.poll(()=>context.pages().find(p=>p.url().includes('manager.html'))?.url()).toBeTruthy().then(()=>context.pages().find(p=>p.url().includes('manager.html'))!);await manager.waitForLoadState();
 await expect(manager.locator('.task-card')).toHaveAttribute('data-state','completed',{timeout:20000});
 return manager.evaluate(async()=>{const task=(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks[0];return{task,item:(await chrome.downloads.search({id:task.downloadId}))[0]};});
}
test('VK slices become one DASH card; qualities are checked separately and the saved file contains both tracks',async()=>{
 const cdn='https://vk6-29.vkuser.net/',sig='keep%2Bsignature%2F',url=(kind:string)=>`${cdn}?sig=${sig}&kind=${kind}`,full:string[]=[];
 const track=async(n:number)=>Buffer.concat(await Promise.all([`fixtures/dash/init-stream${n}.mp4`,...[1,2,3].map(i=>`fixtures/dash/chunk-stream${n}-${String(i).padStart(5,'0')}.mp4`)].map(p=>readFile(p))));
 const video=await track(0),audio=await track(1);
 const xml=`<MPD mediaPresentationDuration="PT6S"><Period><AdaptationSet mimeType="video/mp4"><Representation id="bad" height="720"><BaseURL>?sig=${sig}&amp;kind=bad</BaseURL><SegmentBase indexRange="10-19"/></Representation><Representation id="good" height="404"><BaseURL>?sig=${sig}&amp;kind=video</BaseURL><SegmentBase indexRange="10-19"/></Representation></AdaptationSet><AdaptationSet mimeType="audio/mp4"><Representation id="audio"><BaseURL>?sig=${sig}&amp;kind=audio</BaseURL><SegmentBase indexRange="10-19"/></Representation></AdaptationSet></Period></MPD>`;
 await context.route(`${cdn}**`,async route=>{
  const request=route.request(),u=new URL(request.url());expect(u.searchParams.get('sig')).toBe('keep+signature/');expect([...u.searchParams.keys()].some(k=>k.startsWith('amp;'))).toBe(false);
  const kind=u.searchParams.get('kind');if(kind==='manifest'){await route.fulfill({contentType:'application/dash+xml',body:xml});return;}
  if(kind==='bad'&&!u.searchParams.has('bytes')){await route.fulfill({contentType:'text/html',body:'<!doctype html><title>Unavailable quality</title>'});return;}
  const bytes=kind==='audio'?audio:video,range=request.headers().range?.match(/^bytes=(\d+)-(\d+)$/)??u.searchParams.get('bytes')?.match(/^(\d+)-(\d+)$/);const start=Number(range?.[1]??0),end=Math.min(Number(range?.[2]??bytes.length-1),bytes.length-1);
  if(!range)full.push(kind!);await route.fulfill({status:request.headers().range?206:200,headers:{'Content-Type':kind==='audio'?'audio/mp4':'video/mp4','Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Access-Control-Allow-Origin':'*'},body:bytes.subarray(start,end+1)});
 });
 await context.route('https://vkvideo.ru/**',route=>route.request().url().includes('/mp3/')?route.fulfill({contentType:'audio/mpeg',body:Buffer.alloc(12000)}):route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><title>VK segmented lesson</title><script>window.lateSlice=()=>fetch('${url('video')}&bytes=2000-4000');(async()=>{await fetch('${url('video')}&bytes=0-1000');await fetch('${url('manifest')}');await Promise.all(['video','audio','bad'].map(kind=>fetch('${cdn}?sig=${sig}&kind='+kind+'&bytes=1001-1999')));await Promise.all([1,2,3].map(i=>fetch('/mp3/bb'+i+'.mp3')));})();</script>`}));
 const source=await context.newPage();await source.goto('https://vkvideo.ru/video-1_2');const tabId=await open(source);const card=ui.locator('.media-card');await expect(card).toHaveCount(1);await expect(card.locator('option')).toHaveText(['404p']);await expect(card.locator('.source-check')).toHaveText('Accessible');
 const checks=await ui.evaluate(async tabId=>(await chrome.storage.session.get(`tab:${tabId}`))[`tab:${tabId}`][0].variants,tabId);expect(checks.find((v:any)=>v.id==='bad').check).toMatchObject({state:'unavailable',error:'html'});expect(checks.find((v:any)=>v.id==='good').check.state).toBe('ready');expect(full).toEqual([]);
 await source.evaluate(()=>(window as any).lateSlice());await expect.poll(()=>ui.evaluate(tabId=>chrome.action.getBadgeText({tabId}),tabId)).toBe('1');await mkdir('artifacts/evidence',{recursive:true});await ui.screenshot({path:'artifacts/evidence/vk-segmented-popup.png'});
 await card.getByRole('button',{name:'Download',exact:true}).click();const {task,item}=await output();expect(task.saved).toBe(true);expect(task.validation.tracks).toHaveLength(2);expect(task.validation.tracks.map((t:any)=>t.codec)).toEqual(['avc','aac']);expect(task.validation.duration).toBeCloseTo(6,0);expect(item.state).toBe('complete');expect(full.sort()).toEqual(['audio','video']);expect(task.variant.id).toBe('good');expect(task.variant.url).toBe(url('manifest'));
 const bytes=await readFile(item.filename);expect(bytes.length).toBe(task.validation.bytes);await writeFile('artifacts/evidence/vk-segmented-fixture.mp4',bytes);
 // The persisted manifest resource inventory still rejects later slices after MV3 replacement.
 const cdp=await context.browser()!.newBrowserCDPSession(),targets=await cdp.send('Target.getTargets'),sw=targets.targetInfos.find(t=>t.type==='service_worker'&&t.url.startsWith(base));if(sw)await cdp.send('Target.closeTarget',{targetId:sw.targetId});await cdp.detach();await source.evaluate(()=>(window as any).lateSlice());await ui.goto(`${base}/popup.html?tabId=${tabId}`);await expect(ui.locator('.media-card')).toHaveCount(1);expect(await ui.evaluate(tabId=>chrome.action.getBadgeText({tabId}),tabId)).toBe('1');
});
test('DASH XML-escaped SegmentTemplate queries retain signatures and assemble every selected fragment',async()=>{
 const origin='http://127.0.0.1:4179',requests:string[]=[];let xml=await readFile('fixtures/dash/manifest.mpd','utf8');xml=xml.replace(/initialization="([^"]+)"/g,'initialization="$1?signature=a%2Bb&amp;track=native"').replace(/media="([^"]+)"/g,'media="$1?signature=a%2Bb&amp;track=native"');
 await context.route(`${origin}/dash/manifest.mpd?escaped=43`,r=>r.fulfill({contentType:'application/dash+xml',body:xml}));
 await context.route(`${origin}/dash/*.mp4?**`,async route=>{const u=new URL(route.request().url());expect(u.search).toBe('?signature=a%2Bb&track=native');requests.push(u.pathname);await route.continue();});
 await context.route(`${origin}/dash-escaped43.html`,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Signed DASH lesson</title><a href="/dash/manifest.mpd?escaped=43">Signed DASH lesson</a>'}));
 const source=await context.newPage();await source.goto(`${origin}/dash-escaped43.html`);await open(source);const card=ui.locator('.media-card');await expect(card.locator('option')).toHaveText(['404p']);await expect(card.locator('.source-check')).toHaveText('Accessible');await card.getByRole('button',{name:'Download',exact:true}).click();const{task}=await output();expect(task.validation.tracks).toHaveLength(2);expect(task.saved).toBe(true);
 expect(new Set(requests)).toEqual(new Set([0,1].flatMap(n=>[`/dash/init-stream${n}.mp4`,...[1,2,3].map(i=>`/dash/chunk-stream${n}-${String(i).padStart(5,'0')}.mp4`)])));
});
