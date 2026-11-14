import type { Kind } from '../contracts';
import {directExtensions,formatMime} from './formats';
export const mimeType = (value = '') => value.split(';')[0]!.trim().toLowerCase();
export const htmlResponse = (mime: string, filename = '') => ['text/html','application/xhtml+xml'].includes(mimeType(mime)) || /\.(html?|xhtml)$/i.test(filename);
export function mediaKind(url: string, contentType = ''): Kind {
  const mime = mimeType(contentType);
  if (/mpegurl/.test(mime) || /\.m3u8(?:\?|$)/i.test(url)) return 'hls';
  if (mime === 'application/dash+xml' || /\.mpd(?:\?|$)/i.test(url)) return 'dash';
  return 'direct';
}
export function directExtension(url: string, contentType = '') {
  let path='';try{path=new URL(url).pathname;}catch{/* MIME still identifies dynamic endpoints. */}
  const suffix=path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const mime=mimeType(contentType);
  // Preserve MTS/M2TS and MPG rather than replacing their recognized suffix.
  if(suffix&&directExtensions.some(ext=>ext===suffix)&&(!mime||mime===formatMime[suffix]||['application/octet-stream','binary/octet-stream','application/binary'].includes(mime)))return suffix;
  const aliases:Record<string,string>={'video/matroska':'mkv','audio/x-wav':'wav','audio/wave':'wav','audio/x-flac':'flac','audio/x-aac':'aac','video/avi':'avi','video/msvideo':'avi','application/ogg':'ogg','audio/3gpp':'3gp','video/mp2t':'ts','audio/aacp':'aac','audio/mp3':'mp3','audio/vnd.wave':'wav','audio/x-m4a':'m4a','application/vnd.ms-asf':'wmv'};
  return aliases[mime]??Object.keys(formatMime).find(ext=>formatMime[ext]===mime)??(suffix&&directExtensions.some(ext=>ext===suffix)?suffix:undefined);
}
export function responseFilename(disposition = '') {
  if(disposition.length>4096)return '';
  const encoded=/(?:^|;)\s*filename\*\s*=\s*UTF-8'[^']*'([^;]*)/i.exec(disposition)?.[1]?.trim();
  if(encoded){try{return decodeURIComponent(encoded);}catch{/* Fall back to the ordinary filename. */}}
  return /(?:^|;)\s*filename\s*=\s*(?:"([^"]*)"|([^;]*))/i.exec(disposition)?.slice(1).find(Boolean)?.trim()??'';
}
export function networkMedia(url: string, contentType: string, filename = '', explicit=false) {
  if (htmlResponse(contentType,filename)) return false;
  const kind = mediaKind(url,contentType);
  if (kind !== 'direct') return true;
  // Some CDNs serve complete media as generic binary data. A media suffix
  // must belong to the actual path, never a proxy's file/query parameter.
  let path:string;try{path=new URL(url).pathname;}catch{return false;}
  const mime=mimeType(contentType),binary=['','application/octet-stream','binary/octet-stream','application/binary'].includes(mime);
  const suffix=path.split('.').pop()?.toLowerCase();
  const direct=/^(video|audio)\//.test(mime)||['application/ogg','application/vnd.ms-asf'].includes(mime)||(binary&&directExtensions.some(ext=>ext===suffix));
  return direct && mime!=='video/iso.segment' && !/\.m4s(?:[?#]|$)/i.test(url) && (explicit||!((mime==='video/mp2t'||/\.(ts|aac)(?:[?#]|$)/i.test(url))&&!/\.(m2ts|mts)(?:[?#]|$)/i.test(url))) && !/(?:^|\/)(?:init|chunk|segment)[-_][^/]*\.mp4(?:\?|$)/i.test(url);
}
