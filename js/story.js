/* ===========================================================================
   story.js, story page wiring
   ---------------------------------------------------------------------------
   Two jobs:

     1. Drive the custom narration transport from the mockup. The <audio>
        element is still the engine; this only replaces its face. The native
        controls stay visible until this file has actually wired everything up
        and set .is-enhanced, so a script error leaves working browser
        controls behind instead of a dead row of buttons.

     2. Make the two missing-asset cases fail legibly rather than looking
        broken, because during the build most of the assets are not in yet.

   No fetch, no modules, no external icon font, this has to run from file://.
   =========================================================================== */

(function () {
  'use strict';

  var SKIP_ICON_SECONDS = 15;                     /* must match the <b>15</b> */
  var RATES = [1, 1.25, 1.5, 2, 0.75];

  var wrap  = document.querySelector('.story__audio');
  var audio = wrap && wrap.querySelector('audio');

  /* A story narrated with a VIDEO has a <video> here and no custom transport
     at all - the build emits one player or the other, never both. The
     missing-file handling below is identical for the two; only the transport
     wiring is not, and wirePlayer bails on its own when the buttons are
     absent. */
  var media = audio || (wrap && wrap.querySelector('video'));

  /* --- missing narration ---------------------------------------------------
     A missing mp3 renders as a dead native control with no explanation. Catch
     the error and say what is actually going on.
     ----------------------------------------------------------------------- */

  function markMissing() {
    if (wrap) { wrap.classList.add('is-missing'); }
  }

  if (media) {
    /* Capture phase: the error fires on the element itself, and on the
       <source> children in browsers that report it there instead. */
    media.addEventListener('error', markMissing, true);
  }

  /* --- the transport -------------------------------------------------------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function clock(seconds) {
    if (!isFinite(seconds) || seconds < 0) { return '--:--'; }
    var total = Math.floor(seconds);
    var mins  = Math.floor(total / 60);
    var secs  = total % 60;
    if (mins < 60) { return pad(mins) + ':' + pad(secs); }
    return Math.floor(mins / 60) + ':' + pad(mins % 60) + ':' + pad(secs);
  }

  function wirePlayer() {
    if (!wrap || !audio) { return; }

    var play     = wrap.querySelector('.player__play');
    var seek     = wrap.querySelector('.player__seek');
    var elapsed  = wrap.querySelector('.player__elapsed');
    var duration = wrap.querySelector('.player__duration');
    var rateBtn  = wrap.querySelector('.player__rate');
    var muteBtn  = wrap.querySelector('.player__mute');
    var skips    = wrap.querySelectorAll('.player__skip');

    /* Every part has to be present. A half-wired transport is worse than the
       native controls, so bail out and leave those in place. */
    if (!play || !seek || !elapsed || !duration || !rateBtn || !muteBtn) { return; }

    var scrubbing = false;
    var rateIndex = 0;

    function paint(value) {
      var max = parseFloat(seek.max) || 0;
      var pct = max > 0 ? (value / max) * 100 : 0;
      seek.style.setProperty('--p', pct + '%');
    }

    function sync() {
      if (scrubbing) { return; }
      seek.value = audio.currentTime;
      paint(audio.currentTime);
      elapsed.textContent = clock(audio.currentTime);
    }

    /* --- duration ---------------------------------------------------------
       A stream with no known length (rare from disk, but possible) leaves the
       seek bar disabled rather than pretending to scrub. */

    function readDuration() {
      if (!isFinite(audio.duration) || audio.duration <= 0) { return; }
      seek.max = audio.duration;
      seek.disabled = false;
      duration.textContent = clock(audio.duration);
      sync();
    }

    audio.addEventListener('loadedmetadata', readDuration);
    audio.addEventListener('durationchange', readDuration);
    if (audio.readyState > 0) { readDuration(); }

    /* --- play / pause ------------------------------------------------------ */

    play.addEventListener('click', function () {
      if (audio.paused) {
        var started = audio.play();
        if (started && typeof started['catch'] === 'function') {
          /* A rejection is not proof the file is bad - an autoplay-policy
             block rejects too, and calling that "not recorded yet" would be a
             lie. Only the element's own error means the narration is missing;
             the 'error' listener above already catches that case. */
          started['catch'](function () {
            if (audio.error) { markMissing(); }
          });
        }
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', function () {
      wrap.classList.add('is-playing');
      play.setAttribute('aria-label', 'Pause narration');
    });

    function stopped() {
      wrap.classList.remove('is-playing');
      play.setAttribute('aria-label', 'Play narration');
    }
    audio.addEventListener('pause', stopped);
    audio.addEventListener('ended', function () {
      stopped();
      audio.currentTime = 0;
      sync();
    });

    audio.addEventListener('timeupdate', sync);

    /* --- seeking -----------------------------------------------------------
       Scrub on 'input' updates only the readout; the audio is moved on
       'change'. Setting currentTime on every input event stutters badly on a
       long file.
       -------------------------------------------------------------------- */

    seek.addEventListener('input', function () {
      scrubbing = true;
      paint(seek.value);
      elapsed.textContent = clock(parseFloat(seek.value));
    });

    seek.addEventListener('change', function () {
      audio.currentTime = parseFloat(seek.value) || 0;
      scrubbing = false;
      sync();
    });

    /* --- skip -------------------------------------------------------------- */

    for (var i = 0; i < skips.length; i++) {
      skips[i].addEventListener('click', function (e) {
        var by = parseFloat(e.currentTarget.getAttribute('data-seek'));
        if (!isFinite(by)) { by = SKIP_ICON_SECONDS; }

        var target = audio.currentTime + by;
        var end    = isFinite(audio.duration) ? audio.duration : target;

        audio.currentTime = Math.max(0, Math.min(target, end));
        sync();
      });
    }

    /* --- speed ------------------------------------------------------------- */

    rateBtn.addEventListener('click', function () {
      rateIndex = (rateIndex + 1) % RATES.length;
      var rate = RATES[rateIndex];
      audio.playbackRate = rate;
      rateBtn.textContent = rate + 'x';
      rateBtn.setAttribute('aria-label', 'Playback speed, currently ' + rate + ' times');
    });

    /* --- mute -------------------------------------------------------------- */

    muteBtn.addEventListener('click', function () {
      audio.muted = !audio.muted;
      wrap.classList.toggle('is-muted', audio.muted);
      muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute narration' : 'Mute narration');
    });

    /* Wired. Take the native controls down and show ours. */
    audio.removeAttribute('controls');
    wrap.classList.add('is-enhanced');
  }

  wirePlayer();

  /* --- illustration --------------------------------------------------------
     If the image 404s, swap the blurred backdrop to a plain gradient so the
     page does not read as half-loaded.
     ----------------------------------------------------------------------- */

  var illo = document.querySelector('.story__figure img');
  var bg   = document.querySelector('.story-bg');

  if (illo) {
    illo.addEventListener('error', function () {
      illo.style.display = 'none';
      if (bg) { bg.style.backgroundImage = 'none'; }
    });
  }

  /* --- back link -----------------------------------------------------------
     The href already points at index.html#toc, which works with JS off. This
     only adds a small nicety: if the visitor arrived from the TOC in this same
     tab, go back through history instead of re-loading the page, which
     preserves their exact scroll position in the story list.
     ----------------------------------------------------------------------- */

  var back = document.querySelector('.story__back');

  if (back && document.referrer) {
    var cameFromIndex = document.referrer.indexOf('index.html') !== -1;
    if (cameFromIndex && window.history.length > 1) {
      back.addEventListener('click', function (e) {
        e.preventDefault();
        window.history.back();
      });
    }
  }

})();
