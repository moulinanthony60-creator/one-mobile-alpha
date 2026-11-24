"""Real audio/video autoplay policy, with a synthetic clip and no TikTok traffic."""
import base64
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT/'index.html').read_text()
player = html[html.index('function v17Escape('):html.index('function v17SetupObserver(')]
clip = base64.b64encode((ROOT/'tests/fixtures/tiktok-autoplay.webm').read_bytes()).decode()
ids = [str(7000000000000000000+i) for i in range(3)]
# Include production markup and the clean-feed style, not just the JS handler.
style_start=html.index('<style>#vfeed.oneCleanFeed #vSoundPanel')
control_style=html[style_start:html.index('</style>',style_start)+8]
control_start=html.index('<div class="vsoundPanel" id="vSoundPanel">')
control_markup=html[control_start:html.index('</div>',control_start)+6]
fixture = control_style+'<button id="fixtureEnter" hidden>Ouvrir TikTok</button><section id="vfeed" class="show oneCleanFeed">'+control_markup+'<div id="vfeedScroller">'+''.join(
    f'<article class="vslide" data-platform="tiktok" data-id="tt_ext_{key}"><div class="vslideMedia"><img><button class="vslidePlay">▶</button></div></article>' for key in ids)+'</div></section>'
setup = '''
window.v17ActiveId='';window.v17Muted=true;window.v17Volume=50;window.v17TwitchPlayers={};
localStorage.setItem('one_tiktok_sound_v3','0');
const ids=IDS,items=new Map(ids.map(id=>['tt_ext_'+id,{id:'tt_ext_'+id,p:'tiktok',tiktokId:id,creator:'Fixture',tiktokPlayable:true}]));
window.v17ItemById=id=>items.get(String(id));window.platformName=p=>p;window.v1814RememberSoundGesture=()=>{};
window.oneTTTrace=()=>{};window.toast=()=>{};window.learnFromItem=()=>{};window.v1814NativeMuted=()=>true;
window.fixtureReports={};
addEventListener('message',event=>{
 if(event.origin!=='https://www.tiktok.com'||event.data?.type!=='fixtureReport')return;
 const slide=[...document.querySelectorAll('.vslide')].find(s=>s.querySelector('iframe')?.contentWindow===event.source);
 if(slide)fixtureReports[slide.dataset.id.slice(7)]=event.data.value;
});
// The audible case models a later sound request whose permission is denied.
addEventListener('load',()=>{
 window.slides=[...document.querySelectorAll('.vslide')];
 if(location.search.startsWith('?entry=1')){
  const enter=document.getElementById('fixtureEnter');enter.hidden=false;
  enter.onclick=()=>{v17TikTokSoundGesture();v17ActivateSlide(slides[0]);};
 }else{if(location.search==='?audible=1')v17TikTokAutoplayMuted=false;v17ActivateSlide(slides[0]);}
});
'''.replace('IDS',json.dumps(ids))
# Exercise the production ONE button binding, not a stand-in for its sound command.
button_binding=next(line for line in html.splitlines() if line.startswith('if(vSoundBtn)vSoundBtn.onclick='))
fixture += '<script>'+setup+'</script><script>'+player+'</script><script>const vSoundBtn=document.getElementById("vSound");'+button_binding+'</script><script src="/ui/tiktok-availability.js"></script>'
embedded = '''<video controls playsinline loop src="data:video/webm;base64,CLIP"></video><script>
const video=document.querySelector('video');const wantsAutoplay=new URL(location.href).searchParams.get('autoplay')==='1';const buffered=BUFFERED;video.muted=new URL(location.href).searchParams.get('muted')==='1';video.autoplay=wantsAutoplay&&!buffered;
window.commands=[];window.refusals=[];
// Model the observed provider: an autoplay=0 preview can expose no command API.
const apiEnabled=!MISSING_READY||wantsAutoplay;
const send=(type,value)=>parent.postMessage({'x-tiktok-player':true,type,value},'https://one.test');
const report=()=>send('fixtureReport',{time:video.currentTime,paused:video.paused,muted:video.muted,commands,refusals,activated:navigator.userActivation.hasBeenActive});
video.addEventListener('playing',()=>send('onStateChange',1));
video.addEventListener('pause',()=>send('onStateChange',2));
video.addEventListener('timeupdate',()=>{send('onCurrentTime',{currentTime:video.currentTime});report();});
video.addEventListener('volumechange',()=>send('onMute',video.muted));
addEventListener('message',event=>{
 if(!apiEnabled||event.source!==parent||event.origin!=='https://one.test'||event.data?.['x-tiktok-player']!==true)return;
 const type=event.data.type;commands.push(type);
 if(type==='mute')video.muted=true;
 if(type==='unMute')video.muted=false;
 if(type==='pause')video.pause();
 if(type==='play'){const start=()=>video.play().catch(error=>{refusals.push(error.name);send('onPlayerError',{errorCode:3002,errorType:'AUTOPLAY_ERROR'});report();});if(buffered){send('onStateChange',3);setTimeout(start,2300);}else start();}
});
if(apiEnabled)send('onPlayerReady');
</script>'''.replace('CLIP',clip)

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--autoplay-policy=document-user-activation-required',
        '--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies'])
    for scenario in ('muted','refused','no_api','entry_sound','sound_button','buffered_sound'):
        audible=scenario=='refused'
        missing_ready=scenario in ('no_api','entry_sound','sound_button','buffered_sound')
        wants_audio=scenario in ('entry_sound','sound_button','buffered_sound')
        context = browser.new_context(viewport={'width':390,'height':844})
        page = context.new_page()
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        def route(request):
            url=request.request.url
            if url.split('?')[0]=='https://one.test/':
                request.fulfill(status=200,content_type='text/html',body=fixture)
            elif url.startswith('https://one.test/ui/'):
                request.fulfill(status=200,content_type='text/javascript',body=(ROOT/'ui'/url.split('/ui/')[1].split('?')[0]).read_bytes())
            elif url.startswith('https://www.tiktok.com/player/v1/'):
                request.fulfill(status=200,content_type='text/html',body=embedded.replace('MISSING_READY','true' if missing_ready else 'false').replace('BUFFERED','true' if scenario=='buffered_sound' and '/'+ids[0]+'?' in url else 'false'))
            else:
                request.abort()
        page.route('**/*',route)
        page.goto('https://one.test/'+('?entry=1' if scenario in ('entry_sound','buffered_sound') else '?audible=1' if audible else ''))
        # Playwright evaluate can grant an activation. These test-only protocol reads
        # explicitly omit that gesture, and all player installation happens at load.
        protocol=context.new_cdp_session(page)
        def inspect(expression):
            result=protocol.send('Runtime.evaluate',{'expression':expression,'returnByValue':True,'userGesture':False})
            assert 'exceptionDetails' not in result,result
            return result['result'].get('value')
        def wait(expression):
            deadline=time.monotonic()+15
            while time.monotonic()<deadline:
                if inspect(expression):
                    return
                time.sleep(.05)
            raise AssertionError(expression)
        assert inspect('navigator.userActivation.hasBeenActive') is False
        if scenario in ('entry_sound','buffered_sound'):
            page.get_by_role('button',name='Ouvrir TikTok',exact=True).click()
        wait("slides[0].dataset.ttTimeAdvanced==='1' && fixtureReports['"+ids[0]+"']?.time>.4")
        first=inspect("fixtureReports['"+ids[0]+"']")
        # Use the no-gesture protocol read here too: a visibility helper can activate the document.
        assert inspect("(()=>{const b=document.getElementById('vSound');return b.getClientRects().length>0 && getComputedStyle(b).visibility==='visible';})()") is True
        if audible:
            assert 'NotAllowedError' in first['refusals']
            assert first['commands'].count('play')==2 and 'unMute' in first['commands']
        else:
            assert first['refusals']==[]
            assert first['commands'].count('play')==1
            assert ('unMute' in first['commands']) is (scenario in ('entry_sound','buffered_sound'))
            assert inspect("new URL(slides[0].querySelector('iframe').src).searchParams.get('muted')")==('0' if scenario in ('entry_sound','buffered_sound') else '1')
        assert first['muted'] is (scenario not in ('entry_sound','buffered_sound')) and first['paused'] is False and first['activated'] is False
        assert inspect("localStorage.getItem('one_tiktok_sound_v3')")=='0'
        if scenario=='sound_button':
            page.get_by_role('button',name='Activer le son TikTok',exact=True).click()
            wait("fixtureReports['"+ids[0]+"']?.muted===false && !fixtureReports['"+ids[0]+"'].paused")
        for i in [1,2]:
            # The no-API fixture only exposes commands in its autoplay reader.
            # Require actual media progress and silence before swiping to it.
            wait(f"slides[{i}].querySelector('iframe')?.dataset.{'oneWarm' if missing_ready else 'oneReady'}==='1'")
            if missing_ready:
                wait(f"fixtureReports['{ids[i]}']?.muted===true && fixtureReports['{ids[i]}'].time>0")
            inspect(f"window.kept=slides[{i}].querySelector('iframe');v17StepSlide(slides[{i-1}],1)")
            wait(f"slides[{i}].dataset.ttTimeAdvanced==='1' && fixtureReports['{ids[i]}']?.time>.4 && !fixtureReports['{ids[i]}'].paused")
            assert inspect(f"slides[{i}].querySelector('iframe')===kept") is True
            report=inspect(f"fixtureReports['{ids[i]}']")
            assert report['muted'] is (not wants_audio) and report['activated'] is False
            assert report['refusals']==[]
            if missing_ready:
                assert inspect(f"slides[{i}].querySelector('iframe').dataset.oneReady==='1'") is True
                assert inspect(f"new URL(slides[{i}].querySelector('iframe').src).searchParams.get('autoplay')")=='1'
                assert report['commands'].count('play')==1
            assert inspect('navigator.userActivation.hasBeenActive') is wants_audio
        if wants_audio:
            page.get_by_role('button',name='Couper le son TikTok',exact=True).click()
            wait("fixtureReports['"+ids[2]+"']?.muted===true && !fixtureReports['"+ids[2]+"'].paused")
            inspect('v17StepSlide(slides[2],-1)')
            wait("slides[1].dataset.ttTimeAdvanced==='1' && fixtureReports['"+ids[1]+"']?.muted===true && !fixtureReports['"+ids[1]+"'].paused")
            assert inspect("localStorage.getItem('one_tiktok_sound_v3')")=='1'
        assert not errors,errors
        context.close()
    browser.close()
    print('Media scenarios passed: muted startup, audio permission recovery, silent preloading before swipe, player reuse, and sound preference across navigation.')
