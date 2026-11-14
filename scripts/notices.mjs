import { readFile,writeFile,mkdir,readdir,realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { zipSync } from 'fflate';
const list=spawnSync('pnpm',['--filter','@alcydeo/extension','list','--prod','--depth','Infinity','--json'],{encoding:'utf8',shell:process.platform==='win32'});
if(list.status)throw new Error(list.stderr);
const paths=new Set();function walk(tree){for(const p of Object.values(tree??{})){paths.add(p.path);walk(p.dependencies);}}walk(JSON.parse(list.stdout)[0].dependencies);
paths.add(await realpath('apps/extension/node_modules/wxt'));
const entries=[];await mkdir('apps/extension/public/licenses',{recursive:true});
for(const path of [...paths].sort()){
 const p=JSON.parse(await readFile(join(path,'package.json'),'utf8'));
 const files=(await readdir(path)).filter(n=>/^(licen[sc]e|copying|notice)(\.|$)/i.test(n));
 let licenseText='';for(const f of files)licenseText+=`\n${f}\n${await readFile(join(path,f),'utf8')}\n`;
 const name=`${p.name.replaceAll('/','_').replaceAll('@','')}-${p.version}.txt`;
 if(!licenseText)licenseText=await readFile(`docs/licenses/${name}`,'utf8');
 await writeFile(`apps/extension/public/licenses/${name}`,licenseText);
 entries.push(`${p.name} ${p.version} — ${p.license ?? 'see included license'}\n${typeof p.repository==='string'?p.repository:p.repository?.url??''}\nlicenses/${name}`);
}
const source={};
async function sourceFiles(path,prefix){for(const entry of (await readdir(path,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){if(entry.isDirectory())await sourceFiles(join(path,entry.name),`${prefix}/${entry.name}`);else source[`${prefix}/${entry.name}`]=new Uint8Array(await readFile(join(path,entry.name)));}}
await sourceFiles('node_modules/mediabunny/src','mediabunny-1.65.0/src');
source['mediabunny-1.65.0/LICENSE']=new Uint8Array(await readFile('node_modules/mediabunny/LICENSE'));
source['mediabunny-1.65.0/package.json']=new Uint8Array(await readFile('node_modules/mediabunny/package.json'));
await writeFile('apps/extension/public/licenses/mediabunny-1.65.0-source.zip',zipSync(source,{level:6,mtime:new Date(2000,0,1,0,0,0)}));
const aacSource={};
async function aacFiles(path,prefix){for(const entry of (await readdir(path,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){if(entry.isDirectory())await aacFiles(join(path,entry.name),`${prefix}/${entry.name}`);else aacSource[`${prefix}/${entry.name}`]=new Uint8Array(await readFile(join(path,entry.name)));}}
await aacFiles('node_modules/@mediabunny/aac-encoder/src','aac-encoder-1.65.0/src');
await aacFiles('node_modules/@mediabunny/aac-encoder/licenses','aac-encoder-1.65.0/licenses');
for(const name of ['LICENSE','README.md','package.json'])aacSource[`aac-encoder-1.65.0/${name}`]=new Uint8Array(await readFile(`node_modules/@mediabunny/aac-encoder/${name}`));
aacSource['aac-encoder-1.65.0/upstream-bundle.mjs']=new Uint8Array(await readFile('node_modules/@mediabunny/aac-encoder/dist/bundles/mediabunny-aac-encoder.mjs'));
await aacFiles('packages/media-core/.generated','alcydeo-mv3-adaptation');
aacSource['alcydeo-mv3-adaptation/conversion-assets.mjs']=new Uint8Array(await readFile('scripts/conversion-assets.mjs'));
await writeFile('apps/extension/public/licenses/mediabunny-aac-encoder-1.65.0-source.zip',zipSync(aacSource,{level:6,mtime:new Date(2000,0,1,0,0,0)}));
await writeFile('apps/extension/public/licenses/FFmpeg-AAC-LGPL-2.1.txt',await readFile('node_modules/@mediabunny/aac-encoder/licenses/ffmpeg/COPYING.LGPLv2.1'));
await writeFile('apps/extension/public/licenses/FFmpeg-AAC-PROVENANCE.txt',`FFmpeg AAC encoder: LGPL-2.1-or-later, unmodified, no GPL/version3/nonfree components enabled by upstream.\nExact source: https://github.com/FFmpeg/FFmpeg/tree/60a2818f76dcd1fee3155b1791304af104a0fc1b\nSource archive: https://github.com/FFmpeg/FFmpeg/archive/60a2818f76dcd1fee3155b1791304af104a0fc1b.tar.gz\nRebuild instructions, toolchain and upstream binary hash: mediabunny-aac-encoder-1.65.0-source.zip, README.md.\nThe local MV3 adaptation replaces only the Blob-worker factory with a packaged module worker. The AAC worker body and its inlined WASM are unchanged. No native program or remote executable is used.\n`);
const text=`Alcydeo original code: MIT, copyright 2026 Alcydeo contributors.\n\nThird-party production dependency inventory (may include tree-shaken code).\nBuild-only website and test dependencies remain under their own package licenses and pnpm-lock.yaml.\nMediabunny is unmodified MPL-2.0 code. Its exact source is included in licenses/mediabunny-1.65.0-source.zip.\nNoto Naskh Arabic (official unmodified Arabic subset): SIL Open Font License, fonts/OFL.txt and licenses/NotoNaskhArabic-OFL.txt. Local use for ar/ur; no runtime font service.\n\n${entries.join('\n\n')}\n`;
await writeFile('apps/extension/public/licenses/Material-Symbols-Apache-2.0.txt',await readFile('docs/licenses/Material-Symbols-Apache-2.0.txt'));
await writeFile('apps/extension/public/licenses/Inter-OFL-1.1.txt',await readFile('docs/licenses/Inter-OFL-1.1.txt'));
await writeFile('apps/extension/public/licenses/NotoSansDevanagari-OFL.txt',await readFile('docs/licenses/NotoSansDevanagari-OFL.txt'));
await writeFile('apps/extension/public/licenses/NotoSansDevanagari-PROVENANCE.json',await readFile('docs/licenses/NotoSansDevanagari-PROVENANCE.json'));
const additions='Noto Sans Devanagari: unmodified official Devanagari WOFF2 subset, SIL Open Font License 1.1. Local Hindi rendering, no runtime font request. See licenses/NotoSansDevanagari-OFL.txt and licenses/NotoSansDevanagari-PROVENANCE.json.\n\n' + 'Inter outlined lettering: Copyright 2016 The Inter Project Authors, SIL Open Font License 1.1. Only the Alcydeo wordmark outlines are included; no font is loaded. Source and SHA-256 retained in packages/design-tokens/brand/PROVENANCE.json. See licenses/Inter-OFL-1.1.txt.\n\n' + '\nGoogle Material Symbols Rounded: Apache-2.0, Google LLC. Local SVG path subset from google/material-design-icons, revision 10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7; original symbols and provenance retained in packages/design-tokens/icons. See licenses/Material-Symbols-Apache-2.0.txt. No remote icon/font service.\n' + '\nAAC conversion fallback: @mediabunny/aac-encoder 1.65.0, MPL-2.0, with the MV3 worker-factory adaptation documented in licenses/mediabunny-aac-encoder-1.65.0-source.zip. FFmpeg AAC itself is unmodified LGPL-2.1-or-later; see licenses/FFmpeg-AAC-LGPL-2.1.txt and licenses/FFmpeg-AAC-PROVENANCE.txt. Native Chrome codecs are preferred. No general FFmpeg runtime is shipped.\n';
await writeFile('THIRD_PARTY_NOTICES.txt',text+additions);await writeFile('apps/extension/public/THIRD_PARTY_NOTICES.txt',text+additions);await writeFile('apps/extension/public/LICENSE.txt',await readFile('LICENSE'));
console.log(`Retained ${entries.length} dependency notices and exact Mediabunny source.`);
