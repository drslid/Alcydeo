# Firefox smoke

This optional development check installs the Firefox build temporarily into a
fresh geckodriver profile, detects two direct qualities, downloads the original
180p fixture byte for byte, remuxes one HLS fixture, reads the diagnostic panel,
and opens the local settings guide. It never opens Cloud or grants optional
data-collection permissions. A local deny proxy blocks external connections;
only loopback fixtures bypass it. No existing browser profile is accepted.

Requirements: Python 3.10+, Firefox 153+, geckodriver, and the pinned Selenium
package. Install the browser and driver separately from their official releases.
The script does not download tools or modify the system.

```sh
python3 -m venv .local/firefox-smoke-venv
.local/firefox-smoke-venv/bin/python -m pip install -r scripts/requirements-firefox.txt
```

Start the original fixture server in another terminal, or reuse one already
running. This command uses port 4191; omit the environment variable for 4179.

```sh
ALCYDEO_FIXTURE_PORT=4191 node scripts/fixture-server.mjs
```

Then run from the repository root:

```sh
.local/firefox-smoke-venv/bin/python scripts/firefox-smoke.py \
  --extension artifacts/alcydeo-1.0.0-firefox.zip \
  --firefox /path/to/firefox \
  --geckodriver /path/to/geckodriver \
  --fixture-url http://127.0.0.1:4191/ \
  --output-dir artifacts/evidence/firefox-smoke
```

Windows users can invoke `.local/firefox-smoke-venv/Scripts/python.exe` and use
their Firefox/geckodriver executable paths. The helper has no platform-specific
profile or library paths. Linux users may need their usual Firefox runtime/media
libraries. Add `--playback` to require real H.264/AAC decoding of both saved files;
this option intentionally fails if the OS codecs are unavailable.

The output directory contains JSON, screenshots, driver logs, and the actual
downloaded fixtures. It is ignored under `artifacts/`. The browser profile is
temporary and disappears on exit. The script uses Firefox's privileged test
context only to locate its own temporary extension URL; it does not disable
signing requirements or bypass consent. Temporary loading does not demonstrate
permanent installation, Mozilla signing, AMO approval, or hardware TV support.

Tool references: [Selenium Firefox](https://www.selenium.dev/documentation/webdriver/browsers/firefox/),
[Mozilla temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).
