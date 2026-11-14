import{beforeAll,afterAll,describe,it,expect,vi}from'vitest';
import{readFile}from'node:fs/promises';
import{supportedLanguages,type Locale,type Message}from'../../packages/i18n/manual';

const catalogs=Object.fromEntries(await Promise.all(supportedLanguages.map(async locale=>[locale,JSON.parse(await readFile(`apps/extension/public/_locales/${locale}/messages.json`,'utf8'))])))as Record<Locale,Record<string,Message>>;
let nativeLocale:Locale='en',uiLanguage='en',i18n:typeof import('../../apps/extension/src/i18n');
const prefixed=['cloudOnefichierUnavailable','cloudTurbobitUnavailable','cloudMegaupUnavailable','cloudFileTooLarge'];
const direct=['cloudSetup','cloudAuth','cloudNetwork','cloudResponse','cloudRate','cloudExpired','cloudInput','cloudInterrupted','cloudPcloudLink','cloudPcloudQuota','cloudProviderRemoved'];
beforeAll(async()=>{
 vi.stubGlobal('chrome',{i18n:{getUILanguage:()=>uiLanguage,getMessage:(key:string)=>catalogs[nativeLocale][key]?.message??''},runtime:{getURL:(path:string)=>`chrome-extension://fixture${path}`},storage:{local:{get:async()=>({}),set:async()=>{}},onChanged:{addListener:()=>{}}}});
 vi.stubGlobal('fetch',vi.fn(async value=>{const url=new URL(String(value));expect(url.protocol).toBe('chrome-extension:');expect(url.host).toBe('fixture');const locale=url.pathname.split('/')[2]as Locale;return new Response(JSON.stringify(catalogs[locale]));}));
 i18n=await import('../../apps/extension/src/i18n');await i18n.i18nReady;
});
afterAll(()=>vi.unstubAllGlobals());

describe.each(supportedLanguages)('cloud errors in %s',locale=>{
 for(const mode of ['manual','auto']as const)it(`resolves provider and existing direct errors in ${mode} mode without exposing codes`,async()=>{
  nativeLocale=mode==='auto'?locale:'en';uiLanguage=nativeLocale.replace('_','-');await i18n.setLanguage(mode==='auto'?'auto':locale);
  for(const code of prefixed)expect(i18n.errorText(code)).toBe(catalogs[locale][`err_${code}`]!.message);
  for(const code of direct)expect(i18n.errorText(code)).toBe(catalogs[locale][code]!.message);
  expect(i18n.errorText('cloudUnknownProviderFailure')).toBe(catalogs[locale].cloudNetwork!.message);
  expect(i18n.rtl.value).toBe(locale==='ar'||locale==='ur');
 });
});
it('keeps the native regional automatic locale and the other error families',async()=>{
 nativeLocale='fr';uiLanguage='fr-CA';await i18n.setLanguage('auto');expect(i18n.language.value).toBe('fr-CA');
 for(const code of ['playlistRead','liveAudio','cropRange','trimRange','recordingDenied'])expect(i18n.errorText(code)).toBe(catalogs.fr[code]!.message);
 for(const [code,key]of [['html','html'],['sourceRestricted','sourceRestricted'],['sourceChanged','invalid'],['codec','unsupported'],['missing','network'],['private','excluded'],['unknownFailure','interrupted']])expect(i18n.errorText(code!)).toBe(catalogs.fr[`err_${key}`]!.message);
});
