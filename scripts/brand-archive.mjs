import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {zipSync} from 'fflate';
import {createHash} from 'node:crypto';

const {version}=JSON.parse(await readFile('package.json','utf8')),files={};
async function collect(dir,prefix){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){if(entry.isDirectory())await collect(`${dir}/${entry.name}`,`${prefix}/${entry.name}`);else if(entry.isFile())files[`${prefix}/${entry.name}`]=new Uint8Array(await readFile(`${dir}/${entry.name}`));}}
for(const [dir,prefix]of [['docs/brand','exports'],['packages/design-tokens/brand','sources']])await collect(dir,prefix);
for(const [source,name]of [['docs/BRAND.md','BRAND.md'],['docs/brand-board.png','brand-board.png'],['docs/brand-board.svg','brand-board.svg'],['LICENSE','LICENSE-MIT.txt'],['docs/licenses/Inter-OFL-1.1.txt','Inter-OFL-1.1.txt']])files[name]=new Uint8Array(await readFile(source));
await mkdir('artifacts',{recursive:true});const name=`alcydeo-brand-${version}.zip`,bytes=zipSync(files,{level:9,mtime:new Date(2000,0,1,0,0,0)});await writeFile(`artifacts/${name}`,bytes);await writeFile(`artifacts/${name}.sha256`,`${createHash('sha256').update(bytes).digest('hex')}  ${name}\n`);console.log(`Prepared ${name}: ${Object.keys(files).length} files, ${bytes.length} bytes. No publication.`);
