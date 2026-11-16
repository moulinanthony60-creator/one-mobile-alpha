"""One anonymous control and the reported ID; no production writes or retries."""
import json
import time
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
IDS = ['7666374455538617633', '7686962788157197575']
CATALOGUE = 'https://one-comments-api.moulinanthony60.workers.dev/catalog/tiktok'
ORIGIN = 'https://www.tiktok.com'
ENTRY = [{'id': i, 'url': f'{ORIGIN}/@_/video/{i}', 'title': 'Diagnostic',
          'creator': 'Diagnostic ONE', 'addedAt': 1} for i in IDS]

def emit(value):
    print('TIKTOK_EXACT_NETWORK ' + json.dumps(value, ensure_ascii=False), flush=True)

def numeric_statuses(value, out=None, depth=0):
    out = [] if out is None else out
    if depth > 10 or len(out) >= 12:
        return out
    if isinstance(value, dict):
        for key, child in value.items():
            if key in ('statusCode', 'status_code', 'errorCode', 'error_code') and isinstance(child, (int, float)):
                out.append({'field': key, 'value': child})
            elif isinstance(child, (dict, list)):
                numeric_statuses(child, out, depth + 1)
    elif isinstance(value, list):
        for child in value[:20]:
            numeric_statuses(child, out, depth + 1)
    return out[:12]

with sync_playwright() as p:
    browser = p.chromium.launch()
    stopped = False
    try:
        for mode in ['ONE']:
            if stopped:
                break
            context = browser.new_context(**p.devices['Pixel 5'], service_workers='block')
            page = context.new_page()
            rows, failures = [], []

            def seen(response):
                global stopped
                host = urlsplit(response.url).hostname or ''
                if not (host == 'tiktok.com' or host.endswith(('.tiktok.com', '.tiktokcdn.com', '.tiktokcdn-us.com', '.tiktokcdn-eu.com'))):
                    return
                kind = response.request.resource_type
                if kind not in ('document', 'xhr', 'fetch', 'media'):
                    return
                row = {'host': host, 'kind': kind, 'http': response.status}
                path = urlsplit(response.url).path
                if '/api/' in path:
                    row['endpoint'] = path
                    if 'json' in response.headers.get('content-type', ''):
                        try:
                            row['numericStatuses'] = numeric_statuses(response.json())
                        except Exception:
                            row['statusUnreadable'] = True
                if kind == 'document':
                    row['cacheControl'] = response.headers.get('cache-control', '')
                if len(rows) < 50:
                    rows.append(row)
                if response.status == 429 or (response.status == 403 and kind != 'media'):
                    stopped = True

            def failed(request):
                host = urlsplit(request.url).hostname or ''
                if host.endswith('.tiktok.com') and len(failures) < 10:
                    failures.append({'host': host, 'kind': request.resource_type, 'error': request.failure})

            def route(route):
                req = route.request
                u = urlsplit(req.url)
                if u.hostname == 'one-officiel.fr' and u.path in ('/', '/ui/tiktok-health-core.js') and req.method == 'GET':
                    file = ROOT / ('index.html' if u.path == '/' else u.path.lstrip('/'))
                    route.fulfill(status=200, content_type='text/html' if u.path == '/' else 'text/javascript', body=file.read_bytes())
                elif req.url.split('?')[0] == CATALOGUE and req.method == 'GET':
                    route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': 'https://one-officiel.fr'},
                                  body=json.dumps({'ok': True, 'entries': ENTRY, 'cursor': None}))
                elif (u.hostname or '').endswith('workers.dev') and req.method not in ('GET', 'HEAD', 'OPTIONS'):
                    route.abort()
                else:
                    route.continue_()

            page.on('response', seen)
            page.on('requestfailed', failed)
            page.route('**/*', route)
            try:
                if mode == 'ONE':
                    page.goto('https://one-officiel.fr/', wait_until='domcontentloaded', timeout=30000)
                    page.wait_for_function('window.ONETikTokPublic?.entries?.length===2', timeout=15000)
                    page.get_by_role('button', name='TikTok', exact=True).click()
                for index, video_id in enumerate(IDS):
                    if stopped:
                        break
                    rows.clear()
                    failures.clear()
                    trace_start = 0 if index == 0 else page.evaluate('(window.oneTikTokDiagnostic||[]).length')
                    if mode == 'officiel':
                        page.goto(f'{ORIGIN}/player/v1/{video_id}?autoplay=1&muted=1', wait_until='domcontentloaded', timeout=25000)
                    elif index:
                        page.locator('#vfeedScroller').evaluate('(el)=>el.scrollTo({top:el.clientHeight,behavior:"instant"})')
                    if mode == 'ONE':
                        page.wait_for_timeout(700)
                        video_id = page.evaluate("v17RawTikTokId(v17ItemById(document.querySelector('.vslide[data-active=\"1\"]').dataset.id))")
                    last = None
                    deadline = time.monotonic() + 15
                    while time.monotonic() < deadline:
                        frames = [page.main_frame] if mode == 'officiel' else [f for f in page.frames if f'/player/v1/{video_id}' in f.url]
                        if frames:
                            try:
                                last = frames[0].evaluate('''()=>({
                                  authenticationFailed:document.body.innerText.includes('Player authentication failed'),
                                  unavailable:document.body.innerText.includes('Video currently unavailable'),
                                  media:[...document.querySelectorAll('video')].map(v=>({time:v.currentTime,paused:v.paused,error:v.error?.code??null})),
                                  statuses:[...document.querySelectorAll('script[type="application/json"]')].flatMap(s=>{
                                    try{const found=[];function walk(o,d){if(!o||typeof o!=='object'||d>10||found.length>=12)return;
                                      for(const [k,v] of Object.entries(o)){if(['statusCode','status_code','errorCode','error_code'].includes(k)&&typeof v==='number')found.push({field:k,value:v});
                                      else if(v&&typeof v==='object')walk(v,d+1)}}walk(JSON.parse(s.textContent),0);return found.slice(0,12)}catch{return []}
                                  }).slice(0,12)
                                })''')
                                if last['authenticationFailed']:
                                    stopped = True
                                if last['authenticationFailed'] or last['unavailable'] or any(v['time'] >= 2 for v in last['media']):
                                    break
                            except Exception:
                                pass
                        elif mode == 'ONE' and page.locator('.vslide[data-active="1"] .oneTikTokStatus').count():
                            if page.locator('.vslide[data-active="1"]').get_attribute('data-id').endswith(video_id):
                                last = {'ONEStatus': page.locator('.vslide[data-active="1"] .oneTikTokStatus p').inner_text()}
                                break
                        page.wait_for_timeout(500)
                    errors = [] if mode != 'ONE' else page.evaluate("start=>(window.oneTikTokDiagnostic||[]).slice(start).filter(e=>e.event==='onPlayerError').map(e=>({code:e.errorCode,type:e.errorType}))", trace_start)
                    emit({'mode': mode, 'video': video_id, 'observed': last, 'network': rows, 'failures': failures, 'errors': errors, 'stopped': stopped})
                    if not stopped:
                        page.wait_for_timeout(10000)
            except Exception as error:
                emit({'mode': mode, 'errorType': type(error).__name__, 'stopped': stopped})
            finally:
                context.close()
    finally:
        browser.close()
