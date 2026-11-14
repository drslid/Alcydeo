import {spawnSync} from 'node:child_process';
for(const [command,args] of [[process.execPath,['scripts/locales.mjs']],[process.execPath,['scripts/brand.mjs']],[process.execPath,['scripts/conversion-assets.mjs']],[process.execPath,['scripts/notices.mjs']],['pnpm',['--filter','@alcydeo/extension','zip']],[process.execPath,['scripts/check-package.mjs','--store']]]){
  const result=spawnSync(command,args,{env:{...process.env,ALCYDEO_DISTRIBUTION:'store'},stdio:'inherit',shell:process.platform==='win32'});if(result.status)process.exit(result.status);
}
