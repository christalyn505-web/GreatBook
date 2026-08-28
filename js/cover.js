/* ===========================================================================
   cover.js, dismisses the cover and releases the scroll lock
   ---------------------------------------------------------------------------
   The decision "cover or no cover" was already made before first paint by the
   inline script in index.html <head>. This file only handles the dismissal.

   WHAT ADVANCES THE COVER, AND WHAT DELIBERATELY DOES NOT

   Two things: the button, and a deliberate scroll DOWN.

   An earlier version advanced on anything at all, any key, a click anywhere,
   a wheel in either direction, a touch. The reasoning was that a cover which
   traps someone is the worst outcome. In practice it was worse than that: a
   stray keypress threw the reader straight past the cover before they had read
   a word of it, and there is no way back short of reloading.

   So the rule now is that the input has to MEAN "go down":
     - the button                     click, Enter or Space while focused
     - wheel                          only when deltaY is positive
     - the keys that scroll down      Down, PageDown, End, Space
     - touch                          a real upward swipe, not a tap

   Everything else, letters, Escape, Tab, arrow up, a click on the background
  , leaves the cover alone.

   Deep links (index.html#toc, which is where every story page's back button
   points) never reach any of this: html.deep-link means the cover was never
   shown and the lock was never applied, so the browser's own fragment scroll
   lands on the table of contents untouched.

   WHAT HAPPENS WHEN IT IS DISMISSED

   Two steps, and they are deliberately separate:

     dismiss()   the reader's input landed. Stop listening, start the exit.
     release()   the screen is now dark. Unlock, re-measure, move focus, fade.

   Everything that changes the layout lives in release(), and release() does
   not run until whatever is playing the exit says the screen is opaque. That
   is the whole point of the split: unlocking the scroll makes the scrollbar
   appear, which narrows the columns, which resizes every marquee panel. Doing
   that in front of the reader is a visible jolt. Doing it behind a black
   screen is free.

   js/cover-fx.js plays the exit when it can, grey ellipses growing in from
   the rim of the frame until the centre is swallowed, then swirling lights on
   the black, and calls release() the moment the fade is due to begin, which
   is while the last of those lights are still turning. The cover is still
   fully opaque on that frame, so the relayout is as well hidden as it ever
   was; the swirls simply carry on over the introduction as it comes up. When
   cover-fx cannot run (no WebGL, a shader that will not compile,
   prefers-reduced-motion) it is simply absent and release() runs immediately,
   which is the plain CSS crossfade this file has always done. Nothing below
   needs to know which of the two happened.
   =========================================================================== */

(function () {
  'use strict';

  var root  = document.documentElement;
  var cover = document.getElementById('cover');
  var enter = document.getElementById('cover-enter');

  if (!cover) { return; }

  /* Arrived via a fragment, the cover is display:none and body was never
     locked. Nothing to wire up. */
  if (root.classList.contains('deep-link')) { return; }

  var SWIPE_PX  = 24;               /* upward finger travel that counts       */
  var dismissed = false;            /* the input landed                       */
  var released  = false;            /* the page has been unlocked             */
  var touchY    = null;

  /* --- step one: the input landed ------------------------------------------
     Stop listening immediately, a second wheel event during the exit must
     not start a second one, then hand over to the shader if there is one.
     ----------------------------------------------------------------------- */

  function dismiss() {
    if (dismissed) { return; }
    dismissed = true;

    detach();

    var fx = window.GB_COVER_FX;
    if (fx && fx.available()) {
      /* Recedes the title and the button, so the centre of the screen is
         already empty by the time the dark closes over it. */
      root.classList.add('cover-veiling');

      /* release() is called once, on the frame the reveal is due to start,
         the cover is still opaque at that instant, and the swirls play on
         over the top of it. cover-fx.js guarantees the call even if its own
         animation never finishes, so there is no path where the page stays
         locked. */
      fx.play(release);
      return;
    }

    release();
  }

  /* --- step two: the screen is dark, so change the page ---------------------
     Everything here is invisible to the reader at the moment it happens.
     ----------------------------------------------------------------------- */

  function release() {
    if (released) { return; }
    released = true;

    root.classList.remove('cover-active');   /* releases overflow:hidden */
    root.classList.add('cover-done');

    /* Releasing the lock restores the document's real height. Anything that
       measured the layout while it was locked has to look again. */
    if (window.GB_SCROLL) {
      window.GB_SCROLL.measure();
      window.GB_SCROLL.paint();
    }

    /* Same reason, different element: the marquee's repeat distance is
       measured in pixels, so anything that changes the column width makes it
       stale.

       THIS USED TO BE LOAD-BEARING AND IS NOT ANY MORE. Releasing the lock
       made the page scrollbar appear, which narrowed the columns and
       shortened every marquee panel, they are aspect-ratio sized, so height
       follows width. The site now hides the scrollbar everywhere (see the
       note in css/base.css), so there is no width change here to correct.

       Both calls are kept regardless. They cost one measurement each, they
       are still right if the layout moves for any other reason, and they are
       precisely what would be needed again the day the scrollbar comes back. */
    if (window.GB_MARQUEE) {
      window.GB_MARQUEE.measure();
      /* Once more after the paint, for that same historical reason: a
         scrollbar does not appear on the tick the lock is released, so a
         single measurement taken here would still see the old, wider column. */
      window.setTimeout(window.GB_MARQUEE.measure, 80);
    }

    /* Move focus into the page so keyboard users are not left on a button
       that has just faded out from under them. */
    var target = document.getElementById('intro');
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }

    /* Take the faded cover out of the accessibility tree entirely, and let
       the shader drop its GL context at the same time, the cover is hidden
       by now, so nothing it could draw would ever be seen again.

       THIS WAIT MUST OUTLAST THE FADE, which is the 1500ms transition on
       .cover in css/cover.css. It is a hand-kept pair, and getting it wrong
       is not subtle: set it short and the cover is torn out of the document
       partway through its own dissolve, taking the swirls with it. The extra
       60ms is margin, not meaning.

       It is one of three numbers spread across three files that have to agree
       about this handover, the third is REVEAL_LEAD_MS in js/cover-fx.js,
       where the arithmetic between all of them is written out. */
    window.setTimeout(function () {
      cover.setAttribute('aria-hidden', 'true');
      cover.hidden = true;
      if (window.GB_COVER_FX) { window.GB_COVER_FX.stop(); }
    }, 1560);
  }

  /* --- scroll down, by wheel ----------------------------------------------- */

  function onWheel(e) {
    if (e.deltaY > 0) { dismiss(); }
  }

  /* --- scroll down, by key -------------------------------------------------
     Only the keys that actually mean "down the page". Space is included
     because it is the oldest page-down gesture on the web; it also activates
     the button when the button has focus, and the dismissed guard makes the
     overlap harmless.
     ----------------------------------------------------------------------- */

  var SCROLL_DOWN_KEYS = {
    'ArrowDown': true,
    'Down': true,                   /* legacy Edge/IE key name                */
    'PageDown': true,
    'End': true,
    ' ': true,
    'Spacebar': true                /* legacy Edge/IE key name                */
  };

  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) { return; }
    if (!SCROLL_DOWN_KEYS[e.key]) { return; }

    /* The page is locked, so this would scroll nothing anyway, but stopping
       it keeps Space from also scrolling the moment the lock releases. */
    e.preventDefault();
    dismiss();
  }

  /* --- scroll down, by touch -----------------------------------------------
     A tap must not dismiss, so this waits for real travel. The finger moves
     UP to scroll the page DOWN.
     ----------------------------------------------------------------------- */

  function onTouchStart(e) {
    touchY = (e.touches && e.touches.length) ? e.touches[0].clientY : null;
  }

  function onTouchMove(e) {
    if (touchY === null || !e.touches || !e.touches.length) { return; }
    if (touchY - e.touches[0].clientY > SWIPE_PX) { dismiss(); }
  }

  function attach() {
    if (enter) { enter.addEventListener('click', dismiss); }
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
  }

  function detach() {
    if (enter) { enter.removeEventListener('click', dismiss); }
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
  }

  attach();

})();
