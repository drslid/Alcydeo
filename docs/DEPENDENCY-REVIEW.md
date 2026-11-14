# Dependency review — 0.2.0 preview

On November 14, 2026, the pinned tree was updated before its initial public release:

| Dependency | Previous | Selected | Advisory |
| --- | --- | --- | --- |
| esbuild | 0.28.0 | 0.28.1 | GHSA-g7r4-m6w7-qqqr |
| fflate | 0.8.2 | 0.8.3 | GHSA-px8p-9vwx-vf98 |
| fast-xml-parser | 5.11.2 | 5.12.0 | GHSA-474x-hrwr-fgx4 |
| Astro | 7.4.4 | 7.4.7 | GHSA-mh32-jxcr-mh9f; GHSA-r3h5-4585-7x3w |
| minimatch, one development parent only | 10.2.6 | 11.0.1 | GHSA-g3hv-75wg-m249 |

Versions were verified against the npm registry. `pnpm audit --json` reports zero known advisories in this resolved tree at review time; this is not a guarantee of future vulnerability absence.

The minimatch override is limited to `@typescript-eslint/typescript-estree@8.72.1`. The latest stable TypeScript-ESLint package still pins v10; upstream main has adopted v11. The parent uses only `minimatch(filePath, pattern, {dot:true})`, whose named export and semantics are retained. Five cases exercise matches, nonmatches, nested paths, dotfiles and normalized Windows paths through the actually resolved parent dependency. Node24 satisfies the engine. Project-service allowDefaultProject is not enabled in this project's ESLint config, so the advisory is not an observed runtime extension vulnerability.

Remove the override when a stable parent adopts the fixed major. Recheck lockfile audit, lint, typecheck, tests and actual build outputs after dependency changes. [Upstream change log](https://github.com/isaacs/minimatch/blob/v11.0.1/changelog.md), [TypeScript-ESLint parent](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-estree/package.json), [advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).
