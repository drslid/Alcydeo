# Rebuilding Alcydeo 1.0.0

The reviewer archive is a Git snapshot of the complete original workspace,
including the extension, shared packages, local visual/media assets, generated
native language catalogs, license notices, tests and original synthetic fixtures.
It contains no signing credentials, browser profile or `node_modules`.

Use the Node version in `.nvmrc` and pnpm version in `package.json`:

```sh
pnpm install --frozen-lockfile
pnpm build:firefox
pnpm zip:firefox
```

The Firefox MV3 package is `artifacts/alcydeo-1.0.0-firefox.zip` and its unpacked
directory is `apps/extension/.output/firefox-mv3`. WXT deliberately emits a
nonpersistent background event page. The stable Gecko identifier is
`alcydeo@drslid.github.io`; it is an extension identifier, not a support email.
Firefox 153 or later is required. No API secret or account is needed to build.
The unsigned ZIP supports temporary installation from `about:debugging`; an
ordinary permanent installation requires Mozilla signing/review.

For the Chrome Store candidate use `pnpm zip:store`; the local experimental
Chrome build uses `pnpm build:chrome` and `pnpm zip:chrome`. Firefox and the
Chrome Store package exclude the YouTube catalog, transport and playlist
components at compilation. The development Chrome package is separate.

All JavaScript and WebAssembly executed by the extension is bundled. The
optional Google SDK is confined to the separate public web player used by
Chrome; it is not loaded into an extension page. Framework packages are pinned
in the lockfile. Vue's compiled-template runtime may receive the linter's
`UNSAFE_VAR_ASSIGNMENT` warning for its `insertStaticContent` implementation;
application templates do not use `v-html` or assign untrusted `innerHTML`.
This explanation does not bypass review or assert Mozilla approval.

Local FFmpeg/AAC adaptation and exact Mediabunny sources are included in the
packaged license archives with their original notices. The unmodified AAC
codec's corresponding source is also distributed separately as
`ffmpeg-aac-corresponding-source-60a2818.tar.gz` alongside the Release binaries.
It is source for review, not a required runtime download or a native companion.
Keep all third-party license terms; Alcydeo's original code and artwork are MIT.

Run `pnpm typecheck`, `pnpm lint` and `pnpm test` for static/unit checks. The
browser and Firefox reports identify their executed fixtures, versions, native
consent checks and codec limitations. A successful build or lint does not imply
universal source/codec compatibility or Store acceptance.
