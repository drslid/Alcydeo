import { safeUrl } from '../contracts';
let workerOrigins: string[] = [];
export const allowWorkerOrigins = (origins: string[]) => { workerOrigins = origins; };
export function matchesOrigin(url: URL, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern === '<all_urls>') return true;
    const match = /^(https?|\*):\/\/([^/]+)\//.exec(pattern); if (!match) return false;
    const host = match[2]!.replace(/:\d+$/, '');
    return (match[1] === '*' || `${match[1]}:` === url.protocol) && (host === '*' || host === url.hostname || (host.startsWith('*.') && (url.hostname === host.slice(2) || url.hostname.endsWith(host.slice(1)))));
  });
}
export async function permitted(url: string) {
  const u = new URL(safeUrl(url));
  if (typeof chrome === 'undefined' || !chrome.permissions) return matchesOrigin(u, workerOrigins);
  return chrome.permissions.contains({ origins: [`${u.origin}/*`] });
}
export async function mediaFetch(url: string, init: RequestInit = {}): Promise<Response> {
  safeUrl(url);
  if (!await permitted(url)) throw new Error('permission');
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { ...init, credentials: 'include', redirect: 'error', cache: 'no-store' });
    if (response.ok) return response;
    await response.body?.cancel();
    if (response.status === 403 || response.status === 401) throw new Error('expired');
    if (response.status === 404 || response.status === 410) throw new Error('missing');
    if (![429, 500, 502, 503, 504].includes(response.status)) throw new Error('network');
    if (attempt === 3) throw new Error(response.status === 429 ? 'retryLater' : 'network');
    const header = response.headers.get('Retry-After');
    const retry = header ? (/^\d+$/.test(header) ? Number(header) * 1000 : Date.parse(header) - Date.now()) : 500 * 2 ** attempt + Math.random() * 250;
    if (retry > 60_000) throw new Error('retryLater');
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new Error('cancelled')); };
      const timer = setTimeout(() => { init.signal?.removeEventListener('abort', abort); resolve(); }, Math.max(0, retry));
      if (init.signal?.aborted) abort(); else init.signal?.addEventListener('abort', abort, { once: true });
    });
  }
  throw new Error('network');
}
export async function manifestText(url: string, signal?: AbortSignal) {
  const response = await mediaFetch(url, { signal });
  const reader = response.body?.getReader(); if (!reader) throw new Error('network');
  let text = ''; const decoder = new TextDecoder(); let bytes = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 2_000_000) throw new Error('manifestLimit'); text += decoder.decode(value, { stream: true }); } }
  finally { await reader.cancel(); }
  return text + decoder.decode();
}
