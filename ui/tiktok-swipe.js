// Drag the ONE playback surface. The exposed TikTok controls keep native input.
(() => {
  const root = document.getElementById('vfeedScroller');
  if (!root || !window.PointerEvent) return;

  const surface = '#vfeed:not(.oneTikTokMini) .vslide[data-platform="tiktok"] .oneTapPlayback';
  root.classList.add('oneTikTokSwipe');
  let drag = null;
  let animation = 0;
  let previousSnap = null;
  let suppressClick = false;

  function restoreSnap() {
    if (previousSnap === null) return;
    root.style.scrollSnapType = previousSnap;
    previousSnap = null;
  }

  function settle(top) {
    const start = root.scrollTop;
    const distance = top - start;
    const duration = Math.min(260, 120 + 140 * Math.abs(distance) / root.clientHeight);
    const began = performance.now();
    function finish() {
      root.scrollTo({top, behavior: 'instant'});
      animation = 0;
      restoreSnap();
    }
    function frame(now) {
      const t = Math.min(1, (now - began) / duration);
      if (t >= 1 || !root.clientHeight) return finish();
      root.scrollTo({top: start + distance * (1 - (1 - t) ** 3), behavior: 'instant'});
      animation = requestAnimationFrame(frame);
    }
    if (Math.abs(distance) < 1 || matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else animation = requestAnimationFrame(frame);
  }

  function end(event, cancelled) {
    if (!drag || drag.id !== event.pointerId) return;
    const gesture = drag;
    drag = null;
    if (!gesture.moved) {
      if (previousSnap !== null) settle(gesture.top);
      return;
    }
    const dy = gesture.y - event.clientY;
    const direction = Math.sign(dy);
    const flick = event.timeStamp - gesture.lastTime < 100 && gesture.speed * direction >= 0.45;
    const advance = !cancelled && (Math.abs(dy) >= gesture.height * 0.26 || (Math.abs(dy) >= 24 && flick));
    const target = advance && v17NextPlayableSlide(gesture.slide, direction);
    if (target && target !== gesture.slide.nextElementSibling && target !== gesture.slide.previousElementSibling) {
      restoreSnap();
      v17StepSlide(gesture.slide, direction);
      return;
    }
    settle(target ? gesture.top + direction * gesture.height : gesture.top);
  }

  root.addEventListener('pointerdown', event => {
    if (drag && !event.isPrimary) {
      end({pointerId: drag.id}, true);
      return;
    }
    suppressClick = false;
    if (!event.isPrimary || event.button !== 0 || !event.target.closest(surface)) return;
    if (animation) {
      cancelAnimationFrame(animation);
      animation = 0;
    }
    const rect = root.getBoundingClientRect();
    const slide = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest('.vslide');
    if (slide?.dataset.platform !== 'tiktok' || !root.contains(slide)) { restoreSnap(); return; }
    const bounds = slide.getBoundingClientRect();
    const top = root.scrollTop + bounds.top - rect.top;
    drag = {id: event.pointerId, slide, top, height: bounds.height, origin: root.scrollTop,
      previous: v17NextPlayableSlide(slide, -1), next: v17NextPlayableSlide(slide, 1),
      x: event.clientX, y: event.clientY, lastY: event.clientY, lastTime: event.timeStamp, speed: 0, moved: false};
    // Keep receiving the mouse/stylus if it leaves the original button.
    event.target.closest(surface).setPointerCapture(event.pointerId);
  });

  root.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dy = drag.y - event.clientY;
    const dx = drag.x - event.clientX;
    if (!drag.moved) {
      if (Math.max(Math.abs(dy), Math.abs(dx)) < 8) return;
      suppressClick = true;
      if (Math.abs(dx) >= Math.abs(dy)) {
        const top = drag.top;
        drag = null;
        if (previousSnap !== null) settle(top);
        return;
      }
      drag.moved = true;
      // The observer can replace the old slide's playback button halfway through a drag.
      root.setPointerCapture(event.pointerId);
      if (previousSnap === null) previousSnap = root.style.scrollSnapType;
      root.style.scrollSnapType = 'none';
    }
    const elapsed = event.timeStamp - drag.lastTime;
    if (elapsed > 0) drag.speed = (drag.lastY - event.clientY) / elapsed;
    drag.lastY = event.clientY;
    drag.lastTime = event.timeStamp;
    const position = drag.origin + dy - drag.top;
    const direction = Math.sign(position);
    const neighbor = direction < 0 ? drag.slide.previousElementSibling : drag.slide.nextElementSibling;
    const playable = direction < 0 ? drag.previous : drag.next;
    // Keep a known-bad slot below the observer's activation threshold.
    const limit = !playable ? 0 : playable === neighbor ? drag.height : drag.height * 0.35;
    root.scrollTo({top: drag.top + direction * Math.min(Math.abs(position), limit), behavior: 'instant'});
  });
  root.addEventListener('pointerup', event => end(event, false));
  root.addEventListener('pointercancel', event => end(event, true));
  root.addEventListener('lostpointercapture', event => {
    if (!root.hasPointerCapture(event.pointerId)) end(event, true);
  });
  root.addEventListener('click', event => {
    if (!suppressClick || !event.detail) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();
