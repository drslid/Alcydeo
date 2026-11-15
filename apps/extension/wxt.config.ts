import { defineConfig } from 'wxt';
import{version}from'../../package.json';
import{buildDefines,extensionManifest}from'./browser-config';
const local=process.env.ALCYDEO_DISTRIBUTION!=='store';
export default defineConfig({
  outDir:local?'.output':'.output-store',
  manifestVersion:3,
  modules: ['@wxt-dev/module-vue'],
  vite:({browser})=>({define:buildDefines(browser,process.env.ALCYDEO_DISTRIBUTION,process.env.ALCYDEO_CAST_SENDER_URL)}),
  // The review source archive is built from the whole workspace separately.
  zip: { name:local?'alcydeo':'alcydeo-store', artifactTemplate:'{{name}}-{{version}}-{{browser}}.zip',zipSources:false },
  manifest:({browser})=>extensionManifest(browser,version),
});
