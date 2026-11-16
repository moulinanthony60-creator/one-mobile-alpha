"""Production player functions plus the real navigation guard, with mocked TikTok."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT/'index.html').read_text()
player = html[html.index('function v17Escape('):html.index('function v17SetupObserver(')]
ids = [str(7000000000000000000+i) for i in range(8)]
fixture = '''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>
body{margin:0}#vfeedScroller{height:600px;overflow-y:auto;scroll-snap-type:y mandatory;scroll-behavior:smooth}
.vslide{height:600px;scroll-snap-align:start}.vslideMedia{position:relative;height:100%}iframe{width:100%;height:100%;border:0}
</style><section id="vfeed" class="show"><div id="vfeedScroller">'''
fixture += ''.join(f'<article class="vslide" data-platform="tiktok" data-id="tt_ext_{key}"><div class="vslideMedia"><img><button class="vslidePlay">▶</button></div></article>' for key in ids)
fixture += '</div></section>'
# Use the real panel positioning so a click exercises the actual retry control.
panel_start = html.index('.oneTikTokStatus{')
fixture = fixture.replace('</style>', html[panel_start:html.index('</style>',panel_start)]+'</style>',1)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width':390,'height':844})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    def route(request):
        url = request.request.url
        if url == 'https://one.test/':
            request.fulfill(status=200,content_type='text/html',body=fixture)
        elif url.startswith('https://one.test/ui/'):
            name = url.split('/ui/')[1].split('?')[0]
            request.fulfill(status=200,content_type='text/javascript; charset=utf-8',body=(ROOT/'ui'/name).read_text())
        elif url.startswith('https://www.tiktok.com/player/v1/'):
            request.fulfill(status=200,content_type='text/html',body="<script>window.commands=[];addEventListener('message',e=>{if(e.source===parent&&e.data?.['x-tiktok-player']===true)commands.push(e.data.type)});parent.postMessage({'x-tiktok-player':true,type:'onPlayerReady'},'*')</script>")
        else:
            request.abort()
    page.route('**/*',route)
    page.goto('https://one.test/')
    page.evaluate('''ids=>{
      window.v17ActiveId='';window.v17Muted=true;window.v17Volume=50;window.v17TwitchPlayers={};
      const items=new Map(ids.map(id=>['tt_ext_'+id,{id:'tt_ext_'+id,p:'tiktok',tiktokId:id,creator:'Test',tiktokPlayable:true}]));
      window.v17ItemById=id=>items.get(String(id));window.platformName=p=>p;
      window.v1814NativeMuted=()=>true;window.v1814SoundAllowed=()=>true;
      window.v1814RememberSoundGesture=()=>{};window.toast=()=>{};window.learnFromItem=()=>{};
      window.traces=[];window.oneTTTrace=event=>traces.push(event);
    }''',ids)
    page.add_script_tag(content=player)
    # Use the real loader, so global function binding and script order are covered.
    page.add_script_tag(content=(ROOT/'ui/tiktok-availability.js').read_text())
    page.wait_for_function('!!window.ONETikTokNavigation')
    page.evaluate('''()=>{
      window.slides=[...document.querySelectorAll('.vslide')];
      v17ActivateSlide(slides[2]);v17RememberTikTokUnavailable(slides[3]);
      v17ActivateSlide(slides[3]);window.keptFrame=slides[4].querySelector('iframe');
      window.initialCount=traces.filter(x=>x==='création préchargement').length;
    }''')
    for _ in range(12):
        page.evaluate('v17ActivateSlide(slides[3])')
        page.wait_for_timeout(80)
    assert page.evaluate("slides[4].dataset.active==='1' && slides[4].querySelector('iframe')===keptFrame")
    assert page.evaluate("traces.filter(x=>x==='création préchargement').length===initialCount")
    assert page.evaluate("Math.abs(document.getElementById('vfeedScroller').scrollTop-slides[4].offsetTop)<2")
    page.locator('#vfeedScroller').dispatch_event('pointerdown')
    page.evaluate('v17ActivateSlide(slides[3])')
    for _ in range(12):
        page.evaluate('v17ActivateSlide(slides[3])')
    assert page.evaluate("slides[2].dataset.active==='1'")
    assert page.evaluate("Math.abs(document.getElementById('vfeedScroller').scrollTop-slides[2].offsetTop)<2")
    assert page.locator('iframe').count()==1
    assert page.evaluate("traces.filter(x=>x==='création préchargement').length===0")
    # A real TikTok-origin playback error must not trigger automatic navigation.
    frame = next(f for f in page.frames if f.url.startswith('https://www.tiktok.com/player/v1/'+ids[2]))
    frame.evaluate("parent.postMessage({'x-tiktok-player':true,type:'onPlayerError',value:{errorCode:3001,errorType:'PLAYBACK_ERROR'}},'*')")
    page.wait_for_timeout(1700)
    assert page.evaluate("slides[2].dataset.active==='1' && !v17TikTokIsUnavailable(v17ItemById(slides[2].dataset.id))")
    assert page.locator('iframe').count()==1
    page.get_by_role('button',name='Réessayer',exact=True).click()
    page.wait_for_function("slides[2].querySelector('iframe')?.dataset.oneReady==='1'")
    frame = next(f for f in page.frames if f.url.startswith('https://www.tiktok.com/player/v1/'+ids[2]))
    frame.wait_for_function("commands.includes('play')")
    assert frame.evaluate('commands')==['unMute','play']
    assert page.locator('iframe').count()==1
    frame.evaluate("parent.postMessage({'x-tiktok-player':true,type:'onStateChange',value:1},'*');parent.postMessage({'x-tiktok-player':true,type:'onCurrentTime',value:{currentTime:0}},'*')")
    page.wait_for_timeout(1000)
    frame.evaluate("parent.postMessage({'x-tiktok-player':true,type:'onCurrentTime',value:{currentTime:1}},'*')")
    page.wait_for_timeout(1000)
    frame.evaluate("parent.postMessage({'x-tiktok-player':true,type:'onCurrentTime',value:{currentTime:2}},'*')")
    page.evaluate('v120PrewarmAround(slides[2]);v124PreloadTikTokSlide(slides[4])')
    assert page.locator('iframe').count()==1
    assert page.evaluate("traces.filter(x=>x==='création préchargement').length===0")
    frame.evaluate("parent.postMessage({'x-tiktok-player':true,type:'onPlayerError',value:{errorCode:1001,errorType:'INVALID_VIDEO'}},'*')")
    page.wait_for_function("!!slides[2].querySelector('.oneTikTokStatus')")
    page.wait_for_timeout(1700)
    assert page.evaluate("slides[2].dataset.active==='1'")
    assert page.locator('iframe').count()==0
    assert 'Passage' not in page.locator('.oneTikTokStatus').inner_text()
    page.get_by_role('button',name='Vidéo suivante',exact=True).click()
    page.wait_for_function("slides[4].querySelector('iframe')?.dataset.oneReady==='1'")
    assert page.locator('iframe').count()==1
    assert not errors, errors
    browser.close()
    print('Navigation browser checks passed: stable navigation, one active player from startup, no preloads after progress, isolated retry, sound before play, explicit navigation after error.')
