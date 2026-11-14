import{ref,computed}from'vue';
import{supportedLanguages,messageText,type Message,type Locale}from'../../../packages/i18n/manual';
export const language=ref(chrome.i18n.getUILanguage()),choice=ref<Locale|'auto'>('auto');
const catalog=ref<Record<string,Message>>({});let generation=0;const catalogs=new Map<string,Promise<Record<string,Message>>>();
export const t=(key:string,substitutions?:string[])=>catalog.value[key]?messageText(catalog.value[key]!,substitutions):chrome.i18n.getMessage(key,substitutions)||key;
export const rtl=computed(()=>/^(ar|ur)(-|_|$)/i.test(language.value));
async function apply(value:unknown){const current=++generation,next=supportedLanguages.includes(value as Locale)?value as Locale:'auto';let messages:Record<string,Message>={};if(next!=='auto'){try{if(!catalogs.has(next))catalogs.set(next,fetch(chrome.runtime.getURL(`/_locales/${next}/messages.json`)).then(response=>response.json()));messages=await catalogs.get(next)!;}catch{return;}}if(current!==generation)return;choice.value=next;catalog.value=messages;language.value=next==='auto'?chrome.i18n.getUILanguage():next.replace('_','-');}
export const i18nReady=chrome.storage.local.get('language').then(data=>apply(data.language));
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.language)void apply(changes.language.newValue);});
export async function setLanguage(locale:Locale|'auto'){await chrome.storage.local.set({language:locale});await apply(locale);}
export function errorText(code: string) {
  if(code.startsWith('playlist'))return t(code);
  if(['liveAudio','notLive','liveGap','liveVariant','liveEmpty','liveInterrupted'].includes(code))return t(code);
  if(code.startsWith('cloud')){const direct=t(code);if(direct!==code)return direct;const key=`err_${code}`,specific=t(key);return specific!==key?specific:t('cloudNetwork');}
  if(['trimRange','mergeTracks','cropRange','recordingInterrupted','recordingSlow','recordingDenied','recordingUnavailable'].includes(code))return t(code);
  if(['tooSmall','chooseQuality','manifestLoop','saveDialog','sourcePending','sourceRestricted','conversionCodec','conversionInput'].includes(code))return t(`err_${code}`);
  const group = ['html','notMedia','permission','network','expired','unsupported','encrypted','invalid','space','excluded','blocked','interrupted'].includes(code) ? code : ['private'].includes(code) ? 'excluded' : ['missing','retryLater'].includes(code) ? 'network' : ['duration','sourceChanged','range'].includes(code) ? 'invalid' : ['live','periods','timeline','codec','discontinuity','chooseQuality','manifestLimit'].includes(code) ? 'unsupported' : 'interrupted';
  return t(`err_${group}`);
}
export const bytes = (n?: number) => n === undefined ? t('unknownSize') : new Intl.NumberFormat(language.value, { style: 'unit', unit: n >= 1e9 ? 'gigabyte' : n >= 1e6 ? 'megabyte' : 'kilobyte', maximumFractionDigits: 1 }).format(n / (n >= 1e9 ? 1e9 : n >= 1e6 ? 1e6 : 1e3));
export const duration = (n?: number) => n === undefined ? '' : `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2,'0')}`;
