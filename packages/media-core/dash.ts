import { XMLParser } from 'fast-xml-parser';
import { safeUrl, type Variant } from '../contracts';
import type { Plan, TrackPlan, Segment } from './hls';
const array = (x: any): any[] => x === undefined ? [] : Array.isArray(x) ? x : [x];
function seconds(s: string): number { const m = /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(s ?? ''); return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0; }
export function parseDash(xml: string, url: string, selected?: string): { variants: Variant[]; plan: Plan; resources:string[] } {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('invalid');
  // XML escapes are syntax, not part of a signed URL. DTD/entities are refused
  // above; decode the standard XML escapes once, including URL attributes.
  const mpd = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', processEntities: true, parseTagValue: false }).parse(xml)?.MPD;
  if (!mpd) throw new Error('invalid'); if (mpd.type === 'dynamic') throw new Error('live');
  const periods = array(mpd.Period); if (periods.length !== 1) throw new Error('periods');
  const period = periods[0]; const duration = seconds(period.duration ?? mpd.mediaPresentationDuration);
  const variants: Variant[] = []; const tracks: TrackPlan[] = [];
  const representations: { a: any; r: any; type: string; base: string }[] = [];
  const baseOf = (base: string, o: any) => o.BaseURL ? safeUrl(String(array(o.BaseURL)[0]?.['#text'] ?? array(o.BaseURL)[0]), base) : base;
  for (const a of array(period.AdaptationSet)) for (const r of array(a.Representation)) {
    if (a.ContentProtection || r.ContentProtection) throw new Error('encrypted');
    const type = r.contentType ?? a.contentType ?? String(r.mimeType ?? a.mimeType ?? '').split('/')[0];
    const id = String(r.id ?? representations.length);
    if (type === 'video') variants.push({ id, url, height: Number(r.height) || undefined, bandwidth: Number(r.bandwidth) || undefined, label: r.height ? `${r.height}p` : id });
    representations.push({ a, r: { ...r, id }, type, base: baseOf(baseOf(baseOf(baseOf(url, mpd), period), a), r) });
  }
  const chosen = selected ?? variants.sort((a,b) => (b.height ?? 0) - (a.height ?? 0))[0]?.id;
  let audioChosen = false;
  for (const { a, r, type, base } of representations) {
    if (type === 'video' && r.id !== chosen) continue;
    if (type === 'audio') { if (audioChosen) continue; audioChosen = true; } else if (type !== 'video') continue;
    const segments: Segment[] = [];
    const list = r.SegmentList ?? a.SegmentList; const template = r.SegmentTemplate ?? a.SegmentTemplate ?? period.SegmentTemplate;
    const substitute = (pattern: string, number: number, time: number) => pattern.replace(/\$\$/g, '__ALCYDEO_DOLLAR__').replace(/\$(RepresentationID|Bandwidth|Number|Time)(?:%0(\d+)d)?\$/g, (_: string, key: string, pad: string) => String(({ RepresentationID: r.id, Bandwidth: r.bandwidth, Number: number, Time: time } as any)[key]).padStart(Number(pad) || 0, '0')).replaceAll('__ALCYDEO_DOLLAR__', '$');
    if (list) {
      const range = (s: string) => { const [start,end] = s.split('-').map(Number); if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end! < start!) throw new Error('invalid'); return { start: start!, length: end! - start! + 1 }; };
      if (list.Initialization) segments.push({ url: safeUrl(list.Initialization.sourceURL ?? base, base), ...(list.Initialization.range ? { range: range(list.Initialization.range) } : {}) });
      for (const s of array(list.SegmentURL)) segments.push({ url: safeUrl(s.media, base), ...(s.mediaRange ? { range: range(s.mediaRange) } : {}) });
    } else if (template?.media) {
      const timescale = Number(template.timescale ?? 1); const start = Number(template.startNumber ?? 1); let number = start;
      if (template.initialization) segments.push({ url: safeUrl(substitute(template.initialization, start, 0), base) });
      if (template.SegmentTimeline) {
        let time = 0;
        for (const s of array(template.SegmentTimeline.S)) {
          time = Number(s.t ?? time); const d = Number(s.d); let repeat = Number(s.r ?? 0);
          if (repeat < 0) throw new Error('timeline'); if (repeat > 100_000 || d <= 0) throw new Error('manifestLimit');
          while (repeat-- >= 0) { segments.push({ url: safeUrl(substitute(template.media, number++, time), base) }); time += d; }
        }
      } else {
        const d = Number(template.duration); const count = Math.ceil(duration * timescale / d);
        if (!Number.isFinite(count) || count <= 0 || count > 100_000) throw new Error('manifestLimit');
        for (let i = 0; i < count; i++) segments.push({ url: safeUrl(substitute(template.media, number++, i * d), base) });
      }
    } else if (r.BaseURL) segments.push({ url: base }); else throw new Error('unsupported');
    if (!segments.length || segments.length > 100_000) throw new Error('manifestLimit');
    tracks.push({ type: type as 'audio' | 'video', segments, duration });
  }
  if (!tracks.length) throw new Error('invalid');
  const resources=representations.filter(({a,r,type})=>['video','audio'].includes(type)&&r.BaseURL&&!r.SegmentList&&!a.SegmentList&&!r.SegmentTemplate&&!a.SegmentTemplate&&!period.SegmentTemplate).map(({base})=>base);
  return { variants, plan: { tracks, duration },resources };
}
