"""Bounded live-player diagnostic. No account, browser-policy overrides or writes."""
import importlib.util
import json
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading
import time
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('health', ROOT / 'scripts/tiktok-health-server.py')
health = importlib.util.module_from_spec(spec)
spec.loader.exec_module(health)
rows = health.fetch_page(health.CATALOGUE)['entries'][:2]
ids = [row['id'] for row in rows]
assert len(ids) == 2 and all(isinstance(i, str) and i.isascii() and i.isdigit() for i in ids)
source = (ROOT / 'index.html').read_text()
source = source[source.index('function v17Escape('):source.index('function v17SetupObserver(')]
fixture = b'''<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">
<button id="start">Start</button><button id="next">Next</button>
<section id="vfeed" class="vfeed show"></section>
<style>.vslide{display:none}.vslide[data-active="1"]{display:block}iframe{width:325px;height:578px;border:0}.vslideMedia{position:relative}</style>'''


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(fixture)

    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
reports = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for mode in ['native_autoplay', 'controlled_start']:
            context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
            page = context.new_page()
            denied = []
            page.on('response', lambda r: denied.append(r.status) if r.request.resource_type == 'document' and r.url.startswith('https://www.tiktok.com/player/v1/') and r.status in (403, 429) else None)
            page.goto(f'http://127.0.0.1:{server.server_port}/')
            page.evaluate('''ids => {
              localStorage.setItem('one_tiktok_muted','0');
              window.events=[];window.started=performance.now();window.items=new Map();
              window.record=(event,extra={})=>events.push({ms:Math.round(performance.now()-started),event,...extra});
              window.v17ActiveId='';window.v17Muted=false;window.v17Volume=50;window.v17TwitchPlayers={};
              window.v17ItemById=id=>items.get(String(id));window.platformName=p=>p;
              window.v1814NativeMuted=()=>false;window.v1814SoundAllowed=()=>true;
              window.v1814RememberSoundGesture=()=>{};window.toast=()=>{};window.learnFromItem=()=>{};
              window.oneTTTrace=(event,slide,frame,extra)=>record(event,{slide:slide?.dataset.id,...extra});
              for(const id of ids){
                const slide=document.createElement('article');slide.className='vslide';slide.dataset.platform='tiktok';slide.dataset.id='tt_ext_'+id;
                slide.innerHTML='<div class="vslideMedia"><img><button class="vslidePlay"></button></div>';
                document.getElementById('vfeed').append(slide);
                items.set(slide.dataset.id,{id:slide.dataset.id,p:'tiktok',tiktokId:id,tiktokPlayable:true});
              }
              addEventListener('message',e=>{
                if(e.origin!=='https://www.tiktok.com'||e.data?.['x-tiktok-player']!==true)return;
                const slide=[...document.querySelectorAll('.vslide')].find(s=>s.querySelector('iframe')?.contentWindow===e.source);
                if(slide&&['onPlayerReady','onStateChange','onMute','onVolumeChange','onPlayerError','onCurrentTime'].includes(e.data.type))record(e.data.type,{slide:slide.dataset.id,active:slide.dataset.active==='1',value:e.data.value});
              });
            }''', ids)
            page.add_script_tag(content=source)
            page.evaluate('''mode => {
              const send=v17SendTikTok;
              window.v17SendTikTok=(frame,type,value,allow)=>{record('command',{type,slide:frame?.closest('.vslide')?.dataset.id});return send(frame,type,value,allow);};
              if(mode==='controlled_start'){
                const url=v17PlayerUrl,activate=v17ActivateSlide;
                window.v17PlayerUrl=x=>{const result=new URL(url(x));result.searchParams.set('autoplay','0');return result.href;};
                window.v17ActivateSlide=slide=>{activate(slide);const frame=slide?.querySelector('iframe');if(frame&&frame.dataset.oneReady!=='1')frame.dataset.onePlayPending='1';};
              }
              const slides=[...document.querySelectorAll('.vslide')];
              document.getElementById('start').onclick=()=>{record('start_click');v17ActivateSlide(slides[0]);};
              document.getElementById('next').onclick=()=>{record('next_click');v17ActivateSlide(slides[1]);};
            }''', mode)
            observations = []
            for button in ['start', 'next']:
                if denied:
                    break
                page.locator('#' + button).click()
                for _ in range(16):
                    page.wait_for_timeout(500)
                    if denied:
                        break
                    for frame in page.frames[1:]:
                        try:
                            state = frame.evaluate('''() => {const v=document.querySelector('video');return v?{muted:v.muted,volume:v.volume,paused:v.paused,time:v.currentTime,ready:v.readyState}:null;}''')
                            if state:
                                observations.append({'phase': button, 'id': frame.url.split('/v1/')[-1].split('?')[0], **state})
                        except Exception:
                            pass
            report = {'mode': mode, 'ids': ids, 'denied': denied, 'events': page.evaluate('events'), 'media': observations}
            reports.append(report)
            print('AUDIO_PROBE ' + json.dumps(report, ensure_ascii=False), flush=True)
            context.close()
            if denied:
                break
            time.sleep(3)
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    output = ROOT / 'audio-report'
    output.mkdir(exist_ok=True)
    (output / 'report.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2))
