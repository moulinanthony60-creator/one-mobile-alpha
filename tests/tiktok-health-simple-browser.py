"""Minimal on-device diagnostic: no autoplay scans, trusted source, real progress."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width':390,'height':844})
    page = context.new_page()
    errors, requests = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    def route(route):
        url = route.request.url
        if url.startswith('https://one.test/tiktok-test.html'):
            route.fulfill(status=200, content_type='text/html; charset=utf-8', body=(ROOT/'tiktok-test.html').read_bytes())
        elif url.startswith('https://www.tiktok.com/player/v1/'):
            requests.append(url)
            route.fulfill(status=200, content_type='text/html', body="<script>parent.postMessage({'x-tiktok-player':true,type:'onPlayerReady'},'https://one.test')</script><button>Play video</button>")
        else:
            route.abort()
    page.route('**/*', route)
    page.goto('https://one.test/tiktok-test.html')
    assert page.locator('iframe').count()==0 and requests==[]
    page.get_by_role('button', name='Démarrer le test', exact=True).click()
    expect(page.get_by_role('status')).to_contain_text('Lecteur prêt')
    assert page.locator('iframe').count()==1 and len(requests)==1
    assert page.locator('iframe').get_attribute('credentialless') is None
    assert 'autoplay=1&muted=1' in requests[0]
    frame=next(f for f in page.frames if 'tiktok.com/player/' in f.url)
    # Forged host messages and unrelated origins cannot create an error result.
    page.evaluate("window.dispatchEvent(new MessageEvent('message',{origin:'https://www.tiktok.com',source:window,data:{'x-tiktok-player':true,type:'onPlayerError',value:{errorCode:3001}}}))")
    page.evaluate("window.dispatchEvent(new MessageEvent('message',{origin:'https://foreign.test',source:document.querySelector('iframe').contentWindow,data:{'x-tiktok-player':true,type:'onPlayerError',value:{errorCode:3001}}}))")
    expect(page.get_by_role('status')).to_contain_text('Lecteur prêt')
    frame.evaluate("parent.postMessage({'x-tiktok-player':true,type:'onStateChange',value:1},'*');parent.postMessage({'x-tiktok-player':true,type:'onCurrentTime',value:{currentTime:0}},'*')")
    for step in range(1,5):
        page.wait_for_timeout(510)
        frame.evaluate("t=>parent.postMessage({'x-tiktok-player':true,type:'onCurrentTime',value:{currentTime:t}},'*')",step*.5)
    expect(page.get_by_role('status')).to_contain_text('Lecture démarrée confirmée')
    page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copiedResult=text},configurable:true})")
    page.get_by_role('button', name='Copier le résultat', exact=True).click()
    result=json.loads(page.evaluate('window.copiedResult').split('\n',1)[1])
    assert result['playbackConfirmed'] is True and result['ready'] is True and result['seconds']>=2
    assert not any(row['event']=='erreur TikTok' for row in result['events'])
    # A fresh attempt is explicit, keeps one iframe, and never loops after error.
    page.get_by_role('button', name='Recommencer le test', exact=True).click()
    expect(page.get_by_role('status')).to_contain_text('Lecteur prêt')
    assert page.locator('iframe').count()==1 and len(requests)==2
    frame=next(f for f in page.frames if 'tiktok.com/player/' in f.url)
    frame.evaluate("parent.postMessage({'x-tiktok-player':true,type:'onPlayerError',value:{errorCode:3001,errorType:'PLAYBACK_ERROR'}},'*')")
    expect(page.get_by_role('status')).to_contain_text('TikTok n’a pas démarré')
    page.wait_for_timeout(300)
    assert len(requests)==2 and page.locator('iframe').count()==1
    # The player's own message stays visible and the clipboard-denied path is usable.
    page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied')}},configurable:true})")
    page.get_by_role('button', name='Copier le résultat', exact=True).click()
    expect(page.get_by_role('textbox',name='Résultat à copier')).to_be_visible()
    result=json.loads(page.get_by_role('textbox',name='Résultat à copier').input_value().split('\n',1)[1])
    assert result['playbackConfirmed'] is False and any(row.get('code')==3001 for row in result['events'])
    # Changing mode stops the old frame and does not request anything until Start.
    page.get_by_label('Mode du lecteur').select_option('isolated')
    assert page.locator('iframe').count()==0 and len(requests)==2
    page.get_by_role('button',name='Démarrer le test',exact=True).click()
    expect(page.get_by_role('status')).to_contain_text('Lecteur prêt')
    assert page.locator('iframe').count()==1 and len(requests)==3
    assert page.locator('iframe').get_attribute('credentialless') is not None
    frame=next(f for f in page.frames if 'tiktok.com/player/' in f.url)
    frame.evaluate("parent.postMessage({'x-tiktok-player':true,type:'onPlayerError',value:{errorCode:2001,errorType:'SERVER_ERROR'}},'*')")
    expect(page.get_by_role('status')).to_contain_text('erreur serveur (2001)')
    page.get_by_role('button',name='Copier le résultat',exact=True).click()
    result=json.loads(page.get_by_role('textbox',name='Résultat à copier').input_value().split('\n',1)[1])
    assert result['sessionIsolee'] is True and result['ready'] is True and result['playbackConfirmed'] is False
    assert result['previousTests'][0]['sessionIsolee'] is False and result['previousTests'][0]['playbackConfirmed'] is True
    assert all(row['video']==result['video'] for row in result['previousTests'])
    assert len(result['previousTests'])==2 and len(requests)==3
    for width in (320,390,900):
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
    for invalid in ('bad','123','1234567890123456789012345'):
        page.goto('https://one.test/tiktok-test.html?video='+invalid)
        expect(page.get_by_role('status')).to_contain_text('Identifiant vidéo invalide')
        assert page.locator('iframe').count()==0 and len(requests)==3
    assert not errors,errors
    browser.close()
    print('Simple player browser checks passed: explicit standard/isolated comparison on one video, no background scans, origin/source validation, two-second playback proof, server errors kept distinct, combined copy, invalid IDs and mobile layout.')
