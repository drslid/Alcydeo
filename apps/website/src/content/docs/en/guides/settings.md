---
title: "Settings"
---

Saving files

Save automatically. Show Save As for every download.

Files are saved in Chrome’s chosen download directory, inside this subfolder. Change the main directory in Chrome’s download settings.

Choose the main folder in Chrome

Theme. Toolbar badge. Blocked hosts (one per line; * allowed). Save settings. Reset settings.

Automatic media detection

Enabled by default. Chrome grants site access at installation. You can pause detection here or limit site access in Chrome.

clip.webm → clip-converted.mp4

MP4 conversion

MP4 with H.264 video and AAC audio. One file at a time; keep the manager open. The original is kept. Compatible tracks are copied; other supported tracks are re-encoded, which can take longer and change quality.

Video quality: Automatic · copy compatible video / High quality / Balanced / Smaller file.

Maximum resolution: Original · no enlargement / 1080p / 720p / 480p.

Audio bitrate: Automatic · copy compatible AAC / 128 / 192 / 256 kb/s.

Defaults for MP4 conversion. Quality, resolution or audio changes may require re-encoding. Size and speed depend on the source and your computer.

Conversion stays local. A copy of the selected source and the MP4 stay in browser temporary storage until the task is removed. The disk original is kept. File contents are not uploaded.

Conversion runs one file at a time. After a pause or manager closure it restarts from the saved input.

Saving files: Save automatically. Show Save As for every download.

Files are saved in Chrome’s chosen download directory, inside this subfolder. Change the main directory in Chrome’s download settings.

## Simultaneous downloads — 0.1.60

Files in parallel: 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8.

1 to 8 files at a time, independently of connections per file. Queued files start as soon as a slot is free.

Lowering the limit lets current downloads finish. Conversions still run one at a time.

### Multi-part downloads

Use multiple connections for compatible files and DASH.

Connections per file: 2 / 4 / 8.

Keep the manager open. Compatible audio/video tracks can download together. Splitting one resource requires reliable byte ranges and a strong version validator; otherwise standard transfer is used. Speed depends on the server and your connection.

## Library

Your videos, downloads and processing jobs in one place.

Select this page · Convert to MP4 · Compress · Merge clips · Cloud · Delete selection

Files are processed one at a time. Original files are kept. Choose any missing local copies below.

Visual trim editor — Drag the handles to choose the start and end, preview the selection, then save it as MP4.

Visual merge editor — Drag clips to reorder them, or use the arrows. Click a thumbnail to preview a clip.

Compression defaults: Used for Compress in the library. Quality, maximum resolution and audio bitrate affect size and processing time.

Capture quality: 720p / 1080p / 4K. Keeps up to 4K at 30 fps with a higher bitrate. Detail depends on the captured source; enlarging pixels cannot restore missing detail.

Draw on the captured tab · Undo stroke · Clear drawing

Language: English / Español / Français / Deutsch / 简体中文 / العربية / Русский / Português / हिन्दी / اردو.

Original file downloads; these extensions do not guarantee that Chrome can play or convert every codec. M3U8 and MPD describe segmented streams.

MP4 · WEBM · M3U8 · MPD · M4V · MKV · TS · MOV · AVI · OGG · MPG · WMV · FLV · 3GP · M2TS · MTS

MP3 · AAC · M4A · FLAC · WAV

Ignore files smaller than: 10 KB / 100 KB / 1 MB / 2 MB. Unknown sizes remain visible. Playlist sizes are not video sizes.

One domain or URL per line, including its subdomains. All other sites are scanned when automatic detection is enabled.

## Video tools

Trim a video or join clips in the order you choose. Processing stays on your device.

Local MP4 conversion to H.264/AAC. Unsupported codecs are reported.

Create a local H.264/AAC MP4 with the compression defaults in Settings. A smaller file is not guaranteed.

Choose 2–20 clips and order them. MP4 is normalized up to 720p/30 fps. Each clip must have one video track and the same audio layout.

Drag the handles to choose the start and end, preview the selection, then save it as MP4.

## Record stream

Live — Records a supported HLS live source directly. Other playing sources use tab capture.

Player stream — Save received HLS segments directly, keeping the source quality. This mode supports unencrypted TS/fMP4 with audio and video in the same stream. Keep the manager open. For other sources use Tab capture.

Starts at a recent complete segment, which may include a few seconds before your click. Stop and save finishes the current segment, then creates a checked MP4. Earlier broadcast content is not recovered.

This live stream has separate audio. Use a combined HLS source or Tab capture; no silent video-only file is saved.

Live recording was interrupted. Save the received part; missing broadcast time cannot be recovered.

Tab capture — Capture the current tab from the popup, or choose a screen here. Uses a higher bitrate and up to the source resolution. Keep this manager open.

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

## Delete temporary files — 0.1.63

Deletes local Cloud copies and cancels queued uploads. Originals and sharing links are kept.

Temporary files deleted. Transfer history and sharing links are kept.

A transfer or preparation is in progress. Wait for it to finish or cancel it before cleaning up.

[Gofile API](https://gofile.io/api) · [pCloud API](https://docs.pcloud.com/methods/upload_links/uploadtolink.html)

## Checking source…

A small sample is checked before download. This does not validate the complete file. Refresh to test the proposals again.

The check found an invalid, unavailable or too-small source. Reload the original player, then scan again.

This source is smaller than the minimum size selected in Settings.

[TV playback](/Alcydeo/en/guides/tv/)
