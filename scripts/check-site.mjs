import{readFile,readdir,stat}from'node:fs/promises';
import{join,resolve,relative,sep}from'node:path';
import{fileURLToPath}from'node:url';

export const pagesBase='/Alcydeo/';
const origin='https://drslid.github.io',locales=['en','es','fr','de','zh-cn','ar','ru','pt','hi','ur'];
export async function verifySite(directory=resolve('apps/website/dist'),{quiet=false}={}){
 const root=resolve(directory),html=[],css=[],broken=[];let links=0;
 async function walk(dir){for(const file of await readdir(dir,{withFileTypes:true})){const path=join(dir,file.name);if(file.isSymbolicLink())throw Error(`Pages output must not contain symlinks: ${relative(root,path)}`);if(file.isDirectory())await walk(path);else if(path.endsWith('.html'))html.push(path);else if(path.endsWith('.css'))css.push(path);}}
 await walk(root);
 async function check(value,path){
  const input=value.replaceAll('&amp;','&').trim();if(!input||input.startsWith('#')||/^(?:data|mailto|tel|blob):/i.test(input))return;
  let url;try{url=new URL(input,origin+pagesBase+relative(root,path).split(sep).join('/'));}catch{broken.push(`${relative(root,path)}: invalid URL`);return;}
  if(url.origin!==origin)return;
  if(!url.pathname.startsWith(pagesBase)){broken.push(`${relative(root,path)}: wrong Pages base ${url.pathname}`);return;}
  links++;let target;try{target=resolve(root,decodeURIComponent(url.pathname.slice(pagesBase.length)));}catch{broken.push(`${relative(root,path)}: invalid path encoding`);return;}
  if(target!==root&&!target.startsWith(root+sep)){broken.push(`${relative(root,path)}: path escapes output`);return;}
  try{const info=await stat(target);if(info.isDirectory())await stat(join(target,'index.html'));else if(!info.isFile())throw Error('Not a regular file');}catch{broken.push(`${relative(root,path)}: missing ${url.pathname}`);}
 }
 for(const path of html){const text=await readFile(path,'utf8');for(const match of text.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/g))await check(match[2],path);}
 for(const path of css){const text=await readFile(path,'utf8');for(const match of text.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/g))await check(match[2],path);}
 const required=['index.html','cast/index.html','cast/sender.js','cast/sender.css','cast/ready.json',...locales.flatMap(locale=>[`${locale}/index.html`,`${locale}/guides/privacy/index.html`])];
 for(const name of required)try{if(!(await stat(join(root,name))).isFile())throw Error();}catch{broken.push(`Missing required Pages output ${name}`);}
 try{const ready=JSON.parse(await readFile(join(root,'cast/ready.json'),'utf8'));if(ready.app!=='alcydeo-cast-web'||ready.protocol!==2)broken.push('Unsupported Cast readiness protocol');}catch{broken.push('Invalid Cast readiness document');}
 if(broken.length)throw Error(`${broken.length} Pages issue(s):\n${broken.slice(0,30).join('\n')}`);
 const result={html:html.length,css:css.length,links,locales:locales.length,base:pagesBase};
 if(!quiet)console.log(`Verified ${result.html} HTML pages, ${result.css} stylesheets, ${result.links} local links and ${result.locales} locale routes under ${pagesBase}.`);
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await verifySite();
