import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
export default ts.config(
  { ignores: ['**/node_modules/**', '**/.wxt/**', '**/.generated/**', '**/public/engines/**', '**/.output/**', '**/.output-store/**', '**/dist/**', '**/.astro/**', '.local/**', 'fixtures/**', 'artifacts/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  {languageOptions:{globals:{AbortSignal:'readonly'}}},
  ...ts.configs.recommended,
  ...vue.configs['flat/essential'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: ts.parser } }, rules: { 'no-undef': 'off', 'vue/multi-word-component-names': 'off' } },
  { languageOptions: { globals: Object.fromEntries(['chrome','navigator','window','document','fetch','URL','console','setTimeout','clearTimeout','setInterval','clearInterval','AbortController','Blob','File','FileReader','Worker','self','postMessage','crypto','indexedDB','DOMParser','TextEncoder','TextDecoder','HTMLElement','HTMLMediaElement','HTMLVideoElement','MutationObserver','location','matchMedia','Intl','performance','structuredClone','defineBackground','process','Buffer','ReadableStream','WritableStream','Response','Request','atob'].map(k => [k,'readonly'])) }, rules: { '@typescript-eslint/no-explicit-any': 'off' } }
);
