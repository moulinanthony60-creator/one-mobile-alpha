"""UI integration checks with mocked catalogue and official-player messages."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
fixture = """<!doctype html><html lang="fr"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<body><section class="tt-public-actions"></section>
<div id="settingsModal"><div class="ttCatalogBox"></div></div></body></html>"""

with sync_playwright() as p:
    executable = os.environ.get("CHROMIUM_EXECUTABLE")
    browser = p.chromium.launch(**({"executable_path": executable} if executable else {}))
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    modes = {"11111111": "played", "22222222": "unavailable", "33333333": "network"}

    def route(request):
        address = request.request.url
        if address == "https://one.test/":
            request.fulfill(status=200, content_type="text/html", body=fixture)
        elif address.startswith("https://www.tiktok.com/player/v1/"):
            video_id = address.split("/v1/")[1].split("?")[0]
            mode = modes.get(video_id, "wait")
            body = "<script>const send=(type,value)=>parent.postMessage({'x-tiktok-player':true,type,value},'https://one.test');send('onPlayerReady');"
            if mode == "played":
                body += "send('onStateChange',1);send('onCurrentTime',{currentTime:0});setTimeout(()=>send('onCurrentTime',{currentTime:1.2}),100);"
            elif mode != "wait":
                body += "send('onPlayerError',{errorCode:" + ("1001" if mode == "unavailable" else "2001") + "});"
            request.fulfill(status=200, content_type="text/html", body=body + "</script>")
        else:
            request.abort()

    page.route("**/*", route)
    page.goto("https://one.test/")
    page.add_style_tag(content=(ROOT / "ui/tiktok-health.css").read_text())
    page.evaluate("""() => {
      window.refreshCalls=0;
      window.catalogue=[{id:'11111111',title:'<img src=x onerror=alert(1)>'},{id:'11111111'},
        {id:'22222222',title:'Absente'},{id:'33333333',title:'Réseau'},{id:'bad',title:'Lien invalide'}];
      window.ONETikTokPublic={refresh:async()=>{window.refreshCalls++;return window.catalogue;}};
    }""")
    page.add_script_tag(content=(ROOT / "ui/tiktok-health-core.js").read_text())
    page.add_script_tag(content=(ROOT / "ui/tiktok-health.js").read_text())
    page.locator("#oneTikTokHealth").click()
    dialog = page.locator(".tt-health-dialog")
    expect(dialog).to_be_visible()
    assert page.locator("iframe").count() == 0
    dialog.get_by_role("button", name="Lancer le contrôle", exact=True).click()
    expect(dialog.get_by_role("status")).to_contain_text("Contrôle terminé", timeout=45000)
    expect(dialog.locator(".tt-health-counts")).to_have_text("4 / 4 testées · 1 lectures démarrées · 1 indisponibles · 2 à vérifier · 0 restantes")
    assert page.locator("iframe, .tt-health-results img").count() == 0
    assert page.evaluate("window.refreshCalls") == 1

    for width in [320, 390, 900]:
        page.set_viewport_size({"width": width, "height": 844})
        assert dialog.evaluate("e=>e.scrollWidth<=e.clientWidth+1"), f"Overflow at {width}"
    with page.expect_download() as download:
        dialog.get_by_role("button", name="Exporter le rapport").click()
    report = json.loads(Path(download.value.path()).read_text())
    assert report["counts"]["total"] == 4 and len(report["entries"]) == 4
    assert report["counts"]["unknown"] == 1 and report["counts"]["invalid"] == 1
    assert all(row["checkedAt"] for row in report["entries"])

    modes["22222222"] = modes["33333333"] = "played"
    dialog.get_by_role("button", name="Réessayer les problèmes").click()
    expect(dialog.get_by_role("status")).to_contain_text("Contrôle terminé", timeout=15000)
    expect(dialog.locator(".tt-health-counts")).to_contain_text("3 lectures démarrées · 0 indisponibles · 1 à vérifier")

    modes["11111111"] = "wait"
    dialog.get_by_role("button", name="Nouveau contrôle").click()
    expect(page.locator("iframe")).to_have_count(1)
    dialog.get_by_role("button", name="Arrêter", exact=True).click()
    expect(page.locator("iframe")).to_have_count(0)
    expect(dialog.locator(".tt-health-counts")).to_contain_text("0 / 4 testées")
    dialog.get_by_role("button", name="Fermer", exact=True).click()
    page.get_by_role("button", name="Vérifier les vidéos", exact=True).click()
    dialog.get_by_role("button", name="Reprendre le contrôle").click()
    expect(page.locator("iframe")).to_have_count(1)
    assert page.evaluate("window.refreshCalls") == 2, "Resume must keep the same snapshot"
    page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
    expect(page.locator("iframe")).to_have_count(0)
    expect(dialog.get_by_role("status")).to_contain_text("arrière-plan")
    page.evaluate("delete document.hidden")
    dialog.get_by_role("button", name="Reprendre le contrôle").click()
    expect(page.locator("iframe")).to_have_count(1)
    page.evaluate("window.dispatchEvent(new Event('offline'))")
    expect(page.locator("iframe")).to_have_count(0)
    expect(dialog.get_by_role("status")).to_contain_text("connexion perdue")

    page.evaluate("window.dispatchEvent(new Event('one-account-changed'))")
    expect(dialog).to_have_count(0)
    page.locator("#oneTikTokHealth").click()
    expect(dialog.get_by_role("button", name="Lancer le contrôle", exact=True)).to_be_enabled()
    page.evaluate("() => { window.ONETikTokPublic.refresh=async()=>{throw Error('Catalogue indisponible');}; }")
    dialog.get_by_role("button", name="Lancer le contrôle", exact=True).click()
    expect(dialog.get_by_role("status")).to_have_text("Catalogue indisponible")
    assert page.locator("iframe").count() == 0

    # A response arriving after close must not restart the scan or populate old data.
    page.evaluate("() => { window.ONETikTokPublic.refresh=()=>new Promise(resolve=>window.resolveCatalogue=resolve); }")
    dialog.get_by_role("button", name="Lancer le contrôle", exact=True).click()
    dialog.get_by_role("button", name="Fermer", exact=True).click()
    page.evaluate("window.resolveCatalogue(window.catalogue)")
    assert page.locator("iframe").count() == 0
    page.locator("#oneTikTokHealth").click()
    expect(dialog.get_by_role("button", name="Lancer le contrôle", exact=True)).to_be_enabled()
    page.set_viewport_size({"width": 390, "height": 844})
    screenshot = os.environ.get("HEALTH_SCREENSHOT")
    if screenshot:
        page.screenshot(path=screenshot)
    assert not errors, errors
    browser.close()
    print("Browser checks passed: results, retries, exports, responsive layout, stopping, resume, hidden/offline, account change, API errors and late responses.")
