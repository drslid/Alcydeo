# Development

Node 24.22.2 and pnpm 12.5.1 are pinned. `pnpm install --frozen-lockfile` installs the workspace. WXT/Vue build the MV3 extension; Astro/Starlight build the static documentation. No server is part of the installed product.

Run the commands in README.md. `pnpm build:chrome` generates native localization catalogs, rasterizes the original SVG icon, retains dependency licenses and compiles the extension. `pnpm zip:chrome` builds and checks the production ZIP. `pnpm crx:chrome` packs the current build with an ignored local test key. `pnpm docs:build` generates translated pages and Store draft text, builds the static site, then checks local links and the exact `/Alcydeo/` base.

`pnpm test` tests manifest parsing, source safety and contracts. `pnpm test:ci` runs the explicit portable browser smoke selection with its own local servers; the full suite remains separate. `pnpm test:e2e` loads the compiled extension in a persistent browser context. The optional large stress test is skipped unless `ALCYDEO_LARGE_FILE` names a generated file. Permissions use the real browser APIs. The native host-consent bubble remains a manual test; no permission mock is used for media downloads.

```sh
pnpm exec playwright install chromium
pnpm build:chrome
pnpm test:e2e
pnpm fixtures:large
# Linux shell; in PowerShell set the variable with $env:ALCYDEO_LARGE_FILE = ...
ALCYDEO_LARGE_FILE="$PWD/artifacts/benchmarks/large.mp4" pnpm test:e2e stress
```

Linux hosts need the browser's runtime libraries. An already installed Chrome for Testing can be selected with `CHROMIUM_PATH`. These are development/test prerequisites, not an end-user companion. The local WSL test host used extracted browser libraries because passwordless sudo was unavailable; no project-specific absolute path is required by source code.

The short, checked-in media fixtures are original synthetic patterns and tones. Optional regeneration uses `FFMPEG_FOR_FIXTURES` pointing to a development-only encoder: `pnpm fixtures`. FFmpeg is not included in the extension, called by it, installed for users or required for normal builds/tests. `pnpm fixtures:large` instead generates a large original stress file from the checked-in encoded packets using Mediabunny alone. Large files stay ignored in `artifacts/`.

Treat docs/SPEC.txt and design-tokens.json as the validated product requirements. Browser engine updates, additional containers, redirects, live windows, codec changes and storage policy changes need real output validation and resource measurements. Keep parsing/remux code out of the initial popup runtime and keep all executable extension code local.
