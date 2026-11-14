// This function is serialized by chrome.scripting. Keep it self-contained.
export function scanPage(previews=true,allowYoutube=false, suffix='\\.(mp4|webm|m3u8|mpd)(?:[?#]|$)',blockedSites:string[]=[]) {
  if (!allowYoutube&&/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(location.hostname)) throw new Error('excluded');
  const host=location.hostname.toLowerCase();
  if(blockedSites.some(p=>{const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'.*');return p.includes('*')?new RegExp(`^${escaped}$`).test(host)||(p.startsWith('*.')&&host===p.slice(2)):host===p||host.endsWith(`.${p}`);})){(globalThis as typeof globalThis&{__alcydeoObserveCleanup?:()=>void}).__alcydeoObserveCleanup?.();return {media:[],frameOrigins:[]};}
  const mediaLink=new RegExp(suffix,'i');
  const valid = (value: string) => { if (!value.trim()) return undefined; try { const u = new URL(value, document.baseURI); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password ? u.href : undefined; } catch { return undefined; } };
  const roots:(Document|ShadowRoot)[]=[document];let inspected=0;
  for(const root of roots){for(const el of root.querySelectorAll('*')){if(++inspected>20000)break;if(el.shadowRoot&&roots.length<128)roots.push(el.shadowRoot);}if(inspected>20000)break;}
  const query=(selector:string)=>roots.flatMap(root=>Array.from(root.querySelectorAll(selector)));
  const found: { title: string; explicitTitle?:boolean; urls: { url: string; label: string }[]; duration?: number; height?: number; poster?: string }[] = [];
  for (const el of query('video,audio')) {
    const media = el as HTMLMediaElement;
    const sources = [{ url: media.currentSrc || media.getAttribute('src') || '', label: (media as HTMLVideoElement).videoHeight ? `${(media as HTMLVideoElement).videoHeight}p` : '' }, ...Array.from(media.querySelectorAll('source')).map(s => ({ url: s.getAttribute('src') ?? '', label: s.getAttribute('label') ?? s.getAttribute('size') ?? '' }))];
    const urls = sources.flatMap(s => { const url = valid(s.url); return url ? [{ url, label: s.label }] : []; }).filter((s, i, a) => a.findIndex(t => t.url === s.url) === i);
    let poster: string | undefined;
    if (previews && media instanceof HTMLVideoElement && media.readyState >= 2) { try { const canvas=document.createElement('canvas');canvas.width=224;canvas.height=126;canvas.getContext('2d')?.drawImage(media,0,0,224,126);poster=canvas.toDataURL('image/webp',0.65); } catch { /* Cross-origin pixels stay protected. */ } }
    const namedTitle=(media.getAttribute('title') || media.getAttribute('aria-label') || '').trim();
    if (urls.length) found.push({ title: namedTitle || document.title,explicitTitle:!!namedTitle, urls, duration: Number.isFinite(media.duration) ? media.duration : undefined, height: (media as HTMLVideoElement).videoHeight || undefined, poster });
  }
  for (const el of query('a[href]')) {
    const a = el as HTMLAnchorElement; const url = valid(a.href);
    const namedTitle=(a.getAttribute('title') || a.textContent || '').trim();
    if (url && mediaLink.test(url) && !found.some(f => f.urls.some(s => s.url === url))) found.push({ title: namedTitle || document.title,explicitTitle:!!namedTitle, urls: [{ url, label: a.getAttribute('data-quality') || a.getAttribute('data-resolution') || '' }] });
  }
  // Recover recognizable media requested before the popup/permission was opened, without
  // treating blob: URLs or iframe HTML documents as downloadable videos.
  for (const entry of performance.getEntriesByType('resource').slice(-1500)) {
    if('initiatorType' in entry&&['iframe','script','link','img','css','beacon'].includes(String(entry.initiatorType)))continue;
    const url=valid(entry.name);
    if(url&&mediaLink.test(url)&&!/\.(ts|aac)(?:[?#]|$)/i.test(url)&&!found.some(f=>f.urls.some(s=>s.url===url)))found.push({title:document.title,urls:[{url,label:''}]});
  }
  const frameOrigins = [...new Set(query('iframe[src]').flatMap(frame => { const url=valid(frame.getAttribute('src')??'');return url?[new URL(url).origin]:[]; }))].slice(0,32);
  return { media:found.slice(0, 200), frameOrigins };
}
