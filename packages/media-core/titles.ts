// Metadata is often absent, whitespace-only or a generic player label in an
// iframe. Keep the top-level page title as a separate fallback, never the URL.
export function usefulTitle(value:unknown):string|undefined {
  if(typeof value!=='string')return;
  const text=value.normalize('NFKC').replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu,' ').replace(/\s+/g,' ').trim().slice(0,300);
  if(!text||/^(?:alcydeo|alcydeo|video|vidéo|audio|player|video player|untitled)(?:\.(?:mp4|webm))?$/i.test(text))return;
  return text;
}
export function mediaTitle(title:unknown,pageTitle:unknown,previous?:unknown){return usefulTitle(title)??usefulTitle(pageTitle)??usefulTitle(previous)??'Alcydeo';}
