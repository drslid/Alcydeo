import{spawnSync}from'node:child_process';
import{readFile,mkdir,writeFile}from'node:fs/promises';
import{fileURLToPath}from'node:url';
import{createHash}from'node:crypto';
import{unzipSync}from'fflate';
const root=fileURLToPath(new URL('../',import.meta.url));
function git(args,encoding='utf8'){const result=spawnSync('git',args,{cwd:root,encoding,maxBuffer:128*1024*1024});if(result.status!==0)throw Error(String(result.stderr));return result.stdout;}
const{version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
if(git(['status','--porcelain','--untracked-files=no']).trim())throw Error('Commit the reviewed tracked source before creating the reviewer archive.');
if(JSON.parse(git(['show','HEAD:package.json'])).version!==version)throw Error('The reviewed commit and working version differ.');
const commit=git(['rev-parse','HEAD']).trim(),prefix=`Alcydeo-${version}/`,name=`alcydeo-${version}-source.zip`;
const bytes=git(['archive','--format=zip',`--prefix=${prefix}`,commit],null),files=unzipSync(bytes);
for(const path of Object.keys(files))if(/(?:^|\/)(?:node_modules|\.git|\.local|\.env|artifacts)(?:\/|$)|\.(?:pem|key|crx|xpi)$/i.test(path))throw Error(`Private or generated file in reviewer source: ${path}`);
for(const path of['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','.nvmrc','apps/extension/wxt.config.ts','apps/extension/browser-config.ts','packages/contracts/index.ts','packages/media-core/conversion.ts','scripts/firefox-build.mjs','scripts/locales.mjs','docs/REVIEWER-BUILD.md','LICENSE','THIRD_PARTY_NOTICES.txt'])if(!files[prefix+path])throw Error(`Incomplete reviewer source: ${path}`);
const archivedVersion=JSON.parse(new TextDecoder().decode(files[prefix+'package.json'])).version;if(archivedVersion!==version)throw Error('Wrong source version.');
const directory=new URL('../artifacts/',import.meta.url);await mkdir(directory,{recursive:true});
await writeFile(new URL(name,directory),bytes);const sha256=createHash('sha256').update(bytes).digest('hex');await writeFile(new URL(name+'.sha256',directory),`${sha256}  ${name}\n`);
console.log(`Verified reviewer source ${name}: commit ${commit}, ${Object.keys(files).length} entries, ${bytes.length} bytes. SHA-256 ${sha256}. No signing or Store submission.`);
