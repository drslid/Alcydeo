---
title: "Permissions and privacy"
---

The Chrome development ZIP includes experimental YouTube support. The separate Chrome Store preparation and Firefox package exclude YouTube. Firefox ZIP installation is temporary; no signed XPI or Store approval is claimed.

Firefox asks for optional native consent before a Cloud upload, covering file content and any personal data it may contain, such as a voice or image. Refusal prevents preparation and sending. There is no automatic upload.

The local YouTube experiment retains bounded observed player context and existing opaque transport tokens locally with the task. It does not generate attestations or execute remote player code. Exports omit these fields.

No telemetry. Library and tasks stay in this browser. Network access is limited to sources you allow.

Automatic media detection

Detection starts automatically on allowed sites. Pause it here or restrict site access in your browser.

Alcydeo may reread detected playlists automatically to identify qualities and fragments. The extension downloads media fragments only when you start a download.

Tasks store page/source URLs, including temporary signatures, locally in IndexedDB. Fragments and outputs use OPFS. Removing a task clears its record and temporary files, not the final saved file or Chrome download history. User exports omit URLs, paths and download IDs. Media requests contact allowed sources/CDNs using Chrome’s applicable sessions. Incognito is disabled. GitHub Pages hosts the public documentation and may log site visits. Public support: [GitHub Issues](https://github.com/drslid/Alcydeo/issues).

Clear history

Remove finished, failed and cancelled records and their temporary files from Alcydeo, across all pages and filters, including favorites. Saved files and active or paused downloads are kept.

## Detection diagnostics — 1.0.0

Library → Settings → Detection: choose the source tab to view or copy its local diagnostic. Safe codes and counters only; no automatic upload. The diagnostic is no longer in the popup.

Local report, without video links, cookies or signatures. Nothing is sent.

Local detection report → Copy report.

## X — 0.1.38

X post pages: reload the post after updating Alcydeo. Native metadata supplies the video title and MP4 qualities, even with a Blob player. The current and legacy bootstrap data are read without executing scripts. Audio/video playback playlists are not offered separately when a complete file is available. The supplied post is saved and fully decoded as a 57.6-second AVC/AAC MP4. Feeds, private posts, live streams and every layout are not universally validated. No new permission, account, API or companion is required.

## TikTok — 0.1.37

TikTok post pages: Alcydeo reads the selected post’s native catalog even when its player uses a Blob. Qualities and codecs share one card with the real title. The source frame samples and streams the original file into local processing, without altered headers/signatures or a companion. Keep TikTok and the manager open; the popup may close. Interrupted files restart. The supplied 33-second AVC/AAC post is saved and fully decoded; feeds, live, private posts and every codec/layout are not universally validated.

The local playlist catalog and continuation tokens stay in extension IndexedDB and are cleared on navigation or stale-session cleanup. Selected batches persist until terminal history cleanup. The native browse context stays in the YouTube page; ordinary requests use the browser session. No playlist data is sent to Alcydeo servers, Cloud or the documentation site.

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

Language choice and video thumbnails are stored locally with library records. Thumbnails come from accessible real files. Annotation strokes stay in the selected tab and are removed when recording stops. Removing records clears their temporary data and keeps saved disk files. Recording starts only after an explicit toolbar action or Chrome surface selection.

## Cloud — 0.1.57

Send only the file you choose, when you click Send. No automatic synchronization.

Send to all clouds without setup

Gofile · MegaUp · 1fichier · Turbobit. Each service keeps its own limits.

**Delete temporary files** — 0.1.58

Deletes local Cloud copies and cancels queued uploads. Originals and sharing links are kept.

Share a link : Gofile / MegaUp / 1fichier / Turbobit. Save to cloud storage : pCloud.

Gofile needs no sign-in and creates a public sharing link. Anyone with the link can access the file. Retention follows Gofile’s rules.

Experimental sharing without an account. Files are public and may expire after 30 days without activity. Keep your original file.

Experimental sharing without an account. Anyone with the link can access the file. Storage is not guaranteed after 15 days; keep your original. Availability may be delayed after sending.

Experimental sharing without an account, up to 200 MB per file. Anyone with the link can access it; guest storage lasts up to 7 days. Keep the original and check the file on Turbobit.

No sign-in here: paste an existing pCloud upload link and choose the folder’s data region. The folder owner needs a pCloud account. This deposits your file in that folder; it does not create a public download link.

Upload link or code — Folder’s data region: Europe / United States.

Retrying sends the whole file again. If the last response was lost, check the destination first to avoid a duplicate.

Keep the manager open. A temporary local copy holds the selected file. Removing a cloud entry clears its local copy and leaves the remote file.

Cloud protocols are tested locally. Real provider transfers still need validation; MegaUp is experimental. pCloud needs an existing upload link.

Capture the current tab from the popup, or choose a screen here. Uses a higher bitrate and up to the source resolution. Keep this manager open.
