/* ===========================================================================
   toc.js, builds the table of contents from window.STORIES
   ---------------------------------------------------------------------------
   Renders TWO independent routes to every story:
     1. the vertical looping marquee  (.marquee)
     2. a plain numbered list         (.toc__index)

   THE LOOP

   The story list is rendered COPIES times over and the scroll position is
   parked in the middle copy. Drift off the end of that copy and we move the
   scroll position back by exactly one copy-height, which lands on a visually
   identical card, so there is no top and no bottom, in either direction.

   Two things make that stable, and both were bugs before:

     - THREE copies, not two. With two copies starting at scrollTop 0, the
       "wrapped past the top" test is true on frame one, so it jumped forward
       a whole copy immediately, which then made the "wrapped past the bottom"
       test true, and the two fought each other forever. The strip looked
       frozen after one violent jump. With three copies the resting range is
       [period, 2*period) and neither test fires at rest.

     - The period is measured between two matching cards, not as
       scrollHeight/COPIES. The gaps between cards do not divide evenly (18
       cards have 17 gaps), so the arithmetic version is short by a fraction
       of a gap each lap and the loop visibly creeps.

   The strip is a native overflow-y:auto scroller, so wheel, touch and keyboard
   scrolling come free. This file only adds auto-drift and mouse drag-scrub.
   =========================================================================== */

(function () {
  'use strict';

  var COPIES = 3;                   /* must be odd, and at least 3            */
  var SPEED  = 0.5;                 /* px per frame at 60fps, ~30px/second    */

  var stories  = window.STORIES || [];
  var viewport = document.getElementById('marquee');
  var track    = document.getElementById('marquee-track');
  var index    = document.getElementById('story-index');

  if (!stories.length) { return; }

  /* ---------------------------------------------------------------------- */
  /*  Build                                                                 */
  /* ---------------------------------------------------------------------- */

  function cardFor(story, isCopy) {
    var a = document.createElement('a');
    a.className = 'marquee__card';
    a.href = './' + story.slug + '.html';

    if (isCopy) {
      /* The duplicated copies exist only so the loop can wrap seamlessly.
         Hide them from assistive tech and from the tab order so every story
         is announced exactly once. */
      a.setAttribute('aria-hidden', 'true');
      a.setAttribute('tabindex', '-1');
    }

    var fig = document.createElement('figure');
    fig.className = 'marquee__figure';

    var img = document.createElement('img');
    /* The card shows the group's COVER, the image with the story's title
       painted into it, and falls back to the front image for a story that
       has not handed a cover in. The story page itself always shows the
       front image; these are two different pictures on purpose. */
    img.src = story.cover || story.illustration;
    img.alt = isCopy ? '' : ('Cover for "' + story.title + '"');
    img.loading = 'lazy';
    img.decoding = 'async';
    /* Dragging an image is the browser's native drag-and-drop, which cancels
       the pointer stream mid-scrub. */
    img.draggable = false;
    fig.appendChild(img);

    var num = document.createElement('span');
    num.className = 'marquee__num';
    num.textContent = story.id;

    var body = document.createElement('div');
    body.className = 'marquee__body';

    var h = document.createElement('h3');
    h.className = 'marquee__title';
    h.textContent = story.title;

    var g = document.createElement('span');
    g.className = 'marquee__group';
    g.textContent = story.group;

    body.appendChild(h);
    body.appendChild(g);

    a.appendChild(fig);
    a.appendChild(num);
    a.appendChild(body);
    return a;
  }

  if (track) {
    var frag = document.createDocumentFragment();
    for (var c = 0; c < COPIES; c++) {
      for (var i = 0; i < stories.length; i++) {
        frag.appendChild(cardFor(stories[i], c > 0));
      }
    }
    track.appendChild(frag);
  }

  if (index) {
    var ol = document.createElement('ol');
    for (var k = 0; k < stories.length; k++) {
      var s = stories[k];

      var li = document.createElement('li');
      var link = document.createElement('a');
      link.href = './' + s.slug + '.html';

      var n = document.createElement('span');
      n.className = 'toc__index-num';
      n.textContent = s.id;

      var t = document.createElement('span');
      t.className = 'toc__index-title';
      t.textContent = s.title;

      var gr = document.createElement('span');
      gr.className = 'toc__index-group';
      gr.textContent = s.group;

      link.appendChild(n);
      link.appendChild(t);
      link.appendChild(gr);
      li.appendChild(link);
      ol.appendChild(li);
    }
    index.appendChild(ol);
  }

  /* ---------------------------------------------------------------------- */
  /*  The loop                                                              */
  /* ---------------------------------------------------------------------- */

  if (!viewport || !track) { return; }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var paused   = reduceMotion;
  var dragging = false;
  var rafId    = null;
  var period   = 0;                 /* exact pixel height of one copy         */
  var carry    = 0;                 /* sub-pixel drift remainder              */
  var wrapping = false;             /* re-entry guard for the scroll handler  */

  var parkTries = 0;
  var PARK_TRIES_MAX = 60;          /* ~1 second at 60fps, then give up       */

  function measureLoop() {
    var cards = track.children;
    if (cards.length <= stories.length) { period = 0; return; }

    /* Distance between the first card of copy 1 and the first card of copy 2.
       Exact by construction, whatever the gap works out to. */
    period = cards[stories.length].offsetTop - cards[0].offsetTop;
    if (period <= 0) { return; }

    /* Park in the middle copy if we are not already inside it. */
    var y = viewport.scrollTop;
    if (y >= period && y < period * 2) { parkTries = 0; return; }

    /* Keep the position WITHIN the copy rather than snapping to its top. A
       re-measure after a resize can move the period by a pixel, and snapping
       would throw the reader a whole copy-height up the strip for no visible
       reason. Modulo keeps them on the same card at the same offset. */
    viewport.scrollTop = period + (((y % period) + period) % period);

    /* The assignment above CLAMPS TO ZERO if the strip is not scrollable yet,
       which it briefly is not while layout settles on a cold load. Being left
       parked at zero is the whole bug this loop was reported for: the wrap
       then fires on frame one and the strip jumps once and sticks. So check
       the write actually took, and keep trying for about a second. */
    if (viewport.scrollTop < period && parkTries < PARK_TRIES_MAX) {
      parkTries++;
      /* setTimeout rather than requestAnimationFrame: rAF is throttled hard in
         a background tab, and a strip left parked at zero is exactly the state
         this is here to escape. A timer fires either way. */
      window.setTimeout(measureLoop, 16);
    }
  }

  function wrap() {
    if (period <= 0 || wrapping) { return; }

    var y = viewport.scrollTop;
    var next = y;

    if (y >= period * 2)  { next = y - period; }
    else if (y < period)  { next = y + period; }

    if (next !== y) {
      /* Setting scrollTop fires 'scroll', which calls this again. One
         correction always lands strictly inside [period, 2*period), so the
         second call is a no-op, but guard anyway rather than rely on it. */
      wrapping = true;
      viewport.scrollTop = next;
      wrapping = false;
    }
  }

  function tick() {
    if (!paused && !dragging && period > 0) {
      /* scrollTop rounds to whole pixels in some browsers, and a 0.5px step
         would round to zero every frame and never move. Accumulate the
         remainder and spend it a pixel at a time. */
      carry += SPEED;
      var step = Math.floor(carry);
      if (step > 0) {
        carry -= step;
        viewport.scrollTop += step;
        wrap();
      }
    }
    rafId = window.requestAnimationFrame(tick);
  }

  function start() {
    if (rafId === null && !reduceMotion) { rafId = window.requestAnimationFrame(tick); }
  }
  function stop() {
    if (rafId !== null) { window.cancelAnimationFrame(rafId); rafId = null; }
  }

  /* Exposed so cover.js can re-measure the moment the scroll lock releases.
     That is the one size change we know the exact timing of, and a
     ResizeObserver notification arrives a frame late. Mirrors window.GB_SCROLL,
     which exists in scroll.js for the same reason. */
  window.GB_MARQUEE = { measure: measureLoop };

  measureLoop();
  window.addEventListener('resize', measureLoop);
  window.addEventListener('load', measureLoop);

  /* The period has to be re-measured whenever the panels change size, and they
     change size for reasons a resize listener never sees:

       - the first measure runs before layout has settled, so it is usually
         wrong by a lot on a cold load;
       - dismissing the cover releases the scroll lock, the page scrollbar
         appears, the column narrows, and every panel gets shorter, the panels
         are aspect-ratio sized, so their height follows their width;
       - late-arriving fonts and images nudge the surrounding layout.

     A stale period does not look like a stale period. It looks like the strip
     slipping a little further out of alignment on every lap. */
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { measureLoop(); }).observe(track);
  }

  /* Wheel, touch and keyboard all move scrollTop without going through tick(),
     so the wrap has to be checked on every scroll, not just on drift. */
  viewport.addEventListener('scroll', wrap, { passive: true });

  /* --- pause ---------------------------------------------------------------
     Hover freezes the strip where it stands and it resumes on leave. Keyboard
     focus pauses too, so a tabbing user is not chasing a moving target.
     ----------------------------------------------------------------------- */

  viewport.addEventListener('pointerenter', function (e) {
    if (e.pointerType === 'mouse') { paused = true; }
  });
  viewport.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse' && !dragging) { paused = false; }
  });

  viewport.addEventListener('focusin',  function () { paused = true; });
  viewport.addEventListener('focusout', function () {
    if (!viewport.matches(':hover')) { paused = false; }
  });

  /* Do not burn frames in a hidden tab or when the strip is off-screen. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { start(); } else { stop(); }
    }, { threshold: 0 }).observe(viewport);
  } else {
    start();
  }

  /* ---------------------------------------------------------------------- */
  /*  Mouse drag-scrub                                                      */
  /* ---------------------------------------------------------------------- */
  /*  Mouse only. Touch already has a native vertical swipe that behaves
      better than anything reimplemented here.                               */

  var DRAG_THRESHOLD = 5;           /* px before a click becomes a drag       */
  var startY = 0, startScroll = 0, moved = 0, activeId = null, captured = false;

  viewport.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) { return; }

    dragging    = true;
    moved       = 0;
    captured    = false;
    startY      = e.clientY;
    startScroll = viewport.scrollTop;
    activeId    = e.pointerId;

    viewport.classList.add('is-dragging');
  });

  viewport.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== activeId) { return; }

    var dy = e.clientY - startY;
    if (Math.abs(dy) > moved) { moved = Math.abs(dy); }

    /* Capture only once this is genuinely a drag.
       setPointerCapture retargets the follow-up click to the capturing
       element, so capturing on pointerdown meant every click on a card was
       delivered to the strip instead of to the <a>, which is exactly why
       clicking an illustration went nowhere. */
    if (!captured) {
      if (moved <= DRAG_THRESHOLD) { return; }
      viewport.setPointerCapture(e.pointerId);
      captured = true;
    }

    viewport.scrollTop = startScroll - dy;
    wrap();
  });

  function endDrag(e) {
    if (!dragging || (activeId !== null && e.pointerId !== activeId)) { return; }

    dragging = false;
    activeId = null;

    if (captured) {
      try { viewport.releasePointerCapture(e.pointerId); } catch (err) {}
      captured = false;
    }

    viewport.classList.remove('is-dragging');
    if (!viewport.matches(':hover')) { paused = false; }
  }

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  /* Suppress the click at the end of a drag so releasing the mouse over a card
     does not navigate. A click that never moved falls straight through to the
     link. moved resets either way, so one drag cannot poison the next click. */
  viewport.addEventListener('click', function (e) {
    if (moved > DRAG_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
    }
    moved = 0;
  }, true);

})();
