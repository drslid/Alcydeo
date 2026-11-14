import{readFile,readdir,mkdir,writeFile}from'node:fs/promises';import{join}from'node:path';import{zipSync}from'fflate';import{createHash}from'node:crypto';
import{verifySite,pagesBase}from'./check-site.mjs';
const{version}=JSON.parse(await readFile('package.json','utf8'));const root='apps/website/dist',files={};
await verifySite(root);
async function walk(dir,prefix=''){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){const name=prefix+entry.name;if(entry.isSymbolicLink())throw Error(`Pages archive refuses symlink ${name}`);if(entry.isDirectory())await walk(join(dir,entry.name),name+'/');else if(entry.isFile())files[name]=[new Uint8Array(await readFile(join(dir,entry.name))),{mtime:new Date(2020,0,1,0,0,0)}];}}
await walk(root);for(const required of['index.html','fr/index.html','en/index.html','ar/index.html','ur/index.html'])if(!files[required])throw new Error(`Missing Pages output ${required}`);
await mkdir('artifacts',{recursive:true});const name=`alcydeo-pages-${version}.zip`,bytes=zipSync(files,{level:9});await writeFile(`artifacts/${name}`,bytes);await writeFile(`artifacts/${name}.sha256`,`${createHash('sha256').update(bytes).digest('hex')}  ${name}\n`);console.log(`Prepared ${name}: ${Object.keys(files).length} files, ${bytes.length} bytes; ${pagesBase} deployment base, no publication.`);
