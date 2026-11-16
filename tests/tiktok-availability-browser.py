"""Actual public-catalogue UI with mocked network; no real TikTok request."""
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
now = datetime.now(timezone.utc)
withdrawals = {'version': 2, 'withdrawalPolicy': 'temporary-v1', 'generatedAt': now.isoformat(), 'entries': [{
    'id': '11111111', 'reason': 'invalid_video', 'code': 1001, 'confirmations': 3,
    'firstUnavailableAt': (now-timedelta(hours=13)).isoformat(),
    'lastUnavailableAt': (now-timedelta(hours=1)).isoformat(), 'hiddenUntil': (now+timedelta(hours=23)).isoformat()}]}
original_entries = json.loads(json.dumps(withdrawals['entries']))
observations, reports = [], []
collection_down = False
fixture = '<!doctype html><body><div class="vfeedTop"></div><div id="feed"></div><div id="vfeed"></div></body>'
with sync_playwright() as p:
    executable = os.environ.get('CHROMIUM_EXECUTABLE')
    browser = p.chromium.launch(**({'executable_path': executable} if executable else {}))
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
        elif url == 'https://one-tiktok-health.moulinanthony60.workers.dev/health':
            request.fulfill(status=503 if collection_down else 200, content_type='application/json', body=json.dumps({'ok': True, 'version': 1, 'policy': 'temporary-v1', 'startedAt': (now-timedelta(days=2)).isoformat(), 'generatedAt': datetime.now(timezone.utc).isoformat(), 'entries': observations}))
        elif url == 'https://one-tiktok-health.moulinanthony60.workers.dev/playback':
            if request.request.method == 'OPTIONS':
                request.fulfill(status=204, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type'})
            else:
                data = request.request.post_data_json
                reports.append(data)
                observations.append({'id': data['videoId'], 'playedAt': datetime.now(timezone.utc).isoformat()})
                request.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body='{"ok":true}')
        elif url.startswith('https://www.tiktok.com/player/v1/'):
            request.fulfill(status=200, content_type='text/html', body='''<script>const send=(type,value)=>parent.postMessage({'x-tiktok-player':true,type,value},'*');send('onStateChange',1);send('onCurrentTime',{currentTime:0});setTimeout(()=>send('onCurrentTime',{currentTime:1}),1000);setTimeout(()=>send('onCurrentTime',{currentTime:2}),2000);</script>''')
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
    # Real cross-origin iframe messages trigger restoration; no player commands are sent.
    withdrawals['entries'] = original_entries
    withdrawals['generatedAt'] = (now+timedelta(seconds=2)).isoformat()
    open_catalogue()
    assert page.evaluate("ONETikTokAvailability.isHidden('11111111')")
    page.evaluate("document.getElementById('vfeed').classList.add('show')")
    page.add_script_tag(content=(ROOT/'ui/tiktok-playback-health.js').read_text())
    page.evaluate('''() => { const slide=document.createElement('article');slide.className='vslide';slide.dataset.platform='tiktok';slide.dataset.active='1';const frame=document.createElement('iframe');slide.append(frame);document.getElementById('vfeed').append(slide);frame.src='https://www.tiktok.com/player/v1/11111111'; }''')
    page.wait_for_function("!ONETikTokAvailability.isHidden('11111111')")
    page.wait_for_function("ONETikTokPublic.entries.length===2")
    assert reports == [{'videoId': '11111111', 'seconds': 2}], reports
    # Other devices receive the shared observation on reload, without a local success.
    page.evaluate("localStorage.removeItem('one_tiktok_played_v1')")
    open_catalogue()
    expect(page.get_by_role('status')).to_have_text('2 vidéos partagées · chacun peut contribuer')
    observations.clear()
    collection_down = True
    open_catalogue()
    expect(page.get_by_role('status')).to_have_text('2 vidéos partagées · chacun peut contribuer')
    assert not errors, errors
    browser.close()
    print('Catalogue integration passed: withdrawal, creator list, cached evidence, automatic restoration.')

