import { Input, BlobSource, ALL_FORMATS, EncodedPacketSink, Output, Mp4OutputFormat, StreamTarget, EncodedVideoPacketSource, EncodedAudioPacketSource, type EncodedPacket, type VideoCodec, type AudioCodec, type InputTrack } from 'mediabunny';
import type { MediaNotice,Validation } from '../contracts';
import {mediaLogs} from './media-logs';
export async function validate(file: File | Blob, expectedDuration?: number, expectedTracks?: number,notice?:(code:MediaNotice)=>void): Promise<Validation> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const logs=mediaLogs(notice);
  try {
    const tracks = (await input.getTracks()).filter(t => t.type === 'audio' || t.type === 'video');
    logs.check();
    if (!file.size || !tracks.length || (expectedTracks && tracks.length < expectedTracks)) throw new Error('invalid');
    const duration = await input.computeDuration();
    if (!Number.isFinite(duration) || duration <= 0 || (expectedDuration && Math.abs(duration - expectedDuration) > Math.max(2, expectedDuration * 0.02))) throw new Error('duration');
    for (const track of tracks) {
      const sink = new EncodedPacketSink(track);
      const [first, last] = await Promise.all([sink.getFirstPacket(), sink.getPacket(Infinity)]);
      if (!first?.data.length || !last?.data.length) throw new Error('invalid');
    }
    return { duration, tracks: await Promise.all(tracks.map(async t => ({ type: t.type, codec: await t.getCodec() }))), bytes: file.size, method: 'local-structure', checkedAt: Date.now() };
  } finally { input.dispose();logs.dispose(); }
}
export async function remux(files: File[], writable: FileSystemWritableFileStream, signal?: AbortSignal, progress?: (n: number) => void,notice?:(code:MediaNotice)=>void) {
  const inputs = files.map(file => new Input({ source: new BlobSource(file, { maxCacheSize: 4 * 1024 * 1024 }), formats: ALL_FORMATS }));
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'fragmented', minimumFragmentDuration: 2 }), target: new StreamTarget(writable, { chunked: true, chunkSize: 1024 * 1024 }) });
  type Stream = { iterator: AsyncGenerator<EncodedPacket, void, unknown>; next: IteratorResult<EncodedPacket, void>; source: EncodedVideoPacketSource | EncodedAudioPacketSource; config: unknown; first: boolean };
  const streams: Stream[] = []; let count = 0;const logs=mediaLogs(notice);
  try {
    const tracks: InputTrack[] = (await Promise.all(inputs.map(i => i.getTracks()))).flat().filter(t => t.type === 'video' || t.type === 'audio');
    logs.check();
    if (!tracks.length || tracks.length > 8) throw new Error('unsupported');
    for (const track of tracks) {
      const codec = await track.getCodec(); if (!codec) throw new Error('codec');
      const config = await (track as any).getDecoderConfig(); if (!config) throw new Error('codec');
      const source = track.type === 'video' ? new EncodedVideoPacketSource(codec as VideoCodec) : new EncodedAudioPacketSource(codec as AudioCodec);
      if (track.type === 'video') output.addVideoTrack(source as EncodedVideoPacketSource); else output.addAudioTrack(source as EncodedAudioPacketSource);
      const iterator = new EncodedPacketSink(track).packets(); streams.push({ iterator, next: await iterator.next(), source, config, first: true });
    }
    const offset = Math.min(...streams.filter(s => !s.next.done).map(s => s.next.value!.timestamp));
    await output.start();
    while (streams.some(s => !s.next.done)) {
      if (signal?.aborted) throw new Error('cancelled');
      const stream = streams.filter(s => !s.next.done).sort((a,b) => a.next.value!.timestamp - b.next.value!.timestamp)[0]!;
      const packet = stream.next.value!;
      await stream.source.add(offset ? packet.clone({ timestamp: packet.timestamp - offset }) : packet, stream.first ? { decoderConfig: stream.config as any } : undefined);
      stream.first = false; stream.next = await stream.iterator.next(); if (++count % 200 === 0) progress?.(count);
    }
    for (const stream of streams) stream.source.close();
    logs.check();await output.finalize(); return tracks.length;
  } catch (e) { await output.cancel().catch(() => {}); throw e; }
  finally { for (const input of inputs) input.dispose();logs.dispose(); }
}
