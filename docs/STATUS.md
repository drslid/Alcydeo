# Current release candidate — 0.2.0 preview

The first public GitHub release packages the existing Chrome media workflow with a new original kingfisher identity, an English/French README, ten-language Pages documentation and reproducible checks. GitHub source, Release and Pages publication were authorized on November 14, 2026. This is a preview, not a Store listing or a claim of universal source compatibility.

| Capability | State |
| --- | --- |
| Direct media, selected HLS/DASH VOD profiles, local library and file saving | Implemented and exercised with original fixtures; site/session compatibility varies |
| Trim, crop, merge, convert and compress | Local processing; supported codec/track combinations only, one conversion at a time |
| Live HLS recording and tab capture | Implemented with separate supported-source and capture limits |
| Ten languages, manual flags and Arabic/Urdu RTL | Implemented and exercised in the installed extension |
| Gofile, pCloud, MegaUp, 1fichier and Turbobit | Optional; protocol tests do not establish reliable real provider uploads |
| Cast of a public source | Official SDK in an external player; one Google sample reported working by the user, wider receiver compatibility limited |
| Direct Cast of a private PC file to Shield | Not implemented; explicit Chrome tab-casting guide retained |
| AirPlay in Windows Chrome | Unavailable |
| YouTube experimentation | Development preview only; removed from the distinct Store preparation build |
| Chrome Web Store submission | Next stage; no Store listing or approval claimed |
| Firefox and AMO | Requested for a later phase; no tested Firefox build yet |

See [test results](TEST-RESULTS.md), [TV](TV.md), [Cloud](CLOUD.md), [publication channels](publication/README.md) and [release procedure](RELEASING.md). Historical observations below retain their original versions and limits.

# Previous revision — 0.1.64 Cast cancellation and local recovery

A cancelled receiver picker no longer overwrites an existing media failure or resets playback/loading. The web player retains known idle errors from the actual media object, rejects stale evidence on retry and includes its build version in a safe report. A clean optional return link opens the source page without exposing page query tokens to the web player.

A failed native file prompt opens and focuses the complete Chrome tab-casting guide, with native retry retained as a secondary compatible-device action. The user’s new TikTok/Shield failure remains distinct from the successful Google demo: no direct TikTok or private PC file receiver playback is claimed. No relay, companion, private upload or publication. [TV scope](TV.md), [validation](TEST-RESULTS.md).

# Previous revision — 0.1.63 compact Cloud and web Cast player

Cloud uses one compact composer and expandable provider details. Cleanup errors are specific and shown beside the action; only Cloud staging copies are removed, preserving originals, Library media, history and links. Physical OPFS deletion is verified with original fixtures; provider uploads remain intercepted.

A new original web player uses Google's official Cast SDK outside the extension. The local test build can open it from a checked source in the popup, with its URL in an erased fragment. The user confirms the official 37-second Google sample plays on Nvidia Shield after an earlier W3C sample failed. This is a user-reported receiver test for one HTTP source, separate from laboratory simulations. Private PC files retain Chrome tab casting for Shield; no helper or relay is added. Production Pages remains unpublished and Store has no sender URL configured. [TV scope](TV.md), [tests](TEST-RESULTS.md).

# Previous revision — 0.1.62 Cast diagnostics and TikTok clarification

TikTok downloading is confirmed by the user and separate real file/Windows decode checks. No TikTok parser/transport change is made. File Cast now reports connection failure without inventing picker dismissal. Receiver limitations and the Chrome tab-casting guide are available inside the standalone player before any preparation. The native Shield file-casting restriction remains; no receiver, helper or relay is added. See [TV limits](TV.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.61 visible Cloud action in Library

Every available file card has a Cloud icon before Show in folder. It opens provider selection for that file without checkbox selection or an intermediate dialog. Multi-file selection retains its Cloud action, and missing copies use the existing inline picker. No upload starts before Send.

# Previous revision — 0.1.60 independent download concurrency

Settings separates simultaneous source files (1–8, default 1) from connections per compatible file (2/4/8). A shared persisted admission protects native/managed downloads, resumes and fallback across managers and service-worker restarts. Active transfers finish after a lower limit; queued files wait for capacity. Media Workers are routed by task. Conversion remains serial and page/playlist limits remain intact. No new permission or external publication. See [concurrency](DOWNLOAD-CONCURRENCY.md) and [tests](TEST-RESULTS.md).

# Previous revision — 0.1.59 local Cast recovery and Shield limitation

Local-file selection invokes the native chooser without waiting for playback; valid Chrome originals survive missing OPFS/old Cast copies, and selecting another file detaches the previous task. File-controller errors become visible. Chrome156’s file Remote Playback filters Shield model names; the working detected-URL route does not establish support for local files on that hardware. The local-player + Chrome-menu tab path is retained, with the limitation translated into ten languages. No autonomous Shield file transport or physical playback validation is claimed. See [TV](TV.md) and [tests](TEST-RESULTS.md). No publication.

# Previous revision — 0.1.58 Cloud temporary cleanup

Cloud has an explicit action to clear local staging copies and orphan Cloud directories, preserving originals, Library outputs, job history and sharing links. Pending sends whose input is cleared are cancelled. Locks and live leases protect preparation/uploads across managers; stale Resume cannot resurrect a cleaned entry. Partial deletion is reported and retryable. No provider request or external publication. See [Cloud](CLOUD.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.57 multi-cloud send and Turbobit links

An explicit action sends selected files to Gofile, MegaUp, 1fichier and Turbobit, with per-provider caps, independent progress/retry and one active cloud transfer. pCloud keeps its deposit-link action. A failed local copy retries only missing destinations; an earlier click never consumes a later selection. Turbobit links gain their native .html suffix, including exact older history links repaired locally. Validation transfers are intercepted or loopback, not real provider uploads. See [Cloud](CLOUD.md) and [tests](TEST-RESULTS.md). No external publication.

# Previous revision — 0.1.56 1fichier initialization and Cloud errors

The allocator’s native ru-N nodes are accepted alongside upN. Cloud provider errors use their actual localized messages. An explicit persisted attempt marker prevents a duplicate warning on never-attempted new 1fichier jobs while preserving earlier uncertainty. Actual anonymous initialization succeeds; complete transfers are simulated. See [Cloud](CLOUD.md) and [tests](TEST-RESULTS.md). No external publication.

# Previous revision — 0.1.55 direct Cloud selection

Cloud opens directly from the selected Library files, with destinations and Send on the same page. Available files resolve locally; missing copies have inline choosers. Stable file/task pairing, stale-read guards and an explicit immutable Send batch preserve the intended files and their source leases. Provider protocols are unchanged; validation uses intercepted transfers. See [Cloud](CLOUD.md) and [tests](TEST-RESULTS.md). No external publication.

# Previous revision — 0.1.54 compact Library actions

Each file has six icon actions: Trim, Crop, Merge, Convert, Compress and Show in folder. Localized tooltips and accessible names keep the row compact in ten languages and RTL. The matching editor retains the real file; unavailable audio/video and disk actions stay disabled. Existing active-task recovery remains available. See [validation](TEST-RESULTS.md). No external publication.

# Previous revision — 0.1.53 TikTok checks and local diagnosis

Three independently reproduced sampling gaps are corrected: anonymous CORS, hidden Content-Range and Range refusal with ordinary GET available. The confirmed mode follows the complete download; media-prefix and output validation remain required. An explicit local diagnostic appears when no media is available, including during pending checks, without URLs/identifiers/cookies or automatic transmission. Safe guard errors remain diagnosable. The actual personal-session cause remains unconfirmed. See [behavior](TIKTOK.md) and [validation](TEST-RESULTS.md). No external publication.

# Previous revision — 0.1.52 TikTok detection and native alternatives

TikTok uses the exact post’s native JSON, then bounded current-player metadata when the script catalogue is absent. Explicit refusals remain authoritative. Only minimal video data crosses from MAIN; no player cache, hooks, remote API or author/statistics data is added. Up to three native CDN addresses remain attached to each format and are checked before substitution. Open-time fallback requires a recognized prefix and matching exact size; HTTP429 does not rotate servers.

Observation restoration now targets exact documents and rereads policy, tab URL and navigation epoch. A reproduced startup failure is fixed; three fresh profiles keep observing and detect later media changes. Final Windows52 detects five qualities even after an explicitly artificial removal of scripts/cache, saves one 2,956,190-byte HEVC/AAC file automatically, and fully decodes 1080×1920/17.801134s. The personal-session cause remains unreplicated. See [TikTok evidence](TIKTOK.md), [validation](benchmarks/tiktok-validation-0.1.52.json) and [artifact checks](benchmarks/tiktok-artifacts-0.1.52.json). No external publication.

# Previous revision — 0.1.51 catalog lifetime and precise trimming

Trim start/end are editable directly beside the player, in seconds or clock notation with millisecond input precision, ten languages and RTL. Handles and fields stay synchronized; invalid ranges cannot export. A real original fixture produces a separate playable AVC/AAC MP4 with audio retained. See [trimming](TRIM.md).

TikTok’s native catalog is captured before its script disappears and survives valid observer replacement within the exact post/page/frame. The reported absence is not reproduced in Linux/Windows test profiles; the disappearing-script race is proven separately and fixed. [TikTok evidence](TIKTOK.md). Segmented downloads preserve the original error rather than an aborted sibling. The supplied Odysee source still refuses particular segments in the measured sessions; no full file is claimed. [Odysee diagnosis](ODYSEE.md).

# Previous revision — 0.1.50 confirmed proposals and metadata

Normal downloadable sources are checked before appearing in the popup or badge. Candidate inventory stays internal; checks run in the background with bounded source/metadata concurrency and page-scoped budgets. Quality preferences survive replacement signed URLs while those sources are checked. Native YouTube catalogs, playlists and explicit capture remain distinct local capabilities.

Instagram now reads only the current Reel’s native complete-file catalog and excludes recommendation/technical playback resources. The supplied Reel was saved once and fully decoded on an intermediate 0.1.50 build; a later metadata probe made no new export. The additional TikTok clip was saved and fully decoded with 0.1.49, without a parser change; its 0.1.50 rechecks cover prefixes and native playback only. Odysee already exposes four native HLS qualities in 0.1.49; only native playback and prefixes are verified. Container dimensions, HTTP-declared source totals and marked estimates are optional, never invented. See [source checks](SOURCE-CHECKS.md), [Instagram](INSTAGRAM.md), [TikTok](TIKTOK.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.49 HLS components and public-page audit

Checked HLS master video/audio pairs now absorb their corresponding technical leaf proposals while retaining both actual native transport URLs. The selection survives rescans; different audio languages and contradictory evidence remain distinct. A complete original fixture saves automatically with AVC/AAC. The supplied Coflix film changes from three ready proposals to one complete 360p source; only manifests and samples were fetched for that public film. Other page outcomes and limits are recorded in [the six-page audit](DETECTION-SITES.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.48 visual crop

Video tools adds spatial cropping by mouse selection, four resize handles, keyboard/numeric adjustment and a cropped preview. The persistent local conversion queue exports a separate -cropped MP4 with audio and the original retained. Coordinates follow displayed rotation; the H.264 output uses even dimensions. See [guide](CROP.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.47 automatic saved output

A validated output no longer requires the local HTML player to decode it before disk saving. The complete OPFS result is checked against its validated byte count and saved automatically. Retained results blocked only by the former codec veto recover without fetching the source again; uncertain saves and dismissed Save As dialogs retain their explicit recovery. See [saving](OUTPUT-SAVING.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.46 source identity and parallel DASH

Checked equivalent HLS alternatives in the same player form one quality choice while retaining the native address and separate audio identity. The supplied Coflix episode is saved completely in one real trial. Optional 2/4/8 connections now cover monofile DASH; VK can fetch its distinct audio/video resources together even without an ETag, but cannot safely divide one such resource into ranges. One real 144p comparison measures 27.8 s versus 20.8 s; both results fully decode. See [Coflix](COFLIX.md), [VK](VK.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.45 language control

The shared language selector shows only its flag when closed in both popup and manager. Native names and automatic mode remain in the menu, with the same accessible labels and live language switching. See [validation](TEST-RESULTS.md).

# Previous revision — 0.1.44 saved-file actions

The manual verification picker and its hint are removed. Native files finish when Chrome confirms their saved disk copy; Show in folder remains. Older saved records recover on refresh. Automatic processed-output validation and source/HTML guards stay active. Native files are not claimed structure-checked. See [validation](TEST-RESULTS.md).

# Previous revision — 0.1.43 VK Video / signed DASH

The supplied VK video now exposes one grouped source and five qualities. Standard XML URL separators are decoded once, confirmed byte slices and UI sounds are excluded, and each DASH representation has its own source check. Existing progressive audio/video download, remux and automatic Chrome saving succeed on the real public example. See [scope](VK.md) and [tests](TEST-RESULTS.md); no universal format/site claim.

# Previous revision — 0.1.42 site-access messages

The obsolete domain-approval message and per-domain controls are removed from Alcydeo. Internal Chrome/extension pages show a neutral hint, actual Chrome access restrictions remain enforced, and inaccessible managed tasks pause with standard recovery. Revoking an unrelated host no longer pauses an authorized transfer. See [behavior](SITE-ACCESS.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.41 kingfisher consistency

The compact portrait and monochrome now reuse the exact head from the original full bird. The white outer cutout stroke is removed. The interface, app icons and dark publication marks use a pale rounded support to preserve dark-ink readability. All exports and favicon variants are regenerated locally. See [brand guidance](BRAND.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.40 popup layout

The toolbar popup now has a clear source action row (quality, Cast, Download), a secondary-actions menu and a stable footer for tab capture and Library. Titles have more space, secondary icons are aligned and repeated global shortcuts are removed. Light/dark, ten locales and RTL are checked with the installed extension. See [layout and limits](POPUP.md) and [validation](TEST-RESULTS.md).

# Previous revision — 0.1.39 content observer lifecycle

The user reports missing runtime/sendMessage; an installed-context fault-injection check covers that exact TypeError. A related Extension context invalidated failure gives six exceptions after native runtime reload / zero in the patched probe. Context guards and idempotent cleanup stop old DOM observers; valid transient receiver failures remain recoverable. Native Chrome reload/disable-enable and notification races have dedicated tests. Refresh already-open pages to remove resident old code. [Scope and reproduction](OBSERVER.md).

# Previous revision — 0.1.38 X posts and local YouTube mixes

The supplied X post is detected with badge 1 before popup, saved as a real 1,545,730-byte 320×320 AVC/AAC MP4 and fully decoded through 57.557 s. Native bootstrap JSON supplies complete-file qualities; no JS evaluation, account/API or permission is added. Native file verification remains an explicit local-file selection. [Scope](X.md).

The user-provided YouTube mix exposes a snapshot of 25 current titles. Exactly two are tried, both sourceRestricted with no partial exports or other entries started. This is not a successful real music download. Finite playlists remain complete catalogs; Store still excludes YouTube. [Playlists](PLAYLISTS.md).

# Previous revision — 0.1.37 TikTok posts

The supplied public TikTok post is detected before opening the popup, saved under its real title and fully decoded as a 9,510,143-byte 576×1024 AVC/AAC MP4. Blob playback uses a bounded original-frame-to-Worker stream; no header/signature or manifest permission is changed. Source and manager must stay open; interrupted source transfers restart. Broader feeds/live/private/codec combinations remain limited. [Scope](TIKTOK.md).

# Current revision — 0.1.36 local playlists

The local popup presents YouTube playlist selection and sequential downloads to a playlist-named folder. Persistent manager ownership, acknowledged disk results, individual failures and pause/retry are implemented. Store compilation excludes the playlist and transport paths. See [playlist limits](PLAYLISTS.md) and the current validation report. Real Internet playlist completion remains a separate check.

# 0.1.31 live/Cast correction

Active YouTube live metadata is now retained in the local build. A compatible exposed HLS can be recorded directly; other live players offer explicit native tab capture. The supplied public event has ended at probe time and is recognized as a replay. No universal live SABR extraction or protected-source support is claimed. Cast polling and deadlines prevent endless loading-state resurrection; real physical Shield validation remains pending.

# Current workspace note — 0.1.30

The latest revision unifies Library, provides ten selectable languages, real random thumbnails, bulk actions, visual trim/merge and separate conversion/compression defaults. Popup recording adds genuine toolbar tab capture, higher bitrate and colored annotations. Gofile/pCloud remain; Drive/OneDrive and identity/OAuth were removed at the user’s request. Quick Cast passes the explicit click to a persistent controller; known native files or an explicit original path avoid duplicate copies. Laboratory checks do not validate reception on the user’s Shield.

# Product status — local 0.1.30

The first functional slice is implemented; the complete specification remains a multi-lot target. No full parity or public-release readiness is claimed.

| Lot | Current result | Remaining work |
| --- | --- | --- |
| 0 | Engine research, packet-remux prototype, OPFS, persistent tasks/checkpoints, lease, original identity, initial views and benchmark scripts | Broader corpus, browser memory isolation, multi-GB segmented benchmark and conversion comparison |
| 1 | Actual MV3 extension, automatic DOM/network/frame detection on granted sites, automatic detection as standard with Chrome site controls and early badge updates independent of slow frame scans, grouped source/quality selection, observed redirect resolution with title/quality preservation, direct files with HTML rejection, observed-playlist analysis and exact fragment exclusion, tested unencrypted VOD HLS/DASH variants including timed metadata, opaque CMAF fragments and explicit HLS init byte ranges and bounded nested-rendition resolution, manager, library, compact proposals, automatic/Save As destination settings and diagnostics | More authenticated/CDN/frame cases and larger-library indexing; format/size controls now implemented |
| 2 | Pause/resume, cancellation, crash/closure recovery for tested VOD cases, structure/track/duration/initial-playback validation; local H.264/AAC MP4 conversion with sequential persisted inputs and tested packet-copy/reencode cases | Other output targets, broader codec/large-transcode corpus, supplied subtitles, audio-language choice  |
| 3 | Metadata export without sensitive URLs; Gofile/pCloud transports and multiple-file staging tested with local API fixtures; unified selected library and visual trim/merge | Real provider transfer validation; metadata import/tag editing, Cast/AirPlay device prototypes, quality profiles and chapters |
| 4 | Ten native catalogs, RTL tests, README, static ten-locale site, ZIP/CRX, dependency notices and Store text/procedure drafts | Translation review, Windows manual checks, public support contact and final promotional assets/review |

Refused explicitly: DRM/encryption, HLS discontinuities/gaps and live windows in the VOD downloader (the separate HLS recorder supports tested growing streams), DASH multi-period and unbounded timeline repeats. Redirected fetch sources are currently refused. Exact/estimated/unknown sizes are not conflated; missing sizes stay unknown.

Not exercised on real provider accounts/devices: pCloud transfers and PC-file Cast. Gofile and detected-source Cast success are user-reported, independently of the laboratory tests. Cloud controls call the implemented transports; local protocol tests are not real-provider validation. The TV controls are a native Remote Playback prototype, explicitly marked experimental; unavailable AirPlay is disabled with an explanation. No private Vidow service was tested. No reference code or CRX content is included.

The reported Zalando Privé product source is **not verified**: its public page returned HTTP 403 to the local HTTP client and failed with an HTTP/2 protocol error in Chrome for Testing. No account/session was used and no access was bypassed. The `chooseQuality` failure path is reproduced with local authorized HLS fixtures.

Automatic saving targets Chrome’s configured main download directory with a relative subfolder. An extension-specific arbitrary absolute filesystem destination is not implemented. The Windows native Save As chooser remains a manual verification; headless API/transfer checks are documented separately.

0.1.12 adds bounded open-component scanning and already-loaded direct-media recovery. Local-only YouTube detection exposes the observed player catalog and grouped quality selection. The bundled SABR/UMP and direct adaptive paths produce verified six-second synthetic two-track files; the supplied real YouTube Short completes at 144p and 720p with audio/video, while other sources/sessions remain limited. The Store build retains the YouTube exclusion and omits its transport code. This is partial support, not universal site compatibility.

0.1.12 fixes generic-binary media detection and keeps final signed destinations through observed proxy redirects. Explicit HTML wrappers/errors/attachments remain excluded, including embedded documents and 403 responses. Two complete authorized fixture paths are verified; the supplied real Webflix player was gated by its security verification in the automated browser and its exact file download is not verified.

## TV roadmap — explicit user commitment

User reminder on 2026-11-01: retain both Google Cast/Chromecast and AirPlay. These are separate planned capabilities, not optional replacements for each other, and their progress must be tracked separately from cloud exports. Neither is implemented or device-validated in 0.1.12.

| Capability | Current status | Validation required before availability |
| --- | --- | --- |
| Google Cast / Chromecast | Planned; device prototype not executed | Real receiver selection, authorized source playback, basic playback controls, stopping/disconnection and inaccessible-source diagnostics |
| AirPlay | Planned; feasibility on the target Windows Chrome setup remains unvalidated | A working compatible transmission path within the confirmed no-companion scope, then real receiver playback/control/disconnection checks |

Keep these prototypes in lot 3. Preserve desktop Chrome, no required native companion, no paid mandatory API and no remote executable code inside the extension. Availability must reflect the tested browser/device/source combination; a saved file or a source accessible only inside the browser is not automatically reachable from a TV. Any required change to the confirmed scope must be discussed before adopting it.

0.1.13 adds an opt-in 2/4/8-part direct-file transfer setting, captured per new task. Compatible sources use strong-validated byte ranges and one disk-backed original output, with pause/checkpoint recovery, cancellation, source-change refusal, final validation and native fallback for incompatible fresh sources. Direct native transfer remains the default. HLS/DASH/SABR and the separate Cast/AirPlay roadmap retain their existing scope.

0.1.14 redraws the identity in the requested Cuphead-inspired 1930s cartoon direction. The full SVG kingfisher, pie-cut eyes, long bill/arrow, approved palette and optical toolbar portraits are integrated into the extension and static site. Transfer behavior is unchanged from 0.1.13.

0.1.15 adds confirmed history clearing in Downloads/Library and pagination at 20 entries per page. Clearing covers all pages/filters, including favorites, but keeps saved files and Chrome’s download history. Active/paused work and live leases are retained; eligibility is rechecked atomically against the selected records. New records after confirmation are retained.

0.1.16 adds local MP4 conversion, a simple Settings file picker and an action on applicable records. MKV/MOV H.264/AAC copies preserve encoded packet hashes; VP8/Opus WebM is reencoded to H.264/AAC. A global lease and Worker lock serialize conversions across managers. Native codecs are preferred; a packaged AAC-only WASM fallback handles missing AAC encoders. No native application, account, remote executable or backend is introduced. Originals and saved files are retained; prepared inputs and outputs remain temporary local task data. Codec/format/HDR/long-file coverage is limited to the measured corpus.


## 0.1.17 additions

- Original downloads recognize every video/audio format requested by the user. M3U8/MPD remain manifest-driven; known fragment URLs remain excluded. Nineteen genuine local video/audio container files are downloaded byte for byte. These are download tests, not universal playback or conversion certification.
- Size presets are 10 KB (default), 100 KB, 1 MB and 2 MB. Unknown sizes stay visible; playlist byte counts are ignored. Blacklist entries accept domains/URLs, including subdomains. Other HTTP/HTTPS sites remain enabled by default, subject to Chrome’s grants.
- Recording uses Chrome’s explicit surface chooser and WebM VP8/Opus at up to 480p/24 fps. A dedicated Worker flushes to OPFS, with bounded pending memory and interrupted-part recovery. Real local tab recording is tested; protected-content support and every-PC real-time performance are not claimed.
- Convert/compress/trim/ordered-merge share one persisted sequential processing queue. Compression targets adaptive H.264 up to 1.5 Mb/s and 720p and AAC stereo; a small source can grow. Merge normalizes one clip at a time and rejects unsupported layouts/configurations. AVI/WMV/FLV/MPEG-PS original downloads do not imply support in the local demuxer/editor.
- Gofile is selected for explicit guest sharing; Google Drive/OneDrive for personal storage through official resumable protocols. No other provider is represented as integrated. Real uploads and OAuth consent remain unverified without configured accounts/app client IDs. Access tokens stay session-only; upload checkpoints/local staging are persisted. No test content was sent to a real cloud provider.
- Help prepares `https://drslid.github.io/alcydeo/<locale>/`, with local fallback before publication or offline. The site uses an original implementation of the NoxRouteNeo editorial style and remains unpublished.


## 0.1.18 workspace design

The manager uses a Material-inspired side-navigation layout, local Rounded SVG icons, concise file rows, localized dates/counts, grouped settings and a persistent save action. Original media engines, storage/checkpoints, actual recording and prepared cloud protocols retain their existing behavior and limits. The ten native locales and RTL apply to all new copy. No new permission, telemetry or remote executable/font service is added.

## 0.1.19 identity revision

The latest user revision replaces the previous two-eye face with one visible eye in side profile and removes the arrow. The full original illustration, simplified icon, outlined wordmarks, monochrome versions and high-resolution publication kit are prepared locally. Runtime small headers, manifest icons and site favicons use the simplified head. See [brand guide](BRAND.md). Media functionality remains as documented for 0.1.18.

## 0.1.20 checked proposals and TV prototype

Source availability checks inspect small direct-file samples or manifest/first-fragment samples before a download. Explicit invalid/too-small responses are excluded; uncertainty remains visible. This is not whole-file validation. Generic iframe/media titles fall back to the top-level page title. The TV player uses the native Chrome Remote Playback API for direct sources, marked experimental; no real receiver is validated, and AirPlay is unavailable on the Chrome Windows target. See SOURCE-CHECKS.md and TV.md.

## 0.1.21 conversion filenames

Original user filenames are retained through local selection, library tools and prepared cloud files; conversion adds `-converted.mp4`. Editing operations use their respective suffixes. Internal OPFS output names are kept private to storage. Existing output files are not renamed retroactively, and Chrome keeps original/duplicate files distinct. Media engines and TV/cloud limitations are unchanged.

0.1.32 distinguishes temporary completion from Chrome disk saving. Checked outputs are automatically exported after a lost worker notification; exports are serialized and created native downloads reconciled by exact local Blob URL. Dismissed Save As stays stopped until explicit Save file, reusing the prepared bytes. Progress remains below 100% until saved; native Windows dialogs remain a separate manual test.

0.1.33 adds experimental MegaUp anonymous sharing via the public web form, next to Gofile and pCloud. Original local parser/transport, bounded sequential chunks, exact destination checks, progress/cancel and fresh whole-file retry. Read-only inspection of the real page and intercepted transfer tests remain distinct: no real MegaUp file upload is claimed.

0.1.34 adds experimental 1fichier anonymous sharing via its documented web-upload protocol. A real anonymous initialization succeeds without uploading a file. Installed-Chrome transfer tests intercept all bytes/reports; real provider upload and maximum-size transfers remain unvalidated. Progress is indeterminate; retries restart from zero with fresh upload IDs, which are not persisted.

0.1.35 adds experimental Turbobit guest sharing through the user-provided torbobit.net mirror, using an anonymous web flow rather than the authenticated CostAction API. Actual initialization succeeds without sending a file. A conservative 200 MB cap and published seven-day guest retention are disclosed. ID-only acknowledgements are distinct from remote metadata/readback verification. Real uploads remain unvalidated.
