---
title: "Compatibility and limits"
---

Direct files and tested unencrypted HLS/DASH variants are supported. Source access, codecs and storage determine compatibility. Protected media are refused. Allow roughly three times the media size for segmented processing; large-file limits are not universally validated.

Google Cast remains experimental. The user confirmed one official Google demo on Shield; other sources and private files are not covered by that result. Use Chrome tab casting for local files on Shield. AirPlay is unavailable in Chrome on Windows.

Gofile, MegaUp, 1fichier and Turbobit sharing, plus pCloud upload links, are optional. Sending requires your click. Provider protocols have local tests; real uploads are not validated. Provider limits and retention apply.

The local build experimentally detects YouTube and handles separate tracks/SABR. One supplied Short completed at 144p/720p with audio/video; other videos, qualities and sessions need separate validation. The Store ZIP excludes YouTube. Start the normal player; interrupted SABR restarts from the beginning. No universal site compatibility is promised.

## 0.1.52

TikTok uses the current post’s native media metadata and keeps up to three original CDN addresses per quality. A failed address may be replaced only after its own media check; downloads keep the selected quality and title. Server rate limits still require waiting. Keep the source page and manager open until saving finishes.

## 0.1.51

Trim times are editable directly beside the video: enter seconds, m:ss or h:mm:ss with up to three decimal places. Handles and fields stay synchronized; an invalid interval cannot be exported. Segmented transfers preserve the original failure when other requests are stopped. A server rate limit still requires waiting; it is not bypassed.

## 0.1.50

Direct, HLS and DASH proposals and badges appear after bounded media-prefix checks: at most two simultaneous background checks, without opening the popup. Uncertain sources stay hidden; Scan page retries them. Real checks cover the exact Instagram Reel, excluding recommendations, plus TikTok and Odysee. Access limits and challenges are reported; complete Odysee downloading remains unverified. Container dimensions appear when available. Consistent HTTP totals describe the complete source; ≈ marks estimates, never just an HLS initialization fragment’s size. Missing metadata stays unknown. Local YouTube SABR, playlist and capture prototypes keep distinct validation limits; this precheck does not certify their bytes. Compatibility remains limited.

## 0.1.49

Separate audio and video sources belonging to the same HLS VOD are grouped after their tracks are checked. One proposal keeps the available qualities and combines both tracks. No additional URL normalization is applied; other formats and players remain subject to the documented limits.

## Crop — 0.1.48

Select an area of the video to export as a new MP4. The original is kept.

Drag to draw a new area. Drag inside it to move, or use its handles to resize. Arrow keys move it by 1 pixel; hold Shift for 10 pixels.

## 0.1.46

Additional HLS VOD duplicates are grouped after comparing the download plan and sampled bytes; the original player URL is retained. The optional 2/4/8-connection setting can fetch compatible DASH audio and video tracks together. Splitting one resource requires a strong version validator and reliable byte ranges. Speed depends on the server and connection.

## VK Video — 0.1.43

VK Video: compatible DASH videos appear as one source with a quality selector. Playback fragments and interface sounds are excluded. Alcydeo combines the declared video and audio resources and saves a checked MP4. The supplied 7 min 53 s video was saved and fully decoded in 144p (AV1/Opus). Other codecs, live streams, private access and DRM are not universally supported. Keep the manager open during processing.

## X — 0.1.38

X post pages: reload the post after updating Alcydeo. Native metadata supplies the video title and MP4 qualities, even with a Blob player. The current and legacy bootstrap data are read without executing scripts. Audio/video playback playlists are not offered separately when a complete file is available. The supplied post is saved and fully decoded as a 57.6-second AVC/AAC MP4. Feeds, private posts, live streams and every layout are not universally validated. No new permission, account, API or companion is required.

## TikTok — 0.1.37

TikTok post pages: Alcydeo reads the selected post’s native catalog even when its player uses a Blob. Qualities and codecs share one card with the real title. The source frame samples and streams the original file into local processing, without altered headers/signatures or a companion. Keep TikTok and the manager open; the popup may close. Interrupted files restart. The supplied 33-second AVC/AAC post is saved and fully decoded; feeds, live, private posts and every codec/layout are not universally validated.

## YouTube playlist — 0.1.38

Local build only: on a YouTube playlist, available videos are checked initially. Uncheck any videos, choose a quality limit and start. Files are saved one at a time in a subfolder named after the playlist, with original positions and video titles. Keep the manager open; the popup may close. Resume skips already saved files; failed items can be retried separately. Metadata must load completely before starting (up to 5,000 entries / 100 pages). This uses native browse continuations and one muted owned player tab, without access bypass. Full real YouTube playlist transfers remain unvalidated. The Store package excludes this feature.

This evolving mix includes only the titles currently loaded by YouTube. Select the ones to save; future suggestions are not included.

clip.webm → clip-converted.mp4

MP4 conversion

MP4 with H.264 video and AAC audio. One file at a time; keep the manager open. The original is kept. Compatible tracks are copied; other supported tracks are re-encoded, which can take longer and change quality.

Video quality: Automatic · copy compatible video / High quality / Balanced / Smaller file.

Maximum resolution: Original · no enlargement / 1080p / 720p / 480p.

Audio bitrate: Automatic · copy compatible AAC / 128 / 192 / 256 kb/s.

Defaults for MP4 conversion. Quality, resolution or audio changes may require re-encoding. Size and speed depend on the source and your computer.

Conversion stays local. A copy of the selected source and the MP4 stay in browser temporary storage until the task is removed. The disk original is kept. File contents are not uploaded.

Conversion runs one file at a time. After a pause or manager closure it restarts from the saved input.

## Record a live stream

Save received HLS segments directly, keeping the source quality. This mode supports unencrypted TS/fMP4 with audio and video in the same stream. Keep the manager open. For other sources use Tab capture.

Starts at a recent complete segment, which may include a few seconds before your click. Stop and save finishes the current segment, then creates a checked MP4. Earlier broadcast content is not recovered.

This live stream has separate audio. Use a combined HLS source or Tab capture; no silent video-only file is saved.

Live recording was interrupted. Save the received part; missing broadcast time cannot be recovered.
