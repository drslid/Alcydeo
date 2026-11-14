import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const server=spawn('pnpm',['--filter','@alcydeo/website','preview','--port','4180'],{shell:process.platform==='win32',stdio:'ignore'});
let browser;
try{
 let ready=false;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:4180/alcydeo/en/');if(r.ok){ready=true;break;}}catch{/* Starting preview. */}await new Promise(r=>setTimeout(r,100));}if(!ready)throw new Error('Local preview did not start');
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await mkdir('artifacts/evidence/site',{recursive:true});
 for(const locale of ['en','es','fr','de','zh-cn','ar','ru','pt','hi','ur']){
  const response=await page.goto(`http://127.0.0.1:4180/alcydeo/${locale}/`);if(response.status()!==200)throw new Error(locale);
  if(await page.locator('html').getAttribute('dir')!==(['ar','ur'].includes(locale)?'rtl':'ltr'))throw new Error(`Direction ${locale}`);
  const link=page.locator(`a[href="/alcydeo/${locale}/guides/install/"]`).first();if(!await link.isVisible())throw new Error(`Missing install link ${locale}`);
 }
 await page.goto('http://127.0.0.1:4180/alcydeo/en/');await page.screenshot({path:'artifacts/evidence/site/desktop.png',fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4180/alcydeo/fr/');await page.screenshot({path:'artifacts/evidence/site/mobile-fr.png',fullPage:true,animations:'disabled'});if(await page.evaluate(()=>document.documentElement.scrollWidth)>390)throw new Error('Mobile overflow');
 await page.goto('http://127.0.0.1:4180/alcydeo/ur/guides/privacy/');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'artifacts/evidence/site/mobile-ur.png',fullPage:true,animations:'disabled'});
 if(errors.length)throw new Error(errors.join('\n'));await writeFile('artifacts/evidence/site/result.json',JSON.stringify({browser:browser.version(),locales:10,mobileOverflow:false,pageErrors:errors,base:'/alcydeo/'},null,2)+'\n');console.log('Local static preview passed: ten locales, RTL, mobile width and real screenshots.');
}finally{await browser?.close();server.kill();}
