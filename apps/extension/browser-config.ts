import type{UserManifest}from'wxt';

export function buildDefines(browser:string,distribution:string|undefined,sender:string|undefined){
 const firefox=browser==='firefox',local=!firefox&&distribution!=='store';
 return{__ALCYDEO_LOCAL__:JSON.stringify(local),'import.meta.env.ALCYDEO_LOCAL':JSON.stringify(local),__ALCYDEO_FIREFOX__:JSON.stringify(firefox),__ALCYDEO_CAST_SENDER_URL__:JSON.stringify(firefox?'':sender??'https://drslid.github.io/Alcydeo/cast/'),...(firefox?{chrome:'browser'}:{})};
}

export function extensionManifest(browser:string,version:string):UserManifest{
 const firefox=browser==='firefox';
 return{
  manifest_version:3,name:'__MSG_appName__',description:'__MSG_appDescription__',default_locale:'en',version,
  homepage_url:'https://drslid.github.io/Alcydeo/',incognito:'not_allowed',
  ...(firefox?{browser_specific_settings:{gecko:{id:'alcydeo@drslid.github.io',strict_min_version:'153.0',data_collection_permissions:{required:['none'],optional:['websiteContent','personallyIdentifyingInfo']}}}}:{minimum_chrome_version:'120'}),
  permissions:['activeTab','scripting','storage','downloads','webRequest',...(!firefox?['tabCapture']:[])],
  optional_permissions:[],optional_host_permissions:firefox?[]:['file:///*'],host_permissions:['http://*/*','https://*/*'],
  action:{default_title:'__MSG_appName__',default_popup:'popup.html'},
  icons:{16:'icons/16.png',32:'icons/32.png',48:'icons/48.png',128:'icons/128.png'},
  content_security_policy:{extension_pages:"script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; base-uri 'none'"},
 };
}
