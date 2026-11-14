# X / Twitter post downloads — 0.1.38

Reload the post after updating the extension. Alcydeo reads the exact selected post's native data, including the current streamed TanStack/Relay JSON and legacy JSON hydration. It does not evaluate the surrounding JavaScript, call an X API, construct a bearer token or read cookies. Native bootstrap scripts may remove themselves, so the existing document-start observer captures their text from mutation records before discarding everything except a bounded media catalog. A worker/observer restart retains an already-read exact-page catalog. A different post URL cannot inherit it.

Internal navigation can leave old playback resources in the page while no new native bootstrap is exposed. Those resources are not relabelled as the new post. Reload that post if X has not supplied its new catalog; this build does not intercept private client APIs to reconstruct it.

The supplied post plays through a Blob with separate audio/video HLS playlists. The earlier build could offer those technical playlists separately. The native catalog also exposes a complete MP4: Alcydeo prefers its MP4 qualities on one card. Multiple native media entries retain separate cards and selectors. Duplicate Relay representations without a media ID use the already supplied CDN asset identity; they do not create another video or a spurious title suffix. The native post text supplies the name, falling back to the actual page title when the post contains only a shortened media link.

Known native refusal/availability metadata is respected. Only HTTPS `video.twimg.com` media and `pbs.twimg.com` posters are accepted, with no credentials, unusual ports, altered query or invented source. MP4 initialization/audio fragments never become whole-file proposals. Catalog URLs are sampled through the existing source-check path; HTML, explicit refusals and undersized responses are excluded. When the exact focal catalog is known, the source frame's separate playback playlists do not reappear as duplicates. This does not claim support for every feed, recommendation, quoted post, private post, live source or future layout.

## Transfer and verification

Complete MP4s use the existing Chrome direct-download path and the chosen destination/Save As preferences. The popup can close. Enabling compatible multipart downloads uses the existing Worker/OPFS path; that path and HLS processing need the manager open. No TikTok-style source-frame transfer is required for the tested X CDN. If only an accessible HLS source exists, it uses the existing HLS manifest/assembly path; no conversion is faked by renaming a playlist.

An ordinary native Chrome disk result is acknowledged by Chrome, while full local structure verification requires explicitly selecting that saved file through the existing Verify file control. Managed results are verified before saving. These are distinct states; a successful headers sample alone is not a full-file integrity claim.

## Actual evidence

The supplied public post returns HTTP 200 in the ordinary headed Chrome test. The badge is **1 before opening the popup**, with one **320p** MP4. Chrome saves **1,545,730 bytes** under the actual page-based name. Selecting that exact local file through Verify file gives AVC video, AAC audio and **57.557 seconds**. An independent full WebCodecs decode traverses all **1,150 video samples and 2,698 audio samples** without error: [public result](benchmarks/x-public-0.1.38.json), [full decode](benchmarks/x-decode-0.1.38.json).

Initial headless navigation returned HTTP 403; no header, signature, cookie or challenge workaround was added. The normal headed browser loaded and played the post. This distinction matters when reproducing the external site. Download names may receive Chrome's normal duplicate suffix. The tested public video and its screenshots remain ignored local evidence, excluded from packages, the site and publication assets.

Synthetic installed-extension cases verify native scripts which remove themselves synchronously, late legacy hydration, exact selected-quality disk bytes/names, a real Worker restart, separate-playlist suppression, two videos, stale routes, blacklist, native refusals, HTML/HTTP failures and ten native languages including Arabic/Urdu RTL. Transfer fixtures contain original six-second AVC/AAC media plus a valid BMFF free box to exceed the existing one-MiB multipart threshold; they exercise managed range transfer without pretending that browser download requests are Playwright-intercepted. The actual public test separately exercises Chrome's native direct transfer.

## Resource bounds and data

Each candidate script is capped at 2 Mi characters. A capture batch takes at most 32 scripts / 8 Mi characters; the reader considers at most 160 candidate texts, parses at most 8 Mi characters, and walks at most 20,000 objects to depth 32. It retains at most four media entries and 24 formats per entry. Only a minimized current-post catalog lives in the isolated content-script context. Session scope records contain page URL and frame ID; normal media/task storage retains only the existing title, media metadata and source links. No full post JSON, user profile, account or native API context is persisted by this reader.

The feature is in both local and Store preparation builds, without a new manifest permission. YouTube remains excluded from Store. Native Windows dialogs/CRX installation and broad X live/private/feed coverage are not claimed. No external publication occurred.
