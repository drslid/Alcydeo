import{spawnSync}from'node:child_process';
import{fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
if(process.argv.slice(2).some(arg=>arg!=='--zip'))throw Error('Usage: node scripts/firefox-build.mjs [--zip]');
const zip=process.argv.includes('--zip'),env={...process.env,ALCYDEO_DISTRIBUTION:'firefox',ALCYDEO_CAST_SENDER_URL:''};
const commands=[...['locales','brand','conversion-assets','notices'].map(name=>[process.execPath,[`scripts/${name}.mjs`]]),['pnpm',['--filter','@alcydeo/extension','exec','wxt',zip?'zip':'build','-b','firefox','--mv3']],...(zip?[[process.execPath,['scripts/check-firefox-package.mjs']]]:[])];
for(const[command,args]of commands){const result=spawnSync(command,args,{cwd:root,env,stdio:'inherit',shell:process.platform==='win32'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);}
