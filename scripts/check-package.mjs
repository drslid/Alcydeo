import { readFile,mkdir,copyFile,writeFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';
import { createHash } from 'node:crypto';
const store=process.argv.includes('--store');
const {version}=JSON.parse(await readFile('apps/extension/package.json','utf8'));const filename=`alcydeo${store?'-store':''}-${version}-chrome.zip`;
const path=`apps/extension/${store?'.output-store':'.output'}/${filename}`;const bytes=await readFile(path);const zip=unzipSync(bytes);const text=p=>new TextDecoder().decode(zip[p]);
if(!zip['manifest.json'])throw new Error('manifest.json must be at ZIP root');const manifest=JSON.parse(text('manifest.json'));
if(manifest.version!==version || manifest.manifest_version!==3 || manifest.default_locale!=='en')throw new Error('Invalid manifest');
if(manifest.content_security_policy?.extension_pages!=="script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; base-uri 'none'")throw new Error('Unexpected executable-code policy');
if(Object.keys(zip).filter(p=>/^assets\/aac-worker-[\w-]+\.js$/.test(p)).length!==1)throw new Error('Expected exactly one packaged AAC worker');
if(JSON.stringify([...(manifest.host_permissions??[])].sort())!==JSON.stringify(['http://*/*','https://*/*']) || JSON.stringify(manifest.optional_host_permissions??[])!==JSON.stringify(['file:///*']) || manifest.permissions.includes('debugger') || manifest.permissions.includes('nativeMessaging'))throw new Error('Unexpected permissions');
if(JSON.stringify(manifest.optional_permissions??[])!==JSON.stringify([]))throw new Error('Unexpected optional permissions');
if(manifest.oauth2)throw new Error('OAuth providers removed');
if(JSON.stringify([...manifest.permissions].sort())!==JSON.stringify(['activeTab','downloads','scripting','storage','tabCapture','webRequest'].sort()))throw new Error('Unexpected required permissions');
const locales=['en','es','fr','de','zh_CN','ar','ru','pt','hi','ur'];const catalogs=locales.map(l=>JSON.parse(text(`_locales/${l}/messages.json`)));const keys=Object.keys(catalogs[0]).sort().join();
for(const c of catalogs){
 if(Object.keys(c).sort().join()!==keys)throw new Error('Locale key mismatch');
 if(c.appDescription.message.length>132)throw new Error('Description too long');
 for(const m of Object.values(c)){
  if(!m.message)throw new Error('Empty localization');
  for(const [,name]of m.message.matchAll(/\$(\w+)\$/g))if(!/^\$[1-9]$/.test(m.placeholders?.[name.toLowerCase()]?.content??''))throw new Error('Invalid localization placeholder');
 }
}
for(const path of Object.keys(zip)){
 if(path.endsWith('.js')&&text(path).includes('www.gstatic.com/cv/js/sender'))throw new Error('Cast SDK loader must remain outside the extension');
 if(/(^|\/)(node_modules|fixtures|\.git|\.env)(\/|$)|\.(pem|key|crx|map)$/i.test(path))throw new Error(`Unexpected packaged file ${path}`);
 if(/\.js$/.test(path)&&/importScripts\(["']https?:|import\(["']https?:|eval\(/.test(text(path)))throw new Error(`Remote executable or eval in ${path}`);
 if(store&&/\.js$/.test(path)&&/videoPlaybackUstreamerConfig|SabrStream|application\/vnd\.yt-ump|alcydeo-youtube-playlists|playlistVideoRenderer|youtubei\/v1\/browse/.test(text(path)))throw new Error(`YouTube transport or playlist code in Store artifact: ${path}`);
}
for(const required of ['popup.html','manager.html','background.js','THIRD_PARTY_NOTICES.txt','licenses/mediabunny-1.65.0-source.zip','licenses/mediabunny-aac-encoder-1.65.0-source.zip','licenses/FFmpeg-AAC-LGPL-2.1.txt','licenses/FFmpeg-AAC-PROVENANCE.txt','licenses/Material-Symbols-Apache-2.0.txt','licenses/Inter-OFL-1.1.txt'])if(!zip[required])throw new Error(`Missing ${required}`);
await mkdir('artifacts',{recursive:true});await copyFile(path,`artifacts/${filename}`);
const sha256=createHash('sha256').update(bytes).digest('hex');await writeFile(`artifacts/${filename}.sha256`,`${sha256}  ${filename}\n`);
console.log(`Verified ${filename}: ${Object.keys(zip).length} files, ${bytes.length} bytes, 10 locales, MV3, standard HTTP/HTTPS host access. SHA-256 ${sha256}`);
