# Publishing Alcydeo previews

The first public version is **0.2.0 preview**, for Chrome desktop. GitHub source,
GitHub Pages and GitHub Releases are separate publication actions. Chrome Web
Store submission and the planned Firefox port are later work. Publishing a ZIP
does not mean that Google has reviewed or listed the extension.

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

The last command runs six **explicit files**, with no retries and one worker:

| File | Coverage |
| --- | --- |
| `extension.spec.ts` | Detection, quality selection, direct/HLS/DASH files, failures, worker interruption, checkpoints and cancellation |
| `segmented.spec.ts` | TS metadata, byte ranges, fragment filtering, track and HTML guards |
| `site-access.spec.ts` | Internal pages and real permission removal/recovery |
| `popup-locales.spec.ts` | Download activity and layout in ten languages, including RTL |
| `cast-web.spec.ts` | Controlled SDK lifecycle, integrated controls, privacy and localization |
| `cast-handoff.spec.ts` | Popup/library handoff and explicit local-file fallback |

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

The CI workflow also checks both ZIP channels and creates a Pages archive. Its
local extension ZIP contains the **loopback test sender**, so CI validation ZIPs
are not the production Release assets. CI has read-only repository access and
never publishes a Release or submits to a Store.

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
claiming hardware reception. Only then enable the production sender URL in the
separately rebuilt Release candidate. Leave the Store configuration empty until
that channel is reviewed and deliberately configured.

## Prepare the public Release assets

Build from the reviewed release commit, after the public Pages check:

```sh
ALCYDEO_CAST_SENDER_URL=https://drslid.github.io/Alcydeo/cast/ pnpm build:chrome
ALCYDEO_CAST_SENDER_URL=https://drslid.github.io/Alcydeo/cast/ pnpm zip:chrome
pnpm docs:build
node scripts/pages-archive.mjs
```

Review the ZIP contents and their SHA-256 sidecars. The Chrome ZIP must contain
`manifest.json` at its root and no source fixtures, credentials or reference CRX.
Preserve the bundled licenses and source offers. `alcydeo-pages-0.2.0.zip`
contains the static site tree; it is not a Chrome extension. A locally generated
CRX and its private signing key are not needed for this first public preview.

Write reviewed release notes into `artifacts/release-notes.md`, including:

- Chrome installation with **Load unpacked**, supported scope and ten languages.
- Changes from the tested candidate, executed checks and their actual results.
- YouTube's local experimental status and its exclusion from the Store channel.
- Cloud/provider, file-size, codec and Cast/AirPlay limits that remain unvalidated.
- Links to the source, Pages documentation, privacy information and issue tracker.

Do not claim universal detection, a working private-file Cast transport or a
successful Store submission. Update the version in the following example for
later previews. Create the annotated tag at the reviewed commit, push that tag,
then prepare a draft. `--verify-tag` prevents the CLI from silently creating a
tag against another commit.

```sh
git tag -a v0.2.0 -m 'Alcydeo 0.2.0 preview'
git push origin v0.2.0
gh release create v0.2.0 \
  --repo drslid/Alcydeo --verify-tag --draft --prerelease --latest=false \
  --title 'Alcydeo 0.2.0 preview' --notes-file artifacts/release-notes.md \
  artifacts/alcydeo-0.2.0-chrome.zip \
  artifacts/alcydeo-0.2.0-chrome.zip.sha256 \
  artifacts/alcydeo-pages-0.2.0.zip \
  artifacts/alcydeo-pages-0.2.0.zip.sha256
```

Review the exact asset list and notes in the draft. Publishing that draft is the
external Release action:

```sh
gh release edit v0.2.0 --repo drslid/Alcydeo --draft=false --prerelease --latest=false
```

These commands require an already authenticated maintainer session; no token
belongs in a tracked file. GitHub CLI documents these flags in
[release create](https://cli.github.com/manual/gh_release_create).

## Recover a bad publication

For Pages, revert the faulty site commit on `main`, validate the resulting tree
and manually rerun `pages.yml`. Check the deployed URLs again. Keep release
tags immutable; publish a new version for corrected extension assets instead of
silently replacing a ZIP with a different checksum. If a preview must be pulled,
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
