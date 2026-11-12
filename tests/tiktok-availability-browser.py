"""Actual public-catalogue UI with mocked network; no real TikTok request."""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
now = datetime.now(timezone.utc)
withdrawals = {'version': 1, 'generatedAt': now.isoformat(), 'entries': [{
    'id': '11111111', 'reason': 'invalid_video', 'code': 1001, 'confirmations': 3,
    'firstUnavailableAt': (now-timedelta(hours=13)).isoformat(),
    'lastUnavailableAt': (now-timedelta(hours=1)).isoformat()}]}
fixture = '<!doctype html><body><div class="vfeedTop"></div><div id="feed"></div><div id="vfeed"></div></body>'
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    def route(request):
        url = request.request.url
        if url == 'https://one.test/':
            request.fulfill(status=200, content_type='text/html', body=fixture)
        elif url.startswith('https://one-comments-api.moulinanthony60.workers.dev/catalog/tiktok'):
            request.fulfill(status=200, content_type='application/json', body=json.dumps({'ok': True, 'entries': [
                {'id': '11111111', 'creator': 'Retiré'}, {'id': '22222222', 'creator': 'Lisible'}]}))
        elif url.endswith('/one-tiktok-health-data/hidden.json'):
            request.fulfill(status=200, content_type='application/json', body=json.dumps(withdrawals))
        else:
            request.abort()
    page.route('**/*', route)
    def open_catalogue():
        page.goto('https://one.test/')
        page.evaluate("window.state={filter:'tiktok',mode:null}")
        page.add_script_tag(content=(ROOT/'ui/tiktok-availability.js').read_text())
        page.add_script_tag(content=(ROOT/'ui/tiktok-public.js').read_text())
        expect(page.get_by_role('status')).not_to_contain_text('Chargement')
    open_catalogue()
    expect(page.get_by_role('status')).to_have_text('1 vidéos partagées · chacun peut contribuer')
    assert page.evaluate('ONETikTokPublic.entries.map(row=>row.id)') == ['22222222']
    page.get_by_role('button', name='Créateurs', exact=True).click()
    expect(page.locator('.tt-creators-list')).to_contain_text('Lisible')
    expect(page.locator('.tt-creators-list')).not_to_contain_text('Retiré')
    # A later valid empty list must restore the link, including when local storage has old withdrawals.
    withdrawals['entries'] = []
    withdrawals['generatedAt'] = (now+timedelta(seconds=1)).isoformat()
    open_catalogue()
    expect(page.get_by_role('status')).to_have_text('2 vidéos partagées · chacun peut contribuer')
    assert page.evaluate('ONETikTokPublic.entries.length') == 2
    assert not errors, errors
    browser.close()
    print('Catalogue integration passed: withdrawal, creator list, cached evidence, automatic restoration.')
