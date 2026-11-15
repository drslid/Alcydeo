---
title: "Troubleshooting"
---

Library → Settings → Detection: choose the source tab to view or copy its local diagnostic. Safe codes and counters only; no automatic upload. The diagnostic is no longer in the popup.

Firefox 153+ has its own package without YouTube. Chrome tab capture, Google Cast and AirPlay are unavailable in Firefox. Local processing depends on the codecs supported by that browser; the Firefox guide records the tested scope.

This source is not accessible.

The source returned an HTML page instead of media. The download was stopped. Refresh the original player and detect its media source again.

This response is not a supported media file. Refresh the player and detect its media source again.

The session or source link expired. Refresh the original page.

Not enough temporary storage. Remove old tasks and try again.

Encrypted or protected media is not supported.

The file could not be validated. Check that you selected the downloaded file.

After updating, reload Alcydeo and video pages which were already open. Version 0.1.39 stops obsolete page observers when Chrome messaging disappears, fixing the sendMessage/context-invalidated error. Historical errors can be cleared in Chrome’s extension Errors panel.

## 0.1.52

TikTok uses the current post’s native media metadata and keeps up to three original CDN addresses per quality. A failed address may be replaced only after its own media check; downloads keep the selected quality and title. Server rate limits still require waiting. Keep the source page and manager open until saving finishes.

## Detection diagnostics — 1.0.0

Library → Settings → Detection: choose the source tab to view or copy its local diagnostic. Safe codes and counters only; no automatic upload. The diagnostic is no longer in the popup.

Local report, without video links, cookies or signatures. Nothing is sent.

Local detection report → Copy report.

## 0.1.47

Assembled outputs that pass structural checks save automatically without a second click. Local browser playback no longer blocks saving; an unavailable codec may need another player. Older codec-playback failures with an intact retained output are saved without downloading again. Cancelling Save As still requires an explicit retry.

Original quality indicates that the source resolution is unknown. Sources identified as HTML are removed. When a player redirect is observed, the title and resolution stay attached to the actual media file.

Some CDNs send MP4 as application/octet-stream. Alcydeo retains the observed final signed media URL and excludes HTML wrappers, error pages and HTML attachments. Restart the original player after reloading the extension.

The badge updates when a source is detected, while the page or its frames may still be loading. Available qualities are filled in afterward. The site must first expose a media source.

Alcydeo may reread detected playlists automatically to identify qualities and fragments. The extension downloads media fragments only when you start a download.

A source URL may return another HLS list. Alcydeo follows a unique rendition to expose its actual qualities and resolves your selected rendition when downloading, up to six playlist levels. If that quality disappears, choose again; encrypted sources remain unsupported.

Timed metadata (0x15) was omitted from the saved file.

## Checking source…

A small sample is checked before download. This does not validate the complete file. Refresh to test the proposals again.

The check found an invalid, unavailable or too-small source. Reload the original player, then scan again.

This source is smaller than the minimum size selected in Settings.

[TV playback](/Alcydeo/en/guides/tv/)

Parallel parts are unavailable for this source. Using standard transfer.

This source now lists several qualities. Reopen Alcydeo on the video page, find qualities and select one again.

The source links back to a playlist already visited. Refresh the original player and detect the source again.

Saving did not start. Try again and choose a name and location in the Save As dialog.

Play the video for a few seconds so its download source becomes available.

The source refused access to this stream. This video cannot be downloaded in the current player session.
