import{readFile,mkdir,copyFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{unzipSync}from'fflate';
import{assertFirefoxPackageSafety}from'./firefox-package-safety.mjs';
const{version}=JSON.parse(await readFile('package.json','utf8')),filename=`alcydeo-${version}-firefox.zip`,path=`apps/extension/.output/${filename}`;
const bytes=await readFile(path),zip=unzipSync(bytes),text=path=>new TextDecoder().decode(zip[path]);
if(!zip['manifest.json'])throw Error('manifest.json must be at the archive root');
const manifest=JSON.parse(text('manifest.json')),gecko=manifest.browser_specific_settings?.gecko;
if(manifest.version!==version||manifest.manifest_version!==3||manifest.default_locale!=='en'||manifest.minimum_chrome_version)throw Error('Unexpected Firefox MV3 identity');
if(gecko?.id!=='alcydeo@drslid.github.io'||gecko.strict_min_version!=='153.0'||JSON.stringify(gecko.data_collection_permissions)!==JSON.stringify({required:['none'],optional:['websiteContent','personallyIdentifyingInfo']}))throw Error('Unexpected Gecko capabilities or data consent');
if(manifest.background?.service_worker||manifest.background?.persistent===true||JSON.stringify(manifest.background?.scripts)!==JSON.stringify(['background.js']))throw Error('Firefox must use a nonpersistent background event page');
if(JSON.stringify([...manifest.permissions].sort())!==JSON.stringify(['activeTab','downloads','scripting','storage','webRequest'].sort())||manifest.oauth2||JSON.stringify(manifest.optional_permissions??[])!=='[]'||JSON.stringify(manifest.optional_host_permissions??[])!=='[]'||JSON.stringify(manifest.host_permissions)!==JSON.stringify(['http://*/*','https://*/*']))throw Error('Unexpected Firefox permissions');
if(manifest.content_security_policy?.extension_pages!=="script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; base-uri 'none'")throw Error('Unexpected executable-code policy');
assertFirefoxPackageSafety(zip);
const locales=['en','es','fr','de','zh_CN','ar','ru','pt','hi','ur'],catalogs=locales.map(locale=>JSON.parse(text(`_locales/${locale}/messages.json`))),keys=Object.keys(catalogs[0]).sort().join();
for(const catalog of catalogs){if(Object.keys(catalog).sort().join()!==keys||catalog.appDescription.message.length>132)throw Error('Invalid localized Firefox catalog');for(const key of['firefoxCaptureUnavailable','firefoxCastUnavailable','cloudConsentDenied'])if(!catalog[key]?.message||catalog[key].message===key)throw Error(`Missing Firefox capability/consent localization: ${key}`);for(const message of Object.values(catalog))if(!message.message)throw Error('Empty localization');}
for(const file of Object.keys(zip)){
 if(/(^|\/)(node_modules|fixtures|\.git|\.local|\.env|META-INF)(\/|$)|\.(pem|key|crx|xpi|map)$/i.test(file))throw Error(`Unexpected packaged file ${file}`);
 if(/(?:YoutubePlaylist|PlaylistBatchCard|playlist-(?:catalog|service)|sabr)/i.test(file))throw Error(`YouTube module in the principal Firefox package: ${file}`);
 if(!/\.[cm]?js$/.test(file))continue;const code=text(file);
 if(code.includes('www.gstatic.com/cv/js/sender')||/importScripts\(["']https?:|import\(["']https?:|eval\(/.test(code))throw Error(`Remote executable in ${file}`);
 if(/videoPlaybackUstreamerConfig|SabrStream|application\/vnd\.yt-ump|alcydeo-youtube-playlists|playlistVideoRenderer|youtubei\/v1\/browse|youtubePlaylist[A-Z]|ytInitialPlayerResponse/.test(code))throw Error(`YouTube transport in the principal Firefox package: ${file}`);
}
for(const file of['popup.html','manager.html','background.js','THIRD_PARTY_NOTICES.txt','licenses/mediabunny-1.65.0-source.zip','licenses/mediabunny-aac-encoder-1.65.0-source.zip','licenses/FFmpeg-AAC-LGPL-2.1.txt','licenses/Material-Symbols-Apache-2.0.txt','licenses/Inter-OFL-1.1.txt'])if(!zip[file])throw Error(`Missing ${file}`);
await mkdir('artifacts',{recursive:true});await copyFile(path,`artifacts/${filename}`);const sha256=createHash('sha256').update(bytes).digest('hex');await writeFile(`artifacts/${filename}.sha256`,`${sha256}  ${filename}\n`);
console.log(`Verified unsigned Firefox MV3 ZIP: ${filename}, ${bytes.length} bytes, ${Object.keys(zip).length} files, ten locales. SHA-256 ${sha256}. Temporary installation / review only; not an AMO-signed release.`);
