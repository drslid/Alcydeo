# Single purpose and data-use draft — Store build

Single purpose: find user-authorized page media, save a chosen available source locally, check the resulting file and organize its local record.

| Permission | Actual use |
| --- | --- |
| activeTab | Temporary access to the page activated through the extension action |
| scripting | Scan media DOM and run observation only on authorized pages/frames |
| storage | Local preferences and transient per-tab detection cache |
| downloads | Browser-managed transfer, progress, source-dependent pause/resume and reveal in folder |
| webRequest | Observe media URLs, response headers and redirect relationships on explicitly granted hosts; no request-body interception |
| file:///* (optional host) | Read an explicitly requested local video for Cast, thumbnail preview or processing; requires Chrome’s user-controlled Allow access to file URLs setting. No folder scanning or local-file content script |
| tabCapture | Record the explicitly invoked current tab from the toolbar popup; Chrome requires a genuine extension invocation and displays its capture indicator |
| HTTP/HTTPS hosts, declared at installation | Automatic page/iframe media detection, source manifests and CDN fragments across provider domains; respects Chrome site-access restrictions |

The manifest declares HTTP/HTTPS host access at installation, as requested for standard automatic detection without an additional activation step. The broad scope supports unknown user-selected video sites, embedded readers and CDNs. Chrome's actual grants remain authoritative; if the user restricts site access, only allowed hosts are observed. Pausing detection stops automatic observation on all sites. There is no debugger, nativeMessaging, cookies, tabs, payment or externally-connectable permission. Content-script notifications trigger a fresh authorized scan and cannot supply arbitrary fetch headers. See [Chrome's permission declarations](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions) and [update warnings](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings): an existing installation may require accepting the changed host permissions.

The extension handles website content and browsing-related media URLs/titles locally. Recovery URLs can include temporary signatures. Browser-managed source requests can use existing applicable sessions, but the extension never reads cookie values or includes them in exports. Metadata and task records live in IndexedDB; temporary media lives in OPFS. No automatic analytics, advertising, sale, account backend or diagnostic upload exists. Incognito use is disabled. See ../PRIVACY.md for retention/deletion behavior.

The experimental local build additionally observes bounded ordinary YouTube player request bodies and retains minimal opaque transport context/tokens locally. This capability is removed from the Store compilation. See ../PRIVACY.md for the local-build differences; do not reuse this Store permission row to describe the local experimental artifact.

Dashboard answers must be reviewed against the exact build and the current Store wording before submission. No unqualified "no user data handled" claim should be made. A public contact and real privacy/support URLs are still required.


## Optional user-directed transfers and capture

Google Drive and OneDrive were removed in 0.1.30 at the user’s request. Neither identity permission nor OAuth manifest configuration is present. Legacy OAuth jobs cannot resume; former local tokens/preferences are cleared. No provider account is connected on installation.

The existing HTTP/HTTPS grants cover explicit Gofile/pCloud uploads. Gofile sends selected file contents/name/size/MIME without sign-in and creates a public link. pCloud receives the selected file through a user-supplied upload link, with no sender sign-in. Disclose user-provided media transmission and provider processing. This optional upload is separate from local recording/editing and from telemetry.

Tab recording uses the required tabCapture API only after genuine toolbar invocation; its consumer is a persistent extension page. The manager also offers getDisplayMedia with Chrome’s surface chooser. No camera, microphone or desktopCapture permission is declared. Local annotation content appears in the captured source. The higher bitrate/resolution and selection controls do not authorize hidden or automatic capture.

0.1.33 adds experimental MegaUp sharing through its public anonymous upload form. An explicit Send reads megaup.net, then sends selected file contents/name/size/MIME and ephemeral form fields to a validated HTTPS MegaUp/mupload.store upload endpoint. Fetch explicitly omits credentials and rejects redirects. No provider script is executed; no new manifest permission or OAuth application is required. Temporary provider session fields are not persisted in jobs or exported. The returned link is public; the FAQ states deletion after 30 days of inactivity. Cancel does not guarantee remote deletion and retry starts from the beginning. All laboratory upload tests are intercepted; real MegaUp uploads remain unvalidated. See ../CLOUD.md and ../PRIVACY.md.

0.1.34 adds experimental anonymous 1fichier sharing. Explicit Send transmits the selected file/name/size/MIME to an HTTPS upload node returned by api.1fichier.com, then reads that same node’s report. Existing HTTP/HTTPS grants cover this; no account/API key, identity permission, email notification or remote script is used. Fetch omits cookies. Upload redirects are never followed; metadata/report redirects are refused. Only the matched public download link is retained, never upload IDs or deletion links. Disclose user-selected media transmission, provider-controlled retention and possible delayed availability. Real upload validation remains pending.

0.1.35 adds experimental Turbobit guest sharing. Explicit Send sends the selected file/name/size/MIME and guest form fields to a validated HTTPS fdfiles.net storage host supplied by app.torbobit.net. No account ID, API key, email, remote script or new permission is used. Fetch omits credentials and refuses redirects. Keep only the public sharing link from the acknowledged ID, never the upload destination or deletion data. Disclose provider processing, the conservative 200 MB guest cap, published seven-day retention and absence of independent remote-file verification for ID-only responses. No real provider file upload has been validated.

0.1.53 adds an explicit local detection diagnostic: read-only page state, bounded counts, safe codes and permission booleans, with no new HTTP/media requests, URL/identifier/title/cookie/raw-page data or automatic transmission. Users see the temporary report before an explicit clipboard copy. No new manifest permission is added. TikTok sampling can use ordinary anonymous CORS after a fetch TypeError, then retain the confirmed mode for transfer; readable access refusals remain authoritative. See ../TIKTOK.md and ../PRIVACY.md.

0.1.56 accepts the observed ru-N 1fichier upload-node family alongside upN in the existing anonymous protocol. No permission or provider is added. One optional local uploadAttempted boolean distinguishes a known never-attempted new job from uncertain earlier bodies; no session/emission/upload URL is persisted. Current validation includes real metadata initialization only, with file transfers simulated or local-loopback.
