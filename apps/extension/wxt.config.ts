import { defineConfig } from 'wxt';
const local=process.env.ALCYDEO_DISTRIBUTION!=='store';
const senderUrl=process.env.ALCYDEO_CAST_SENDER_URL??(local?'https://drslid.github.io/Alcydeo/cast/':'');
export default defineConfig({
  outDir:local?'.output':'.output-store',
  modules: ['@wxt-dev/module-vue'],
  vite:()=>({define:{__ALCYDEO_LOCAL__:JSON.stringify(local),__ALCYDEO_CAST_SENDER_URL__:JSON.stringify(senderUrl)}}),
  zip: { name:local?'alcydeo':'alcydeo-store', artifactTemplate:'{{name}}-{{version}}-{{browser}}.zip' },
  manifest: {
    name: '__MSG_appName__', description: '__MSG_appDescription__', default_locale: 'en', version: '0.2.0',
    homepage_url: 'https://drslid.github.io/Alcydeo/',
    minimum_chrome_version: '120', incognito: 'not_allowed',
    permissions: ['activeTab', 'scripting', 'storage', 'downloads', 'webRequest','tabCapture'],
    optional_permissions:[],
    optional_host_permissions:['file:///*'],

    host_permissions: ['http://*/*', 'https://*/*'],
    action: { default_title: '__MSG_appName__', default_popup: 'popup.html' },
    icons: { 16: 'icons/16.png', 32: 'icons/32.png', 48: 'icons/48.png', 128: 'icons/128.png' },
    content_security_policy: { extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; base-uri 'none'" },
  },
});
