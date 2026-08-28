/* ===========================================================================
   scroll.js, the scroll spine. Single source of truth for parallax.
   ---------------------------------------------------------------------------
   No modules, no imports, no fetch. Classic script, IIFE, runs from file://.

   Note: history.scrollRestoration is NOT set here. It is set by the inline
   script in index.html <head>, because by the time a script at the end of
   <body> runs the browser may already have restored the previous position.
   =========================================================================== */

(function () {
  'use strict';

  /* --- the one number to tune ---------------------------------------------
     Fraction of the scroll distance the backdrop travels. Panels ride normal
     flow at 1.0, so anything below 1.0 reads as parallax. Lower = more
     dramatic separation. 0.0 would pin the backdrop completely.
     ----------------------------------------------------------------------- */
  var PARALLAX_RATE = 0.35;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var section = document.getElementById('intro');
  var bg      = document.getElementById('intro-bg');

  /* ---------------------------------------------------------------------- */
  /*  Parallax                                                              */
  /* ---------------------------------------------------------------------- */

  if (section && bg) {
    if (reduceMotion) {
      /* No differential motion at all. The backdrop stays pinned by its
         sticky positioning and we never write a transform. Cheapest correct
         answer, and it removes will-change from the compositor's plate. */
      bg.style.willChange = 'auto';
    } else {
      var sectionTop = 0;
      var maxShift   = 0;
      var ticking    = false;

      function measure() {
        /* Absolute document offset of the section, recomputed on resize
           because the intro height is expressed in viewport units. */
        var rect = section.getBoundingClientRect();
        sectionTop = rect.top + (window.pageYOffset || document.documentElement.scrollTop);

        /* --- size the backdrop to exactly the travel it needs ---------------
           The sticky backdrop is pinned for (section height - one viewport) of
           scrolling. Over that distance it translates by that much x the rate,
           so it needs precisely that much surplus height beyond the viewport.

           Computing it instead of hardcoding a CSS height is what keeps the
           two in sync: change --intro-screens or PARALLAX_RATE and this still
           fits. A fixed 165vh silently ran out of travel a third of the way
           down and then sat frozen for the rest of the section.
           ------------------------------------------------------------------ */
        var viewport   = window.innerHeight;
        var pinnedFor  = Math.max(0, section.offsetHeight - viewport);
        var needed     = viewport + (pinnedFor * PARALLAX_RATE);

        bg.style.height = needed + 'px';
        maxShift = Math.max(0, needed - viewport);
      }

      function paint() {
        ticking = false;
        var y = window.pageYOffset || document.documentElement.scrollTop;
        var shift = (y - sectionTop) * PARALLAX_RATE;
        if (shift < 0) shift = 0;
        if (shift > maxShift) shift = maxShift;
        bg.style.transform = 'translate3d(0,' + (-shift).toFixed(2) + 'px,0)';
      }

      function onScroll() {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(paint);
        }
      }

      measure();
      /* Paint once immediately, BEFORE any scroll event fires. On a deep link
         or a restored scroll position the backdrop must already be in the
         right place on frame one, otherwise it visibly snaps the first time
         the wheel is touched. */
      paint();

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { measure(); paint(); });
      window.addEventListener('orientationchange', function () {
        window.setTimeout(function () { measure(); paint(); }, 200);
      });

      /* Late-loading content (images) can change the document height and move
         the section. Re-measure once everything has settled. */
      window.addEventListener('load', function () { measure(); paint(); });

      /* Exposed so cover.js can re-measure after the scroll lock releases,
         which changes the document height. */
      window.GB_SCROLL = { measure: measure, paint: paint };
    }
  }

  /* --- deep-link insurance -------------------------------------------------
     Arriving at index.html#toc, the browser scrolls to the fragment while
     parsing. The marquee cards are built by JS after that, and images resolve
     later still, so anything that changes layout above the target leaves the
     visitor slightly off-position.

     Re-jumping once after load costs nothing and makes the return trip from a
     story page land exactly on the table of contents every time.

     Outside the reduced-motion branch on purpose: the correction is a jump,
     not an animation, so it is wanted in both modes.
     ----------------------------------------------------------------------- */

  if (window.location.hash.length > 1) {
    window.addEventListener('load', function () {
      var target = document.getElementById(window.location.hash.slice(1));
      if (!target) { return; }
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
      if (window.GB_SCROLL) {
        window.GB_SCROLL.measure();
        window.GB_SCROLL.paint();
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  Keep the address bar pointing at where the reader actually is          */
  /* ---------------------------------------------------------------------- */
  /*
     Once the table of contents has climbed past the middle of the screen the
     URL becomes index.html#toc, and it drops back to index.html when it falls
     below again.

     The point is what happens NEXT time: the pre-paint script in index.html
     reads that fragment and skips the cover, so someone who scrolled down and
     then reloaded, bookmarked, or shared the page lands back on the story list
     instead of watching the opening again.

     replaceState, never pushState, pushState would stack a history entry on
     every crossing and bury the back button.
  */

  var toc = document.getElementById('toc');

  if (toc) {
    var hashNow  = null;
    var hashTick = false;

    function syncHash() {
      hashTick = false;

      /* Halfway up the viewport, as asked. Using the section's top edge means
         the switch happens as the list arrives, not when it is already gone. */
      var atToc = toc.getBoundingClientRect().top <= window.innerHeight / 2;
      var want  = atToc ? '#toc' : '';

      if (want === hashNow) { return; }
      hashNow = want;

      /* file:// is the delivery condition, and some browsers refuse
         replaceState on a file URL. A thrown SecurityError here must not take
         the parallax down with it, so this is best-effort by design. */
      try {
        window.history.replaceState(
          window.history.state, '',
          window.location.pathname + window.location.search + want
        );
      } catch (err) { /* address bar stays as it was; nothing else cares */ }
    }

    function onHashScroll() {
      if (!hashTick) {
        hashTick = true;
        window.requestAnimationFrame(syncHash);
      }
    }

    window.addEventListener('scroll', onHashScroll, { passive: true });
    window.addEventListener('resize', onHashScroll);

    /* Seed it, so arriving mid-page by any route is already correct. Skipped
       on a deep link: the fragment is the reason we are here. */
    if (window.location.hash.length > 1) { hashNow = '#toc'; }
    else { syncHash(); }
  }

  /* ---------------------------------------------------------------------- */
  /*  Panel reveal                                                          */
  /* ---------------------------------------------------------------------- */
  /*  CSS hides panels only when html.js is present, so if this file fails to
      parse the panels are simply visible. Progressive enhancement, not a
      dependency.                                                             */

  var panels = document.querySelectorAll('.intro__panel');

  if (panels.length && !reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-visible');
          io.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    for (var p = 0; p < panels.length; p++) { io.observe(panels[p]); }
  } else {
    for (var q = 0; q < panels.length; q++) { panels[q].classList.add('is-visible'); }
  }

})();
