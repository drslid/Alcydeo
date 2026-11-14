import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{createServer,type Server}from'node:http';
import{resolve}from'node:path';
import{mkdir,mkdtemp,readFile,writeFile,rm}from'node:fs/promises';
import{tmpdir}from'node:os';

const evidence='artifacts/evidence/confirmed-navigation50',original=await readFile('fixtures/media/low.mp4'),unknown=Buffer.alloc(20000,85),title='Nouveau cours original';
let context:BrowserContext,ui:Page,source:Page,base:string,profile:string,server:Server,site:string,tabId:number;
let requests:{path:string;range?:string}[],phases:{phase:string;badge:string;pending?:boolean;visible:number;raw:{url:string;checks:(string|undefined)[]}[]}[];
test.beforeEach(async()=>{
 await mkdir(evidence,{recursive:true});requests=[];phases=[];
 server=createServer((req,res)=>{
  const path=new URL(req.url!,'http://fixture.invalid').pathname;
  if(path==='/page-a.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><meta charset="utf-8"><title>Original SPA availability laboratory</title><h1>First page</h1>'+Array.from({length:32},(_,i)=>`<p><a href="/unknown-${i}.mp4" title="Original unconfirmed fixture ${i}">Candidate ${i}</a></p>`).join(''));return;}
  if(path==='/page-native.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(`<!doctype html><meta charset="utf-8"><title>${title}</title><video controls preload="metadata" src="/new-original.mp4" title="${title}"></video><p><a href="/never.m3u8" title="Original unavailable manifest">Unresponsive original fixture</a></p>`);return;}
  if(path==='/never.m3u8'){requests.push({path,range:req.headers.range});return;}
  if(!/^\/unknown-\d+\.mp4$/.test(path)&&path!=='/new-original.mp4'){res.writeHead(404);res.end();return;}
  const range=req.headers.range;requests.push({path,range});const bytes=path==='/new-original.mp4'?original:unknown,match=range?.match(/^bytes=(\d+)-(\d*)$/),start=Number(match?.[1]??0),end=Math.min(Number(match?.[2]||bytes.length-1),bytes.length-1),body=bytes.subarray(start,end+1);
  res.writeHead(range?206:200,{'Content-Type':path==='/new-original.mp4'?'video/mp4':'application/octet-stream','Content-Length':body.length,...(range?{'Content-Range':`bytes ${start}-${end}/${bytes.length}`}:{})});res.end(body);
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));site=`http://127.0.0.1:${(server.address()as{port:number}).port}`;
 profile=await mkdtemp(resolve(tmpdir(),'alcydeo-confirmed-navigation-'));
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,headless:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;ui=await context.newPage();await ui.goto(base+'/manager.html');source=await context.newPage();
});
test.afterEach(async({browserName},info)=>{
 const scenario=info.title.startsWith('a new SPA')?'spa-budget':'native-timeout';await writeFile(`${evidence}/${scenario}-${info.status==='passed'?'result':'failure'}.json`,JSON.stringify({browserName,browser:context?.browser()?.version(),requests,phases},null,2)+'\n');await context?.close();server?.closeAllConnections();if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));if(profile)await rm(profile,{recursive:true,force:true});
});
async function state(phase:string){
 const snapshot=await ui.evaluate(async tabId=>({data:(await chrome.runtime.sendMessage({type:'snapshot',tabId})).data,badge:await chrome.action.getBadgeText({tabId}),raw:(await chrome.storage.session.get(`tab:${tabId}`))[`tab:${tabId}`]??[]}),tabId);
 phases.push({phase,badge:snapshot.badge,pending:snapshot.data.sourcePending,visible:snapshot.data.media.length,raw:snapshot.raw.map((m:any)=>({url:new URL(m.url).pathname,checks:m.variants.map((v:any)=>v.check?.state)}))});return snapshot;
}

test('a new SPA page receives its own bounded source checks after the previous page used all32',async()=>{
 await source.goto(site+'/page-a.html',{waitUntil:'domcontentloaded'});tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url)!.id!,source.url());
 await expect.poll(async()=>{const s=await state('first-page');return s.data.sourcePending===false&&s.raw.length===32&&s.raw.every((m:any)=>m.variants.every((v:any)=>v.check?.state==='unknown'));},{timeout:15000}).toBe(true);
 const first=await state('budget-used');expect(first.data.media).toEqual([]);expect(first.badge).toBe('');expect(new Set(requests.map(r=>r.path)).size).toBe(32);expect(requests.every(r=>r.range==='bytes=0-4095')).toBe(true);
 // Normal same-origin SPA transition, with a different page URL and exact new
 // DOM source. No full navigation, worker restart, popup or forced rescan.
 await source.evaluate(({title})=>{document.title=title;document.body.replaceChildren();const link=document.createElement('a');link.href='/new-original.mp4';link.textContent=title;link.title=title;document.body.append(link);history.pushState({},'','/page-b.html');},{title});
 await expect.poll(async()=>{const s=await state('second-page');return s.badge==='1'&&s.data.media.length===1&&s.data.media[0].pageUrl.endsWith('/page-b.html')&&s.data.media[0].variants.every((v:any)=>v.check?.state==='ready');},{timeout:6500}).toBe(true);
 const second=await state('second-confirmed');expect(second.raw).toHaveLength(1);expect(second.data.media[0].title).toBe(title);expect(new URL(second.data.media[0].url).pathname).toBe('/new-original.mp4');expect(requests.some(r=>r.path==='/new-original.mp4'&&r.range==='bytes=0-4095')).toBe(true);expect(requests.every(r=>!!r.range)).toBe(true);
 const popup=await context.newPage();await popup.setViewportSize({width:525,height:600});await popup.goto(`${base}/popup.html?tabId=${tabId}`);await expect(popup.locator('.media-card')).toHaveCount(1);await expect(popup.locator('.media-info h2')).toHaveText(title);await expect(popup.locator('.source-check.confirmed')).toHaveText('Accessible');await popup.screenshot({path:`${evidence}/second-page.png`});expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);
});

test('native media stays available while one unresponsive manifest reaches its finite checking deadline',async()=>{
 const started=Date.now();await source.goto(site+'/page-native.html',{waitUntil:'domcontentloaded'});tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url)!.id!,source.url());
 await expect.poll(()=>source.locator('video').evaluate((video:HTMLVideoElement)=>({width:video.videoWidth,height:video.videoHeight}))).toEqual({width:320,height:180});
 await expect.poll(async()=>{const s=await state('native-before-timeout');return s.badge==='1'&&s.data.media.length===1&&s.data.media[0].kind==='direct'&&s.data.media[0].variants.every((v:any)=>v.check?.state==='ready');},{timeout:4000}).toBe(true);
 expect(Date.now()-started).toBeLessThan(6000);await expect.poll(()=>requests.filter(r=>r.path==='/never.m3u8').length).toBe(1);
 const popup=await context.newPage();await popup.setViewportSize({width:525,height:600});await popup.goto(`${base}/popup.html?tabId=${tabId}`);await expect(popup.locator('.media-card')).toHaveCount(1);await expect(popup.locator('.media-info h2')).toHaveText(title);await expect(popup.locator('.source-check.confirmed')).toHaveText('Accessible');await expect(popup.locator('.media-controls .primary')).toBeEnabled();
 await expect.poll(async()=>(await state('manifest-deadline')).data.sourcePending,{timeout:12000}).toBe(false);
 const terminal=await state('manifest-finished');expect(terminal.data.media).toHaveLength(1);expect(terminal.data.media[0].kind).toBe('direct');expect(terminal.raw.find((m:any)=>m.kind==='hls')?.variants.some((v:any)=>v.check&&v.check.state!=='ready')).toBe(true);expect(requests.filter(r=>r.path==='/never.m3u8')).toHaveLength(1);
 await source.waitForTimeout(1100);await expect(popup.locator('.media-card')).toHaveCount(1);expect(requests.filter(r=>r.path==='/never.m3u8')).toHaveLength(1);expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);await popup.screenshot({path:`${evidence}/native-with-timed-out-manifest.png`});
});
