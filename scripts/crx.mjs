import { chromium } from '@playwright/test';
import { cp,mkdir,readFile,copyFile,access,rm,chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {unzipSync} from 'fflate';
await mkdir('artifacts',{recursive:true});const input=resolve('artifacts/crx-source');await rm(input,{recursive:true,force:true});await cp('apps/extension/.output/chrome-mv3',input,{recursive:true});await rm(`${input}.crx`,{force:true});
const browser=process.env.CHROMIUM_PATH??process.env.CHROME_PATH??chromium.executablePath();const key=resolve('artifacts/alcydeo-local-test.pem');
let keyExists=false;const args=['--headless=new','--no-sandbox','--no-message-box',`--pack-extension=${input}`];try{await access(key);keyExists=true;args.push(`--pack-extension-key=${key}`);}catch{/* Generate a local test key on first use. */}
const result=spawnSync(browser,args,{timeout:30000,encoding:'utf8'});if(result.error||result.status!==0)throw new Error(result.error?.message||result.stderr||'Chrome pack failed');
const crx=await readFile(`${input}.crx`);if(crx.subarray(0,4).toString()!=='Cr24'||crx.readUInt32LE(4)!==3)throw new Error('Expected CRX3');
const zip=unzipSync(crx.subarray(12+crx.readUInt32LE(8)));for(const[path,data]of Object.entries(zip)){if(path.endsWith('/'))continue;const original=await readFile(resolve(input,path));if(!original.equals(Buffer.from(data)))throw new Error(`CRX differs from current build: ${path}`);}
const {version}=JSON.parse(await readFile(resolve(input,'manifest.json'),'utf8'));const output=`artifacts/alcydeo-${version}-local-test.crx`;
await copyFile(`${input}.crx`,output);if(!keyExists)await copyFile(`${input}.pem`,key);await chmod(key,0o600);await rm(`${input}.pem`,{force:true});
console.log(`CRX3 prepared: ${output}. Signing key stays ignored in artifacts. Use Load unpacked for Windows development; CRX installation is subject to Chrome policy.`);
