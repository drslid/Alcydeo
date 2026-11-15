import{chromium}from'@playwright/test';
import{createServer}from'node:http';
import{createReadStream}from'node:fs';
import{access,mkdir,readFile,stat,writeFile}from'node:fs/promises';
import{resolve,extname,sep}from'node:path';
import{fileURLToPath}from'node:url';
import{spawn}from'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const tests=['extension','segmented','site-access','popup-locales','cast-web','cast-handoff','release-settings','detection-diagnostics'].map(name=>`tests/e2e/${name}.spec.ts`);
if(process.argv.includes('--list')){console.log(tests.join('\n'));process.exit(0);}
if(process.argv.length>2)throw Error('Usage: node scripts/ci-e2e.mjs [--list]');
const extension=resolve(root,process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3'),site=resolve(root,'apps/website/dist');
const browser=process.env.CHROMIUM_PATH??chromium.executablePath(),evidence=resolve(root,'artifacts/evidence/ci');
for(const file of[browser,resolve(extension,'manifest.json'),resolve(site,'cast/ready.json'),resolve(root,'fixtures/media/high.mp4'),resolve(root,'fixtures/segmented.html')])try{await access(file);}catch{throw Error(`Missing ${file}. Install Playwright Chromium and build the extension/site before test:ci.`);}
await mkdir(evidence,{recursive:true});
await writeFile(resolve(evidence,'coverage.json'),JSON.stringify({suite:'local-browser-smoke',files:tests,scope:'Original local fixtures, installed extension and controlled SDK contracts. All other E2E files remain available through test:e2e; physical TV, public sites, account-backed providers, benchmarks and platform-specific tests are not claimed.',extensionVersion:JSON.parse(await readFile(resolve(extension,'manifest.json'),'utf8')).version,browser,fixtureServer:'Playwright-owned :4179',pagesServer:'Runner-owned :4180; /Alcydeo/ and test-only /alcydeo/ alias',retries:0},null,2));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.wasm':'application/wasm'};
const server=createServer(async(request,response)=>{
 try{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405).end();return;}
  const url=new URL(request.url,'http://localhost:4180'),base=['/Alcydeo/','/alcydeo/'].find(value=>url.pathname.startsWith(value));if(!base){response.writeHead(404).end();return;}
  let file=resolve(site,decodeURIComponent(url.pathname.slice(base.length)));if(file!==site&&!file.startsWith(site+sep)){response.writeHead(404).end();return;}
  let info=await stat(file);if(info.isDirectory()){file=resolve(file,'index.html');info=await stat(file);}if(!info.isFile())throw Error('Not a file');
  response.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-store'});
  if(request.method==='HEAD')response.end();else{const stream=createReadStream(file);response.on('close',()=>stream.destroy());stream.on('error',()=>response.destroy());stream.pipe(response);}
 }catch{if(!response.headersSent)response.writeHead(404);response.end();}
});
let child,killTimer;const stop=()=>{child?.kill('SIGTERM');killTimer??=setTimeout(()=>child?.kill('SIGKILL'),5000);killTimer.unref();};
process.once('SIGINT',stop);process.once('SIGTERM',stop);
try{
 await new Promise((done,failed)=>{server.once('error',failed);server.listen(4180,'localhost',done);});
 console.log(`Browser smoke: ${tests.length} explicit files; Chromium ${browser}. Pages server ready; Playwright starts and stops fixture server 4179.`);
 const env={...process.env,CI:'1',CHROMIUM_PATH:browser,ALCYDEO_EXTENSION_PATH:extension,ALCYDEO_TEST_EXTENSION:extension,ALCYDEO_CAST_EVIDENCE_DIR:resolve(evidence,'cast'),PLAYWRIGHT_JSON_OUTPUT_NAME:resolve(evidence,'results.json')};
 child=spawn(process.execPath,[resolve(root,'node_modules/@playwright/test/cli.js'),'test',...tests,'--workers=1','--retries=0','--max-failures=1','--reporter=line,json',`--output=${resolve(evidence,'traces')}`],{cwd:root,env,stdio:'inherit'});
 process.exitCode=await new Promise((done,failed)=>{child.once('error',failed);child.once('exit',(code,signal)=>done(code??(signal?1:0)));});
}finally{
 clearTimeout(killTimer);process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await new Promise(done=>server.close(done));
}
