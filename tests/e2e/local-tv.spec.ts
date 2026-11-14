import{test,expect,chromium,type Page}from'@playwright/test';
import{resolve}from'node:path';import{readFile,mkdir}from'node:fs/promises';
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')),out=process.env.ALCYDEO_CAST_EVIDENCE_DIR?resolve(process.env.ALCYDEO_CAST_EVIDENCE_DIR,'local-tv'):'artifacts/evidence/local-tv-0.1.29';
async function launch(locale='en'){
 const ext=resolve(process.env.ALCYDEO_TEST_EXTENSION??'apps/extension/.output/chrome-mv3'),context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,headless:true,locale:locale.replace('_','-'),args:[`--lang=${locale.replace('_','-')}`,`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox'],env:{...process.env,LANG:locale+'.UTF-8'}});
 await context.addInitScript(()=>{const g=window as any;g.__revoked=[];g.__presentations=0;const revoke=URL.revokeObjectURL.bind(URL);URL.revokeObjectURL=url=>{g.__revoked.push(url);revoke(url);};Object.defineProperty(window,'PresentationRequest',{value:class{constructor(){g.__presentations++;throw new Error('Local files must not be sent as URLs to the TV');}}});});
 const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker'),base=`chrome-extension://${new URL(sw.url()).host}`,page=await context.newPage();await page.goto(base+'/manager.html');return{context,page,base};
}
async function choose(page:Page,c:any,name='My course.mp4'){await page.getByLabel(c.tvFileChoose,{exact:true}).setInputFiles({name,mimeType:'video/mp4',buffer:await readFile('fixtures/media/low.mp4')});await expect(page.getByRole('button',{name:c.tvFileCastGuide,exact:true})).toBeEnabled();}
async function plays(page:Page){const player=page.locator('.local-tv video');await player.evaluate((v:HTMLVideoElement)=>v.play());await expect.poll(()=>player.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(0.1);return player;}
for(const locale of Object.keys(catalogs))test(`local file player decodes offline and guides Chrome tab casting in ${locale}`,async()=>{
 const c=catalogs[locale],{context,page}=await launch(locale);try{
  const requests:string[]=[];context.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.locator('.manager-tabs').getByRole('button',{name:c.tv,exact:true}).click();await choose(page,c);await plays(page);
  await expect(page.locator('.local-file-heading h4')).toHaveText('My course.mp4');await page.getByRole('button',{name:c.tvFileCastGuide,exact:true}).click();await expect(page.locator('.local-cast-guide')).toBeFocused();await expect(page.locator('.local-cast-guide li')).toHaveCount(3);
  expect(await page.evaluate(()=>(window as any).__presentations)).toBe(0);expect(requests).toEqual([]);await page.setViewportSize({width:1280,height:1000});await mkdir(out,{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${locale}-desktop.png`,fullPage:true,animations:'disabled'});
  if(locale==='fr'){await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.screenshot({path:`${out}/fr-dark.png`,fullPage:true,animations:'disabled'});await page.evaluate(()=>document.documentElement.dataset.theme='light');}
  await page.setViewportSize({width:390,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(locale)?'rtl':'ltr');await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${locale}-narrow.png`,fullPage:true,animations:'disabled'});
  const first=await page.locator('.local-tv video').getAttribute('src');await choose(page,c,'Replacement.mp4');expect(await page.evaluate(()=>(window as any).__revoked)).toContain(first);await page.locator('.manager-tabs').getByRole('button',{name:c.settings,exact:true}).click();expect(await page.evaluate(()=>(window as any).__revoked.length)).toBe(2);
 }finally{await context.close();}
});
async function seed(page:Page,retained:boolean){
 const bytes=[...await readFile('fixtures/media/low.mp4')];
 return page.evaluate(async({retained,bytes})=>{
  const id=crypto.randomUUID(),variant={id:'fixture',url:'https://unreachable.invalid/original.mp4',label:'720p'},media={id:'fixture',tabId:1,pageUrl:'https://unreachable.invalid',title:'My course',url:variant.url,kind:'direct',variants:[variant]},task={id,media,variant,title:'My course',saved:true,state:'completed',filename:'C:\\Downloads\\My course-converted.mp4',createdAt:Date.now(),updatedAt:Date.now(),bytes:bytes.length,progress:1,checkpoints:{},...(retained?{output:'output.mp4'}:{})};
  if(retained){const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(id,{create:true}),w=await(await dir.getFileHandle('output.mp4',{create:true})).createWritable();await w.write(new Uint8Array(bytes));await w.close();}
  await new Promise<void>((resolve,reject)=>{const r=indexedDB.open('alcydeo',1);r.onsuccess=()=>{const tx=r.result.transaction('tasks','readwrite');tx.objectStore('tasks').put(task);tx.oncomplete=()=>{r.result.close();resolve();};tx.onerror=()=>reject(tx.error);};r.onerror=()=>reject(r.error);});return id;
 },{retained,bytes});
}
for(const retained of [true,false])test(`the TV route opens ${retained?'retained output with real filename':'explicit picker for a native saved file'}`,async()=>{
 const c=catalogs.en,{context,page,base}=await launch();try{
  const id=await seed(page,retained);await page.goto(`${base}/manager.html?taskId=${id}#tv`);await expect(page.locator('.manager-tabs').getByRole('button',{name:c.tv,exact:true})).toHaveAttribute('aria-current','page');
  if(retained){await expect(page.locator('.local-file-heading h4')).toHaveText('My course-converted.mp4');await plays(page);}else{await expect(page.getByText(c.tvFileChooseSaved,{exact:false})).toContainText('My course-converted.mp4');await expect(page.locator('.local-tv video')).toHaveCount(0);await choose(page,c);await plays(page);}
 }finally{await context.close();}
});
test('missing retained output keeps an explicit disk picker available',async()=>{
 const c=catalogs.en,{context,page,base}=await launch();try{const id=await seed(page,true);await page.evaluate(async id=>(await navigator.storage.getDirectory()).removeEntry(id,{recursive:true}),id);await page.goto(`${base}/manager.html?taskId=${id}#tv`);await expect(page.getByRole('alert')).toHaveText(c.tvFileChooseAgain);await choose(page,c);await plays(page);}finally{await context.close();}
});
test('invalid and unreadable files fail visibly; cancelled selection keeps the current player',async()=>{
 const c=catalogs.en,{context,page,base}=await launch();try{
  await page.goto(base+'/manager.html#tv');const input=page.getByLabel(c.tvFileChoose,{exact:true});await input.setInputFiles({name:'page.htm',mimeType:'text/html',buffer:Buffer.from('<html>not a video</html>')});await expect(page.getByRole('alert')).toHaveText(c.tvFileInvalid);await expect(page.locator('.local-tv video')).toHaveCount(0);
  await input.setInputFiles({name:'bad.mp4',mimeType:'video/mp4',buffer:Buffer.from('<html>not a video</html>')});await expect(page.getByRole('alert')).toContainText(c.tvFileCodec);await expect(page.getByRole('button',{name:c.tvFileCastGuide,exact:true})).toBeEnabled();await choose(page,c);await plays(page);const url=await page.locator('.local-tv video').getAttribute('src');await input.setInputFiles([]);expect(await page.locator('.local-tv video').getAttribute('src')).toBe(url);
  await page.getByRole('button',{name:c.tvFileClose,exact:true}).click();await expect(page.locator('.local-tv video')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).__revoked)).toContain(url);
 }finally{await context.close();}
});
