"""Exercise the feed's touch surface, legacy listeners and CSS with Chromium touch input."""
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text()
styles = ''.join(re.findall(r'<style\b[^>]*>.*?</style>', html, re.S | re.I))
start = html.index("const root=document.getElementById('vfeedScroller');let startX")
legacy = html[start:html.index('\n})();', start)]
slides = ''.join(
    '<article class="vslide" data-platform="tiktok"><div class="vslideMedia">'
    '<iframe srcdoc="<video></video>"></iframe><button class="oneTapPlayback"></button>'
    '</div></article>' for _ in range(4)
)
with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    page.set_content('<meta name="viewport" content="width=device-width">' + styles +
                     '<section id="vfeed" class="vfeed show"><div id="vfeedScroller" class="vfeedScroller">' +
                     slides + '</div></section>')
    page.evaluate("""() => {
      const slides = [...document.querySelectorAll('.vslide')];
      window.taps = 0;
      for (const slide of slides) slide.querySelector('button').onclick = () => taps++;
      window.v17NextPlayableSlide = (slide, dir) => slides[slides.indexOf(slide) + dir];
      window.v17StepSlide = () => {throw Error('Unexpected second navigation')};
    }""")
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.add_script_tag(content='(()=>{' + legacy + '})();')
    page.add_script_tag(path=str(ROOT / 'ui/tiktok-swipe.js'))
    client = page.context.new_cdp_session(page)
    height = page.locator('.vslide').first.evaluate('(slide) => slide.clientHeight')

    def touch(kind, x=175, y=400):
        points = [] if kind in ('touchEnd', 'touchCancel') else [{'x': x, 'y': y, 'id': 1}]
        client.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': points})

    def settled(index):
        page.wait_for_function(
            "top => Math.abs(vfeedScroller.scrollTop - top) <= 1 && !vfeedScroller.style.scrollSnapType",
            arg=index * height, timeout=1800)

    # A partial drag shows the next slide before release, then returns after a hold.
    touch('touchStart')
    touch('touchMove', y=340)
    page.wait_for_function('Math.abs(vfeedScroller.scrollTop - 60) <= 1')
    page.wait_for_timeout(160)
    touch('touchEnd')
    settled(0)
    # Short flick, long drag in reverse, then a cancelled drag at the first slide.
    touch('touchStart')
    touch('touchMove', y=345)
    touch('touchEnd')
    settled(1)
    touch('touchStart')
    touch('touchMove', y=670)
    touch('touchEnd')
    settled(0)
    touch('touchStart')
    touch('touchMove', y=130)
    touch('touchCancel')
    settled(0)
    touch('touchStart')
    touch('touchMove', x=275, y=395)
    touch('touchEnd')
    settled(0)
    assert page.evaluate('taps') == 0
    touch('touchStart')
    touch('touchEnd')
    page.wait_for_function('taps === 1')
    assert not errors, errors
    browser.close()
    print('Touch scrolling passed: finger tracking, short flick, return, cancellation, sideways drag and tap.')
