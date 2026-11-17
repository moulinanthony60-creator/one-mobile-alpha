"""Real audio/video autoplay policy, with a synthetic clip and no TikTok traffic."""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT/'index.html').read_text()
player = html[html.index('function v17Escape('):html.index('function v17SetupObserver(')]
clip = base64.b64encode((ROOT/'tests/fixtures/tiktok-autoplay.webm').read_bytes()).decode()
ids = [str(7000000000000000000+i) for i in range(3)]
fixture = '<section id="vfeed" class="show"><div id="vfeedScroller">'+''.join(
    f'<article class="vslide" data-platform="tiktok" data-id="tt_ext_{key}"><div class="vslideMedia"><img><button class="vslidePlay">▶</button></div></article>' for key in ids)+'</div></section>'
embedded = '''<video controls playsinline loop src="data:video/webm;base64,CLIP"></video><script>
const video=document.querySelector('video');video.muted=new URL(location.href).searchParams.get('muted')==='1';
window.commands=[];window.refusals=[];
const send=(type,value)=>parent.postMessage({'x-tiktok-player':true,type,value},'https://one.test');
video.addEventListener('playing',()=>send('onStateChange',1));
video.addEventListener('pause',()=>send('onStateChange',2));
video.addEventListener('timeupdate',()=>send('onCurrentTime',{currentTime:video.currentTime}));
video.addEventListener('volumechange',()=>send('onMute',video.muted));
addEventListener('message',event=>{
 if(event.source!==parent||event.origin!=='https://one.test'||event.data?.['x-tiktok-player']!==true)return;
 const type=event.data.type;commands.push(type);
 if(type==='mute')video.muted=true;
 if(type==='unMute')video.muted=false;
 if(type==='pause')video.pause();
 if(type==='play')video.play().catch(error=>{refusals.push(error.name);send('onPlayerError',{errorCode:3002,errorType:'AUTOPLAY_ERROR'});});
});
send('onPlayerReady');
</script>'''.replace('CLIP',clip)

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--autoplay-policy=document-user-activation-required',
        '--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies'])
    context = browser.new_context(viewport={'width':390,'height':844})
    page = context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    def route(request):
        url=request.request.url
        if url=='https://one.test/':
            request.fulfill(status=200,content_type='text/html',body=fixture)
        elif url.startswith('https://one.test/ui/'):
            request.fulfill(status=200,content_type='text/javascript',body=(ROOT/'ui'/url.split('/ui/')[1].split('?')[0]).read_bytes())
        elif url.startswith('https://www.tiktok.com/player/v1/'):
            request.fulfill(status=200,content_type='text/html',body=embedded)
        else:
            request.abort()
    page.route('**/*',route)
    page.goto('https://one.test/')
    page.evaluate('''ids=>{
      window.v17ActiveId='';window.v17Muted=true;window.v17Volume=50;window.v17TwitchPlayers={};
      const items=new Map(ids.map(id=>['tt_ext_'+id,{id:'tt_ext_'+id,p:'tiktok',tiktokId:id,creator:'Fixture',tiktokPlayable:true}]));
      window.v17ItemById=id=>items.get(String(id));window.platformName=p=>p;
      window.oneTTTrace=()=>{};window.toast=()=>{};window.learnFromItem=()=>{};
      window.v1814NativeMuted=()=>true;
    }''',ids)
    page.add_script_tag(content=player)
    page.add_script_tag(content=(ROOT/'ui/tiktok-availability.js').read_text())
    page.wait_for_function('!!window.ONETikTokNavigation && !!window.ONETikTokPreload')
    # No click or user activation. Audible autoplay must fail in the real engine.
    assert page.evaluate('navigator.userActivation.hasBeenActive') is False
    page.evaluate("window.slides=[...document.querySelectorAll('.vslide')];v17ActivateSlide(slides[0])")
    page.wait_for_function("slides[0].dataset.ttTimeAdvanced==='1'")
    first=next(f for f in page.frames if ids[0] in f.url)
    first.wait_for_function("document.querySelector('video').currentTime>.4 && !document.querySelector('video').paused")
    assert 'NotAllowedError' in first.evaluate('refusals')
    assert first.evaluate("commands.includes('unMute') && commands.filter(x=>x==='play').length===2")
    assert first.evaluate("document.querySelector('video').muted") is True
    assert page.evaluate("localStorage.getItem('one_tiktok_sound_v3')")=='0'
    for i in [1,2]:
        page.wait_for_function("i=>slides[i].querySelector('iframe')?.dataset.oneReady==='1'",arg=i)
        page.evaluate("i=>{window.kept=slides[i].querySelector('iframe');v17StepSlide(slides[i-1],1)}",i)
        page.wait_for_function("i=>slides[i].dataset.ttTimeAdvanced==='1'",arg=i)
        assert page.evaluate("i=>slides[i].querySelector('iframe')===kept",i)
        frame=next(f for f in page.frames if ids[i] in f.url)
        frame.wait_for_function("document.querySelector('video').currentTime>.4 && !document.querySelector('video').paused")
        assert frame.evaluate("document.querySelector('video').muted") is True
        assert frame.evaluate('refusals')==[]
        assert page.evaluate('navigator.userActivation.hasBeenActive') is False
    assert not errors,errors
    browser.close()
    print('Real media autoplay passed: audible start denied by Chromium, same iframe recovers muted, two following videos start without any tap, no external provider requests.')
