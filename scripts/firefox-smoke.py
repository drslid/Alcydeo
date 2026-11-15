#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Real Firefox smoke on Alcydeo's original loopback fixtures.

See scripts/firefox-smoke.md. Requires Python >=3.10, Firefox >=153,
geckodriver and scripts/requirements-firefox.txt. Uses a fresh temporary browser
profile, temporary unsigned installation, and an external-network deny proxy.
Never opens Cloud, grants optional permissions, or uses an existing profile.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
import zipfile

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import Select


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def wait(read, ready=bool, timeout=45):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        value = read()
        if ready(value):
            return value
        time.sleep(0.1)
    raise TimeoutError("Expected browser state was not reached")


class DenyExternal(BaseHTTPRequestHandler):
    """Never resolves or forwards any requested destination."""

    def deny(self):
        self.server.denials.append(self.path.split("?")[0])
        self.send_response(403)
        self.send_header("Connection", "close")
        self.end_headers()
        self.close_connection = True

    do_CONNECT = do_GET = do_POST = do_HEAD = do_PUT = do_DELETE = do_OPTIONS = deny

    def log_message(self, *_args):
        pass


class Smoke:
    def __init__(self, driver, output, playback):
        self.driver, self.output, self.playback = driver, output, playback

    def evaluate(self, body, *args):
        result = self.driver.execute_async_script(
            "const done=arguments[arguments.length-1];(async()=>{" + body
            + "})().then(data=>done({ok:true,data}),e=>done({ok:false,error:String(e)}));",
            *args,
        )
        require(result["ok"], result.get("error", "Browser script failed"))
        return result.get("data")

    def rpc(self, message):
        result = self.evaluate("return await browser.runtime.sendMessage(arguments[0]);", message)
        require(result and result.get("ok"), "Extension message failed: " + str(result))
        return result.get("data")

    def snapshot(self, tab_id=None):
        return self.rpc({"type": "snapshot", **({"tabId": tab_id} if tab_id is not None else {})})

    def saved(self, task_id):
        task = wait(
            lambda: next((t for t in self.snapshot()["tasks"] if t["id"] == task_id), None),
            lambda t: t and t["state"] in ["completed", "failed", "paused"],
        )
        require(task["state"] == "completed" and task.get("saved"), "Download did not complete")
        item = self.evaluate("return (await browser.downloads.search({id:arguments[0]}))[0];", task["downloadId"])
        path = Path(item["filename"])
        require(path.is_relative_to(self.output / "downloads"), "Unexpected download destination")
        data = path.read_bytes()
        require(item["state"] == "complete" and item["exists"] and len(data) == item["fileSize"], "Incomplete saved file")
        result = {"file": path.name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        if self.playback:
            self.driver.execute_script("const i=document.createElement('input');i.type='file';i.id='smoke-video';document.body.append(i);")
            self.driver.find_element(By.ID, "smoke-video").send_keys(str(path))
            result["playback"] = self.evaluate("""
                const input=document.querySelector('#smoke-video'),v=document.createElement('video');
                const url=URL.createObjectURL(input.files[0]);document.body.append(v);v.muted=true;
                try {
                    await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=()=>reject(Error('Video metadata unavailable'));v.src=url;setTimeout(()=>reject(Error('Metadata timeout')),8000)});
                    await new Promise((resolve,reject)=>{v.onseeked=resolve;v.onerror=()=>reject(Error('Video decode unavailable'));v.currentTime=Math.min(1,v.duration/2);setTimeout(()=>reject(Error('Decode timeout')),8000)});
                    const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');ctx.drawImage(v,0,0,32,32);
                    return {width:v.videoWidth,height:v.videoHeight,duration:v.duration,nonblank:ctx.getImageData(0,0,32,32).data.some((n,i)=>i%4!==3&&n>0)};
                } finally {v.remove();input.remove();URL.revokeObjectURL(url)}
            """)
            require(result["playback"]["nonblank"], "Decoded frame is empty")
        return task, result


def run(args, report):
    report["stage"] = "installation"
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)
    (output / "downloads").mkdir(exist_ok=True)
    extension = args.extension.resolve()
    proxy = ThreadingHTTPServer(("127.0.0.1", 0), DenyExternal)
    proxy.denials = []
    threading.Thread(target=proxy.serve_forever, daemon=True).start()
    driver = None
    try:
        with tempfile.TemporaryDirectory(prefix="alcydeo-firefox-smoke-") as temporary:
            if extension.is_dir():
                archive = Path(temporary) / "alcydeo.xpi"
                with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as packed:
                    for file in sorted(extension.rglob("*")):
                        require(not file.is_symlink(), "Build symlinks are not supported")
                        if file.is_file():
                            packed.write(file, file.relative_to(extension))
            else:
                archive = extension
                report["artifactSha256"] = hashlib.sha256(archive.read_bytes()).hexdigest()
            with zipfile.ZipFile(archive) as packed:
                manifest = json.loads(packed.read("manifest.json"))
            require(manifest.get("browser_specific_settings", {}).get("gecko", {}).get("id") == "alcydeo@drslid.github.io", "Expected an Alcydeo Firefox build")
            options = Options()
            options.binary_location = args.firefox
            options.add_argument("-headless")
            options.add_argument("--allow-system-access")
            preferences = {
                "app.update.auto": False, "app.normandy.enabled": False,
                "datareporting.healthreport.uploadEnabled": False, "toolkit.telemetry.enabled": False,
                "browser.shell.checkDefaultBrowser": False, "browser.startup.page": 0,
                "browser.download.folderList": 2, "browser.download.dir": str(output / "downloads"),
                "browser.download.useDownloadDir": True, "browser.download.alwaysOpenPanel": False,
                "network.proxy.type": 1, "network.proxy.http": "127.0.0.1",
                "network.proxy.http_port": proxy.server_port, "network.proxy.ssl": "127.0.0.1",
                "network.proxy.ssl_port": proxy.server_port, "network.proxy.failover_direct": False,
                "network.proxy.no_proxies_on": "localhost,127.0.0.1,[::1]",
            }
            for key, value in preferences.items():
                options.set_preference(key, value)
            environment = {**os.environ, "MOZ_REMOTE_ALLOW_SYSTEM_ACCESS": "1"}
            if sys.platform.startswith("linux"):
                environment.update({"LANG": "C.UTF-8", "LC_ALL": "C.UTF-8"})
            service = Service(args.geckodriver, env=environment, log_output=str(output / "geckodriver.log"))
            driver = webdriver.Firefox(options=options, service=service)
            driver.set_script_timeout(25)
            installed = driver.install_web_extension(str(archive), permanent=False)
            driver.set_context("chrome")
            uuid = driver.execute_script("return JSON.parse(Services.prefs.getStringPref('extensions.webextensions.uuids'))[arguments[0]];", installed.id)
            driver.set_context("content")
            base = "moz-extension://" + uuid
            driver.get(base + "/manager.html#library")
            manager = driver.current_window_handle
            smoke = Smoke(driver, output, args.playback)
            initial = smoke.snapshot()["settings"]
            require(initial["maxConcurrentFiles"] == 4 and initial["multipart"] is True and initial["connections"] == 4, "Expected fresh 4-file/4-connection defaults")
            report.update({"firefox": driver.capabilities["browserVersion"], "addonVersion": manifest["version"], "defaults": {k: initial[k] for k in ["maxConcurrentFiles", "multipart", "connections", "globalDetection", "minSize"]}})
            report["stage"] = "external-network-denial"
            blocked = smoke.evaluate("try{await fetch('https://example.invalid/alcydeo-smoke-proxy',{signal:AbortSignal.timeout(3000)});return false}catch{return true}")
            require(blocked and "example.invalid:443" in proxy.denials, "External deny proxy was not verified")
            smoke.evaluate("await browser.storage.local.set({language:'en'});return true")
            smoke.rpc({"type": "settings", "value": {**initial, "saveAs": False, "folder": "Alcydeo smoke"}})
            report["stage"] = "detection"
            driver.switch_to.new_window("tab")
            driver.get(args.fixture_url)
            driver.switch_to.window(manager)
            tab_id = smoke.evaluate("return (await browser.tabs.query({})).find(t=>t.url===arguments[0]).id;", args.fixture_url)
            wait(lambda: smoke.snapshot(tab_id)["media"], lambda ms: any(m["title"] == "Kingfisher study — direct video" and len(m["variants"]) == 2 for m in ms))
            report["stage"] = "direct-download"
            driver.get(base + "/popup.html?tabId=" + str(tab_id))
            card = wait(lambda: driver.find_elements(By.XPATH, "//article[contains(@class,'media-card')][.//h2[normalize-space(.)='Kingfisher study — direct video']]"))[0]
            Select(card.find_element(By.TAG_NAME, "select")).select_by_visible_text("180p")
            next(b for b in card.find_elements(By.TAG_NAME, "button") if b.text.strip() == "Download").click()
            task_id = wait(lambda: smoke.snapshot()["tasks"])[0]["id"]
            driver.get(base + "/manager.html#library")
            _, report["direct"] = smoke.saved(task_id)
            original = Path(__file__).resolve().parents[1] / "fixtures/media/low.mp4"
            require(report["direct"]["sha256"] == hashlib.sha256(original.read_bytes()).hexdigest(), "Direct file differs from original fixture")
            report["stage"] = "hls-remux"
            hls = next(m for m in wait(lambda: smoke.snapshot(tab_id)["media"], lambda ms: any(m["title"] == "Kingfisher study — HLS TS" for m in ms)) if m["title"] == "Kingfisher study — HLS TS")
            smoke.rpc({"type": "expand", "tabId": tab_id, "id": hls["id"]})
            hls = wait(lambda: next(m for m in smoke.snapshot(tab_id)["media"] if m["id"] == hls["id"]), lambda m: bool(m["variants"]) and not m.get("pending"))
            task_id = smoke.rpc({"type": "enqueue", "tabId": tab_id, "id": hls["id"], "variantId": hls["variants"][0]["id"]})
            task, report["hls"] = smoke.saved(task_id)
            require(task["validation"]["bytes"] == report["hls"]["bytes"], "HLS validation size differs")
            report["hls"]["validation"] = task["validation"]
            report["stage"] = "diagnostics"
            driver.get(base + "/manager.html#settings")
            wait(lambda: driver.find_elements(By.CSS_SELECTOR, ".diagnostic-source select option"))
            Select(driver.find_element(By.CSS_SELECTOR, ".diagnostic-source select")).select_by_value(str(tab_id))
            driver.find_element(By.CSS_SELECTOR, ".diagnostics-toggle").click()
            field = wait(lambda: driver.find_elements(By.CSS_SELECTOR, ".diagnostics-panel textarea"))[0]
            report["diagnostics"] = json.loads(field.get_attribute("value"))
            driver.save_screenshot(str(output / "diagnostics.png"))
            report["stage"] = "local-help"
            folder = driver.find_element(By.CSS_SELECTOR, ".automatic-folder button")
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", folder)
            folder.click()
            wait(lambda: driver.current_url.endswith("#help"))
            require("about:preferences#general" in driver.find_element(By.TAG_NAME, "body").text, "Firefox settings guide missing")
            report["localHelp"] = True
            driver.save_screenshot(str(output / "help.png"))
            grants = smoke.evaluate("return (await browser.permissions.getAll()).data_collection;")
            require(grants == [], "Smoke must not grant data-collection permissions")
            report.update({"temporaryUnsignedInstall": True, "externalDenyProxyVerified": True, "cloudClicked": False, "stage": "complete", "passed": True})
    finally:
        try:
            if driver:
                driver.quit()
        finally:
            proxy.shutdown()
            proxy.server_close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--extension", required=True, type=Path, help="Firefox ZIP/XPI or unpacked build")
    parser.add_argument("--firefox", default=shutil.which("firefox"), help="Firefox executable")
    parser.add_argument("--geckodriver", default=shutil.which("geckodriver"), help="geckodriver executable")
    parser.add_argument("--fixture-url", default="http://127.0.0.1:4179/", help="Already running original fixture server; loopback only")
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/evidence/firefox-smoke"))
    parser.add_argument("--playback", action="store_true", help="Also require real decoded frames; needs OS media codecs")
    args = parser.parse_args()
    fixture = urlparse(args.fixture_url)
    if fixture.scheme != "http" or fixture.hostname not in ["127.0.0.1", "localhost", "::1"] or fixture.username or fixture.password or fixture.query or fixture.fragment:
        parser.error("A loopback HTTP fixture URL is required")
    args.fixture_url = args.fixture_url.rstrip("/") + "/"
    if not args.firefox or not args.geckodriver:
        parser.error("Provide Firefox and geckodriver paths, or put both on PATH")
    report = {"scope": "Original loopback fixtures; fresh isolated profile; no Cloud interaction", "passed": False}
    try:
        run(args, report)
    except Exception as error:
        # Driver exception messages can contain temporary profile paths/UUIDs.
        # Keep the failure stage and type in the shareable JSON; raw driver
        # diagnostics remain separate in the ignored output directory.
        report["errorType"] = type(error).__name__
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"passed": report["passed"], "firefox": report.get("firefox"), "report": str(args.output_dir / "report.json")}))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
