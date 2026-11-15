# Changelog

## Unreleased

### Build safeguards
- Check every packaged Firefox `.js`, `.mjs` and `.cjs` file for common string-execution forms and require imports to resolve to constant local packaged modules. Preserve the desktop target and the distinction between WebAssembly and JavaScript CSP permissions.
- Recheck the immutable Firefox 1.0.0 ZIP with Mozilla's validator: no Android-minimum, Function/eval or unsafe-import finding; retain the documented Vue static-template warning. No released binary is replaced.

## 1.0.0 — Chrome and Firefox · 2026-11-15

### Added
- A dedicated Firefox package and review-source archive, with temporary installation instructions and explicit browser differences. Firefox excludes YouTube; no Mozilla signature or Store submission is claimed.

### Changed
- Move the local detection diagnostic from the popup to Library → Settings → Detection, with a source-tab chooser and the existing safe copyable report.
- Default new and reset settings to four simultaneous files and multipart enabled at four connections per compatible file. Keep existing saved choices and server compatibility guards.
- Publish separate Chrome development, Chrome Store preparation and Firefox channels, with English/French installation guidance and ten-language Pages documentation. The Chrome development channel retains the local YouTube experiment; the other two exclude it.

### Fixed
- Remove the kingfisher's rear bulge and dark patch; share the streamlined contour across the emblem, icons, signatures and selected design proposal.

### Known limits
- Firefox has no Chrome tab capture, Google Cast or AirPlay capability. Codec/storage support and real Firefox validation are detailed in docs/FIREFOX.md; a successful build does not establish parity.
- The existing provider, source, codec and receiver limits still apply. A 1.0.0 GitHub Release is not Chrome Web Store or Mozilla approval, universal site compatibility or private-file Cast to Shield.

## 0.2.0 — First public preview · 2026-11-14

### Added
- Public GitHub source and a documented preview distribution, with separate Chrome development and Store preparation ZIPs.
- Original minimal kingfisher identity, consistent toolbar/manager/publication exports and three preserved design proposals.
- English/French README and ten-language Pages presentation inspired by NoxRouteNeo, with actual screenshots and installation guidance.
- Pinned CI actions, explicit browser smoke coverage, manual Pages deployment and a documented release/rollback procedure.

### Changed
- Use the actual case-sensitive `drslid/Alcydeo` repository and `/Alcydeo/` Pages path. Keep the optional official Cast SDK outside the extension.
- Apply dependency security patches and one scoped development-tool override; preserve source archives and license notices.
- Exclude local preparation notes, unfiltered logs and machine-specific reports from the initial public tree.

### Fixed
- Suppress only the known optional MPEG-TS ID3 metadata warning during bounded source checks, retaining real dimensions, unknown warnings and codec refusals. Restore the logging policy correctly across concurrent checks.
- Keep language/theme controls accessible on narrow landing pages and provide a real 404 navigation document without virtual locale links.

### Known limits
- This preview inherits the source, codec, recording, Cloud and receiver limitations documented in STATUS.md. Private PC Cast to Shield is not implemented, AirPlay is absent in Windows Chrome, and real provider uploads are not universally validated.
- No Chrome Web Store submission or Firefox/AMO build is included. Firefox is now on the later roadmap.

## 0.1.65 — Cast inside the video player (local preparation)

- Integrate Cast, local/receiver playback, timeline, volume and fullscreen into one localized player toolbar; retain native video controls without JavaScript and fold the help text.
- Start buffered Cast loads at zero instead of inheriting the preview position, including an ended preview. Allow explicit replay after receiver FINISHED without an automatic LOAD loop.
- Add Cast to Library cards and give popup buttons preparation feedback. Original downloads can use their exact current checked online source, identified in the player. Converted, cropped, trimmed, merged, captured and live-recorded outputs keep the explicit local-file path; never replace an edited result with its original.
- Preserve extension-only scope, source signatures and safe reports. Real Shield playback of the supplied TikTok and private PC transport remain unverified; the user has not yet tried the same-source comparison. No private upload or external publication.

## 0.1.64 — Preserve Cast media errors on picker cancellation (local preparation)

- Keep current playback, loading deadline and media error when a new receiver selection is cancelled. A first cancelled picker returns to a neutral state. Observe known media idle reasons even after the SDK getter clears, with session/attempt cleanup and stale-media guards. Add the web build version to the safe diagnostic.
- Add an optional clean source-page return link, excluded from receiver metadata and diagnostics. Reject private/query-bearing page links.
- After a local-file native Cast failure, focus the complete Chrome tab-casting guide and make it the primary recovery action; retain explicit native retry for compatible devices without another copy. This does not add private PC file transport to Shield or establish TikTok receiver playback.

## 0.1.63 — Compact Cloud and official-SDK web Cast player (local preparation)

- Compact the Cloud composer, destination buttons, file rows and history; fold provider details. Report cleanup success/failure beside the action, preserving originals, Library media, history and links. Normalize storage/iteration failures to the specific cleanup error.
- Protect individual Cloud deletion against stale cards in another manager by rechecking state/lease atomically under the existing locks.
- Add an original standalone web player with Google's official sender SDK, remote controls and a safe copyable diagnostic. The local popup hands off checked network media through an erased fragment; native fallback remains when the configured player is unavailable. A preparation that outlasts the user gesture now exposes the persistent player for a fresh click.
- Record user-reported playback of the official Google 37-second sample on Nvidia Shield. Do not claim private PC file transport or universal media support; the static production page is prepared, not published. No companion, relay or remote SDK execution in the extension.

## 0.1.62 — Honest Cast diagnostics and early receiver guidance (local preparation)

- Replace the ambiguous picker-closed message with a neutral connection failure in ten languages. Native errors do not establish that a picker opened or that the user cancelled it.
- Show Shield/Chrome file-casting limitations and the tab-casting guide inside the standalone player before preparation, without a duplicated parent notice. Keep the native click for compatible receivers and disclose AirPlay/experimental status in accessible details.
- Confirm the additional TikTok downloads under build61; the user clarifies that only casting the saved file fails. No TikTok transport, permission or codec change, and no claim that native Shield file casting is fixed.

## 0.1.61 — Direct Cloud action in Library (local preparation)

- Add a visible Cloud icon to every available file card, between Compress and Show in folder. Open the provider page with that file directly, while retaining multi-selection Cloud and inline missing-file choice. No new upload starts before Send.

## 0.1.60 — Independent file and connection concurrency (local preparation)

- Add a global 1–8 simultaneous-file setting, default 1, independent from the existing 2/4/8 connections per compatible file. Preserve active downloads when lowering the limit and wake queued work when capacity opens.
- Share persisted admissions across Chrome-native, multipart and managed streams, including resumes and fallback, without multiplying capacity across managers. Keep conversions serial, page-transport bounds and playlist sequencing.
- Route each media Worker independently and recheck its admission before network reception. Persist native-start intentions for restart recovery, preserve uncertain requests and handle pause/cancel before or after Chrome assigns an ID.

## 0.1.59 — Local Cast recovery and receiver limits (local preparation)

- Call the native file picker without waiting for playback, respect gesture lifetime after preparing a copy and bring local-controller errors forward. Reuse valid original Chrome downloads even when OPFS or an older Cast copy is missing.
- Detach a manually selected replacement from the previous Library task, preserving its file association.
- Explain Chrome156’s receiver-model restriction: Shield names are filtered by file Remote Playback, although detected URLs and manual tab Cast can work. Retain the local player and Chrome-menu tab guide; no server, companion, upload or browser-flag change. Physical receiver playback remains unvalidated.

## 0.1.58 — Clear Cloud temporary files (local preparation)

- Add an explicit Cloud action to clear local upload copies, including orphan directories, while retaining originals, Library outputs, job history and sharing links. Cancel pending jobs whose copies are cleared.
- Protect active uploads/preparation across managers, invalidate resumability before deletion, reject stale Resume actions and report partial deletion for explicit retry. No provider request or remote deletion.

## 0.1.57 — Multi-cloud send and Turbobit links (local preparation)

- Add one explicit Send to all clouds without setup action for Gofile, MegaUp, 1fichier and Turbobit. Keep pCloud deposits separate. Prepare each destination independently, respect its size limit and retain independent progress/retry. Failed local staging retries only missing destinations.
- Append the native .html suffix to Turbobit sharing links and repair exact older bare links locally without another upload. Keep strict IDs, response checks and existing job states. No real provider upload is claimed.

## 0.1.56 — 1fichier allocator compatibility and Cloud errors (local preparation)

- Accept the native ru-N upload-node family alongside upN after reproducing a real anonymous initialization rejected by the older validator. Preserve exact hosts/IDs and strict destination/report checks.
- Resolve provider errors through their existing localized err_ messages, with a translated fallback, in all ten languages.
- Persist an upload-attempt marker before the first 1fichier file body. Hide duplicate warnings only for a proven never-attempted new job; retain uncertainty across retry/reload and for older jobs. No actual file is uploaded during validation.

## 0.1.55 — Direct Library-to-Cloud flow (local preparation)

- Open Cloud destinations immediately from the Library selection, removing the intermediate selected-files dialog. Resolve accessible files automatically and choose missing local copies inline.
- Keep file names and source leases attached to stable rows. Ignore stale resolution results, and snapshot each explicit Send so later selections cannot be uploaded by an older action. No provider upload or job preparation begins merely by selecting files.

## 0.1.54 — Compact Library file actions (local preparation)

- Show six icon-only file actions in order: Trim, Crop, Merge, Convert, Compress and Show in folder, with localized tooltips and accessible names.
- Open the matching editor with the real retained file; merging preserves the first clip when more are added. Keep honest video/disk availability and task recovery controls. File deletion and Cloud use selection; TV remains available from its dedicated view and popup.

## 0.1.53 — TikTok preflight compatibility and local diagnostics (local preparation)

- Reproduce and fix three original-fixture gaps: anonymous CORS, unexposed Content-Range and refused Range. Keep retries bounded, native URLs unchanged, readable refusals authoritative and unknown sizes honest. Reuse the sampled credentials mode for transfer.
- Add an explicit local diagnostic in an empty popup, including pending detection, with ten languages/RTL and preview/copy. Export only safe bounded states and counts; no URLs, identifiers, cookies, raw page data or automatic transmission.
- Keep failed alternative checks attached to the address actually sampled, fixing a reproduced A→B promotion race that could check B twice.
- Persist safe source-check guard errors and protect newer ready evidence. Validate withheld-CDN behavior with real Chrome permissions. The user’s personal-session cause remains unconfirmed; earlier public downloads are separate evidence.

## 0.1.52 — TikTok player metadata and native CDN alternatives (local preparation)

- Read a minimal current-post catalogue from native player data when the script catalogue is absent. Keep explicit refusals authoritative, use only bounded own data descriptors and reparse in the isolated world without a player-derived cache, application hooks or remote API calls. Exclude authors, statistics and raw props.
- Keep up to three original CDN addresses for each native TikTok format instead of losing all but the first. Check alternatives before showing them as ready; retain the successful address and prefer H.264 at equal resolution.
- Retry a declared alternative only when opening fails before body reading, after fresh media-prefix and exact-size checks. Preserve progressive writing, full validation, automatic saving, task ownership and source/permission/blacklist guards. Keep HTTP429 as a server wait without CDN rotation or changed credentials.
- Keep source URLs and their actual checks together during native-network changes and enqueue. Fix stale tab snapshots stopping the observer after navigation and scheduled scans clearing newer sources; target exact documents and recheck policy/page scope.
- Verify the final Windows build on the supplied post: five checked qualities, player-only detection after artificial script/cache removal, one complete automatic HEVC/AAC save and independent full decoding. Preserve separate baseline/intermediate evidence; the personal-session cause remains unreplicated.

## 0.1.51 — TikTok catalog lifetime, transfer errors and precise trimming

- Capture exact-post native TikTok metadata before hydration scripts disappear; retain only a scoped minimal catalog through valid observer replacement, with route, refusal and known HTTP guards. Public Linux/Windows direct loads work in the laboratory; the user session failure remains unreplicated.
- Preserve the original fragment failure when other requests abort. Keep bounded retries and report exhausted 429 responses as a server wait. Odysee 144p and 720p trials encounter refused segments and save no complete file; this is not presented as full Odysee transfer validation.
- Edit trim start/end beside the video using seconds or clock notation with three decimal places and local digits. Keep handles synchronized, preserve incomplete typing and block invalid exports. Retain the original/audio; the codec still determines actual frame/sample boundaries.

## 0.1.50 — Confirmed sources, Instagram and media metadata

- Check normal download sources in the background before showing their cards or badge count. Keep unconfirmed candidates internal, two active source checks, per-page budgets and recovery after navigation, access changes and native source refreshes. Preserve the selected quality while its replacement is being checked.
- Read the exact public Instagram Reel catalog and prefer its complete native MP4s over recommendations, initialization files and separate playback tracks. Respect native refusals and preserve known metadata on same-source refresh.
- Read optional container dimensions from existing prefixes or bounded MP4/MOV header ranges. Validate HTTP total sizes; distinguish stream estimates from exact source sizes and unknown values. No full-file predownload or new permission.
- Save and fully decode the supplied Instagram Reel on an intermediate 0.1.50 build. Distinguish the additional TikTok clip’s complete 0.1.49 result from its prefix/playback-only 0.1.50 rechecks. Verify Odysee HLS qualities with native playback and prefixes only. These observations do not establish universal platform support.

## 0.1.49 — Keep checked HLS video and audio together

- Associate a checked master video/audio pair with its matching leaf playlists using bounded per-track resource/sample identities. Retain the actual native video/audio URLs and selected quality across rescans; keep different languages, frames and contradictory checked sources distinct.
- Reject a refused selected audio transport while preserving independent working aliases. Keep newer checks attached to the exact transport they validated; native requests do not refresh a check's age.
- Reproduce the extra proposals on the supplied Coflix film and verify one complete 360p source after the fix. Document all six public-page outcomes separately from the complete original-fixture download; no whole public film is downloaded in this revision.

## 0.1.48 — Visual video crop

- Add Crop to Video tools: draw a rectangle on the actual image, move/resize with mouse or keyboard, adjust pixel coordinates and preview the selected region. Keep landscape/portrait and RTL coordinates consistent.
- Export a separate -cropped MP4 through the existing one-file conversion queue and automatic disk saving. Reencode video to H.264, copy compatible AAC or encode supported audio to AAC, retain duration and original; reject invalid/multiple-video selections.
- Add ten localized crop controls and a pinned Apache-2.0 Material Symbols Rounded crop icon.

## 0.1.47 — Save validated outputs automatically

- Remove the local HTML player veto before saving an already validated output. Keep structure/track/duration/packet checks and require a nonempty OPFS file with the exact validated size. A missing browser decoder no longer blocks the disk save.
- Automatically recover retained results blocked only by that old player, without a source download or a second click. Keep uncertain native-save reconciliation, exclusive saving and explicit retry after a dismissed Save As dialog.

## 0.1.46 — Checked HLS alternatives and parallel DASH

- Group equivalent checked HLS VOD plans and samples within the same player, retain the native signed URL and known quality, and keep different audio tracks separate. Reject known terminal native failures and inventory opaque HLS fragments found by preflight.
- Apply the existing optional 2/4/8 connection setting to monofile DASH: distinct whole tracks can run together; splitting a resource requires exact byte ranges and a strong ETag. Keep bounded OPFS writes, cancellation and complete-resource checkpoints.
- Real Coflix episode saved as one 488p AVC/AAC MP4. Real VK 144p comparison saves and fully decodes both outputs, with 27.8 s sequential versus 20.8 s parallel in one trial. No universal speed or site support claim.

## 0.1.45 — Compact language control

- Show only the flag in the closed language selector throughout the popup and manager, including automatic mode. Keep native language names, automatic choice and accessible labels in the menu.

## 0.1.44 — Simpler saved-file actions

- Remove the manual saved-file verification action and its hint; retain Show in folder.
- Finish native downloads when Chrome confirms an existing complete disk copy, including older saved records awaiting optional verification. Keep automatic checks on processed outputs and source/HTML guards. Native saved files are not labelled structure-checked.

## 0.1.43 — VK Video and signed DASH manifests

- Decode standard XML URL escapes exactly once, retaining signed query bytes in DASH BaseURL and segment attributes.
- Track all single-file representations and remove only confirmed native VK byte slices from the source list. Exclude its three UI sounds; retain ordinary audio detection.
- Buffer fragment writes in bounded 512 KiB blocks, report live byte progress and apply the 120-second timeout to inactivity instead of total duration. An active large track can continue past two minutes.
- Check DASH qualities independently even when their manifest URL is shared. Preserve the existing OPFS/remux/validation/save pipeline and Store YouTube exclusion. See [scope and real-file evidence](docs/VK.md).

## 0.1.42 — Remove the obsolete domain approval flow

- Remove the repeated “Allow the source domains” instruction and per-domain/embedded-player approval controls. HTTP/HTTPS access remains declared at installation; real Chrome restrictions remain enforced.
- Skip scans on internal/unknown Chrome pages and show a neutral web-page hint. Pause inaccessible managed sources once, with the normal resume action and a link to Chrome settings.
- Recheck the active task’s necessary origins before pausing on permission removal, so revoking an unrelated site does not stop a download. Local file access stays separate. [Behavior](docs/SITE-ACCESS.md).

## 0.1.41 — One consistent kingfisher face

- Derive the compact portrait and monochrome from the full illustration's canonical head. Keep the same eye, beak, profile and palette across the popup, manager, icons and publications.
- Remove the external white cutout stroke. Use a deliberate pale blue surface for app icons and dark presentation, keeping the original transparent vectors.
- Regenerate all SVG/PNG/ICO exports and dark wordmarks. [Brand guidance](docs/BRAND.md).

## 0.1.40 — Clearer toolbar popup

- Give titles more room and align quality, Cast and Download on a single action row. Move secondary source commands to a keyboard-accessible native menu.
- Keep one stable footer for tab capture and Library; remove repeated header/record shortcuts. Align saved-file controls and keep progress in the popup.
- Refine spacing and states in both themes and all ten languages, including RTL. Close language menus on Escape or outside clicks, without reloading active work. [Layout and verification](docs/POPUP.md).

## 0.1.39 — Stop obsolete content observers after extension reload

- Prevent `Cannot read properties of undefined (reading 'sendMessage')` and `Extension context invalidated` errors from an obsolete DOM observer after reload/disable. Check context validity before DOM work and sending; handle synchronous throws and rejected promises.
- Stop old observers once, cancel timers and remove document/shadow listeners. Keep a valid observer available after a transient missing receiver.
- No permission, media-engine or UI change. Refresh already-open pages to remove an old resident script. [Lifecycle and reproduction](docs/OBSERVER.md).

## 0.1.38 — X post catalogs and evolving YouTube mix snapshots

- Read native X streamed/legacy JSON before its bootstrap nodes disappear, without evaluating JavaScript or calling an X API. Prefer complete MP4 qualities on one focal-post card; retain separate videos and explicit native refusals. Suppress separate playback playlists and duplicate Relay metadata.
- Verify the supplied X post through an actual Chrome disk download, explicit local-file validation and complete independent AVC/AAC decode (57.557 s).
- Recognize current YouTube mix panel entries as an explicitly labelled snapshot in ten languages. No future suggestions are fetched. The requested real test selects only two titles; both are refused without partial files or extra entries.
- Keep TikTok and finite playlists, existing host permissions and the separate Store YouTube exclusion. No external publication.

## 0.1.37 — TikTok post detection and original-frame saving

- Detect the selected TikTok post from bounded native JSON even when playback uses a Blob. Keep its real title and native qualities/codecs on one card, and exclude the site’s decorative login video. Reject stale/restricted entries.
- Sample and stream files through the authorized original frame using normal browser CORS/session handling. Transfer bounded chunks into the existing Worker/OPFS validation and automatic-save path; keep popup progress, cancellation and restart-from-source recovery. No new permission, modified signature, forged origin/header or companion.
- Preserve completed source checks against late network-header events. Validate the supplied public clip as a complete 576×1024 AVC/AAC MP4, with honest limits for other posts, codecs and layouts.

## 0.1.36 — local YouTube playlist batches

- Show complete playlists in the local popup, select available videos by default, allow deselection and a maximum quality. Follow bounded native metadata continuations before allowing a batch start. Keep unavailable entries visible and paginate large lists.
- Save checked files one at a time into the playlist-named subfolder, retaining original positions and video titles. Keep progress in the popup and persist recovery in Library; closing the manager pauses work without repeating saved items.
- Isolate source failures and retry only failed items. Reuse one owned muted player tab, with no player API request, generated tokens or access bypass. Compile playlist and YouTube transport code out of the Store artifact.

## 0.1.35 — experimental Turbobit guest sharing

- Add the Turbobit icon for the user-provided torbobit.net site, using its anonymous web flow instead of the authenticated CostAction API. Read a fresh validated upload destination for every file; no provider code is executed or copied.
- Apply a conservative 200 MB guest file limit and disclose the published seven-day retention. Omit cookies, refuse redirects, cancel active uploads and restart only on explicit retry.
- Treat the returned ID as a provider acknowledgement, checking optional name/size metadata when supplied. Keep progress indeterminate; real uploads and independent remote-file checks remain unvalidated.

## 0.1.34 — experimental 1fichier sharing

- Add a fourth Cloud destination icon: anonymous 1fichier sharing through its documented web-upload protocol, with no account/API key or new manifest permission.
- Send one known-size file, ignore the upload redirect and validate the same-node JSON report against the exact filename, size and public download-link domain. Omit cookies and never retain upload IDs or deletion links.
- Show indeterminate sending instead of an invented percentage. Cancellation preserves originals; explicit retry starts a fresh whole-file upload. Real provider upload remains unvalidated.

## 0.1.33 — experimental MegaUp sharing

- Add MegaUp as an icon destination alongside Gofile and pCloud. Parse its fresh public anonymous upload configuration as bounded data, without executing provider scripts or copying account cookies.
- Upload sequential chunks, show progress, cancel active requests and retain originals. Explicit retry starts a fresh whole-file transfer; temporary provider credentials are never persisted.
- Reject unexpected destinations, changed upload pages, provider limits, HTML and inconsistent final metadata. Label this undocumented web-form adapter experimental; real provider transfers remain unvalidated.

## 0.1.32 — finish saving without a second download

- Automatically save checked temporary results after a missed worker notification or manager reload. Serialize disk exports between managers, reconcile native downloads by their exact persisted Blob URL and avoid a second copy after a lost reply.
- Keep progress below 100% until Chrome confirms the disk file. Show saving as a separate phase in all ten languages; reopening the popup retains this page’s download results.
- Keep dismissed Save As dialogs stopped. An explicit Save file action retries only the prepared result. Uncertain native starts are reconciled before offering a retry.

## 0.1.31 — YouTube live proposals and bounded Cast loading

- Detect active YouTube live players in the local build using their already loaded player metadata. Offer exposed, compatible HLS through the stream recorder or clearly labelled tab capture for blob/SABR players. Never download the watch page as media; retain replay handling and protected-source refusal. Store detection/transport exclusion remains unchanged.
- Bound each Cast loading/buffering episode to 20 seconds, query receiver status without repeating LOAD, and keep expired/refused attempts terminal until explicit retry. Retry rechecks the observed selected source; older source/session updates cannot resurrect a failed attempt.
- Validate actual native capture from the popup’s record-only action with an original live-player fixture. Real supplied public page is now a finished live event, detected as replay; no complete transfer or physical Shield playback is claimed from that probe.

## 0.1.30 — Unified library and visual media workspace

- Add a ten-language flag picker without reloading active work, real random-frame library thumbnails and multiple selection for deletion, sequential conversion/compression, visual merge and cloud staging.
- Replace the Downloads/Library split with Library. Add visual trim handles, frame previews, range playback and ordered clip cards; move conversion/compression defaults to Settings.
- Record detected HLS streams from the popup or capture the current invoked tab through a persistent owner. Raise capture defaults to 1080p/30 fps and 8–32 Mb/s VP9/VP8, with source up to 4K selectable. Add local colored pen annotations and cleanup.
- Accept modern pCloud EU upload links and stage multiple cloud files only after Send. Remove Google Drive, OneDrive and identity/OAuth permissions at the user’s request.
- Pass the popup Cast click directly to a persistent native controller. Reuse completed downloads or an explicit original path for PC files; after eligible preparation, call the receiver picker without a second Cast click. Physical PC-file reception on Shield remains unvalidated.

## 0.1.29 — Alcydeo and native local-file Cast

- Rename the displayed product Alcydeo, without an accent, in native locales, UI, documentation and outlined wordmarks; regenerate brand exports.
- Add a real Cast button to the local video player using Chrome Remote Playback for an authorized saved file. Prepare optional local-file access; reuse completed Chrome downloads or explicitly save a local copy from File/OPFS. Start playback, then choose a receiver in the player.
- Report native connection state and errors; cancel pending local copies and release Blob URLs on replacement/closure. Reject network shares and invalid paths. Keep the tab-casting guide as a secondary fallback for short clips and unsupported receivers.
- Chrome 156 requires more than 15 seconds for this native route. Physical Shield playback remains unvalidated; no external publication or companion.

## 0.1.28 — TV workspace and local files

- Add a permanent TV workspace and Cast actions on saved video cards in the popup and library. Retained outputs open directly with their logical filename; native downloads use an explicit file picker.
- Decode local files in an extension player with no media upload, bounded Blob ownership and cleanup on replacement/navigation. Explain unreadable codecs and guide Chrome’s manual Cast tab menu, separately from direct-link Cast. The guide does not automatically open the browser chooser.
- Localize both paths in ten languages, including RTL. Physical receiver playback remains unvalidated; AirPlay is unavailable in Chrome Windows.

## 0.1.27 — Cast directly from the extension

- Add a visible Cast button on detected videos and an autonomous extension controller. Native Presentation API opens Chrome’s receiver controls; the normal path no longer depends on localhost, Pages or a remote SDK.
- Send a complete direct video URL or HLS/DASH manifest after device selection. Confirm playback from receiver media status, with bounded waits, visible failures, play/pause and disconnect. Local disk-only files still require original-tab casting.
- Separate a real headed Chrome controls capture from receiver protocol simulations. Retire the old native-media prototype from the active UI and tests; real Shield playback remains to be validated.

## 0.1.26 — Cast diagnostics and separate Google Cast sender

- Add an optional standalone Google Cast web sender using the official SDK and Default Media Receiver. The SDK runs only on the web page, with explicit receiver selection, sanitized fragment handoff, visible load errors and playback/disconnect controls. Prepare local preview and Pages output without publication.
- Keep the native prototype separate, gate it on metadata readiness, preserve click activation, report silent dismissals and distinct errors, and cancel availability observation before the video element is removed.
- Explain unavailable AirPlay on Windows. Add the original-tab Cast path for segmented sources, ten native languages and an actual 24-second fixture alongside short clips. Real receiver validation remains pending.

## 0.1.25 — cloud destination icons and pCloud deposits

- Replace the cloud destination dropdown with keyboard-accessible icon buttons, grouped into link sharing and cloud storage, in all ten native languages.
- Add pCloud public upload-link deposits without sender sign-in, explicit EU/US region, real progress, strict API result handling, cancellation and explicit full-file retry. A folder owner account and an existing upload link are required; no new public download link is created.
- Keep real-provider validation pending; tests use intercepted local responses and never upload user files externally.

## 0.1.24 — record a running HLS stream

- Add Player stream alongside the existing Tab capture mode. Record a detected or pasted authorized HLS live source, retaining source packets in local storage and creating a checked MP4 after stop or ENDLIST.
- Persist committed segments, detect sliding-window gaps, changed source identities and discontinuities, save a marked partial recording on transport failure, and recover received bytes after manager closure without refetching missing broadcast time.
- Localize both modes in ten languages. Live support is limited to unencrypted muxed TS/fMP4; separate audio, DASH live and unsupported low-latency/delta layouts are explicitly refused.

## 0.1.23 — dedicated Video tools workspace

- Add a permanent manager navigation tab with direct trim and ordered clip merging, plus conversion/compression. The shared editor also retains contextual dialogs from download records.
- Local processing, original names and the existing persistent queue are preserved; the new workspace and navigation are localized in all ten languages.

## 0.1.22 — popup progress and MP4 conversion preferences

- Download stays in the action popup with persisted progress, bytes, percentage, pause/resume/cancel, saved-file reveal and an explicit advanced-tools action. Native direct downloads open no manager; managed streams reuse an inactive processing tab.
- MP4 conversion gains saved quality, maximum resolution and AAC bitrate preferences, with per-file overrides and automatic compatible-track copying. Defaults preserve existing behavior; original filenames retain their operation suffix.
- Alcydeo and the manifest version replace the optional-transfer label. New controls and help are localized in all ten languages.

## 0.1.21 — retain original names for converted files

- Preserve the selected file’s name, including files reopened from the library, with `-converted.mp4` for conversion and `-compressed`/`-merged`/`-trimmed` for other editing outputs.
- Use the same logical name in the tools dialog, saved file and prepared cloud export; keep temporary OPFS filenames internal.
- Avoid stacking the same operation suffix; keep Chrome’s filename uniqueness handling and the original files.


## 0.1.20 — check proposals before transfer, page-title fallback and native TV prototype

- Check bounded file samples and selected HLS/DASH fragments asynchronously, with two simultaneous checks; reject confirmed HTML, small files, missing sources and unsupported manifests before creating a download. Keep network uncertainty distinct from a rejected file.
- Use the top-level web page title when a media/iframe title is empty or generic; retain original media titles when present.
- Add a persistent experimental TV player for direct videos using Chrome’s native Remote Playback chooser. AirPlay remains explicitly unavailable when its native API is absent; no real receiver playback is claimed.
- Preserve the 0.1.19 identity and ten native languages. No permission, account service, remote executable or storage-schema change.


## 0.1.19 — coherent kingfisher profile and publication assets

- Redraw the original cartoon kingfisher in side profile with one visible eye; remove the download arrow.
- Add a separately drawn compact head for all manifest icons, favicons and small headers; keep the full illustration in larger views.
- Prepare transparent high-resolution PNGs, outlined horizontal/stacked wordmarks, light/dark publication cards, monochrome marks and a downloadable local identity kit.
- Keep the approved palette and existing ten-language interface. No download engine, storage schema, permissions or cloud behavior change.


## 0.1.18 — refreshed manager and Material icons, 2026-11-01

- Rebuild the manager around persistent side navigation, a rounded workspace, a prominent search field and compact grouped download rows with localized dates and status labels.
- Group settings into detection, appearance, destination and processing sections, with a persistent save bar. Keep actual media, recording and cloud actions connected to their existing workflows.
- Replace hand-drawn UI glyphs with a pinned, locally bundled subset of Google Material Symbols Rounded, including a properly formed settings gear. Preserve Apache-2.0 attribution and SVG provenance; no remote font or icon runtime.
- Add localized navigation/help/filter labels, ten-language descriptions and native count placeholders. Support RTL, compact rails/narrow windows, keyboard skip navigation and both themes.

## 0.1.17 — media formats, filters, recording, editing and cloud preparation, 2026-11-01

- Recognize MP4, WebM, M4V, MKV, TS, MOV, AVI, OGG, MPG/MPEG, WMV, FLV, 3GP, M2TS, MTS and MP3, AAC, M4A, FLAC, WAV originals; keep HTML and known stream fragments excluded. HLS M3U8 and DASH MPD retain their segmented processing.
- Default to ignoring known files below 10 KB, with 100 KB, 1 MB and 2 MB presets. Apply thresholds per quality, preserve unknown sizes, and never confuse playlist bytes with media size.
- Normalize blacklisted URLs/domains, include subdomains, and clear page caches/badges. Add help with a local fallback before Pages publication; refresh website styling from the NoxRouteNeo design reference.
- Add explicit Chrome tab/window recording, a bounded 480p/24 fps WebM profile, progressive OPFS flushes and interrupted-part recovery. No universal DRM or machine-performance claim.
- Add queued local compression, trim and ordered merge to MP4. Normalize merge clips sequentially and reject incompatible layouts or codec configurations.
- Add explicit Gofile sharing and prepared OAuth/resumable Google Drive and OneDrive transports. Provider validation requires configured accounts; local protocol simulations do not count as real-service tests. No background upload or external publication during development.

## 0.1.16 — sequential local MP4 conversion, 2026-11-01

- Add a simple video picker in Settings and Convert to MP4 on applicable download records. Keep the disk original and persist the prepared input for recovery.
- Target H.264 and AAC-LC: copy compatible tracks, reencode other supported tracks, preserve audio channels and reject dropped audio/video tracks. Normalize odd display dimensions for H.264.
- Serialize conversions across managers with an atomic lease and a Worker lock. Pause/cancel stops processing; recovery restarts from the stored input. Preserve queue-time save settings.
- Bundle a local AAC-only WASM fallback, with source/license notices and a packaged Worker adapted for MV3 CSP; no remote executable or native companion.
- Recognize original MKV downloads without renaming their container. Keep conversion limits explicit.

## 0.1.15 — clear history and paginated lists, 2026-11-01

- Add a confirmed Clear history action in Downloads and Library, covering all pages/filters and removing eligible records and their temporary directories.
- Preserve saved files, Chrome download history, active/paused work, live leases and entries created after the confirmation opens. Recheck resumed tasks inside the same IndexedDB write transaction as deletion.
- Replace the silent 100-entry truncation with 20-entry pages; apply search/favorites before pagination and clamp pages after removal.
- Translate controls, confirmation and page placeholders in all ten native Chrome locales, including RTL.

## 0.1.14 — vintage cartoon kingfisher, 2026-11-01

- Redraw the original vector mascot in a Cuphead-inspired 1930s cartoon direction, with rounded ink outlines, large pie-cut eyes and expressive wings.
- Preserve the approved palette and download arrow; add a thin light contour for dark backgrounds.
- Generate optical toolbar portraits at 16/32/48 px, a full 128 px icon, monochrome silhouette and updated wordmarks/site identity.

## 0.1.13 — optional multi-part direct downloads, 2026-11-01

- Add a disabled-by-default Settings option with 2/4/8 simultaneous range requests.
- Copy compatible direct files progressively into one OPFS output with strong ETag checks and flushed resume checkpoints; preserve original bytes and container.
- Fall back to native Chrome for incompatible fresh sources. Preserve destination preferences and reject changed/invalid sources without saving partial files.
- Verify a >2 GB original output by full SHA-256; validate settings in all ten locales. Google Cast/Chromecast and AirPlay remain separately planned.

## 0.1.12 — binary media and HTML wrapper detection, 2026-11-01

- Recognize media paths served with generic binary MIME and preserve observed final signed URLs after proxy redirects.
- Exclude HTML attachment names, embedded player documents and HTML error responses including 403; skip non-media resource timing entries.
- Verify both blob/proxy and normal-video paths with full local files and worker restart. The supplied real Webflix player remains gated in the test browser.

## 0.1.11 — broader detection and experimental local YouTube, 2026-11-01

- Detect open component players and recognizable previously loaded media resources.
- Read an already-loaded YouTube catalog, group real qualities and process separate tracks/SABR locally with bundled code.
- Refuse server attestation rejection without saving a partial file; the supplied real Short completes at 144p/720p; other sources/sessions can refuse access.
- Prepare a distinct Store ZIP with YouTube transport omitted. No external publication.

## 0.1.10 — recognizable kingfisher, 2026-11-01

- Redraw the original SVG with a clear head, long bill, separate tail, spread wings and orange breast. Place a small download arrow at the bill tip. Keep the approved colors.
- Regenerate 16/32/48/128 px transparent Chrome icons, light/dark wordmarks, a monochrome silhouette with transparent eye/throat details, and the identity board.
- Refresh actual extension/site screenshots and local delivery assets. No transfer or permission behavior changes.

## 0.1.9 — compact proposals and save preferences, 2026-11-01

- Reduce source cards to about 100 px: a single-line title with full tooltip, compact quality/download controls and icon actions. Remove the filename editor and decorative preview block; retain only actual frame thumbnails, and preview the selected direct variant.
- Offer automatic saving or native Save As for each download in all ten languages. Both direct files and assembled outputs retain the queue-time choice. Automatic saving uses Chrome’s configured download directory and a relative subfolder, with a shortcut to Chrome’s main-folder settings.
- Preserve completed assembled outputs after a dismissed save request, and let failed direct starts retry through the native transfer path. No repeated automatic chooser or unnecessary remux on retry.
- Exercise compact long-title layouts, real thumbnails/selected previews, preferences and actual direct/HLS transfers in both save modes. Windows native chooser interaction is not claimed as tested.

## 0.1.8 — resolve wrapped HLS sources, 2026-11-01

- Unwrap unique HLS rendition lists during discovery to expose actual qualities instead of a wrapper label. Download follows the selected rendition through bounded nested lists and retains inherited separate audio and exact signed URLs.
- Limit a chain to six playlists, 200 variants per playlist and a 20-second download-plan timeout; keep the existing eight-second discovery timeout, source permissions and encryption refusal. Detect cycles and stop when an explicit quality is no longer available.
- Explain quality-selection failures and playlist loops in all ten languages. Move raw task error codes into expandable technical details.
- Verify actual selected 180p output, refreshed source grouping and recovery diagnostics. The reported Zalando product page could not be accessed from this environment; it remains unverified.

## 0.1.7 — earlier detection badge, 2026-11-01

- Start media observation at document_start and inject scans immediately, without waiting for a page or iframe to finish loading.
- Publish confirmed network sources independently of DOM scans and restoration of observers in other tabs; enrich qualities afterward.
- Coalesce relevant media changes with a leading scan and a 200 ms bound on repeated automatic scans. Ignore unrelated DOM churn and prevent duplicate observers.
- Generate thumbnails when the popup requests a detailed scan; retain existing previews during automatic scans. Remove the redundant loading-event badge reset.
- Verify badge availability with parser-blocking scripts, slow frames, delayed quality lookup, worker wake and continuous unrelated DOM updates.

## 0.1.6 — segmented media recognition, 2026-11-01

- Inspect already observed HLS/DASH playlists in the background with bounded concurrency, retain exact fragment relationships, and remove known initialization/media fragments from full-file proposals.
- Support explicit HLS initialization byte ranges and validate each HTTP range before assembly. Preserve signed URLs and unrelated complete files.
- Treat MPEG-TS stream type 0x15 as omitted timed metadata, with an explanatory note in all ten languages. Keep the original warning/error path for other problems and refuse unsupported stream types instead of silently exporting incomplete audio/video.
- Remove the redundant filename callback that ran after cancellation and caused Chrome’s “Download must be in progress” error.
- Exercise actual TS+ID3, opaque CMAF, single-file byte ranges, native error reporting, completed files and an unsupported video codec.

## 0.1.5 — actual media sources, 2026-11-01

- Link player URLs to the final media URL observed after HTTP redirects, keeping the reader title/resolution and the exact download signature.
- Exclude media candidates that actually returned HTML. A failed native source is kept out of suggestions until navigation, while other valid sources remain available.
- Keep the existing native download path and permissions. No extra transfer engine or media preflight is added.

## 0.1.4 — grouped quality selection, 2026-11-01

- Combine a master playlist and its observed quality playlists into one video card with a quality selector; preserve HLS audio links and DASH representation ids.
- Group direct quality links when their title, frame and source URL identity agree; equal titles alone do not merge distinct videos. Download URLs and signatures stay intact.
- Discover HLS/DASH qualities automatically when the popup opens, with two metadata lookups at a time and an eight-second timeout. Manual lookup remains available after a failure.
- Preserve the selected quality and filename during rescans, including refreshed signed URLs for an identifiable quality; show the selected variant's known size and count grouped videos in the badge.
- Verify actual chosen 180p direct/HLS downloads, selection persistence, ten native locale layouts and the reported public page's single 1080p/480p card.

## 0.1.3 — automatic detection as standard, 2026-11-01

- At the user's request, enable automatic detection by default and declare HTTP/HTTPS access at installation.
- Remove the extra activation step and hide redundant source/iframe permission buttons when Chrome already grants full access.
- Preserve Chrome site restrictions and make the pause setting stop all automatic observation. Apply the new default once on upgrade while preserving other preferences and later pause choices.
- Register native request handlers synchronously against required manifest hosts so the request waking the worker is not lost; await restored access/preferences before retaining media.
- Test first-install badges without opening the popup or granting runtime hosts, native Chrome restrictions, scoped access after worker termination, and migration/pause persistence.

## 0.1.2 — optional host-permission fix, 2026-11-01

- Register both webRequest listeners only after HTTP/HTTPS host access has actually been granted; optional manifest declarations alone caused Chrome's native host-permission error at startup.
- Limit native request filters to granted hosts, update them when grants change and remove both listeners after the last grant is revoked. Global detection still requires explicit activation.
- Add three browser tests reading Chrome's native extension error console: fresh installation/reload without grants, scoped network detection after worker termination, and revocation/reload without errors.

## 0.1.1 — local detection/download fix, 2026-11-01

- Reject empty media source attributes instead of treating the current HTML page as a video.
- Detect media automatically on authorized sites with the popup closed; add explicit optional all-site detection and an icon counter.
- Scan authorized cross-origin player frames, recover earlier HLS/DASH resource requests and recognize MIME-only media and HTTP 206 totals.
- Refresh the network listener after optional host grants change; never use a manifest's byte length as the video's file size.
- Keep source/quality identities stable during rescans and discard results from a previous page.
- Stop native downloads that return HTML or other text responses, with a localized diagnostic instead of reporting a saved video.
- Add six browser regressions, including an embedded blob player and actual extensionless MP4 download/validation.

## 0.1.0 — local prototype, 2026-11-01

- Added Chrome MV3 extension with original kingfisher identity and native ten-language catalogs.
- Added direct downloads, tested HLS/DASH VOD remux, persisted tasks, checkpoints and exclusive leases.
- Added local file validation, library, favorites, metadata export, themes, folder and blocked-host settings.
- Added original media fixtures, extension-loaded tests, resource benchmark scripts and real captures.
- Prepared the static multilingual Pages site, local ZIP/CRX packaging and Store draft documents.

Not published. Future lots and unvalidated combinations are tracked in docs/STATUS.md.
