"""Bounded anonymous comparison; no writes to the catalogue or workflows.

Real TikTok responses; two public IDs in a browser-only catalogue fixture.
No accounts, cookies, headers, signed URLs or response bodies in the log.
Stop all probes on HTTP 403/429. Only the diagnostic branch invokes this file.
"""
import json
import time
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, TimeoutError as BrowserTimeout

IDS = ['7666374455538617633', '7691588560222260513']
CATALOGUE = 'https://one-comments-api.moulinanthony60.workers.dev/catalog/tiktok'
ORIGIN = 'https://www.tiktok.com'
ENTRY = [{'id': i, 'url': f'{ORIGIN}/@_/video/{i}', 'title': 'Diagnostic de lecture',
          'creator': 'Diagnostic ONE', 'addedAt': 1} for i in IDS]

def emit(value):
    print('TIKTOK_DIAGNOSTIC ' + json.dumps(value, ensure_ascii=False), flush=True)

def restricted_url(url):
    host = urlsplit(url).hostname or ''
    return host.endswith(('tiktok.com', 'tiktokcdn.com', 'tiktokcdn-eu.com', 'tiktokcdn-us.com', 'byteoversea.com', 'ibytedtos.com'))

with sync_playwright() as p:
    browser = p.chromium.launch()
    stopped = False
    try:
        for mode in ['mobile-officiel', 'mobile-ONE', 'desktop-officiel', 'desktop-ONE']:
            if stopped:
                break
            options = dict(p.devices['Pixel 5']) if mode.startswith('mobile') else {'viewport': {'width': 1280, 'height': 900}}
            # A fresh anonymous test profile, without user sessions or old SW caches.
            context = browser.new_context(**options, service_workers='block')
            page = context.new_page()
            network, failures = [], []
            def response_seen(response):
                global stopped
                if not restricted_url(response.url):
                    return
                request = response.request
                if request.resource_type in ('document', 'media', 'fetch', 'xhr'):
                    row = {'host': urlsplit(response.url).hostname, 'kind': request.resource_type,
                           'status': response.status, 'playerDocument': '/player/v1/' in urlsplit(response.url).path}
                    if row['playerDocument']:
                        headers = response.headers
                        row['cache'] = {k: headers[k] for k in ('age', 'cache-control', 'date', 'x-cache') if k in headers}
                    if len(network) < 60:
                        network.append(row)
                if response.status in (403, 429):
                    stopped = True
            def failed(request):
                if restricted_url(request.url) and len(failures) < 20:
                    failures.append({'host': urlsplit(request.url).hostname, 'kind': request.resource_type,
                                     'error': request.failure})
            page.on('response', response_seen)
            page.on('requestfailed', failed)
            def route(request):
                req = request.request
                if req.url.split('?')[0] == CATALOGUE and req.method == 'GET':
                    request.fulfill(status=200, content_type='application/json',
                                    headers={'Access-Control-Allow-Origin': 'https://one-officiel.fr'},
                                    body=json.dumps({'ok': True, 'entries': ENTRY, 'cursor': None}))
                elif (urlsplit(req.url).hostname or '').endswith('workers.dev') and req.method not in ('GET', 'HEAD', 'OPTIONS'):
                    request.abort()
                else:
                    request.continue_()
            page.route('**/*', route)
            try:
                if mode.endswith('ONE'):
                    page.goto('https://one-officiel.fr/', wait_until='domcontentloaded', timeout=30000)
                    page.wait_for_function('window.ONETikTokPublic?.entries?.length===2', timeout=15000)
                    page.get_by_role('button', name='TikTok', exact=True).click(timeout=10000)
                for index in range(3):
                    if stopped:
                        break
                    network.clear()
                    failures.clear()
                    if mode.endswith('officiel'):
                        video_id = IDS[index % 2]
                        page.goto(f'{ORIGIN}/player/v1/{video_id}', wait_until='domcontentloaded', timeout=25000)
                        try:
                            page.get_by_role('button', name='Play video', exact=True).click(timeout=5000)
                        except BrowserTimeout:
                            pass
                    else:
                        if index:
                            page.locator('#vfeedScroller').evaluate('(el,index)=>el.scrollTo({top:el.clientHeight*(index%2),behavior:"instant"})', index)
                            page.wait_for_timeout(700)
                        video_id = page.locator('.vslide[data-active="1"]').get_attribute('data-id', timeout=5000)
                    snapshots = []
                    deadline = time.monotonic() + 12
                    while time.monotonic() < deadline and not stopped:
                        frame = page.main_frame if mode.endswith('officiel') else next((f for f in page.frames if '/player/v1/' in f.url), None)
                        if frame:
                            try:
                                value = frame.evaluate('''()=>({
                                  authenticationFailed:document.body.innerText.includes('Player authentication failed'),
                                  unavailable:document.body.innerText.includes('Video currently unavailable'),
                                  media:[...document.querySelectorAll('video')].map(v=>({time:v.currentTime,paused:v.paused,ready:v.readyState,ended:v.ended,
                                    error:v.error?{code:v.error.code,message:String(v.error.message).slice(0,200)}:null}))
                                })''')
                                snapshots.append(value)
                                if value['authenticationFailed'] or value['unavailable'] or any(v['time'] >= 2 for v in value['media']):
                                    break
                            except Exception:
                                pass
                        page.wait_for_timeout(500)
                    result = {'mode': mode, 'attempt': index + 1, 'video': video_id,
                              'last': snapshots[-1] if snapshots else None, 'network': network, 'failures': failures,
                              'stoppedOnAccessOrRateLimit': stopped}
                    if mode.endswith('ONE'):
                        result['frames'] = page.locator('#vfeed iframe').count()
                        result['errors'] = page.evaluate("(window.oneTikTokDiagnostic||[]).filter(e=>e.event==='onPlayerError').map(e=>({code:e.errorCode,type:e.errorType,player:e.lecteur}))")
                    emit(result)
                    page.wait_for_timeout(10000 if index < 2 and not stopped else 1)
            except Exception as error:
                emit({'mode': mode, 'errorType': type(error).__name__, 'stoppedOnAccessOrRateLimit': stopped})
            finally:
                context.close()
    finally:
        browser.close()
