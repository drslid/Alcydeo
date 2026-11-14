# Security

Please report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/drslid/Alcydeo/security/advisories/new). Do not put source tokens, cookies, signed media URLs, browser profiles or private files in a public issue. If private reporting is unavailable, open a minimal issue asking for a private channel, without exploit details or sensitive data.

Alcydeo declares HTTP/HTTPS host access at installation for automatic detection; Chrome's site restrictions remain authoritative. It does not request cookies, debugger or Native Messaging permissions. The extension runs packaged JavaScript/WASM only. The optional external Cast page loads Google's official sender SDK outside the extension.

Media processing and task state stay local unless the user explicitly sends a file to a Cloud provider or a source URL to a selected Cast receiver. Source URLs may contain temporary signatures stored locally for recovery. OPFS is quota-bound, and a structural media check is not cryptographic authenticity verification. DRM and access refusals are respected. See [privacy](docs/PRIVACY.md) and [known limits](docs/STATUS.md).

Development tools and dependencies are pinned. `pnpm audit` checks the lockfile; a scoped minimatch security override is documented in `pnpm-workspace.yaml` and should be removed when the parent adopts the fixed major. Do not add telemetry as a substitute for local, opt-in diagnostics.
