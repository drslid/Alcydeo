# Odysee HLS transfer diagnosis — 0.1.51

The supplied page is detected, but **no complete file was saved in these public transfer trials**. Requests for particular media segments returned HTTP 429 while other segments of the same video remained available. This is a session-specific result, not a claim that Odysee downloads always fail or that every quality is unavailable.

The earlier 0.1.49 evidence covered playback, manifests and bounded prefixes only. It did not establish a complete transfer. See the [earlier platform report](benchmarks/platforms-public-0.1.50.json) and the [0.1.51 transfer report](benchmarks/odysee-public-0.1.51.json).

## Observed transfers

Tests used the [user-provided public page](https://odysee.com/@gohantips:1/This-New-Germany-Inspired-Pok%C3%A9mon-Game-Has-Choices,-Regional-Forms---More!:5), native graphical Chrome **156.0.8078.4** on Linux and Node **24.22.2**. Isolated test profiles used official [uBlock Origin Lite 2026.1103.1743](https://github.com/uBlockOrigin/uBOL-home/releases/tag/2026.1103.1743), **Complete**, with `ublock-filters`, `easylist`, `easyprivacy`, `pgl`, `ublock-badware` and `urlhaus-full`. The blocker is a test tool, not an Alcydeo dependency. No personal profile, copied cookies, forged source URL/header or access workaround was used. The manager stayed open and native playback was paused before each transfer.

- **144p, copied 0.1.50 diagnostic runtime:** 18 of 64 fragments were checkpointed, totaling **3,955,520 bytes**, before failure. Native segment positions 4 and 6 returned 429 without Retry-After. The task incorrectly reported `cancelled` after sibling requests were aborted. It never assembled or exported a file. Later single-prefix probes still found 429 at those positions while position 5 answered 206.
- **360p, bounded probes only:** positions 4 and 5 returned 429, while position 6 answered 206. No complete transfer was attempted for this quality.
- **720p, 0.1.51 intermediate runtime:** initial probes at positions 4, 5 and 6 answered 206. A later bounded complete-transfer attempt checkpointed **23 of 64 fragments / 22,167,268 bytes**, then encountered repeated 429 at positions 18, 19 and 25. The corrected engine retained `retryLater`. It did not assemble or export a file. The trial had a four-minute limit and a conservative cancellation threshold below its 200 MB laboratory budget; the server refusal occurred first.

A later, low-cadence probe of the already-declared 720p segment at position 18 still received 429 with both normal browser caching and `no-store`, while playback was paused. The initial source-frame fetch probes used `credentials: include` and were unreadable to the browser, so they did not establish an HTTP status. A later diagnostic observed the actual native requests without modifying them: media XHR used `withCredentials = false` and native fetch used `same-origin`. Repeating only the same 4 KiB prefix probe in that genuine frame with the matching anonymous mode returned a readable **429**, as did the extension request; the response advertised `Access-Control-Allow-Origin: *`. The initial credentialed CORS failure must not be treated as the source refusal itself. The corrected native-mode probe still did not establish a working alternate transport or a cache/context change that restores access. No further complete transfer or 1080p trial was launched, and no URL parameters, signatures or cache-busting values were invented.

The exact user-reported `interrupted` message was **not reproduced** in the fresh-manager transfer sessions. No Worker error was observed and the ownership lease remained valid until the transfer failed. These results distinguish the observed source refusal and error-masking bug from other causes of an interrupted manager; they do not dismiss the original report.

## Correction and recovery

Concurrent fragment requests used `Promise.allSettled()`, whose result order follows request slots. After one source failed, an earlier slot could reject because its sibling had aborted it. Selecting the first rejected slot then replaced the real source error with `cancelled`.

The engine now captures the first actual fragment error **before aborting siblings** and retains that cause after all requests settle. Exhausted HTTP 429 responses use the existing `retryLater` diagnostic. Concurrency remains three HLS fragments, retries remain bounded to four attempts, and existing Retry-After handling is unchanged. This corrects the diagnostic; it does not override the server refusal or claim that every segment is downloadable.

Explicit Pause and Cancel remain authoritative. Completed checkpoint records are retained, partial writes are not checkpointed, and there is no automatic endless restart. Manual recovery keeps its existing source/version checks. The observed public segments had no ETag, so those checkpoints are not a promise of range resume or automatic reuse of unversioned bytes. No partial file is presented as completed.

## Verification and limits

A failing installed-extension test against 0.1.50 showed a real source refusal replaced with `cancelled`. A focused network test also failed before the exhausted-429 diagnostic was corrected. **38 targeted unit tests** and lint passed after the change. **Six installed-Chrome fixture tests** passed on the final 0.1.51 runtime: primary HLS 403, exhausted 429, explicit pause, cancellation during Retry-After and two parallel-DASH error cases. The DASH hypothesis was not reproduced on the intermediate runtime; those cases remain regression coverage, and no speculative global scheduler rewrite was added.

Fixtures use original local media and synthetic failures. The public trials are separate evidence: **zero complete public files, zero Chrome download records and no full-file decode**. Public videos, partial fragments, signed media addresses, raw manifests and screenshots remain ignored local evidence and are not packaged or published. A later server/session may behave differently; refresh the source and retry only when it is available, or choose another genuinely available quality. No universal Odysee or HLS success is claimed.
