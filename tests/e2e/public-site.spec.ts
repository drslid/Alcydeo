import{test,expect,chromium}from'@playwright/test';
import{mkdir}from'node:fs/promises';
const origin=process.env.ALCYDEO_SITE_ORIGIN??'http://localhost:4180',base=origin+'/Alcydeo/',out=process.env.ALCYDEO_SITE_EVIDENCE_DIR??'.local/publication/site-evidence';
const locales=['en','es','fr','de','zh-cn','ar','ru','pt','hi','ur'];
for(const locale of locales)test(`public presentation, themes and local assets in ${locale}`,async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors:string[]=[],failed:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)failed.push(new URL(response.url()).pathname);});
 try{
  const response=await page.goto(base+locale+'/');expect(response?.status()).toBe(200);await expect(page.locator('main h1')).toHaveCount(1);await expect(page.locator('.home-content')).toBeVisible();await expect(page.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(locale)?'rtl':'ltr');
  await expect(page.locator('.home-content a[href*="releases/tag/v0.2.0"]')).not.toHaveCount(0);
  if(['ar','ur','hi'].includes(locale)){const family=locale==='hi'?'AlcydeoDevanagari':'AlcydeoArabic',sample=locale==='hi'?'हिन्दी':'اردو العربية';expect(await page.evaluate(async({family,sample})=>{const loaded=await document.fonts.load(`16px "${family}"`,sample);await document.fonts.ready;return loaded.length>0&&loaded.every(face=>face.status==='loaded')&&getComputedStyle(document.body).fontFamily.includes(family);},{family,sample})).toBe(true);}

  for(const theme of['light','dark']){
   await page.locator('starlight-theme-select select').selectOption(theme);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
   for(const width of[1440,390]){
    await page.setViewportSize({width,height:1000});await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    // Scroll through lazy real screenshots before testing their network results.
    for(const image of await page.locator('main img:visible').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((element:HTMLImageElement)=>element.complete&&element.naturalWidth>0)).toBe(true);}
    await page.evaluate(()=>window.scrollTo(0,0));
    if(['fr','ur'].includes(locale)){await mkdir(out,{recursive:true});await page.screenshot({path:`${out}/${locale}-${theme}-${width}.png`,fullPage:true,animations:'disabled'});}
   }
  }
  const headings=await page.locator('h1,h2,h3').allTextContents();expect(headings.every(value=>value.trim()&&!value.includes('undefined'))).toBe(true);expect(errors).toEqual([]);expect(failed).toEqual([]);
  const privacy=await page.goto(base+locale+'/guides/privacy/');expect(privacy?.status()).toBe(200);await expect(page.locator('main h1')).toBeVisible();expect(await page.locator('main').innerText()).not.toContain('undefined');expect(errors).toEqual([]);expect(failed).toEqual([]);
 }finally{await browser.close();}
});
test('root offers ten real language routes and the 404 document offers safe navigation',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}),page=await browser.newPage();try{
  await page.goto(base);for(const locale of locales)await expect(page.locator(`a[href="/Alcydeo/${locale}/"]`).first()).toBeVisible();await page.keyboard.press('Tab');expect(await page.locator(':focus').count()).toBe(1);
  await page.goto(base+'404.html');await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex');for(const locale of locales)await expect(page.locator(`a[href="/Alcydeo/${locale}/"]`)).toBeVisible();await expect(page.locator('link[rel="canonical"],link[rel="alternate"]')).toHaveCount(0);
 }finally{await browser.close();}
});


test('mobile home exposes native language and theme choices with real navigation',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:390,height:850}});try{
  await page.goto(base+'en/');const language=page.locator('header starlight-lang-select select:visible'),theme=page.locator('header starlight-theme-select select:visible');await expect(language).toBeVisible();await expect(theme).toBeVisible();await expect(language.locator('option')).toHaveCount(10);await expect(language).toHaveAccessibleName('Select language');
  await language.selectOption('/Alcydeo/fr/');await expect(page).toHaveURL(base+'fr/');await page.locator('header starlight-theme-select select:visible').selectOption('light');await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.locator('header starlight-lang-select select:visible').selectOption('/Alcydeo/ur/');await expect(page).toHaveURL(base+'ur/');await expect(page.locator('html')).toHaveAttribute('dir','rtl');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }finally{await browser.close();}
});
