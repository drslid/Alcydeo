// Identity only. Never use this comparison URL for a network request: VK's
// player adds a byte slice to a signed resource already declared by its MPD.
export function vkRangeResource(source:string):string|undefined{
  try{
    const url=new URL(source),parts=url.search.slice(1).split('&');
    if(!/(^|\.)vkuser\.net$/.test(url.hostname)||url.protocol!=='https:')return;
    const ranges=parts.filter(p=>p.startsWith('bytes='));if(ranges.length!==1)return;
    const match=/^bytes=(\d+)-(\d+)$/.exec(ranges[0]!);if(!match)return;
    const start=Number(match[1]),end=Number(match[2]);
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||end<start)return;
    return `${url.origin}${url.pathname}?${parts.filter(p=>!p.startsWith('bytes=')).join('&')}${url.hash}`;
  }catch{return;}
}
export function vkDecoration(pageUrl:string,source:string){
  try{const page=new URL(pageUrl),url=new URL(source);return /(^|\.)(vkvideo\.ru|vk\.com|vk\.ru)$/.test(page.hostname)&&url.origin===page.origin&&/^\/mp3\/bb[123]\.mp3$/.test(url.pathname);}catch{return false;}
}
