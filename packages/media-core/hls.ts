import { safeUrl, type Variant } from '../contracts';
export interface Segment { url: string; range?: { start: number; length: number } }
export interface TrackPlan { segments: Segment[]; duration?: number; durationComplete?:boolean;type: 'combined' | 'audio' | 'video';live?:boolean }
export interface Plan { tracks: TrackPlan[]; duration?: number;live?:boolean }
function attributes(line: string): Record<string, string> {
  return Object.fromEntries([...line.matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)].map(m => [m[1]!, m[2]!.replace(/^"|"$/g, '')]));
}
export function parseHls(text: string, url: string): { variants: Variant[]; track?: TrackPlan } {
  if (!text.trimStart().startsWith('#EXTM3U')) throw new Error('invalid');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.some(l => l.startsWith('#EXT-X-SESSION-KEY') || (l.startsWith('#EXT-X-KEY:') && attributes(l).METHOD !== 'NONE'))) throw new Error('encrypted');
  const audio = new Map<string, string>();
  for (const line of lines) if (line.startsWith('#EXT-X-MEDIA:')) { const a = attributes(line); if (a.TYPE === 'AUDIO' && a.URI && (!audio.has(a['GROUP-ID']!) || a.DEFAULT === 'YES')) audio.set(a['GROUP-ID']!, safeUrl(a.URI, url)); }
  const variants: Variant[] = [];
  for (let i = 0; i < lines.length; i++) if (lines[i]!.startsWith('#EXT-X-STREAM-INF:')) {
    const a = attributes(lines[i]!); const next = lines[i + 1]; if (!next || next.startsWith('#')) throw new Error('invalid');
    const height = Number(a.RESOLUTION?.split('x')[1]) || undefined;
    variants.push({ id: String(i), url: safeUrl(next, url), label: height ? `${height}p` : a.NAME ?? `${Math.round(Number(a.BANDWIDTH) / 1000)} kb/s`, height, bandwidth: Number(a.BANDWIDTH) || undefined, audioUrl: audio.get(a.AUDIO!) });
  }
  if (variants.length) return { variants: variants.sort((a, b) => (b.height ?? b.bandwidth ?? 0) - (a.height ?? a.bandwidth ?? 0)) };
  if (!lines.includes('#EXT-X-ENDLIST')) throw new Error('live');
  if (lines.some(l => l === '#EXT-X-DISCONTINUITY' || l.startsWith('#EXT-X-GAP'))) throw new Error('discontinuity');
  const segments: Segment[] = []; let duration = 0; let range: Segment['range']; let previousUrl = ''; let end = 0; let implicitRange = false;let init:Segment|undefined;let durationComplete=true,pendingDuration:number|undefined,mediaSegments=0;
  const byteRange=(value:string,offset?:number)=>{const match=/^(\d+)(?:@(\d+))?$/.exec(value);if(!match)throw new Error('invalid');const length=Number(match[1]),start=match[2]===undefined?offset:Number(match[2]);if(!Number.isSafeInteger(length)||length<=0||start===undefined||!Number.isSafeInteger(start)||start<0||!Number.isSafeInteger(start+length))throw new Error('invalid');return{start,length};};
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {duration += Number.parseFloat(line.slice(8)) || 0;const value=line.slice(8).split(',')[0]!.trim();if(pendingDuration!==undefined)durationComplete=false;pendingDuration=/^\d+(?:\.\d+)?$/.test(value)?Number(value):NaN;}
    if (line.startsWith('#EXT-X-MAP:')) {
      const a = attributes(line); if (!a.URI) throw new Error('invalid');
      const map:Segment={url:safeUrl(a.URI,url),...(a.BYTERANGE?{range:byteRange(a.BYTERANGE)}:{})};
      if(segments.length&&(!init||JSON.stringify(init)!==JSON.stringify(map)))throw new Error('discontinuity');
      if(!init){init=map;segments.push(map);}
    }
    if (line.startsWith('#EXT-X-BYTERANGE:')) {implicitRange=!line.slice(17).includes('@');range=byteRange(line.slice(17),end);}
    if (!line.startsWith('#')) {
      if(pendingDuration===undefined||!Number.isFinite(pendingDuration)||pendingDuration<=0)durationComplete=false;pendingDuration=undefined;mediaSegments++;
      const segmentUrl = safeUrl(line, url);
      if (range && implicitRange && (!end || previousUrl !== segmentUrl)) throw new Error('invalid');
      segments.push({ url: segmentUrl, ...(range ? { range: { ...range } } : {}) });
      previousUrl = segmentUrl; end = range ? range.start + range.length : 0; range = undefined;
    }
  }
  if (!segments.length || segments.length > 100_000) throw new Error('manifestLimit');
  return { variants: [], track: { type: 'combined', segments, duration,durationComplete:durationComplete&&pendingDuration===undefined&&mediaSegments>0 } };
}
