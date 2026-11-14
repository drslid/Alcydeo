# Publication channels

The owner authorized the first public GitHub publication on **November 14, 2026**: source at [drslid/Alcydeo](https://github.com/drslid/Alcydeo), a documented **0.2.0 preview Release**, and [GitHub Pages](https://drslid.github.io/Alcydeo/). Repository and Pages URLs preserve the capital A. Chrome Web Store submission and the later Firefox/AMO port are separate stages. No Store listing or acceptance is claimed.

## Deliverables

| Artifact | Purpose |
| --- | --- |
| `alcydeo-0.2.0-chrome.zip` | Chrome development preview, including local experimental YouTube support |
| `alcydeo-store-0.2.0-chrome.zip` | Separate Chrome Web Store preparation; YouTube readers, transport and playlists excluded |
| `alcydeo-brand-0.2.0.zip` | Original vector identity and high resolution exports |
| `ffmpeg-aac-corresponding-source-60a2818.tar.gz` | Exact corresponding AAC codec source distributed alongside binaries |
| `SHA256SUMS` | Checksums for the downloadable Release assets |

Both extension ZIPs have `manifest.json` at the root. Neither is an official Store installation. Extract into a folder and use Chrome's developer-mode **Load unpacked** action. The private local CRX test key stays ignored and is never a Release asset.

Use [RELEASING.md](../RELEASING.md) for the publication procedure and rollback. The Release must be marked a pre-release while receiver, provider and wider source compatibility remain limited. Keep all source notices and exact MPL/LGPL source archives inside the extension ZIP. GitHub's automatic source snapshot is not a compiled extension.

## Chrome Web Store — next stage

1. Use the publisher's own developer account and recheck [registration](https://developer.chrome.com/docs/webstore/register), [preparation](https://developer.chrome.com/docs/webstore/prepare) and [image requirements](https://developer.chrome.com/docs/webstore/images) at submission time. No publisher fee or credential is automated here.
2. Review all ten text drafts in `locales/`, the exact packaged manifest and [permission/data statement](DATA-AND-PERMISSIONS.md). The extension handles website media and browsing-related metadata locally; do not claim it handles no user data.
3. Set the actual privacy URL to the public Pages notice and support to GitHub Issues. No fictitious email, Store ID or OAuth client is required.
4. Use only actual screenshots made with original fixtures. Check 1280 × 800 or 640 × 400 Store dimensions against the current portal.
5. Validate Windows behavior, source saving, permissions, recording, media outputs and known limitations. Cloud protocols remain experimental where real uploads are unverified; Cast of private PC files to Shield is not implemented; AirPlay is unavailable in Chrome Windows.
6. Submit the **Store ZIP**, not the repository, local YouTube preview or a CRX, only after an explicit submission instruction. Review/approval does not guarantee publication timing.

## Reviewer scenario

No Alcydeo account is needed. Use the original fixture server described in [DEVELOPMENT.md](../DEVELOPMENT.md). Open a media page, choose quality, download and wait for the saved state; find the item in Library and reveal its folder. Exercise HLS/DASH with the manager open. Restrict a source host in Chrome and verify the recoverable permission error, then restore access. Check all ten locales and Arabic/Urdu RTL. Refuse HTML or protected sources without exporting a false video. Use the separate Store runtime QA to confirm YouTube is absent.

## Firefox / AMO — later stage

The owner now requests Firefox after the Chrome release. This supersedes the earlier planning exclusion; there is **no tested Firefox build yet**. First adapt the background event-page lifecycle and browser API boundaries, then verify downloads, OPFS/WebCodecs, permissions, tab capture, localization and media files in real Firefox. Treat TV capabilities separately. Add Firefox CI and an AMO source bundle before signing/submission with the owner's account. Do not rename a Chrome ZIP to XPI or claim parity from a successful compile. See [Mozilla's cross-browser guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension).
