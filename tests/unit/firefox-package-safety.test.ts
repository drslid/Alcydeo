import{describe,it,expect}from'vitest';
import{assertFirefoxPackageSafety}from'../../scripts/firefox-package-safety.mjs';
const bytes=(text:string)=>new TextEncoder().encode(text);
const manifest={manifest_version:3,browser_specific_settings:{gecko:{strict_min_version:'153.0'}},content_security_policy:{extension_pages:"script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"}};
function pack(code:string,name='main.js',extra:Record<string,Uint8Array>={}){return{'manifest.json':bytes(JSON.stringify(manifest)),[name]:bytes(code),...extra};}
describe('Firefox packaged executable safety gate',()=>{
 it('parses without executing code and ignores text/comments/comparisons',()=>{expect(()=>assertFirefoxPackageSafety(pack(`throw Error('must not run'); const text='eval(x); new Function(x)'; /* import(url) */ const isFactory=Object.prototype!==Function;`))).not.toThrow();});
 it('checks only executable JS files, not nested corresponding-source archives',()=>{expect(()=>assertFirefoxPackageSafety(pack('const valid=1;','main.js',{'licenses/source.zip':bytes('new Function("bad")')}))).not.toThrow();});
 it('does not mix reused aliases or shadowed parameters from separate scopes',()=>{expect(()=>assertFirefoxPackageSafety(pack(`
  const run=Function;
  function unused(){const value=Function;return typeof value;}
  function safe(run){const value=x=>x;return value(run);}
 `))).not.toThrow();});
 it('handles repeated minified local bindings without a cross-scope alias graph',()=>{const code=Array.from({length:150},(_,i)=>`function f${i}(e){const n=e,t=n;return t(1);}`).join('\n');expect(()=>assertFirefoxPackageSafety(pack(code))).not.toThrow();});
 it('still rejects a dangerous binding inside its actual nested scope',()=>{expect(()=>assertFirefoxPackageSafety(pack('function safe(run){return run(1)} function bad(){const run=Function;return run("bad")}'))).toThrow(/JavaScript execution/);});
 it.each([
  'eval("bad")','(eval)("bad")','(0, eval)("bad")','globalThis.eval("bad")','self["eval"]("bad")','window["ev"+"al"]("bad")',
  'new Function("bad")','new (Function)("bad")','globalThis["Function"]("bad")','Function.call(null,"bad")','Function.apply(null,["bad"])',
  'const run=eval; run("bad")','const Make=globalThis["Function"]; new Make("bad")','const root=globalThis, key="Function", Make=root[key]; Make("bad")',
  'const {eval:run}=globalThis; run("bad")','let run=Function; run("bad"); run=()=>1','const f=Function.bind(null); f("bad")',
  'Reflect.construct(Function,["bad"])','Reflect.apply(eval,null,["bad"])','const make=(()=>{}).constructor; make("bad")',
 ])('rejects a common dynamic JavaScript execution form: %s',code=>{expect(()=>assertFirefoxPackageSafety(pack(code,'ort/encoder.mjs'))).toThrow(/JavaScript execution/);});
 it('also checks CommonJS extension files',()=>{expect(()=>assertFirefoxPackageSafety(pack('const run=globalThis["eval"];run("bad")','assets/embed.worker.cjs'))).toThrow(/JavaScript execution/);});
 it('rejects JavaScript unsafe-eval but permits the distinct WASM token',()=>{
  const files=pack('const good=1;');expect(()=>assertFirefoxPackageSafety(files)).not.toThrow();
  files['manifest.json']=bytes(JSON.stringify({...manifest,content_security_policy:{extension_pages:"script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'"}}));expect(()=>assertFirefoxPackageSafety(files)).toThrow(/unsafe-eval/);
  files['manifest.json']=bytes(JSON.stringify({...manifest,content_security_policy:{extension_pages:"script-src 'self' 'UNSAFE-EVAL'"}}));expect(()=>assertFirefoxPackageSafety(files)).toThrow(/unsafe-eval/);
 });
 it('refuses an Android declaration in the desktop-only build',()=>{const files=pack('const good=1;');files['manifest.json']=bytes(JSON.stringify({...manifest,browser_specific_settings:{...manifest.browser_specific_settings,gecko_android:{strict_min_version:'153.0'}}}));expect(()=>assertFirefoxPackageSafety(files)).toThrow(/desktop/);});
 it('rejects malformed executable JavaScript',()=>{expect(()=>assertFirefoxPackageSafety(pack('const broken = ;'))).toThrow(/parse/);});
});
describe('packaged module references',()=>{
 it('allows existing relative literal imports, constant templates and export-from',()=>{expect(()=>assertFirefoxPackageSafety(pack('import "../dep.mjs"; export {x} from "../dep.mjs"; import(`../dep.mjs`);','chunks/main.js',{'dep.mjs':bytes('export const x=1;')}))).not.toThrow();});
 it('normalizes a relative path while keeping it inside the package',()=>{expect(()=>assertFirefoxPackageSafety(pack('import("../chunks/../dep.cjs");','chunks/main.js',{'dep.cjs':bytes('const x=1;')}))).not.toThrow();});
 it.each(['url','`./${name}.js`','"./"+name','"https://example.test/a.js"','"data:text/javascript,alert(1)"','"blob:https://example.test/id"','"/dep.js"','"//example.test/dep.js"','"dep.js"','"./dep.js?q=1"','"./dep.js#x"','"../../dep.js"','"./missing.js"','"./dep.json"'])('rejects an unsafe or unresolved dynamic import: %s',argument=>{expect(()=>assertFirefoxPackageSafety(pack(`import(${argument});`,'main.js',{'dep.js':bytes('const x=1;'),'dep.json':bytes('{}')}))).toThrow(/module/);});
 it.each(['import "https://example.test/a.js";','export * from "./missing.mjs";'])('checks static imports and export-from too: %s',code=>{expect(()=>assertFirefoxPackageSafety(pack(code))).toThrow(/module/);});
});
