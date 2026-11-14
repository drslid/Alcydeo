import {test,expect,chromium,type Page} from '@playwright/test';
import {resolve} from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {historyTask,seedHistory} from './history-fixture';
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')) as Record<string,Record<string,string>>;
const {version}=JSON.parse(await readFile('package.json','utf8'));
const output=`artifacts/evidence/popup-design-${version}`;
async function launch(){
 const ext=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');
 const context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,headless:true,args:[`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox','--test-type']});
 const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker'),base=`chrome-extension://${new URL(sw.url()).host}`,source=await context.newPage(),ui=await context.newPage();
 await ui.setViewportSize({width:525,height:600});await mkdir(output,{recursive:true});
 return{context,sw,base,source,ui};
}
async function inside(page:Page,selector:string){
 return page.locator(selector).evaluateAll(els=>els.filter(el=>!!(el as HTMLElement).offsetWidth).every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}));
}
for(const[locale,c] of Object.entries(catalogs))test(`popup hierarchy, scrolling, menus and real preview in ${locale}`,async()=>{
 const {context,sw,base,source,ui}=await launch();
 try{
  await sw.evaluate(locale=>chrome.storage.local.set({language:locale}),locale);
  await source.goto('http://127.0.0.1:4179/compact.html');
  const tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());
  await ui.goto(`${base}/popup.html?tabId=${tabId}`);
  const cards=ui.locator('.media-card');await expect(cards).toHaveCount(6);
  await expect(ui.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(locale)?'rtl':'ltr');
  await expect(cards.first().getByRole('button',{name:c.download,exact:true})).toBeEnabled();
  await expect(ui.locator('.header-actions>button')).toHaveCount(2);
  await expect(ui.getByRole('button',{name:c.library,exact:true})).toHaveCount(1);
  expect(await ui.locator('.popup-quick-actions').count()).toBe(1);
  const heading=cards.first().locator('h2');expect(await heading.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
  expect(await heading.getAttribute('title')).toBe(await heading.textContent());
  expect(await ui.evaluate(()=>document.documentElement.scrollWidth)).toBe(525);
  expect(await inside(ui,'.header,.popup-footer')).toBe(true);
  expect(await ui.locator('main').evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
  // Essential actions stay in one row in every language. Nothing overlaps the title.
  expect(await cards.first().locator('.media-controls').evaluate(el=>{const r=el.getBoundingClientRect();return [...el.children].every(child=>{const b=child.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right&&b.top>=r.top&&b.bottom<=r.bottom;});})).toBe(true);
  await ui.evaluate(()=>document.fonts.ready);
  for(const theme of ['light','dark']){await ui.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await ui.screenshot({path:`${output}/${locale}-${theme}.png`,animations:'disabled'});}
  await ui.evaluate(()=>document.documentElement.dataset.theme='light');
  // Selecting a real lower quality still previews that variant, without starting a download.
  const first=cards.first();await first.getByRole('combobox').selectOption({label:'180p'});
  await first.getByRole('button',{name:c.preview,exact:true}).click();
  await expect.poll(()=>first.locator('video').evaluate((v:HTMLVideoElement)=>v.videoHeight)).toBe(180);
  await first.getByRole('button',{name:c.preview,exact:true}).click();await expect(first.locator('video')).toHaveCount(0);
  expect(await sw.evaluate(()=>chrome.downloads.search({}))).toEqual([]);
  // The last card's menu must escape its scroll container and remain reachable.
  const more=cards.last().getByRole('button',{name:c.moreActions,exact:true});await more.click();
  const panel=ui.locator('.action-popover:popover-open');await expect(panel).toBeVisible();
  expect(await inside(ui,'.action-popover:popover-open')).toBe(true);
  await expect(panel.getByRole('button',{name:c.trimTool,exact:true})).toBeVisible();
  await ui.screenshot({path:`${output}/${locale}-menu-bottom.png`,animations:'disabled'});
  await ui.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(more).toBeFocused();
  await ui.keyboard.press('Enter');await ui.keyboard.press('Tab');await expect(ui.getByRole('group',{name:c.moreActions,exact:true}).getByRole('button').first()).toBeFocused();
  await ui.keyboard.press('Escape');await more.click();await ui.mouse.click(250,38);await expect(panel).toHaveCount(0);
  await more.click();await ui.locator('main').evaluate(el=>el.scrollTop-=40);await expect(panel).toBeVisible();
  expect(await inside(ui,'.action-popover:popover-open')).toBe(true);await ui.keyboard.press('Escape');
  await ui.locator('main').evaluate(el=>el.scrollTop=0);
  // The language picker is still obvious, bounded, and does not navigate away.
  await ui.locator('.language-picker summary').click();await expect(ui.locator('.language-menu')).toBeVisible();
  expect(await inside(ui,'.language-menu')).toBe(true);await expect(ui.locator('.language-menu button')).toHaveCount(11);
  await ui.keyboard.press('Escape');await expect(ui.locator('.language-menu')).toBeHidden();await expect(ui.locator('.language-picker summary')).toBeFocused();
  await writeFile(`${output}/${locale}.json`,JSON.stringify({version,browser:context.browser()!.version(),locale,width:525,height:600,rtl:['ar','ur'].includes(locale),noHorizontalOverflow:true,footerStaysVisible:true,menuKeyboardAndOutsideDismiss:true,previewHeight:180,source:'Original local fixtures; no public media transfer'},null,2)+'\n');
 }finally{await context.close();}
});
test('empty, restricted, failed and saved popup states keep useful controls reachable',async()=>{
 const{context,sw,base,source,ui}=await launch();const c=catalogs.fr!;
 try{
  await sw.evaluate(()=>chrome.storage.local.set({language:'fr'}));await source.goto('http://127.0.0.1:4179/empty.html');
  const tabId=await sw.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());
  await ui.goto(`${base}/popup.html?tabId=${tabId}`);await expect(ui.getByRole('heading',{name:c.empty,exact:true})).toBeVisible();
  await ui.screenshot({path:`${output}/empty-fr.png`});
  const admin=await context.newPage();await admin.goto('chrome://extensions/');const extensionId=new URL(base).host;
  await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_SPECIFIC_SITES'}),extensionId);
  await admin.evaluate(id=>(chrome as any).developerPrivate.addHostPermission(id,'http://127.0.0.1/*'),extensionId);
  await ui.reload();await expect(ui.getByRole('button',{name:/domaines sources|Allow source domains/})).toHaveCount(0);await expect(ui.getByRole('button',{name:c.chromeSiteAccess,exact:true})).toHaveCount(0);await ui.screenshot({path:`${output}/permission-fr.png`});
  await admin.evaluate(id=>(chrome as any).developerPrivate.updateExtensionConfiguration({extensionId:id,hostAccess:'ON_ALL_SITES'}),extensionId);
  const media={id:'popup-history-fixture',title:'Démonstration Alcydeo',kind:'direct' as const,tabId,pageUrl:source.url(),url:'http://127.0.0.1:4179/media/high.mp4',variants:[]};
  const saved=historyTask('Une vidéo enregistrée au titre très long pour vérifier les actions de la bibliothèque',{media,downloadId:123,filename:'Démonstration.mp4'}),failed=historyTask('Une source indisponible',{media,saved:false,state:'failed',error:'expired',bytes:0,progress:0});
  await seedHistory(ui,[saved,failed]);await ui.reload();await ui.locator('.popup-tabs button').last().click();
  await expect(ui.locator('.popup-task')).toHaveCount(2);await expect(ui.getByRole('button',{name:c.show,exact:true})).toBeVisible();
  await expect(ui.getByRole('button',{name:c.resume,exact:true})).toBeVisible();await expect(ui.locator('.popup-task .task-error')).toBeVisible();
  await ui.screenshot({path:`${output}/saved-error-fr.png`});expect(await inside(ui,'.popup-task-actions button')).toBe(true);
  await ui.getByRole('button',{name:c.trimTool,exact:true}).click();await expect.poll(()=>context.pages().find(p=>p.url().includes('/manager.html'))?.url()).toContain('#tools/');
  const manager=context.pages().find(p=>p.url().includes('/manager.html'))!;await expect(manager.locator('.tools-panel')).toBeVisible();
 }finally{await context.close();}
});
