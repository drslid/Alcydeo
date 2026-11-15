# Firefox — Alcydeo 1.0.0

Firefox **desktop 153.0 or later** has a dedicated Manifest V3 build, using an event page rather than Chrome's service worker. Its add-on ID is `alcydeo@drslid.github.io`. It is not the Chrome package renamed to ZIP or XPI. The 1.0.0 GitHub package is **unsigned and temporarily installable**; no Mozilla Add-ons listing, signature or acceptance is claimed.

## Install and update

1. Download `alcydeo-1.0.0-firefox.zip` from [the 1.0.0 Release](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0).
2. Open `about:debugging#/runtime/this-firefox` and choose **Load Temporary Add-on…**.
3. Select the ZIP, or extract it and select `manifest.json`. Grant the site access needed by the test page, start its player and open Alcydeo.
4. Keep the extension manager open for its local workers. Closing Firefox stops processing; this temporary installation is removed at restart.

For an update during the same session, wait for active work to finish and reload the rebuilt extension in `about:debugging`. Refresh source pages as well. Keep original disk files and export useful Library metadata before replacing a temporary install; this route does not establish production update/restart behavior.

A permanent installation in ordinary release/beta Firefox requires **Mozilla signing**, whether distributed through AMO or independently. Renaming the ZIP to `.xpi` does not sign it. The temporary route also does not reproduce the install-time permission prompt of a signed add-on. [Temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/) · [Signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

## Browser differences

| Capability | Firefox 1.0.0 scope |
| --- | --- |
| YouTube detection, SABR and playlists | Excluded at compilation, like the Chrome Store preparation |
| DOM/network detection, direct files and Library | Original two-quality fixture detected, selected 180p bytes saved exactly; task records survive manager reload |
| HLS/DASH and OPFS | Original unencrypted HLS TS, separate-audio HLS fMP4 and DASH fixtures actually saved/remuxed; OPFS write/read verified |
| Local video tools | Compatible AVC/AAC tracks copied; actual re-encoded conversion, crop, compression, trim and merge verified on both tested versions with OS codecs |
| Chrome `tabCapture` | Unavailable; no simulated recording or silent substitute |
| Google Cast / Chrome Remote Playback / Presentation sender | Unavailable in Firefox; the optional Cast web player requires a compatible Chrome environment |
| AirPlay | No Firefox capability claimed |
| Chrome `file://` permission and settings pages | Chrome-specific; use explicit file selection for files unavailable to the Firefox extension |
| Ten languages and Arabic/Urdu RTL | Real 525×600 popup checks in both Firefox versions, with separate Chromium results |

Firefox codec support can depend on its version, operating system and installed platform codecs. H.264/AAC encoding or a Chrome result cannot be assumed available in every Firefox environment. Unsupported input/output combinations must give an explicit error and keep the original file.

Cloud transfers remain optional and experimental where real provider uploads have not been validated. Firefox declares no required data collection and optional `websiteContent` and `personallyIdentifyingInfo` consent for an explicit Cloud transfer: a selected personal video may contain a voice or image. **Send** asks for the native consent before creating a job, preparing its copy or contacting the provider; refusing stops that send. Resume requires consent again, and revocation stops the active transfer. This is separate from telemetry. See [Mozilla's data-consent definitions](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/). Browser portability does not validate a provider or hardware receiver. No companion, media relay, remote executable or account service is added.

## Validation record

The declared minimum is **Firefox 153.0**. The isolated Linux laboratory has loaded the real temporary extension in **Firefox 160.0** and **ESR 153.7.0**, with OPFS write/read confirmed. An initial minimal Linux environment lacked the operating-system codec libraries: H.264 preview and encoding were unavailable there. Adding official Ubuntu codec libraries only to the isolated laboratory restored real H.264 playback and a supported encoding configuration in Firefox 160.0. This changes the test environment, not the product or Firefox's general capabilities. Alcydeo also includes an AAC encoding fallback; native AAC probe failure alone does not establish the full engine's capability.

Observed media results use original six-second fixtures: direct 180p saves
525,622 bytes with the exact source checksum; HLS TS saves 1,838,138 bytes;
separate-audio HLS fMP4 and DASH each save 1,837,166 bytes, with AVC/AAC tracks.
A compatible AVC/AAC MKV converts to a 1,838,870-byte MP4 with both tracks copied.
In the initial environment without OS codecs, VP8/Opus WebM conversion is refused
with `conversionCodec`, without changing the original or declaring a false saved
output. In the codec-equipped environment, both Firefox 160.0 and ESR 153.7.0
actually save and replay all five tool outputs: WebM to H.264/AAC MP4, visual
crop to 360×200, compression, a two-second trim and a 12.059-second merge.
Decoded nonempty frames, dimensions and durations are checked. Audio encoding
uses the bundled AAC fallback. These observations do not validate every codec,
platform or file size. The [1.0.0 test report](TEST-RESULTS.md) separates
media results, native consent tests and test-isolation evidence.

These are bounded installed-extension scenarios. A clean manifest/linter or
unit suite is not a substitute for those browser and actual-output checks;
unsigned temporary installation does not validate signed production updates.

The complete functional candidate passes **22 unique scenarios per browser**,
assembled from the suite and targeted harness corrections. Each browser confirms
**12 disk downloads**. This covers the media
and tool paths above, ten-language/RTL layout, source/manager/add-on reload,
legacy preference migration, pause/recovery, source refusal, dashboard
diagnostics and Firefox help, plus native Cloud consent under an enforced
external-deny proxy. It is a selected regression set, not every repository test.

The final package updates only its ten native catalogs to neutral browser
wording. Its **79 JavaScript/CSS/WASM/manifest files remain identical** to that
functional candidate. The checked-in [Firefox smoke helper](../scripts/firefox-smoke.md)
is then executed against this final ZIP on both versions, including real saved
direct/HLS playback, without another Cloud interaction. These final smokes are
distinct from the earlier 22-scenario selection; not every scenario is rerun
after the catalog-only update.

`web-ext 10.8.0` / `addons-linter 10.15.0` report **0 errors, 0 notices and 1
warning**: `UNSAFE_VAR_ASSIGNMENT` in Vue's compiled static-template runtime.
The corresponding project-source inspection finds no `v-html` or manual
`innerHTML` assignment; the warning is retained, not relabeled as a clean AMO
approval. No signed package or AMO submission was produced.

## Review sources and AMO

### Desktop compatibility and executable-code checks

The manifest intentionally omits `browser_specific_settings.gecko_android`:
the supported release target is desktop, without an Android AMO compatibility
claim. This is not a platform block against manual Android installation. Mozilla's
validator still checks Android API minima using the inherited Gecko minimum.
The published minimum is **153.0**, above the `data_collection_permissions`
introduction in desktop Firefox 140 and Android Firefox 142. Do not add an
Android declaration merely to silence a warning without adapting and testing a
mobile port. See [Mozilla's compatibility rules](https://extensionworkshop.com/documentation/publish/version-compatibility/#android-compatibility)
and the [MDN manifest compatibility data](https://github.com/mdn/browser-compat-data/blob/main/webextensions/manifest/browser_specific_settings.json).

The exact published ZIP with SHA-256
`1c03864a6544b2d81ec7d93516b0e9e5524e9f6fa485bf049603521efe507c35`
contains 12 executable JavaScript files. It contains neither `ort/` nor an
`embed.worker` module. Its three dynamic imports are constant relative paths
to modules present in the ZIP. A fresh official-linter check finds no
`DANGEROUS_EVAL`, unsafe-import or minimum-version warning; the single Vue
warning described above remains.

The CSP permits bundled WebAssembly using `'wasm-unsafe-eval'`; it does not
include JavaScript `'unsafe-eval'`. These are different capabilities under
[Mozilla's extension CSP](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_security_policy).

The current repository's packaging gate parses all `.js`, `.mjs` and `.cjs`
modules without executing them. It rejects common `eval`/`Function` invocation
forms and aliases, variable/interpolated imports, remote module references,
missing module targets, JavaScript `'unsafe-eval'` and an accidental Android
target declaration. Constant relative imports must resolve inside the ZIP.
Lexical analysis has finite visit/resolution/depth budgets; it complements the
official Mozilla linter rather than proving arbitrary JavaScript safe.
The [post-release audit](benchmarks/firefox-package-safety-1.0.0.json) records
47 new gate tests, 1,092 passing unit tests and a byte-identical Firefox rebuild.
These are build-tool safeguards: the immutable 1.0.0 release and its tagged
review sources have not been replaced.

With Node 24.22.2 and pnpm 12.5.1, build from the pinned source tree:

```sh
pnpm install --frozen-lockfile
pnpm build:firefox
pnpm zip:firefox
```

The unpacked Firefox manifest is
`apps/extension/.output/firefox-mv3/manifest.json`. The ZIP command also checks
the Firefox manifest, local resources, locale catalogs, permissions, version and
YouTube exclusion. See [development](DEVELOPMENT.md) for the shared toolchain.

`alcydeo-1.0.0-source.zip` contains the review source tree, pinned lockfile, tracked source notices and build instructions. The exact AAC corresponding-source archive is also supplied as a separate Release asset. Rebuilt files must be compared with the Firefox package before a submission. The GitHub automatic source archive is a separate repository snapshot.

Use the exact [reviewer rebuild procedure](REVIEWER-BUILD.md) for the source
archive, environment and package comparison.

The owner must separately authorize any upload for AMO review/signing. Use the same Firefox channel that excludes YouTube. Review the real manifest, permission explanations, data declarations, localized texts and actual screenshots with the publisher account; no token or invented contact belongs in the repository. Public support is [GitHub Issues](https://github.com/drslid/Alcydeo/issues), and [the public privacy notice](https://drslid.github.io/Alcydeo/en/guides/privacy/) describes local and optional external processing.

Mozilla requires readable sources and exact local build instructions for bundled/preprocessed code. Include the tool versions and all required local assets; do not claim reproducibility until the rebuilt content has actually been compared. [Source submission requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/).

## Français

Le paquet Firefox est distinct du paquet Chrome et exclut YouTube. Chargez le ZIP dans **about:debugging → Ce Firefox → Charger un module complémentaire temporaire**. L’installation prend fin au redémarrage ; aucune signature Mozilla ni fiche AMO n’est annoncée. Capture d’onglet Chrome, Google Cast et AirPlay ne sont pas des capacités Firefox. Les codecs et outils locaux dépendent du navigateur et de la plateforme ; les preuves Firefox sont distinctes des essais Chromium.
