import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{createServer,type Server}from'node:http';
import{resolve}from'node:path';
import{mkdir,mkdtemp,readFile,writeFile,rm}from'node:fs/promises';
import{tmpdir}from'node:os';

const evidence='artifacts/evidence/confirmed-sources50',title='Cours original de capture',original=await readFile('fixtures/media/low.mp4');
const candidates=['html-mime','html-body','tiny','missing','timeout','unknown','refused','json','original'];
type Observation={phase:string;badge:string;pending?:boolean;media:{title:string;variants:{path:string;state?:string}[]}[]};
type RequestRecord={name:string;range?:string;started:number;finished?:number;status?:number;aborted?:boolean};
let context:BrowserContext,ui:Page,popup:Page|undefined,source:Page,base:string,profile:string,server:Server,site:string;
let releasePrefixes:()=>void,requests:RequestRecord[],observations:Observation[],active:number,maximum:number;
const timers=new Set<ReturnType<typeof setTimeout>>();
test.beforeEach(async()=>{
 await mkdir(evidence,{recursive:true});requests=[];observations=[];active=0;maximum=0;
 const gate=new Promise<void>(resolve=>{releasePrefixes=resolve;});
 server=createServer(async(req,res)=>{
  const name=new URL(req.url!,'http://fixture.invalid').pathname.slice(1).replace(/\.mp4$/,'');
  if(name==='lesson.html'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(`<!doctype html><meta charset="utf-8"><title>${title}</title><h1>Original local availability fixture</h1>${candidates.map(n=>`<p><a href="/${n}.mp4" title="${n==='original'?title:'Rejected original '+n}">${n}</a></p>`).join('')}`);return;
  }
  if(!candidates.includes(name)){res.writeHead(404);res.end();return;}
  const range=req.headers.range,record:RequestRecord={name,range,started:Date.now()};requests.push(record);active++;maximum=Math.max(maximum,active);
  res.once('close',()=>{active--;record.finished=Date.now();if(!res.writableFinished)record.aborted=true;});
  if(range)await gate;
  const delay=range?({ 'html-mime':160,'html-body':350,tiny:110,missing:260,timeout:10000,unknown:400,refused:180,json:270,original:550 }[name]??0):0;
  await new Promise<void>(resolve=>{const timer=setTimeout(()=>{timers.delete(timer);resolve();},delay);timers.add(timer);});
  if(res.destroyed)return;
  if(name==='missing'||name==='refused'){record.status=name==='missing'?404:403;res.writeHead(record.status,{'Content-Type':'text/plain'});res.end('Original local refusal');return;}
  let bytes=original,type='video/mp4';
  if(name.startsWith('html')){bytes=Buffer.from('<!doctype html><html><title>Original unavailable fixture</title></html>'+' '.repeat(20000));if(name==='html-mime')type='text/html';}
  else if(name==='tiny')bytes=original.subarray(0,128);
  else if(name==='json')bytes=Buffer.from('{"error":"Original fixture refusal"}'+' '.repeat(20000));
  else if(name==='unknown'){bytes=Buffer.alloc(20000,85);type='application/octet-stream';}
  const match=range?.match(/^bytes=(\d+)-(\d+)$/),start=Number(match?.[1]??0),end=Math.min(Number(match?.[2]??bytes.length-1),bytes.length-1),body=bytes.subarray(start,end+1);
  record.status=range?206:200;res.writeHead(record.status,{'Content-Type':type,'Content-Length':body.length,...(range?{'Content-Range':`bytes ${start}-${end}/${bytes.length}`}:{})});res.end(body);
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));site=`http://127.0.0.1:${(server.address()as{port:number}).port}`;
 profile=await mkdtemp(resolve(tmpdir(),'alcydeo-confirmed-sources-'));await mkdir(resolve(profile,'Default'));
 await writeFile(resolve(profile,'Default/Preferences'),JSON.stringify({download:{default_directory:resolve(evidence,'downloads',crypto.randomUUID()),prompt_for_download:false}}));
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');
 context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,headless:true,acceptDownloads:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
 const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;
 const cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});await cdp.detach();
 ui=await context.newPage();await ui.goto(base+'/manager.html');await ui.evaluate(async()=>{const{data}=await chrome.runtime.sendMessage({type:'snapshot'});await chrome.runtime.sendMessage({type:'settings',value:{...data.settings,saveAs:false,multipart:false,minSize:10000}});});
 source=await context.newPage();
});
test.afterEach(async({browserName},info)=>{
 await writeFile(`${evidence}/${info.status==='passed'?'result':'failure'}.json`,JSON.stringify({browserName,browser:context?.browser()?.version(),observations,requests,maximumSampleConcurrency:maximum},null,2)+'\n');
 releasePrefixes?.();await context?.close();for(const timer of timers)clearTimeout(timer);timers.clear();server?.closeAllConnections();if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));if(profile)await rm(profile,{recursive:true,force:true});popup=undefined;
});
async function observe(tabId:number,phase:string){
 const result=await ui.evaluate(async tabId=>({data:(await chrome.runtime.sendMessage({type:'snapshot',tabId})).data,badge:await chrome.action.getBadgeText({tabId})}),tabId);
 const observation:Observation={phase,badge:result.badge,pending:result.data.sourcePending,media:result.data.media.map((m:any)=>({title:m.title,variants:m.variants.map((v:any)=>({path:new URL(v.url).pathname,state:v.check?.state}))}))};observations.push(observation);return observation;
}
function onlyConfirmed(){expect(observations.every(o=>(!o.badge||o.badge==='1')&&o.media.length<=1&&o.media.every(m=>m.variants.length>0&&m.variants.every(v=>v.path==='/original.mp4'&&v.state==='ready'))),'No unconfirmed candidate may appear in the badge or public snapshot').toBe(true);}

test('nine observed candidates publish only the checked original, even before opening the popup',async()=>{
 await source.goto(site+'/lesson.html',{waitUntil:'domcontentloaded'});
 const tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url)!.id!,source.url());
 // Read the toolbar and public cache without invoking scan/checkSource from UI.
 // Prefix responses are held until the global checking state has been seen.
 for(let n=0;n<8;n++){await observe(tabId,'before-popup');await ui.waitForTimeout(30);}
 onlyConfirmed();expect(observations.at(-1)?.badge).toBe('');expect(observations.at(-1)?.media).toEqual([]);
 await expect.poll(async()=>(await observe(tabId,'background-pending')).pending).toBe(true);
 expect(requests.some(r=>r.range)).toBe(true);
 popup=await context.newPage();await popup.setViewportSize({width:525,height:600});await popup.goto(`${base}/popup.html?tabId=${tabId}`);
 const checking=popup.locator('.scan-status[role=status]');await expect(checking).toContainText('Checking');await expect(popup.locator('.media-card')).toHaveCount(0);await popup.screenshot({path:`${evidence}/checking.png`});
 // Completing the checks must not depend on leaving this popup open.
 await popup.close();popup=undefined;releasePrefixes();
 const stop=Date.now()+18000;let final:Observation|undefined;
 while(Date.now()<stop){final=await observe(tabId,'popup-closed');onlyConfirmed();if(final.pending===false&&new Set(requests.filter(r=>r.range).map(r=>r.name)).size===9)break;await ui.waitForTimeout(70);}
 expect(final?.pending).toBe(false);expect(final?.badge).toBe('1');expect(final?.media).toEqual([{title,variants:[{path:'/original.mp4',state:'ready'}]}]);
 expect(new Set(requests.filter(r=>r.range).map(r=>r.name)).size).toBe(9);expect(requests.filter(r=>r.range&&r.name!=='original').every(r=>r.range==='bytes=0-4095')).toBe(true);
 const originalRanges=requests.filter(r=>r.range&&r.name==='original');expect(originalRanges.filter(r=>r.range==='bytes=0-4095')).toHaveLength(1);const metadataRanges=originalRanges.filter(r=>r.range!=='bytes=0-4095');expect(metadataRanges.length).toBeLessThanOrEqual(4);expect(metadataRanges.reduce((sum,r)=>{const bounds=/^bytes=(\d+)-(\d+)$/.exec(r.range!)!;expect(bounds).toBeTruthy();const start=Number(bounds[1]),end=Number(bounds[2]);expect(end).toBeGreaterThanOrEqual(start);expect(end).toBeLessThan(original.length);return sum+end-start+1;},0)).toBeLessThanOrEqual(65536);
 expect(maximum).toBeLessThanOrEqual(2);expect(requests.find(r=>r.name==='timeout')?.aborted).toBe(true);
 popup=await context.newPage();await popup.setViewportSize({width:525,height:600});await popup.goto(`${base}/popup.html?tabId=${tabId}`);
 const card=popup.locator('.media-card');await expect(card).toHaveCount(1);await expect(card.getByRole('heading',{name:title,exact:true})).toBeVisible();await expect(card.locator('.source-check.confirmed')).toHaveText('Accessible');await expect(card.locator('.primary')).toBeEnabled();
 for(let n=0;n<8;n++){await observe(tabId,'popup-open');onlyConfirmed();expect(await card.count()).toBe(1);await popup.waitForTimeout(40);}
 expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);await popup.screenshot({path:`${evidence}/confirmed.png`});await card.getByRole('button',{name:'Download',exact:true}).click();
 await expect(popup.locator('.popup-task')).toHaveAttribute('data-state','completed',{timeout:15000});await expect(popup.locator('.popup-task progress')).toHaveAttribute('value','1');await expect(popup.getByRole('button',{name:'Show in folder',exact:true})).toBeVisible();await expect(popup.getByRole('button',{name:'Save file',exact:true})).toHaveCount(0);
 const result=await ui.evaluate(async()=>{const{data}=await chrome.runtime.sendMessage({type:'snapshot'}),downloads=await chrome.downloads.search({});return{task:data.tasks[0],downloads};});
 expect(result.downloads).toHaveLength(1);expect(result.task).toMatchObject({title,state:'completed',saved:true});expect(result.task.error).toBeUndefined();expect(result.downloads[0]).toMatchObject({state:'complete',exists:true});expect(result.downloads[0].filename).toMatch(/\/Alcydeo\/Cours original de capture\.mp4$/);expect((await readFile(result.downloads[0].filename)).equals(original)).toBe(true);
 expect(requests.filter(r=>!r.range).map(r=>r.name)).toEqual(['original']);await popup.screenshot({path:`${evidence}/saved.png`});
 await writeFile(`${evidence}/saved.json`,JSON.stringify({fixture:true,mediaServer:'localhost',build:await ui.evaluate(()=>chrome.runtime.getManifest().version),candidateCount:9,confirmedCount:1,badgeValues:[...new Set(observations.map(o=>o.badge))],unknownOrUncheckedPublicVariants:0,globalCheckingShown:true,popupClosedDuringChecks:true,maximumSampleConcurrency:maximum,saved:{title:result.task.title,bytes:original.length,exactBytes:true,state:result.task.state,downloadCount:1},hlsRegression:'Covered independently by hls-components.spec.ts; this case uses original direct-media fixtures.'},null,2)+'\n');
});
