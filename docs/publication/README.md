# Publication channels

The owner authorized the first public GitHub publication on **November 14, 2026**, then the **1.0.0 Chrome and Firefox Release on November 15**. Source is at [drslid/Alcydeo](https://github.com/drslid/Alcydeo), with [GitHub Pages](https://drslid.github.io/Alcydeo/). Repository and Pages URLs preserve the capital A. Chrome Web Store/AMO submission and Firefox signing remain separate actions. No Store listing or acceptance is claimed.

## Deliverables

| Artifact | Purpose |
| --- | --- |
| `alcydeo-1.0.0-chrome.zip` | Chrome development package, including local experimental YouTube support |
| `alcydeo-store-1.0.0-chrome.zip` | Separate Chrome Web Store preparation; YouTube readers, transport and playlists excluded |
| `alcydeo-1.0.0-firefox.zip` | Dedicated Firefox package, without YouTube; unsigned temporary installation |
| `alcydeo-1.0.0-source.zip` | Review sources, pinned lockfile and local rebuild instructions |
| `alcydeo-brand-1.0.0.zip` | Corrected original vector identity and high resolution exports |
| `alcydeo-pages-1.0.0.zip` | Static Pages tree; not an extension |
| `ffmpeg-aac-corresponding-source-60a2818.tar.gz` | Exact corresponding AAC codec source distributed alongside binaries |
| `SHA256SUMS` | Checksums for the downloadable Release assets |

All extension ZIPs have `manifest.json` at the root. None is an official Store installation. Extract a Chrome ZIP into a folder and use **Load unpacked** in `chrome://extensions`. For Firefox, use **Load Temporary Add-on…** in `about:debugging#/runtime/this-firefox` and select its ZIP or extracted manifest. It lasts until Firefox restarts. The private local CRX test key stays ignored and is never a Release asset.

Use [RELEASING.md](../RELEASING.md) for the publication procedure and rollback. The requested 1.0.0 is a final GitHub Release, following the package/install/changes/test structure of [Nidomark 1.0.0](https://github.com/drslid/Nidomark/releases/tag/v1.0.0); its browser capabilities and test claims remain Alcydeo's own. Keep all source notices and exact MPL/LGPL source archives inside the extension ZIP. GitHub's automatic source snapshot is not a compiled extension. A final Release does not remove the documented provider, codec or receiver limits.

## Chrome Web Store — next stage

1. Use the publisher's own developer account and recheck [registration](https://developer.chrome.com/docs/webstore/register), [preparation](https://developer.chrome.com/docs/webstore/prepare) and [image requirements](https://developer.chrome.com/docs/webstore/images) at submission time. No publisher fee or credential is automated here.
2. Review all ten text drafts in `locales/`, the exact packaged manifest and [permission/data statement](DATA-AND-PERMISSIONS.md). The extension handles website media and browsing-related metadata locally; do not claim it handles no user data.
3. Set the actual privacy URL to the public Pages notice and support to GitHub Issues. No fictitious email, Store ID or OAuth client is required.
4. Use only actual screenshots made with original fixtures. Check 1280 × 800 or 640 × 400 Store dimensions against the current portal.
5. Validate Windows behavior, source saving, permissions, recording, media outputs and known limitations. Cloud protocols remain experimental where real uploads are unverified; Cast of private PC files to Shield is not implemented; AirPlay is unavailable in Chrome Windows.
6. Submit the **Store ZIP**, not the repository, local YouTube preview or a CRX, only after an explicit submission instruction. Review/approval does not guarantee publication timing.

## Reviewer scenario

No Alcydeo account is needed. Use the original fixture server described in [DEVELOPMENT.md](../DEVELOPMENT.md). Open a media page, choose quality, download and wait for the saved state; find the item in Library and reveal its folder. Exercise HLS/DASH with the manager open. Restrict a source host in Chrome and verify the recoverable permission error, then restore access. Check all ten locales and Arabic/Urdu RTL. Refuse HTML or protected sources without exporting a false video. Use the separate Store runtime QA to confirm YouTube is absent.

## Firefox / AMO — package prepared, signing separate

The owner explicitly requested the Firefox port for 1.0.0. Its principal package is the same channel prepared for AMO, with YouTube excluded at compilation. [FIREFOX.md](../FIREFOX.md) records the exact runtime scope and real validation; Chrome-only APIs are unavailable, rather than simulated.

1. Use the dedicated Firefox ZIP and review-source ZIP. Rebuild in a fresh directory and compare the complete Firefox package contents; preserve the exact lockfile, local assets and bundled third-party source notices. Mozilla requires [readable sources and reproducible build instructions](https://extensionworkshop.com/documentation/publish/source-code-submission/) for bundled/preprocessed code.
2. Review the actual Firefox manifest, host grants, `browser_specific_settings`, privacy declarations and permission explanations. Do not carry a Chrome permission justification across without checking the packaged Firefox manifest.
3. No signed XPI or permanent ordinary-Firefox installation is supplied by a GitHub ZIP. Mozilla signing is required for permanent release/beta installs, including self-distribution. [Signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).
4. Only after a separate explicit signing/submission instruction, use the publisher's Mozilla account and choose listed AMO or unlisted signed distribution. No credentials are written to tracked files, and no approval timing is promised.
5. Use real Firefox screenshots and report unavailable capture/Cast capabilities, codec limitations and the tested versions. Temporary installation does not validate production install prompts, restart recovery or signed updates. [Temporary-install limitations](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).
