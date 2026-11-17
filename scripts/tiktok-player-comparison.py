"""Bounded manual QA: two public IDs, no catalogue scan or production writes."""
import json
import time
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, TimeoutError as BrowserTimeout

ROOT = Path(__file__).resolve().parents[1]
IDS = ['7666374455538617633', '7692893222007295264']
ORIGIN = 'https://www.tiktok.com'
CATALOGUE = 'https://one-comments-api.moulinanthony60.workers.dev/catalog/tiktok'
UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36'
ENTRY = [{'id': v, 'url': f'{ORIGIN}/@_/video/{v}', 'title': 'Diagnostic', 'creator': 'Diagnostic ONE', 'addedAt': 1} for v in IDS]

def emit(value):
    print('PLAYER_COMPARISON ' + json.dumps(value, ensure_ascii=False), flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    stopped = False
    try:
        emit({'engine': browser.version, 'device': 'Pixel 5 simulation', 'serverFacingUA': 'reported Chrome 157'})
        for mode in ['official', 'minimal', 'isolated-minimal', 'ONE']:
            if stopped:
                break
            context = browser.new_context(**{**p.devices['Pixel 5'], 'user_agent': UA}, service_workers='block', locale='fr-FR')
            page = context.new_page()
            network = []
            observations = []
            def seen(response):
                global stopped
                u = urlsplit(response.url)
                host = u.hostname or ''
                if not (host == 'tiktok.com' or host.endswith(('.tiktok.com', '.tiktokcdn.com', '.tiktokcdn-us.com', '.tiktokcdn-eu.com'))):
                    return
                kind = response.request.resource_type
                if kind in ('document', 'xhr', 'fetch', 'media') and len(network) < 50:
                    # Never record headers, cookies, bodies, signatures or URL queries.
                    network.append({'host': host, 'kind': kind, 'http': response.status,
                                    'endpoint': u.path if '/api/' in u.path else 'player' if kind == 'document' else 'resource'})
                if response.status == 429 or (response.status == 403 and kind != 'media'):
                    stopped = True
            def route(route):
                req = route.request
                u = urlsplit(req.url)
                if u.hostname == 'one-officiel.fr' and u.path == '/' and req.method == 'GET':
                    if mode == 'ONE':
                        body = (ROOT/'index.html').read_bytes()
                    else:
                        body = b'''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Comparaison lecteur</title><body><div id="player"></div><script>
                        window.playerReport={ready:false,errors:[]};addEventListener('message',e=>{
                         if(e.origin!=='https://www.tiktok.com'||e.source!==document.querySelector('iframe')?.contentWindow||e.data?.['x-tiktok-player']!==true)return;
                         if(e.data.type==='onPlayerReady')playerReport.ready=true;
                         if(e.data.type==='onPlayerError')playerReport.errors.push({code:e.data.value?.errorCode,type:e.data.value?.errorType});
                        });</script>'''
                    route.fulfill(status=200, content_type='text/html; charset=utf-8', body=body)
                elif u.hostname == 'one-officiel.fr' and u.path in ('/ui/tiktok-navigation.js', '/ui/tiktok-availability.js', '/ui/tiktok-health-core.js') and req.method == 'GET':
                    route.fulfill(status=200, content_type='text/javascript; charset=utf-8', body=(ROOT/u.path.lstrip('/')).read_bytes())
                elif req.url.split('?')[0] == CATALOGUE and req.method == 'GET':
                    route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': 'https://one-officiel.fr'},
                                  body=json.dumps({'ok': True, 'entries': ENTRY, 'cursor': None}))
                elif (u.hostname or '').endswith('workers.dev') and req.method not in ('GET', 'HEAD', 'OPTIONS'):
                    route.abort()
                else:
                    route.continue_()
            page.route('**/*', route)
            page.on('response', seen)
            try:
                if mode == 'ONE':
                    page.goto('https://one-officiel.fr/', wait_until='domcontentloaded', timeout=30000)
                    page.wait_for_function('window.ONETikTokPublic?.entries?.length===2', timeout=15000)
                    page.get_by_role('button', name='TikTok', exact=True).click()
                for index, wanted in enumerate(IDS):
                    if stopped:
                        break
                    network.clear()
                    if mode == 'official':
                        video = wanted
                        page.goto(f'{ORIGIN}/player/v1/{video}?autoplay=1&muted=1', wait_until='domcontentloaded', timeout=25000)
                    elif mode != 'ONE':
                        video = wanted
                        page.goto('https://one-officiel.fr/', wait_until='domcontentloaded', timeout=25000)
                        page.evaluate('''v=>{
                         const f=document.createElement('iframe');if(v.isolated)f.credentialless=true;
                         f.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';f.style='width:100%;height:650px;border:0';
                         f.src='https://www.tiktok.com/player/v1/'+v.id+'?autoplay=1&muted=1';document.getElementById('player').append(f);
                        }''', {'id': video, 'isolated': mode == 'isolated-minimal'})
                    else:
                        if index:
                            page.locator('#vfeedScroller').evaluate('(el)=>el.scrollTo({top:el.clientHeight,behavior:"instant"})')
                        page.wait_for_timeout(700)
                        video = page.evaluate("v17RawTikTokId(v17ItemById(document.querySelector('.vslide[data-active=\"1\"]').dataset.id))")
                    last = None
                    deadline = time.monotonic() + 15
                    clicked = False
                    while time.monotonic() < deadline:
                        frames = [page.main_frame] if mode == 'official' else [f for f in page.frames if f'/player/v1/{video}' in f.url]
                        if frames:
                            try:
                                last = frames[0].evaluate('''()=>({
                                 authenticationFailed:document.body.innerText.includes('Player authentication failed'),
                                 unavailable:document.body.innerText.includes('Video currently unavailable'),
                                 challenge:/verify you are human|checking your browser|unusual traffic/i.test(document.body.innerText),
                                 media:[...document.querySelectorAll('video')].map(v=>({time:v.currentTime,paused:v.paused,error:v.error?.code??null}))
                                })''')
                                if last['authenticationFailed'] or last['challenge']:
                                    stopped = True
                                if stopped or last['unavailable'] or any(v['time'] >= 2 and not v['paused'] for v in last['media']):
                                    break
                                # One ordinary player tap if autoplay is blocked; no iframe retry.
                                if not clicked and time.monotonic() > deadline - 10:
                                    button = frames[0].get_by_role('button', name='Play video', exact=True)
                                    if button.count() and button.is_visible():
                                        button.click(timeout=1000)
                                        clicked = True
                            except BrowserTimeout:
                                pass
                            except Exception:
                                pass
                        elif mode == 'ONE' and page.locator('.vslide[data-active="1"] .oneTikTokStatus p').count():
                            last = {'ONEStatus': page.locator('.vslide[data-active="1"] .oneTikTokStatus p').inner_text()}
                            break
                        page.wait_for_timeout(400)
                    extra = {}
                    if mode == 'ONE':
                        extra = page.evaluate("()=>({frames:document.querySelectorAll('#vfeed iframe').length,errors:(window.oneTikTokDiagnostic||[]).filter(e=>e.event==='onPlayerError').map(e=>({code:e.errorCode,type:e.errorType}))})")
                    elif mode != 'official':
                        extra = page.evaluate('window.playerReport')
                    emit({'mode': mode, 'video': video, 'observed': last, 'tap': clicked, 'network': network, 'details': extra, 'stopped': stopped})
                    if not stopped:
                        page.wait_for_timeout(6000)
            except Exception as error:
                emit({'mode': mode, 'errorType': type(error).__name__, 'stopped': stopped})
            finally:
                context.close()
    finally:
        browser.close()
