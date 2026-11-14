# Content observer lifecycle — 0.1.39

The user reported `Uncaught TypeError: Cannot read properties of undefined (reading 'sendMessage')` at `content-scripts/observe.js:1`. It occurs when the old content script no longer has `chrome.runtime`. A related native reload failure was reproduced in 0.1.38: **Extension context invalidated.** A native extension reload invalidates content-script messaging while an already-open page can still hold the old DOM observer and its queued notification.

`runtime.sendMessage(...).catch(...)` only handles a rejected Promise. Reading sendMessage already throws if runtime is absent. Chrome can also throw synchronously before returning a Promise when the context has expired. Repeated page changes therefore produced repeated exceptions from the minified observer's line 1.

The observer now checks both the actual chrome.runtime/sendMessage namespace and its WXT context before DOM processing, before scheduling a notification and immediately before sending. The direct check matters because the cached WXT browser binding can remain valid while the global runtime namespace is absent. A synchronous throw and a rejected invalidation Promise both stop the obsolete instance. Cleanup is idempotent: it cancels the pending timer, disconnects the observer, removes document/shadow-root listeners and releases the isolated X catalog. Late callbacks cannot restart it. A transient missing receiver while the context is valid leaves detection available for the next event. No polling, permission, message payload or remote executable is added.

## Reproduction and checks

A frozen 0.1.38 package and the patched build are installed separately in actual Chrome 156 profiles. The same native runtime-reload probe and subsequent page mutations produce **six observer exceptions before / zero after**. It records a badge before the reload; successful recovery is checked separately through Chrome's real extension reload and disable/re-enable controls.

A separate controlled missing-runtime probe reproduces the user's exact TypeError in the frozen old package and checks its absence in the patch. This deliberately injects API unavailability in an installed content-script context; it is distinct from a natural Windows-profile reproduction.

The seven lifecycle browser cases exercise an absent runtime namespace and its recovery, plus native reload with a pending report, disable/re-enable with the source page still open, synchronous and asynchronous invalidation races, a transient receiver failure and explicit cleanup with a shadow-root listener. Controlled API-failure injection is confined to tests. It verifies that a dead instance attempts no further notifications, a valid instance survives transient failure, and reinjection restores fresh media detection.

The user's first-line TypeError is now explicitly covered. Tests are performed with Chrome for Testing on Linux/WSL2; native Windows dialogs and the user's profile are not driven.

## Applying the update

Close old Alcydeo manager tabs, reload the extension in `chrome://extensions`, check version 0.1.39 and refresh web pages which were already open. Page refresh removes any already-resident 0.1.38 script. Historical Chrome extension errors can then be cleared from the Errors panel. The fix prevents new stale observers from repeatedly sending after later reloads; it cannot rewrite an old script which is already running or erase historical errors in another Chrome profile.

Existing X/TikTok detection, quality choices, file names, downloads and ten-language/RTL UI use their existing paths. [Validation report](TEST-RESULTS.md). No external publication occurred.


## Startup restoration — 0.1.52

A fresh-profile regression reproduced a valid runtime but absent observer: twelve probes over 1.2 s stay inactive, and a subsequent ordinary media mutation is missed. The stale about:blank snapshot in background restoration could clean up the observer installed by navigation. Restoration now rereads current scope, probes document IDs and targets those exact documents for installation/cleanup. Cache clearing and scheduled scans verify current URL, policy and navigation epoch; scans await policy before tabs.get without awaiting unrelated tab restoration. Three fresh final Chrome profiles each keep all twelve observer probes active and detect a later normal mutation with zero exceptions. Controlled tests cover about:blank, same-URL reload, stale probes and policy/navigation changes. This is a real laboratory defect, not proof of the cause in the user's personal TikTok session.
