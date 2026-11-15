# Publishing Alcydeo

The requested release is **1.0.0**, with separate Chrome and Firefox packages,
following the install/changes/test presentation of
[Nidomark 1.0.0](https://github.com/drslid/Nidomark/releases/tag/v1.0.0).
It is a final GitHub Release. GitHub source, Pages, Releases, Store submissions
and Firefox signing remain separate actions. Publishing a ZIP does not mean
that Google or Mozilla has reviewed, signed or listed the extension.

The canonical repository is `drslid/Alcydeo`. Its case-sensitive Pages URL is
**https://drslid.github.io/Alcydeo/**. Keep this spelling in Astro, links and the
production Cast sender configuration. The lowercase loopback route exists only
as a compatibility alias in the test server.

## Validate the candidate

Use Node from `.nvmrc`, pnpm from `packageManager`, the frozen lockfile and a
clean checkout. Do not copy `.local`, browser profiles, media collected from
public sites, signing keys, tokens or proprietary reference packages into a
public artifact. Synthetic fixtures and the original code/assets are separate
from those research files.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm check:contrast
pnpm audit --prod --audit-level=high
pnpm docs:build
pnpm exec playwright install --with-deps chromium
ALCYDEO_CAST_SENDER_URL=http://localhost:4180/alcydeo/cast/ pnpm build:chrome
pnpm test:ci
```

The last command selects **66 cases in eight explicit files**, with no retries
and one worker:

| File | Coverage |
| --- | --- |
| `extension.spec.ts` | Detection, quality selection, direct/HLS/DASH files, failures, worker interruption, checkpoints and cancellation |
| `segmented.spec.ts` | TS metadata, byte ranges, fragment filtering, track and HTML guards |
| `site-access.spec.ts` | Internal pages and real permission removal/recovery |
| `popup-locales.spec.ts` | Download activity and layout in ten languages, including RTL |
| `cast-web.spec.ts` | Controlled SDK lifecycle, integrated controls, privacy and localization |
| `cast-handoff.spec.ts` | Popup/library handoff and explicit local-file fallback |
| `release-settings.spec.ts` | New/reset defaults, persistence and preservation of existing preferences |
| `detection-diagnostics.spec.ts` | Dashboard diagnostic, source-tab choice and popup removal |

`node scripts/ci-e2e.mjs --list` prints the exact selection. The runner forces
the repository working directory, resolves the full Playwright Chromium binary,
starts its Pages server on 4180 and lets Playwright own the fixture server on
4179. Stop servers you own on these ports before running it; it never kills an
unrelated process. It records the selection in `artifacts/evidence/ci/coverage.json`
and writes results, traces and Cast screenshots below that directory.
The other selected tests also save synthetic media and screenshots under
`artifacts/evidence`; CI retains that generated evidence tree on success or failure.

This is a browser smoke suite, **not the entire regression suite**. All other
tests remain in `tests/e2e` and available through `pnpm test:e2e`. Select and run
additional files for the affected feature before release. That full command
starts the fixture server only: Cast/website cases also need the documented
Pages preview on 4180, including the legacy alias where their fixtures require it.
Large-file benchmarks,
platform-specific native dialogs, personal cloud accounts, public providers and
physical Cast/AirPlay receivers require their documented environments; a mocked
SDK result does not validate TV reception. Tests are not skipped or rewritten
by `test:ci`, and a failing selected test fails CI.

The Chrome CI workflow also checks both Chrome ZIP channels and creates a Pages archive. Its
local extension ZIP contains the **loopback test sender**, so CI validation ZIPs
are not the production Release assets. CI has read-only repository access and
never publishes a Release or submits to a Store.

Also build the dedicated Firefox channel with `pnpm build:firefox`, package it
with `pnpm zip:firefox`, and exercise the installed extension in the real Firefox
versions recorded in [FIREFOX.md](FIREFOX.md). Retain actual results for source
detection, direct/HLS/DASH saving, outputs, permissions, storage, language/RTL and
unavailable browser features. A Chromium smoke run cannot establish Firefox
compatibility. A temporary install does not validate signed restart/update flows.

## Publish Pages explicitly

After the repository's first commit exists on `main`, configure **Settings →
Pages → Build and deployment → Source → GitHub Actions**. The Pages workflow
does not enable the service itself and does not run on pushes or pull requests.

After reviewing a green CI run at the intended commit, run:

```sh
gh workflow run pages.yml --repo drslid/Alcydeo --ref main
gh run list --repo drslid/Alcydeo --workflow pages.yml --limit 5
gh run watch RUN_ID --repo drslid/Alcydeo --exit-status
```

Replace `RUN_ID` with the run just started. The build validates `/Alcydeo/`
links/assets, all ten locale routes and the Cast readiness document. Deployment
uses the `github-pages` environment; only that job receives Pages write and OIDC
permissions. Existing environment protection rules still apply. See GitHub's
[Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

After deployment, check the real homepage, French and Urdu guides, their local
assets and `https://drslid.github.io/Alcydeo/cast/ready.json` (`app` equals
`alcydeo-cast-web`, protocol 2). Check the public Cast player in Chrome without
claiming hardware reception. Pages is already public and ready for 1.0.0:
Chrome development and Chrome Store preparation now default to the production
sender `https://drslid.github.io/Alcydeo/cast/`. An explicit environment override
is reserved for the loopback test build. Firefox keeps its sender empty and
does not offer Cast. A working readiness document is not hardware validation or
Store approval.

## Prepare the public Release assets

Build from the reviewed release commit, after the public Pages check:

```sh
ALCYDEO_CAST_SENDER_URL=https://drslid.github.io/Alcydeo/cast/ pnpm build:chrome
ALCYDEO_CAST_SENDER_URL=https://drslid.github.io/Alcydeo/cast/ pnpm zip:chrome
pnpm zip:store
pnpm build:firefox
pnpm zip:firefox
pnpm docs:build
node scripts/pages-archive.mjs
pnpm zip:brand
pnpm zip:source
```

Review the ZIP contents and their SHA-256 sidecars. The Chrome ZIP must contain
`manifest.json` at its root and no source fixtures, credentials or reference CRX.
Preserve the bundled licenses and source offers. `alcydeo-pages-1.0.0.zip`
contains the static site tree; it is not a Chrome extension. A locally generated
CRX and its private signing key are not Release assets. The Firefox ZIP has its
own manifest/runtime and excludes YouTube; it is not a renamed Chrome ZIP.

`zip:source` archives the reviewed source commit, not an arbitrary working tree.
Extract `alcydeo-1.0.0-source.zip` in a fresh directory and follow its reviewer
build instructions. Compare the rebuilt Firefox contents file by file with the
unsigned Release ZIP, allowing no unexplained differences. Keep the exact AAC
corresponding-source tarball alongside the Release assets; retain the source
archives/notices already tracked in the packages. No `.local`, keys, profiles,
untracked public-media research or `node_modules` belongs in that source archive.

Use the reviewed notes in `docs/releases/v1.0.0.md`, including:

- Chrome installation with **Load unpacked** and Firefox's **Load Temporary Add-on**.
- Firefox minimum/tested versions, unavailable Chrome APIs and the absence of a signed XPI.
- Changes from the tested candidate, executed checks and their actual results.
- YouTube's local Chrome experimental status and exclusion from Chrome Store/Firefox.
- Cloud/provider, file-size, codec and Cast/AirPlay limits that remain unvalidated.
- Links to the source, Pages documentation, privacy information and issue tracker.

Do not claim universal detection, a working private-file Cast transport or a
successful Store submission. The 1.0.0 label does not remove the documented
source, provider, codec or receiver limits. Create the annotated tag at the reviewed commit, push that tag,
then prepare a draft. `--verify-tag` prevents the CLI from silently creating a
tag against another commit.

```sh
git tag -a v1.0.0 -m 'Alcydeo 1.0.0'
git push origin v1.0.0
gh release create v1.0.0 \
  --repo drslid/Alcydeo --verify-tag --draft \
  --title 'Alcydeo 1.0.0' --notes-file docs/releases/v1.0.0.md \
  artifacts/alcydeo-1.0.0-chrome.zip \
  artifacts/alcydeo-store-1.0.0-chrome.zip \
  artifacts/alcydeo-1.0.0-firefox.zip \
  artifacts/alcydeo-1.0.0-source.zip \
  artifacts/alcydeo-brand-1.0.0.zip \
  artifacts/alcydeo-pages-1.0.0.zip \
  artifacts/ffmpeg-aac-corresponding-source-60a2818.tar.gz \
  artifacts/SHA256SUMS
```

Review the exact asset list and notes in the draft. Publishing that draft is the
external Release action:

```sh
gh release edit v1.0.0 --repo drslid/Alcydeo --draft=false --prerelease=false --latest
```

These commands require an already authenticated maintainer session; no token
belongs in a tracked file. GitHub CLI documents these flags in
[release create](https://cli.github.com/manual/gh_release_create).

## Recover a bad publication

For Pages, revert the faulty site commit on `main`, validate the resulting tree
and manually rerun `pages.yml`. Check the deployed URLs again. Keep release
tags immutable; publish a new version for corrected extension assets instead of
silently replacing a ZIP with a different checksum. If a release must be withdrawn,
mark the Release as a draft and explain the reason before distributing a fix.
None of these operations removes a user's local files or extension library.

## Action revisions

The workflow pins below were resolved on 2026-11-14 from each official
repository's latest non-prerelease and Git tag-reference REST endpoints;
annotated tags were dereferenced to commits. Verify a new tag and its commit in
the same official repository before changing a pin. This follows GitHub's
[secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use).

| Action | Release | Commit SHA |
| --- | --- | --- |
| `actions/checkout` | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | [v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| `pnpm/action-setup` | [v6.1.1](https://github.com/pnpm/action-setup/releases/tag/v6.1.1) | `73e46992e05b19abd31f2f3c20e0e7370d762115` |
| `actions/upload-artifact` | [v7.0.2](https://github.com/actions/upload-artifact/releases/tag/v7.0.2) | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |
| `actions/configure-pages` | [v6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0) | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| `actions/upload-pages-artifact` | [v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| `actions/deploy-pages` | [v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) | `368f82528645a54fb793d4d04e342629a3f51346` |

The pinned upload-pages composite also pins its upload-artifact dependency.
No scheduled publishing workflow or Store credential is configured.
