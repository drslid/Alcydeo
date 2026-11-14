export const supportedLanguages=['en','es','fr','de','zh_CN','ar','ru','pt','hi','ur']as const;
export type Locale=typeof supportedLanguages[number];
export interface Message{message:string;placeholders?:Record<string,{content:string}>}
export function messageText(entry:Message,values:string[]=[]){
 const escaped='\u0001';let text=entry.message.replace(/\$\$/g,escaped);
 text=text.replace(/\$([a-z_][\w]*)\$/gi,(_,key:string)=>{const pair=Object.entries(entry.placeholders??{}).find(([name])=>name.toLowerCase()===key.toLowerCase());return pair?.[1].content??'';});
 return text.replace(/\$(\d+)/g,(_,index:string)=>values[Number(index)-1]??'').replaceAll(escaped,'$');
}
