/* ===========================================================================
   cover-fx.js, the raven veil: the cover's exit, drawn by WebGL shaders
   ---------------------------------------------------------------------------
   WHAT IT DOES

   The cover's dismissal is TWO MOVEMENTS, played one after the other. They do
   not overlap, and the handover between them is a full blackout.

   FIRST, THE CAVE-IN (CAVE_MS). Long grey ellipses drive inward from the rim
   of the screen. They are STRAIGHT, the feathers do not turn. They start at
   the bottom centre and unfurl around both sides, meeting last at the top.
   Where they overlap they multiply into each other, so the mass banked against
   the edges reads near-black while the leading tips stay a pale raven grey. A
   black veil comes up behind them over the tail of this movement and reaches
   solid exactly on the handover, so the frame ends on true black. Measured:
   100% black, nothing lit, peak brightness zero.

   THEN, THE SWIRLS (MAGIC_MS). On that black, and not one frame before it,
   small lights appear and wind toward the centre, each drawing a long curved
   streak behind it. They ADD light to the black rather than covering anything,
   which is why the veil sits UNDER them in the stack, the black is the stage
   they play on, not a curtain over them.

   AND THE LAST TWO OVERLAP, DEEPLY (REVEAL_LEAD_MS). The cover does not wait
   for the final spark to burn out before it goes, it does not even wait for
   the swirls to reach their peak. The fade starts about a third of the way
   into them and runs for two thirds of the movement, so the swirls spend most
   of their life turning over an introduction that is already coming up
   underneath. The handover into the page is a long dissolve rather than a cut
   to black and back.

   THAT LEAD HAS A CEILING, and it is worth knowing where it is. Both canvases
   are children of .cover, so when .cover reaches opacity 0 the swirls go with
   it, mid-flight, however much of their arc is left. The lead can therefore
   never usefully exceed the fade's own duration, push it past that and you
   are not revealing earlier, you are cutting the second movement short. To
   start earlier than the fade is long, LENGTHEN THE FADE TOO. The two numbers
   move together; see the note on REVEAL_LEAD_MS.

   LAST, THE BLOOM (BLOOM_MS). The swirls wound everything inward; this throws
   it all back out. Flowers open at the centre and are swept outward along
   unwinding spirals, tumbling end over end, until the wind carries them off
   the edges of the frame. It is meant to read as the mirror of the second
   movement rather than as a new idea: the same rotation, run the other way.

   It does not wait for the swirls to be over. BLOOM_LEAD_MS opens it while
   the last few motes are still turning, so the first flowers appear among
   them and take over from them, rather than following an empty beat.

   THE BLOOM IS NOT INSIDE THE COVER, and it cannot be. By the time it starts,
   the cover is 94% faded and a quarter of a second from being hidden
   altogether, so a child of it would be swept off the screen by the fade
   rather than by the wind. Its canvas is a sibling of .cover, fixed, stacked
   above it, and it owns its own clock, its own resize handling and its own
   teardown, stop() below deliberately does not touch it.

   That is also why it is the one layer in this file drawn with ordinary
   source-over alpha instead of a blend trick. The petals multiply and the
   motes add, and both of those depend on knowing what is underneath. The
   flowers do not: they play over the introduction, over whatever gradient
   happens to be there, and additive light does not show on a lit page.

   WHY THIS IS ALLOWED TO BE WebGL, WHEN NOTHING ELSE HERE IS

   README.md and docs/LAYOUT.md both record "no WebGL" as a deliberate
   decision. That decision was about *sampling Ghibli video into a texture*,
   and it had two reasons: the clips are someone else's copyrighted work, and
   texImage2D() from a local file throws SecurityError under file:// anyway.

   Neither reason touches this file. There is no texture here at all, not one
   texImage2D call, not one image, not one video. Every pixel is computed from
   an ellipse equation or a falloff curve. So there is nothing to be
   cross-origin about, and nothing of anyone else's in it.

   IT IS ALSO ENTIRELY OPTIONAL

   Everything below can fail, no WebGL, a driver that will not compile the
   shaders, a lost context, and the site is unharmed. play() hands control
   straight back and js/cover.js falls through to the CSS fade that has always
   been there. The reduced-motion preference takes that same path on purpose.
   The glow layer is independently optional on top of that: if only it fails,
   the cave-in still runs and still ends on black, the reader loses the second
   movement and nothing else.

   ---------------------------------------------------------------------------
   TWO CANVASES, AND WHY IT HAS TO BE TWO

   This is the one piece of the design that is not obvious, so it is worth
   stating plainly: THE TWO LAYERS CANNOT SHARE A BUFFER. They want opposite
   arithmetic.

     petals   multiply   RGB  ZERO, SRC_COLOR    greys pile into black
                         A    ONE,  1-SRC_ALPHA  silhouettes union
              cleared to WHITE, because white is the identity for multiply

     motes    additive   RGB  ONE,  ONE          light accumulates
              cleared to BLACK, because black is the identity for adding

   Try to put the glow in the petal buffer and its soft edges pick up the white
   ground the multiply pass needs, and every mote wears a pale halo. There is
   no clear colour that is the identity for both operations. The alternative is
   rendering each pass to its own framebuffer texture and compositing them in a
   third pass, which works, and is what you would do if there were four or
   five layers, but it is a great deal of machinery and two more things to go
   wrong on a strange driver for a result no one could tell apart.

   So: two canvases, stacked, each keeping its natural blend mode.

   The glow layer leans on one trick worth knowing. Its context is
   premultipliedAlpha:true and its shader writes

       gl_FragColor = vec4(colour * strength, 0.0);

   RGB above zero with alpha AT zero. Premultiplied, that describes a pixel
   that covers nothing but still contributes light, which is exactly additive
   blending, and the browser composites it that way against whatever is
   underneath, with no blend mode of its own required. Measured on the running
   site: two such draws of (0.5, 0.25, 0.125) accumulate to (1.0, 0.5, 0.25)
   and land over a #203040 ground as (255, 176, 128), the sum, exactly.

   ---------------------------------------------------------------------------
   HOW THE PETALS ARE DRAWN

   Not a full-screen quad looping over every petal per pixel, that is several
   hundred float operations on every one of two million pixels, which is the
   kind of thing that runs at four frames a second on the integrated graphics
   of a borrowed laptop.

   Instead each petal is its own strip of quads, positioned in the vertex
   shader, and the fragment shader tests one ellipse. Fill cost is then
   proportional to the ink actually on screen. Every per-petal number rides in
   as a vertex attribute, so there are no uniform arrays and no per-frame
   chatter with the GPU: one buffer upload per resize, then one float a frame.

   The strip, rather than a single quad, is what lets a feather bend at all.
   A quad has four corners, so bending it only shears it; the interior stays
   flat. Sliced into SEGMENTS pieces along its length, the spine can follow a
   real arc, and the ellipse test still happens in the feather's own undeformed
   parameter space, so the shape bends WITH the mesh instead of being distorted
   by it.

   CURL is zero, so none of that is presently visible, the feathers are plain
   straight ellipses. The machinery is kept because it is written and tested
   and costs one multiply; see the note on CURL in the knobs.
   =========================================================================== */

(function () {
  'use strict';

  /* =======================================================================
     THE KNOBS, everything worth tuning is here, and nothing below is.
     ======================================================================= */

  /* --- the timeline -------------------------------------------------------
     Two movements, one after the other, and THOSE TWO do not overlap:

       1. THE CAVE-IN    the feathers drive straight in and fill the frame,
                         ending on solid black. They do not turn.
       2. THE SWIRLS     on that black, and only then, the magic appears.

     What DOES overlap is the swirls and the reveal, see REVEAL_LEAD_MS.

     Stated in milliseconds rather than in fractions of the run, because that
     is how you actually think about a beat. The fractions the shaders want
     are derived from these numbers, so the split can never drift out of step
     with the total.
     ----------------------------------------------------------------------- */

  var CAVE_MS      = 900;     /* feathers close the frame to black           */
  var MAGIC_MS     = 1850;    /* the swirls turn, on black.

                                 LONG ON PURPOSE. At the 850 this originally
                                 ran for, the second movement was over before
                                 the eye had finished reading it as a
                                 movement at all, the sparks were born,
                                 arrived and died inside a blink. A whole
                                 extra second is what turns it from a
                                 flourish into a beat the reader watches.

                                 Everything downstream is a fraction of the
                                 total, so this is the only number that has
                                 to move when you retune the length. CAVE_END,
                                 the veil ramp, the birth window and the
                                 failsafe all follow it on their own.        */

  var CLOSE_MS     = CAVE_MS + MAGIC_MS;
  var CAVE_END     = CAVE_MS / CLOSE_MS;      /* the handover, as 0..1       */

  /* --- where the reveal starts --------------------------------------------
     How long BEFORE the swirls finish the cover begins to fade, so that the
     introduction comes up through the last of the sparks instead of waiting
     politely behind them.

     THIS NUMBER IS READ AGAINST THE CSS FADE, and it must not exceed it.
     The fade is the 1500ms `transition: opacity` on `.cover` in
     css/cover.css. Nothing in this file can see that value, so THREE numbers
     are kept in step by hand, and all three are in different files:

       REVEAL_LEAD_MS   here          1250   how early the fade starts
       transition       cover.css     1500   how long the fade runs
       the cleanup wait cover.js      1560   when the cover is torn down

     The rules between them are simple and unforgiving. The LEAD must stay at
     or under the FADE, because both canvases are inside .cover and an opacity
     of 0 takes the swirls with it, at 1250 against 1500 the last spark dies
     with about 6% of the black still in front of it, which is as late as it
     can be asked to run. And the CLEANUP must outlast the FADE, or the cover
     is set to hidden partway through its own dissolve. Raise the fade and
     both of its neighbours want raising with it.

     The curve matters as much as the length here, and it is why the reveal is
     the one transition on the site that does not use `--ease`. `--ease` is a
     hard ease-out: it clears half the black in the first fifth of its run, so
     a fade starting this early would dump the reader onto the introduction
     almost at once and leave the swirls playing over a fully lit page. The
     reveal gets a symmetric curve instead, which opens slowly, the black
     lingers while the swirls come up to strength, and the page arrives
     underneath them over the back half. The reasoning sits beside the rule in
     css/cover.css.

     NEGATIVE restores the oldest reading, a beat of held black AFTER the
     swirls, and only then the fade. -120 is exactly what this used to do.
     ----------------------------------------------------------------------- */

  var REVEAL_LEAD_MS = 1250;

  /* When the reveal fires, in ms from the start of the sequence. Derived, so
     that lengthening a movement above carries it along rather than leaving it
     stranded in the middle of the run. */
  var REVEAL_MS    = Math.max(0, CLOSE_MS - REVEAL_LEAD_MS);

  var VEIL_AT      = 0.68;    /* where in the CAVE phase the black floor
                                 starts coming up. It reaches solid exactly
                                 at the handover, which is what guarantees
                                 the swirls begin on a genuinely black frame
                                 rather than on a nearly-black one.

                                 The feathers cannot get there alone: where
                                 all their soft tips converge on the centre
                                 each one darkens only weakly, so on their
                                 own they stall around three-quarters black. */

  /* --- the petals -------------------------------------------------------- */

  var PETALS       = 46;      /* how many ellipses ring the frame            */
  var SEGMENTS     = 12;      /* lengthwise slices per petal. The arc is only
                                 as smooth as this. Below about 6 the curl
                                 visibly kinks; above about 16 nothing
                                 improves and the buffer just grows.         */

  var STAGGER      = 0.62;    /* share of CLOSE_MS spent fanning around the
                                 rim. 0 = every petal starts together;
                                 0.9 = a slow procession from bottom to top. */
  var DELAY_CURVE  = 0.85;    /* below 1 hurries the bottom, lingers at top  */

  var REACH        = 1.18;    /* petal half-length, as a multiple of that
                                 petal's own distance to the centre of the
                                 screen. Below 1.0 they stop short and never
                                 meet; above it they cross and pile up.      */
  var REACH_VARY   = 0.24;

  var WIDTH        = 0.150;   /* half-width as a fraction of half-length.
                                 THIS IS THE ELONGATION. 0.15 is roughly a
                                 7:1 ellipse, long enough that the inward
                                 end reads as a point. Raise it and the
                                 petals become blunt lozenges.               */
  var WIDTH_VARY   = 0.38;

  var CURL         = 0;       /* ZERO BY DESIGN, the feathers cave straight
                                 in and do not turn. The swirling belongs to
                                 the motes, and to the movement after this
                                 one.

                                 The arc machinery in the vertex shader is
                                 kept rather than deleted: it is written and
                                 tested, it costs one multiply on a vertex
                                 that is already being transformed, and at
                                 zero it degenerates cleanly to a straight
                                 line. Raise it to bend the feathers as they
                                 come in, every one turns the SAME way, so a
                                 small value reads as a vortex rather than as
                                 turbulence. Past about 1.2 the tips curl
                                 back across their own neighbours.           */
  var CURL_VARY    = 0.30;

  var TILT         = 0.30;    /* radians a petal may lean off the inward
                                 normal. Without this they are spokes.       */

  var TONE_LO      = 0.15;    /* darkest raven grey a petal may be           */
  var TONE_HI      = 0.46;    /* palest                                      */

  var EDGE         = 0.26;    /* softness of the ellipse rim, in units of its
                                 own half-width. 0 would be a hard cut.      */

  /* --- the motes: THE SWIRLS ---------------------------------------------
     The second movement, and the whole point of it. Small lights that appear
     only once the frame is black, each drawing a curved streak as it winds
     toward the centre.

     They ADD light and never cover anything, which is why the veil sits
     UNDER them in the stack rather than over: the black is the stage, not a
     curtain. That is the one ordering in this file that is easy to get
     backwards and impossible to miss when you do, put the veil on top and
     the swirls simply never appear.
     ----------------------------------------------------------------------- */

  var MOTES        = 700;     /* THE POPULATION. Well over five times what
                                 this ran with when the movement was under a
                                 second, and the count went up with the length
                                 for a reason: a longer beat over the old
                                 sparse field just holds the same thin scatter
                                 of lights on screen for longer, which reads
                                 as a stall rather than as more.

                                 It is cheaper than it sounds. The sparks are
                                 small and their falloff is steep, the core
                                 exponent is 3.4, so a spark's lit area is
                                 under a tenth of the quad it is drawn on. At
                                 700, heads and tails together, the layer
                                 lights a low single-figure percentage of the
                                 frame: a dense sky, not a wash. The cost is
                                 one quad per trail sample and nothing per
                                 pixel that was not already being paid.

                                 IT IS THE FIRST KNOB TO TURN DOWN if the
                                 close ever stutters on a weak machine. Buffer
                                 size and fill both scale straight off it, and
                                 nothing else in the file depends on its
                                 value.                                      */

  var MOTE_SPIN    = 3.10;    /* radians each mote sweeps around the centre
                                 over its life. Generous, because the arc it
                                 sweeps IS the swirl, at the 1.35 it used
                                 when this layer was only a garnish the
                                 streaks came out near enough straight.

                                 RAISED WITH MAGIC_MS, and it had to be. This
                                 is a TOTAL TURN, not a rate: stretch the
                                 window and leave this alone and every mote
                                 covers the same arc at less than half the
                                 angular speed, which stops reading as a
                                 swirl and starts reading as drift. 3.10 is
                                 near enough half a turn each, more curve in
                                 every streak, at a speed still recognisably
                                 the old one.                                */
  var MOTE_DRIFT   = 0.62;    /* fraction of its radius a mote travels
                                 inward. 1.0 would take them to a pile-up on
                                 the exact centre. NEGATIVE blooms them
                                 outward instead, which is the other reading
                                 of this beat and costs nothing to try.      */
  var MOTE_SPREAD  = 0.55;    /* share of the MAGIC window over which they
                                 are born, so they arrive as a drift rather
                                 than all at once.

                                 Widened along with the window. At 0.45 of a
                                 window this long every light is already out
                                 by the halfway mark and the back half of the
                                 movement has nothing new entering it. At
                                 0.55 sparks are still being lit as the
                                 reveal begins, and the last-born of them
                                 reach their brightest DURING the fade rather
                                 than before it.                             */

  var MOTE_MIN     = 0.004;   /* mote half-size, as a fraction of the screen
                                 half-diagonal. Kept relative so they are not
                                 boulders on a phone.

                                 SMALL ON PURPOSE. The first version of this
                                 was three times the size and read as fog: at
                                 that scale the soft halos overlap into an
                                 even wash that lifts the whole frame and
                                 flattens the petals out behind it. Sparks
                                 want to be points with light around them,
                                 not clouds with edges.                      */
  var MOTE_MAX     = 0.013;

  var MOTE_GAIN    = 1.00;    /* master brightness. This is additive light on
                                 an already-dark ground, so it clips fast,
                                 past about 1.4 the cores go flat white.

                                 TRIMMED WHEN THE POPULATION TRIPLED. A core
                                 already peaked near 0.92 at 1.10, and three
                                 times as many of them is three times the
                                 chance of two landing on each other and
                                 clipping to flat white. This is headroom,
                                 not dimming: a single spark is barely
                                 changed, and there are a great many more of
                                 them than there were.                       */

  /* Each mote is drawn several times over, each copy a moment earlier in its
     own life, so the tail lies exactly along the spiral the head has already
     flown. It costs nothing but geometry and it is most of what makes the
     layer read as motion rather than as a field of dots. */
  var MOTE_TRAIL   = 18;      /* samples per mote, the head included. Raised
                                 to buy back the tail length MOTE_LAG gives
                                 up below, which is the order the note under
                                 that knob asks for.                         */
  var MOTE_LAG     = 0.0075;  /* how far back in its life each step reaches.

                                 The rule is that the step it produces has to
                                 land INSIDE the spark, or the tail reads as a
                                 row of beads rather than a streak. Measured:
                                 at 0.035 the step came out at 22px against a
                                 10px spark, and it beaded. Raise MOTE_TRAIL
                                 for a longer comet, not this.

                                 EASED WHEN MOTE_SPIN WENT UP. The step is
                                 the lag times the speed along the path, so a
                                 29% faster sweep lengthens it by 29% on its
                                 own, and the smallest sparks had the least
                                 room to give. Dropping 0.009 to 0.0075 puts
                                 the step back within a few per cent of where
                                 it was measured.                            */
  var MOTE_DECAY   = 0.86;    /* BRIGHTNESS falloff along the tail           */
  var MOTE_WAIST   = 0.97;    /* WIDTH falloff along the tail. Deliberately
                                 close to 1: see the note in the shader.     */

  /* Both drawn from the site palette rather than invented: --accent-bright
     (#c3d64a), the token for live states on dark grounds, and --water-soft
     (#6b8bad), the haze blue. Every mote is a mix of the two. */
  var MOTE_WARM    = [0.765, 0.839, 0.290];
  var MOTE_COOL    = [0.420, 0.545, 0.678];

  /* --- the flowers: THE BLOOM ---------------------------------------------
     The third movement. Everything the swirls drew inward is thrown back out
     again: blossoms open at the centre, spiral outward on an unwinding turn,
     tumble as they travel, and leave the frame on the wind.

     It opens BEFORE the swirls are finished, among the last of them, and
     runs on well past the reveal, so most of it plays over the
     introduction, with the page already unlocked and scrollable underneath.
     Nothing here can affect the reveal, and the canvas takes no clicks.

     TWO CLOCKS, NOT ONE, and this is the part to understand before retuning
     anything below. BLOOM_MS is how long the MOVEMENT lasts. BLOOM_FLIGHT_MS
     is how long ONE FLOWER takes to cross the frame. They used to be the same
     number, every flower's life was normalised over whatever was left of the
     window, so every one of them landed on the final frame together, and
     that coupling made "a longer movement" and "a faster flight" opposite
     requests. Splitting them is what lets the window stretch while the
     flowers themselves speed up.
     ----------------------------------------------------------------------- */

  var BLOOM_MS     = 1000;    /* how long the whole movement lasts. THE ONLY
                                 NUMBER THAT MOVES when you want the bloom
                                 shorter or longer at an unchanged flight
                                 speed, BLOOM_FLIGHT_MS is in milliseconds
                                 precisely so it does not follow this. Check
                                 the constraint below afterwards, though: this
                                 is the denominator under the flight, so
                                 changing it moves that fraction and the
                                 birth spread has to be refitted to match.   */

  var BLOOM_FLIGHT_MS = 715;  /* how long ONE flower takes to go from the
                                 centre to off the frame. UNCHANGED when the
                                 window was last halved, which is exactly why
                                 it is stated in milliseconds and not as a
                                 fraction: "half the duration, same speed" is
                                 one edit to BLOOM_MS and nothing at all here.

                                 At a 1000ms window it is 72% of the movement,
                                 so the two clocks now sit close together and
                                 the whole field is in the air at once. It was
                                 under a third when the window was 2000, and
                                 that difference is worth understanding before
                                 touching BLOOMS, see the note there.

                                 THE CONSTRAINT, and it is the only thing here
                                 that can actually break the movement: the
                                 LAST flower born must be OFF THE SCREEN before
                                 the window shuts, or it is deleted in mid-air
                                 somewhere the reader can see it.

                                   BLOOM_SPREAD
                                     + 0.86 * (BLOOM_FLIGHT_MS / BLOOM_MS)
                                            * the slowest BLOOM_FLIGHT_VARY
                                   <= 1.0

                                 THE 0.86 IS THE POINT. It is the life at
                                 which a flower passes the screen corner, and
                                 it is well under 1.0 because BLOOM_REACH
                                 overshoots on purpose, COMPLETING the flight
                                 and LEAVING THE SCREEN are different moments.
                                 On a roomy window nobody notices; on a tight
                                 one they come apart, and this is a tight one.

                                 At these values the strict "every flower
                                 finishes" form comes to 0.24 + 0.82 = 1.06
                                 and FAILS, while the real test above comes to
                                 0.95 and passes with about 54ms to spare. The
                                 slowest last-born flowers genuinely are cut
                                 off before they finish, off screen, where it
                                 costs nothing. Use the strict form if you want
                                 them all to complete cleanly; use the real one
                                 when the window is this short.

                                 Leaving the spread at 0.62 when the window was
                                 halved would have put the REAL test at 1.23:
                                 flowers cut off in mid-air, a fifth of a
                                 flight short of the edge. That is the failure
                                 this guards against.

                                 Shorten BLOOM_MS or lengthen either of the
                                 other two and work it out again, and mind
                                 the FLOOR on BLOOM_SPREAD below at the same
                                 time, because these two are squeezed from
                                 opposite ends.                               */

  var BLOOM_FLIGHT_VARY = 0.15;
                              /* per-flower spread on that flight time, both
                                 ways. Without it every flower crosses at the
                                 identical rate and the field moves like one
                                 rigid sheet.                                */

  var BLOOMS       = 225;     /* how many are ISSUED over the whole movement,
                                 which is NOT how many are on screen. The
                                 difference is the thing to understand here.

                                 A flower lives BLOOM_FLIGHT_MS and they are
                                 born across BLOOM_SPREAD of the window, so
                                 the number in the air at the peak is about

                                   BLOOMS * min(flight, spread) / spread

                                 WHICH BRANCH OF THAT min() YOU ARE ON IS SET
                                 BY THE WINDOW, and it flips. Against the old
                                 2000ms window the flight was 0.31 and the
                                 spread 0.62, so half the field had left before
                                 the other half opened and 350 issued put about
                                 175 in the air. Halving the window to 1000
                                 doubled the flight fraction to 0.62 and forced
                                 the spread down to 0.28, which lands on the
                                 other branch, where every flower issued is
                                 still flying when the last one opens. EVERY
                                 flower issued is in the air together now, so
                                 at this window the constant IS the density,
                                 225 means 225 on screen.

                                 That flip happened without this number moving
                                 at all. THAT is the trap, and it runs both
                                 ways: read the formula, not the constant.
                                 Measured the
                                 other direction too, dropping the flight from
                                 990 to 620 under the 2000ms window took the
                                 peak from 175 down to 88.

                                 They are OBJECTS rather than sparks, each with
                                 a silhouette the eye can pick out, and the
                                 ceiling is on what is IN THE AIR, not on what
                                 is issued. Push the peak much past a few
                                 hundred and it stops being a gust and starts
                                 being confetti.                              */

  var BLOOM_REACH  = 1.45;    /* how far out they travel, in half-diagonals.
                                 The screen corner sits at exactly 1.0, so
                                 anything at or below that leaves flowers
                                 stranded on screen when the clock runs out.
                                 1.45 clears the corners with room spare.     */
  var BLOOM_REACH_VARY = 0.12;
                              /* per-flower, so they do not all leave along a
                                 perfectly even front. Kept small, the low
                                 end of it is what the constraint above is
                                 measured against.                            */

  var BLOOM_ACCEL  = 1.6;     /* the exponent on the outward travel. ABOVE 1
                                 IS THE WHOLE FEELING, it makes them dawdle
                                 near the centre and tear away at the rim,
                                 which is what being caught by wind looks
                                 like. At 1.0 they slide out at constant
                                 speed and read as a screensaver.             */

  var BLOOM_SWIRL  = 2.20;    /* radians of rotation about the centre over a
                                 flower's life. Applied against sqrt(life),
                                 so the turn is fast while it is still near
                                 the middle and slackens as it gets out,
                                 a vortex shedding what it was carrying,
                                 rather than a record turntable.              */
  var BLOOM_SWIRL_VARY = 0.30;

  var BLOOM_SPREAD = 0.24;    /* share of the window over which they open, so
                                 the centre keeps issuing flowers instead of
                                 emptying after one burst.

                                 NOT A FREE CHOICE IN EITHER DIRECTION, and
                                 the floor is the half that is easy to miss.

                                 The CEILING is the constraint at
                                 BLOOM_FLIGHT_MS: births plus flight have to
                                 fit inside the window.

                                 The FLOOR is that this has to be wide enough
                                 to FILL the window. A quick flight under a
                                 narrow birth spread means every flower has
                                 come and gone before the movement is over,
                                 and the tail of it is a blank canvas sitting
                                 over the page waiting to be hidden. Nothing
                                 errors; there is simply nothing on screen.
                                 It is the FRACTION that matters, so this
                                 gets refitted whenever EITHER the flight or
                                 the window moves. Measured, each time one of
                                 them did: at flight 990 leaving this at 0.30
                                 left 262ms of empty canvas at the end; at
                                 flight 620 leaving it at 0.42 left 447ms; and
                                 halving the window to 1000 while leaving it
                                 at 0.62 broke the ceiling outright.

                                 In real milliseconds it is now 240ms of
                                 flowers opening, a burst rather than the
                                 stream it was over the old 2000ms window, and
                                 there is no room left for more. A slower
                                 flight buys its time from here and nowhere
                                 else, so if you want the staggered issue back,
                                 the number to raise is BLOOM_MS.

                                 IT ALSO DRIVES THE DENSITY, which is the
                                 second-order effect and the one that catches
                                 you out in both directions, see BLOOMS.      */

  var BLOOM_TUMBLE = 3.40;    /* radians a flower turns on its OWN axis over
                                 its life. Signed per flower, so they do not
                                 all roll the same way. This is the cheapest
                                 line in the file for how much life it adds:
                                 without it they slide outward face-on and
                                 look pasted onto the screen.                 */

  var BLOOM_MIN    = 0.011;   /* half-size, as a fraction of the screen
                                 half-diagonal. Still bigger than the motes,
                                 and for the same reason: a spark can be a
                                 point of light, but a flower has to be large
                                 enough to show that it HAS petals or the whole
                                 shape in BLOOM_FRAG is wasted effort.

                                 THIS IS NOW NEAR THE FLOOR OF THAT. On a
                                 1440-wide screen the smallest of them is about
                                 19px across, which puts a single petal at
                                 roughly 6px, enough to read as a flower, not
                                 much more. Take these much lower and the rose
                                 curve stops resolving and they become coloured
                                 dots, at which point the motes already did
                                 this better.

                                 READ THESE AS END-OF-LIFE SIZES. A flower now
                                 scales from 0.0 to 1.0 across its whole life
                                 (see the two ramps in BLOOM_VERT), so it only
                                 reaches the number here as it leaves the
                                 frame, and is at half of it mid-flight. Raise
                                 both if the field reads too small.           */
  var BLOOM_MAX    = 0.027;

  var BLOOM_START  = 0.02;    /* how far from the centre they open. A little
                                 spread, so they do not all erupt from one
                                 pixel.                                       */
  var BLOOM_START_VARY = 0.16;

  var BLOOM_WIND   = [0.14, -0.09];
                              /* the prevailing wind, in half-diagonals, at
                                 the end of a flower's life. ONE DIRECTION
                                 FOR ALL OF THEM, that is what separates
                                 "swept away" from "exploded". It bites
                                 against life squared, so the opening still
                                 reads as radial and only the exit leans.
                                 Screen axes: +x right, +y DOWN, so this is
                                 up and to the right.                         */

  var BLOOM_EDGE   = 0.18;    /* softness of the petal rim                    */

  /* Straight from the site palette, and one of them could not be more on the
     nose: --gb-red (#cf5566) is the swatch README.md labels "flowers". The
     pale one is --gb-sand (#cfc8b8), which is the only place on the site that
     warm beige is welcome, against a deep green ground it reads as blossom
     rather than as the brown it turns into next to paper. Hearts are
     --gb-yellow (#cfdd3e). */
  var BLOOM_PETAL_A = [0.812, 0.333, 0.400];
  var BLOOM_PETAL_B = [0.812, 0.784, 0.722];
  var BLOOM_HEART   = [0.812, 0.867, 0.243];

  var BLOOM_LEAD_MS = 850;    /* how long BEFORE the swirls end the bloom
                                 opens. The same idea as REVEAL_LEAD_MS and
                                 for the same reason: a beat that starts
                                 exactly where another one stops reads as a
                                 cut. At 850 the bloom opens with getting on
                                 for half the swirl still to run, near enough
                                 the exact moment the LAST MOTE IS BORN, at
                                 1917ms. So the two layers overlap at full
                                 strength for a stretch rather than handing
                                 over: the vortex is still drawing sparks
                                 inward while it is already throwing flowers
                                 out. Pull it back toward 400 if that reads as
                                 too much happening at once.

                                 Unlike REVEAL_LEAD_MS this one has no ceiling
                                 to respect, the bloom's canvas is not inside
                                 the cover, so nothing about the fade can
                                 truncate it. Zero starts it on the frame the
                                 swirls end; negative leaves a gap of black
                                 between the two.                             */

  var BLOOM_SCALE  = 1.0;     /* backing store, as a fraction of CSS pixels.
                                 Full res, where the other two layers run at
                                 three-quarters. They are soft-edged and can
                                 afford it; a flower has a defined outline and
                                 shows every bit of the saving. It costs
                                 nothing here, 140 small quads is a rounding
                                 error next to 700 motes with tails.          */

  /* The flight, as a share of the window, which is the form the shader
     wants. Derived, so the two millisecond numbers above stay the only place
     the timing is stated. */
  var BLOOM_FLIGHT = BLOOM_FLIGHT_MS / BLOOM_MS;

  /* When the bloom opens, in ms from the start of the whole sequence. */
  var BLOOM_AT_MS  = Math.max(0, CLOSE_MS - BLOOM_LEAD_MS);

  /* --- machinery --------------------------------------------------------- */

  var RENDER_SCALE = 0.75;    /* backing store as a fraction of CSS pixels.
                                 The shapes are soft, so three-quarter
                                 resolution is invisible and costs a third of
                                 the fill.                                   */

  var SEED         = 20260825; /* fixed, so the effect is identical on every
                                  load and on the grader's machine           */

  /* If the sequence has not handed back by now, something is wrong, release
     the page anyway. DERIVED, not a literal: it has to stay clear of the
     moment it is guarding, and a hand-written number silently stops doing
     that the first time someone lengthens a beat above.

     It hangs off REVEAL_MS rather than off the end of the run, because
     REVEAL_MS is the moment it is a backstop FOR: the frame loop is supposed
     to hand back there, and the 800 is the slack it is allowed to be late
     by. */
  var FAILSAFE_MS  = REVEAL_MS + 800;

  /* =======================================================================
     SHADERS, petals
     ======================================================================= */

  var PETAL_VERT = [
    'attribute vec2 aLocal;',   /* -1..1 along the spine, -1..1 across       */
    'attribute vec2 aAnchor;',  /* rim point, in CSS pixels                  */
    'attribute vec2 aAxis;',    /* unit vector pointing inward               */
    'attribute vec2 aSize;',    /* (half-length, half-width) at full growth  */
    'attribute vec3 aStyle;',   /* (start delay, grey tone, curl radians)    */
    '',
    'uniform vec2  uRes;',
    'uniform float uT;',
    'uniform float uStagger;',
    'uniform float uCave;',     /* progress at which the cave-in completes   */
    '',
    'varying vec2  vLocal;',
    'varying float vTone;',
    '',
    'void main() {',

    /* Each petal starts when the sweep reaches its part of the rim, but
       every one of them FINISHES together, at uT = 1. The window is the
       remainder of the timeline, not a fixed slice of it.

       That distinction is the whole shape of the effect. Give each petal an
       equal-length window instead and the ones at the bottom reach full
       extension at 38% of the run, spearing clean across the frame and out
       the far side before the petals at the top have started: an explosion
       from below, not a ring closing. Ending them together makes the dark
       thicken inward from every edge at once and arrive at the centre on the
       last frame. */
    /* The whole cave-in is squeezed into the first uCave of the run, and the
       stagger is a fraction OF that rather than of the timeline, otherwise
       raising the stagger would push the last petal's start past the moment
       the cave-in is supposed to be finished. */
    '  float d     = aStyle.x * uStagger * uCave;',
    '  float local = clamp((uT - d) / max(uCave - d, 0.001), 0.0, 1.0);',
    '',

    /* Length eases out, a lunge, then a long settle. Width fills faster
       still, so the shape unfurls rather than merely scaling. */
    /* The feathers run their FULL reach inside the cave phase and are done.
       There is no second act for them, the swirling that follows belongs
       entirely to the mote layer, drawn on top of the black they leave. */
    '  float inv  = 1.0 - local;',
    '  float grow = 1.0 - inv * inv;',
    '  float wide = 1.0 - inv * inv * inv;',
    '',
    '  float len = aSize.x * grow;',
    '',

    /* --- the curl --------------------------------------------------------
       The spine is a circular arc rather than a straight line. Walking it by
       arclength t, the heading turns at a constant rate and the position is

           p(t) = anchor + (1/k) * [ N*(1 - cos kt) + A*sin kt ]

       for initial heading A, its left normal N, and curvature k. As k tends
       to zero this tends to anchor + A*t, the straight petal, which is why
       CURL = 0 still works.

       Written in terms of the total turn instead of the curvature, sweep =
       k*len, it stays well behaved as the petal grows, because sweep is
       what should be constant over the growth, not k. The guard below keeps
       the division alive at sweep = 0; at that magnitude the arc and the
       straight line agree to well under a pixel anyway.
       ------------------------------------------------------------------- */
    /* Constant per feather, and CURL is zero, so this reduces to a straight
       ellipse. The arc is kept live rather than stripped out, see the note
       on CURL in the knobs. */
    '  float sweep = aStyle.z;',
    '  if (abs(sweep) < 0.001) { sweep = 0.001; }',
    '',
    '  float phi = sweep * aLocal.x;',
    '  float cf  = cos(phi);',
    '  float sf  = sin(phi);',
    '',
    '  vec2 A = aAxis;',
    '  vec2 N = vec2(-A.y, A.x);',
    '',
    '  vec2 spine = aAnchor + (len / sweep) * (N * (1.0 - cf) + A * sf);',
    '',
    /* The heading at this point along the arc, and its normal. Offsetting the
       width along THIS rather than along the petal's original axis is what
       keeps the ellipse from shearing as the spine bends. */
    '  vec2 dir = A * cf + N * sf;',
    '  vec2 nrm = vec2(-dir.y, dir.x);',
    '',
    '  vec2 p = spine + nrm * (aSize.y * wide * aLocal.y);',
    '',
    '  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0,',
    '                     1.0 - p.y / uRes.y * 2.0,',
    '                     0.0, 1.0);',
    '',
    /* The mesh is bent; the parameter space is not. The fragment shader tests
       a circle in here, and it comes out as a curved petal on screen. */
    '  vLocal = aLocal;',
    '  vTone  = aStyle.y;',
    '}'
  ].join('\n');

  var PETAL_FRAG = [
    /* highp where the hardware has it, mediump where it does not. The macro
       is part of GLSL ES 1.0 and every WebGL implementation defines it. */
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    '',
    'uniform float uEdge;',
    '',
    'varying vec2  vLocal;',
    'varying float vTone;',
    '',
    'void main() {',
    '  float r = length(vLocal);',
    '  float a = 1.0 - smoothstep(1.0 - uEdge, 1.0, r);',
    '  if (a <= 0.002) { discard; }',
    /* Blend does the darkening. This only has to say how far toward the
       petal's own tone the pixel pulls the ground. White means leave it. */
    '  gl_FragColor = vec4(mix(vec3(1.0), vec3(vTone), a), a);',
    '}'
  ].join('\n');

  /* =======================================================================
     SHADERS, motes
     ======================================================================= */

  var MOTE_VERT = [
    'attribute vec2 aQuad;',    /* -1..1 corner of the sprite                */
    'attribute vec4 aSeed;',    /* (radius 0..1, angle, half-size px, birth) */
    'attribute vec3 aTone;',    /* (warm/cool mix, brightness, trail index)  */
    '',
    'uniform vec2  uRes;',
    'uniform float uT;',
    'uniform float uSpin;',
    'uniform float uDrift;',
    'uniform float uFrom;',
    'uniform float uSpread;',
    'uniform float uLag;',
    'uniform float uDecay;',
    'uniform float uWaist;',
    '',
    'varying vec2  vQuad;',
    'varying float vFade;',
    'varying vec2  vTone;',
    '',
    'const float PI = 3.14159265;',
    '',
    'void main() {',
    /* Nothing exists until the frame is black. Births are spread across the
       opening share of the MAGIC window, not across the whole run, so the
       swirls arrive as a drift rather than switching on together, and none
       of them can be caught peeking out from behind a feather that has not
       finished falling. */
    '  float born = uFrom + aSeed.w * uSpread * max(1.0 - uFrom, 0.001);',
    '',
    /* Every sample of a mote runs the same clock, just set back by its index.
       Because the position below is a pure function of life, winding the
       clock back IS walking back along the flight path, the tail cannot
       drift off the spiral, because it is the spiral. */
    '  float life = clamp((uT - born) / max(1.0 - born, 0.001)',
    '                     - aTone.z * uLag, 0.0, 1.0);',
    '',
    /* Polar, so the path is a spiral for free: the radius shrinks while the
       angle advances. Same sign as the petals' curl, which is what makes the
       two layers read as one piece of weather rather than two effects. */
    '  float r     = aSeed.x * (1.0 - life * uDrift);',
    '  float theta = aSeed.y + uSpin * life;',
    '',
    '  vec2  centre = uRes * 0.5;',
    '  float span   = length(uRes) * 0.5;',
    '  vec2  pos    = centre + vec2(cos(theta), sin(theta)) * (r * span);',
    '',
    /* Swell in, shrink out. sin over a half turn is 0 at both ends, so a
       mote is never popped into or out of existence at a visible size, and
       it is also what keeps an unborn tail sample invisible rather than
       parked at its starting radius. */
    '  float breath = sin(life * PI);',
    '',
    /* Brightness falls away down the tail; WIDTH VERY NEARLY DOES NOT. Fading
       and shrinking together is the obvious thing to write and it is wrong:
       each sample pulls away from its neighbour faster than it fades, and the
       tail comes out as a row of separate dots. Holding the width lets
       consecutive samples overlap into one streak. */
    '  float taper = pow(uDecay, aTone.z);',
    '  float girth = pow(uWaist, aTone.z);',
    '',
    '  pos += aQuad * (aSeed.z * girth * (0.35 + 0.65 * breath));',
    '',
    '  gl_Position = vec4(pos.x / uRes.x * 2.0 - 1.0,',
    '                     1.0 - pos.y / uRes.y * 2.0,',
    '                     0.0, 1.0);',
    '',
    '  vQuad = aQuad;',
    '  vFade = breath * taper;',
    '  vTone = aTone.xy;',
    '}'
  ].join('\n');

  var MOTE_FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    '',
    'uniform vec3  uWarm;',
    'uniform vec3  uCool;',
    'uniform float uGain;',
    '',
    'varying vec2  vQuad;',
    'varying float vFade;',
    'varying vec2  vTone;',
    '',
    'void main() {',
    '  float d = length(vQuad);',
    '  if (d >= 1.0) { discard; }',
    '',
    /* A tight core inside a narrow halo. The exponent is the whole difference
       between a spark and a smudge, at 2.6 the halo carries enough area to
       wash the frame flat once a few hundred of them overlap. The max() is
       not decoration: pow() of a negative base is undefined, and d can sit a
       hair above 1 on the corner samples. */
    '  float core = pow(max(0.0, 1.0 - d), 3.4);',
    '',
    '  vec3  col = mix(uCool, uWarm, vTone.x) * vTone.y * uGain;',
    '',
    /* Premultiplied colour at ZERO alpha: covers nothing, contributes light.
       See the note at the top of the file, this is what makes the layer
       composite additively over the petals without a blend mode of its own. */
    '  gl_FragColor = vec4(col * (core * vFade), 0.0);',
    '}'
  ].join('\n');

  /* =======================================================================
     SHADERS, the bloom
     ======================================================================= */

  var BLOOM_VERT = [
    'attribute vec2 aQuad;',    /* -1..1 corner of the sprite                */
    'attribute vec4 aSeed;',    /* (angle, start radius, half-size px, birth) */
    'attribute vec4 aTone;',    /* (colour mix, tumble, swirl vary, petals)  */
    'attribute vec2 aDrift;',   /* (flight multiplier, reach multiplier)     */
    '',
    'uniform vec2  uRes;',
    'uniform float uT;',
    'uniform float uSpread;',
    'uniform float uFlight;',
    'uniform float uReach;',
    'uniform float uAccel;',
    'uniform float uSwirl;',
    'uniform vec2  uWind;',
    '',
    'varying vec2  vQuad;',
    'varying float vFade;',
    'varying float vMix;',
    'varying float vPetals;',
    '',
    'void main() {',
    '  float born = aSeed.w * uSpread;',
    '',
    /* A FIXED flight, not "whatever is left of the window". The difference is
       the whole character of the movement: normalised against the remainder,
       every flower lands on the final frame no matter when it opened, so the
       field drifts to a halt in unison like a held chord. Given its own
       duration, each one crosses at its own pace and leaves when it is done,
       and the centre goes on issuing new ones behind it. */
    '  float flight = uFlight * aDrift.x;',
    '  float life   = clamp((uT - born) / max(flight, 0.001), 0.0, 1.0);',
    '',
    /* Outward, and accelerating. The exponent is the difference between being
       blown away and being conveyed away; see BLOOM_ACCEL. */
    '  float reach = uReach * aDrift.y;',
    '  float r     = aSeed.y + (reach - aSeed.y) * pow(life, uAccel);',
    '',
    /* The turn runs against sqrt(life), not life: most of it is spent while
       the flower is still near the middle, and it slackens as the radius
       opens up. Same sign as the motes' spin, so the two movements read as
       one weather system running forwards and then backwards. */
    '  float theta = aSeed.x + uSwirl * aTone.z * sqrt(life);',
    '',
    '  vec2  centre = uRes * 0.5;',
    '  float span   = length(uRes) * 0.5;',
    '  vec2  pos    = centre + vec2(cos(theta), sin(theta)) * (r * span);',
    '',
    /* The wind proper. Against life SQUARED, so it is nearly absent while the
       flower is opening and dominant by the time it leaves, the burst stays
       radial and only the exit leans downwind. */
    '  pos += uWind * (life * life) * span;',
    '',
    /* TWO RAMPS, because size and opacity no longer want the same curve.

       SIZE runs the WHOLE life: 0.0 at the centre, 1.0 as the wind takes it
       off the frame. A flower is therefore never finished opening while it is
       on screen, the outward spiral and the scale are one movement, and how
       big a flower is reads directly as how far along its arc it has got.
       This replaces a short ramp that reached full size at 16% of the life
       and held it there, which grew the flower and then merely conveyed it.

       OPACITY keeps that short ramp. Scale alone fades a flower in for free,
       but only geometrically: the first frames would be a full-brightness
       speck rather than something arriving. The 0.16 is the same guard
       against a pop it has always been.

       NOTE WHAT THIS COSTS. A flower is now at half size at mid-life, where
       it used to be at full size for everything after the first sixth. The
       field reads smaller overall. If you want the old apparent size back,
       raise BLOOM_MIN and BLOOM_MAX rather than shortening this ramp, the
       ramp is the effect. */
    '  float scale = life;',
    '  float grow  = smoothstep(0.0, 0.16, life);',
    '',
    /* Tumbling. The mesh turns; the parameter space does not, vQuad below is
       the UNROTATED corner, so the fragment shader still tests an upright
       flower and gets a rolling one on screen. Same trick as the petals. */
    '  float ang = aTone.y * life;',
    '  float ca  = cos(ang);',
    '  float sa  = sin(ang);',
    '  vec2  q   = vec2(aQuad.x * ca - aQuad.y * sa,',
    '                   aQuad.x * sa + aQuad.y * ca);',
    '',
    '  pos += q * (aSeed.z * scale);',
    '',
    '  gl_Position = vec4(pos.x / uRes.x * 2.0 - 1.0,',
    '                     1.0 - pos.y / uRes.y * 2.0,',
    '                     0.0, 1.0);',
    '',
    '  vQuad   = aQuad;',
    /* Most flowers are off the frame before this fade does anything, it is
       insurance for the ones travelling the diagonals, which have furthest to
       go before they are out of sight. */
    '  vFade   = grow * (1.0 - smoothstep(0.76, 1.0, life));',
    '  vMix    = aTone.x;',
    '  vPetals = aTone.w;',
    '}'
  ].join('\n');

  var BLOOM_FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    '',
    'uniform vec3  uPetalA;',
    'uniform vec3  uPetalB;',
    'uniform vec3  uHeart;',
    'uniform float uEdge;',
    '',
    'varying vec2  vQuad;',
    'varying float vFade;',
    'varying float vMix;',
    'varying float vPetals;',
    '',
    'void main() {',
    '  float r = length(vQuad);',
    '  if (r > 1.0) { discard; }',
    '',
    '  float a = atan(vQuad.y, vQuad.x);',
    '',
    /* A rose curve, and the reason for the halved angle: abs(cos(k*a/2)) has
       exactly k lobes over a full turn, so vPetals is a petal COUNT that can
       be read straight off the value instead of a number you have to halve or
       double in your head. The exponent fattens them, at 1.0 the lobes are
       thin spikes, at 0.55 they have shoulders and read as petals. */
    '  float rim = 0.40 + 0.60 * pow(abs(cos(a * vPetals * 0.5)), 0.55);',
    '',
    '  float alpha = 1.0 - smoothstep(rim - uEdge, rim, r);',
    '  if (alpha <= 0.004) { discard; }',
    '',
    /* atan() is undefined at the exact origin, which is why the heart is
       drawn from the RADIUS and not from the angle: at r = 0 the rim test
       above has already resolved to a solid 1.0 whatever the angle came out
       as, so nothing downstream can see the singularity. */
    '  float heart = 1.0 - smoothstep(0.06, 0.30, r);',
    '',
    '  vec3 col = mix(uPetalA, uPetalB, vMix);',
    '  col = mix(col, uHeart, heart * 0.85);',
    '',
    '  gl_FragColor = vec4(col, alpha * vFade);',
    '}'
  ].join('\n');

  /* =======================================================================
     STATE
     ======================================================================= */

  var cover  = document.getElementById('cover');
  var veil   = document.getElementById('cover-veil');

  var petal  = { canvas: document.getElementById('cover-fx'),
                 gl: null, program: null, buffer: null,
                 loc: {}, attr: {}, verts: 0, ok: false };

  var mote   = { canvas: document.getElementById('cover-motes'),
                 gl: null, program: null, buffer: null,
                 loc: {}, attr: {}, verts: 0, ok: false };

  var bloom  = { canvas: document.getElementById('cover-bloom'),
                 gl: null, program: null, buffer: null,
                 loc: {}, attr: {}, verts: 0, ok: false };

  var jitter  = null;        /* per-petal randoms, drawn once and kept       */
  var seeds   = null;        /* per-mote randoms, likewise                   */
  var petals  = null;        /* per-flower randoms, likewise                 */
  var ready   = false;
  var running = false;

  /* The bloom's own run flag. Separate from `running` because it outlives it:
     cover.js calls stop() while the flowers are still in the air. */
  var blooming = false;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =======================================================================
     RANDOMNESS, deterministic on purpose
     -----------------------------------------------------------------------
     A plain linear congruential generator. Math.random() cannot be seeded,
     and an effect that looks different on every load is one you cannot tune
     and cannot describe to anyone else.
     ======================================================================= */

  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* =======================================================================
     THE RIM
     -----------------------------------------------------------------------
     Petals are spaced by distance ALONG THE PERIMETER, not by angle from the
     centre. Equal angles bunch petals up on the long edges and starve the
     corners; equal arc length puts them an even number of pixels apart the
     whole way round, which is what makes the base read as one continuous
     bank of dark rather than a row of spokes.

     s = 0 is the bottom-left corner, and the walk runs along the bottom, up
     the right edge, across the top and down the left.
     ======================================================================= */

  function rimPoint(s, w, h) {
    var perim = 2 * (w + h);
    s = ((s % perim) + perim) % perim;

    if (s < w) { return { x: s, y: h, nx: 0, ny: 1 }; }
    s -= w;
    if (s < h) { return { x: w, y: h - s, nx: 1, ny: 0 }; }
    s -= h;
    if (s < w) { return { x: w - s, y: 0, nx: 0, ny: -1 }; }
    s -= w;
    return { x: 0, y: s, nx: -1, ny: 0 };
  }

  /* Drawn once at startup and reused for the life of the page, so a window
     resize re-measures the geometry without reshuffling which petal is long,
     which is pale, and which leans left. */
  function drawJitter() {
    var rnd = makeRng(SEED);
    var out = [];
    for (var i = 0; i < PETALS; i++) {
      out.push({
        reach: 1 + (rnd() * 2 - 1) * REACH_VARY,
        width: 1 + (rnd() * 2 - 1) * WIDTH_VARY,
        tilt:  (rnd() * 2 - 1) * TILT,
        tone:  TONE_LO + rnd() * (TONE_HI - TONE_LO),
        /* Magnitude only. The sign stays with CURL so every petal turns the
           same way and the frame reads as one rotation. */
        curl:  1 + (rnd() * 2 - 1) * CURL_VARY,
        slip:  rnd()                 /* softens the delay ladder            */
      });
    }
    return out;
  }

  function drawSeeds() {
    var rnd = makeRng(SEED ^ 0x5f3759df);
    var out = [];
    for (var i = 0; i < MOTES; i++) {
      out.push({
        /* Biased outward: the exponent pushes the distribution toward the
           rim, so the middle of the screen does not start out crowded. */
        radius: 0.18 + Math.pow(rnd(), 0.65) * 0.92,
        angle:  rnd() * Math.PI * 2,
        size:   MOTE_MIN + rnd() * (MOTE_MAX - MOTE_MIN),
        birth:  rnd(),
        mix:    rnd(),
        bright: 0.55 + rnd() * 0.45
      });
    }
    return out;
  }

  function drawPetalSeeds() {
    var rnd = makeRng(SEED ^ 0x9e3779b9);
    var out = [];
    for (var i = 0; i < BLOOMS; i++) {
      out.push({
        angle:  rnd() * Math.PI * 2,
        radius: BLOOM_START + rnd() * BLOOM_START_VARY,
        size:   BLOOM_MIN + rnd() * (BLOOM_MAX - BLOOM_MIN),
        birth:  rnd(),
        mix:    rnd(),
        /* Signed, unlike the swirl. Flowers tumbling all the same way looks
           mechanical in a way that flowers ORBITING all the same way does
           not, the orbit is the wind, the tumble is the flower. */
        tumble: (rnd() * 2 - 1) * BLOOM_TUMBLE,
        swirl:  1 + (rnd() * 2 - 1) * BLOOM_SWIRL_VARY,
        petals: (rnd() < 0.5) ? 5 : 6,
        /* Both multipliers, both centred on 1. The slow end of `flight` and
           the near end of `reach` together are the worst case the constraint
           at BLOOM_FLIGHT_MS is checked against. */
        flight: 1 + (rnd() * 2 - 1) * BLOOM_FLIGHT_VARY,
        reach:  1 + (rnd() * 2 - 1) * BLOOM_REACH_VARY
      });
    }
    return out;
  }

  /* =======================================================================
     GEOMETRY
     ======================================================================= */

  var PETAL_FLOATS = 11;
  var MOTE_FLOATS  = 9;

  /* Two triangles, as (x0..x1) x (-1..1). One slice of a petal. */
  function sliceCorners(x0, x1) {
    return [[x0, -1], [x1, -1], [x1, 1],
            [x0, -1], [x1,  1], [x0, 1]];
  }

  function buildPetals(w, h) {
    var perim   = 2 * (w + h);
    var step    = perim / PETALS;
    var start   = w * 0.5;                       /* bottom centre           */
    var ringMax = Math.ceil((PETALS - 1) / 2);

    var data = new Float32Array(PETALS * SEGMENTS * 6 * PETAL_FLOATS);
    var at   = 0;

    for (var i = 0; i < PETALS; i++) {
      var j = jitter[i];

      /* Petal 0 sits at the bottom centre; the rest alternate outward to
         either side of it, so the sweep is symmetrical and arrives at the
         top last, from both directions at once. */
      var ring = Math.ceil(i / 2);
      var side = (i % 2) ? 1 : -1;

      var pt = rimPoint(start + side * ring * step, w, h);

      /* Inward normal, leaned over by this petal's tilt. */
      var ang = Math.atan2(-pt.ny, -pt.nx) + j.tilt;
      var ax  = Math.cos(ang);
      var ay  = Math.sin(ang);

      /* Length is measured against THIS petal's own distance to the centre,
         not against the screen diagonal. On a wide screen a petal entering
         from the left has twice as far to travel as one entering from the
         bottom; one shared length makes the short ones overshoot the far
         edge while the long ones fall short. Scaled per petal, REACH means
         the same thing everywhere on the rim: 1.0 is "just touches the
         centre", and the small overshoot above that is what fills the middle
         in on the final frames. */
      var dx = pt.x - w * 0.5;
      var dy = pt.y - h * 0.5;
      var toCentre = Math.sqrt(dx * dx + dy * dy);

      var halfLen = toCentre * REACH * j.reach;
      var halfWid = halfLen * WIDTH * j.width;
      var curl    = CURL * j.curl;

      /* Distance from the bottom centre, normalised, is the start time. The
         slip is a small per-petal nudge so the ladder does not read as a
         mechanical sweep. */
      var delay = Math.pow(ring / Math.max(ringMax, 1), DELAY_CURVE);
      delay = Math.min(1, Math.max(0, delay + (j.slip - 0.5) * 0.08));

      for (var s = 0; s < SEGMENTS; s++) {
        var corners = sliceCorners(-1 + 2 * s / SEGMENTS,
                                   -1 + 2 * (s + 1) / SEGMENTS);
        for (var c = 0; c < 6; c++) {
          data[at++] = corners[c][0];
          data[at++] = corners[c][1];
          data[at++] = pt.x;
          data[at++] = pt.y;
          data[at++] = ax;
          data[at++] = ay;
          data[at++] = halfLen;
          data[at++] = halfWid;
          data[at++] = delay;
          data[at++] = j.tone;
          data[at++] = curl;
        }
      }
    }

    return data;
  }

  var MOTE_CORNERS = [[-1, -1], [1, -1], [1, 1],
                      [-1, -1], [1,  1], [-1, 1]];

  function buildMotes(w, h) {
    var span = Math.sqrt(w * w + h * h) * 0.5;

    var data = new Float32Array(MOTES * MOTE_TRAIL * 6 * MOTE_FLOATS);
    var at   = 0;

    for (var i = 0; i < MOTES; i++) {
      var m    = seeds[i];
      var size = m.size * span;      /* relative, so a phone is not pelted  */

      /* Sample 0 is the head. Every later one carries only its index; the
         shader turns that into a lag on the clock, and the position follows
         from there. Nothing about the path is stored twice. */
      for (var k = 0; k < MOTE_TRAIL; k++) {
        for (var c = 0; c < 6; c++) {
          data[at++] = MOTE_CORNERS[c][0];
          data[at++] = MOTE_CORNERS[c][1];
          data[at++] = m.radius;
          data[at++] = m.angle;
          data[at++] = size;
          data[at++] = m.birth;
          data[at++] = m.mix;
          data[at++] = m.bright;
          data[at++] = k;
        }
      }
    }

    return data;
  }

  var BLOOM_FLOATS = 12;

  function buildBlooms(w, h) {
    var span = Math.sqrt(w * w + h * h) * 0.5;

    var data = new Float32Array(BLOOMS * 6 * BLOOM_FLOATS);
    var at   = 0;

    for (var i = 0; i < BLOOMS; i++) {
      var f    = petals[i];
      var size = f.size * span;     /* relative, so a phone is not pelted    */

      /* No trail here, a flower is one quad. The six corners are the same
         six the motes use. */
      for (var c = 0; c < 6; c++) {
        data[at++] = MOTE_CORNERS[c][0];
        data[at++] = MOTE_CORNERS[c][1];
        data[at++] = f.angle;
        data[at++] = f.radius;
        data[at++] = size;
        data[at++] = f.birth;
        data[at++] = f.mix;
        data[at++] = f.tumble;
        data[at++] = f.swirl;
        data[at++] = f.petals;
        data[at++] = f.flight;
        data[at++] = f.reach;
      }
    }

    return data;
  }

  /* =======================================================================
     GL PLUMBING
     ======================================================================= */

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function link(gl, vertSrc, fragSrc) {
    var vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
    var fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) { return null; }

    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { return null; }
    return p;
  }

  function context(canvas, opts) {
    try {
      return canvas.getContext('webgl', opts) ||
             canvas.getContext('experimental-webgl', opts);
    } catch (e) {
      return null;
    }
  }

  function bind(gl, index, size, stride, offset) {
    if (index < 0) { return; }
    gl.enableVertexAttribArray(index);
    gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset);
  }

  /* A lost context mid-transition must not strand the reader on a frozen
     black screen. The sequence's failsafe timer finishes the job. */
  function guardLoss(layer, fatal) {
    layer.canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      layer.ok = false;
      if (fatal) { ready = false; }
    });
  }

  /* =======================================================================
     SETUP
     ======================================================================= */

  function initPetals() {
    var gl = context(petal.canvas, {
      alpha: true,
      /* Straight alpha, not premultiplied: the fragment shader's RGB is a
         multiply factor, which has nothing to do with its coverage. */
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false
    });
    if (!gl) { return false; }

    var p = link(gl, PETAL_VERT, PETAL_FRAG);
    if (!p) { return false; }

    petal.gl = gl;
    petal.program = p;
    gl.useProgram(p);

    petal.loc.res     = gl.getUniformLocation(p, 'uRes');
    petal.loc.t       = gl.getUniformLocation(p, 'uT');
    petal.loc.stagger = gl.getUniformLocation(p, 'uStagger');
    petal.loc.cave    = gl.getUniformLocation(p, 'uCave');
    petal.loc.edge    = gl.getUniformLocation(p, 'uEdge');

    petal.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, petal.buffer);

    var stride = PETAL_FLOATS * 4;
    bind(gl, gl.getAttribLocation(p, 'aLocal'),  2, stride, 0);
    bind(gl, gl.getAttribLocation(p, 'aAnchor'), 2, stride, 8);
    bind(gl, gl.getAttribLocation(p, 'aAxis'),   2, stride, 16);
    bind(gl, gl.getAttribLocation(p, 'aSize'),   2, stride, 24);
    bind(gl, gl.getAttribLocation(p, 'aStyle'),  3, stride, 32);

    /* Greys multiply into each other; silhouettes union. See the header. */
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(1, 1, 1, 0);      /* white is multiply's identity         */

    gl.uniform1f(petal.loc.stagger, STAGGER);
    gl.uniform1f(petal.loc.cave,  CAVE_END);
    gl.uniform1f(petal.loc.edge, EDGE);

    petal.verts = PETALS * SEGMENTS * 6;
    petal.ok = true;
    guardLoss(petal, true);
    return true;
  }

  function initMotes() {
    if (!mote.canvas) { return false; }

    var gl = context(mote.canvas, {
      alpha: true,
      /* Premultiplied, so that RGB above zero at alpha zero reads as light
         with no coverage, pure addition. See the header. */
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false
    });
    if (!gl) { return false; }

    var p = link(gl, MOTE_VERT, MOTE_FRAG);
    if (!p) { return false; }

    mote.gl = gl;
    mote.program = p;
    gl.useProgram(p);

    mote.loc.res   = gl.getUniformLocation(p, 'uRes');
    mote.loc.t     = gl.getUniformLocation(p, 'uT');
    mote.loc.spin  = gl.getUniformLocation(p, 'uSpin');
    mote.loc.drift = gl.getUniformLocation(p, 'uDrift');
    mote.loc.from   = gl.getUniformLocation(p, 'uFrom');
    mote.loc.spread = gl.getUniformLocation(p, 'uSpread');
    mote.loc.lag   = gl.getUniformLocation(p, 'uLag');
    mote.loc.decay = gl.getUniformLocation(p, 'uDecay');
    mote.loc.waist = gl.getUniformLocation(p, 'uWaist');
    mote.loc.warm  = gl.getUniformLocation(p, 'uWarm');
    mote.loc.cool  = gl.getUniformLocation(p, 'uCool');
    mote.loc.gain  = gl.getUniformLocation(p, 'uGain');

    mote.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mote.buffer);

    var stride = MOTE_FLOATS * 4;
    bind(gl, gl.getAttribLocation(p, 'aQuad'), 2, stride, 0);
    bind(gl, gl.getAttribLocation(p, 'aSeed'), 4, stride, 8);
    bind(gl, gl.getAttribLocation(p, 'aTone'), 3, stride, 24);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);   /* light accumulates                    */
    gl.clearColor(0, 0, 0, 0);      /* black is addition's identity         */

    gl.uniform1f(mote.loc.spin,  MOTE_SPIN);
    gl.uniform1f(mote.loc.drift, MOTE_DRIFT);
    gl.uniform1f(mote.loc.from,   CAVE_END);
    gl.uniform1f(mote.loc.spread, MOTE_SPREAD);
    gl.uniform1f(mote.loc.lag,   MOTE_LAG);
    gl.uniform1f(mote.loc.decay, MOTE_DECAY);
    gl.uniform1f(mote.loc.waist, MOTE_WAIST);
    gl.uniform1f(mote.loc.gain,  MOTE_GAIN);
    gl.uniform3f(mote.loc.warm, MOTE_WARM[0], MOTE_WARM[1], MOTE_WARM[2]);
    gl.uniform3f(mote.loc.cool, MOTE_COOL[0], MOTE_COOL[1], MOTE_COOL[2]);

    mote.verts = MOTES * MOTE_TRAIL * 6;
    mote.ok = true;
    guardLoss(mote, false);
    return true;
  }

  function initBloom() {
    if (!bloom.canvas) { return false; }

    var gl = context(bloom.canvas, {
      alpha: true,
      /* Straight alpha and ordinary source-over blending, the only layer
         here that wants neither of the blend tricks. These are opaque objects
         over an unknown, lit ground rather than light on a known black one. */
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false
    });
    if (!gl) { return false; }

    var p = link(gl, BLOOM_VERT, BLOOM_FRAG);
    if (!p) { return false; }

    bloom.gl = gl;
    bloom.program = p;
    gl.useProgram(p);

    bloom.loc.res    = gl.getUniformLocation(p, 'uRes');
    bloom.loc.t      = gl.getUniformLocation(p, 'uT');
    bloom.loc.spread = gl.getUniformLocation(p, 'uSpread');
    bloom.loc.flight = gl.getUniformLocation(p, 'uFlight');
    bloom.loc.reach  = gl.getUniformLocation(p, 'uReach');
    bloom.loc.accel  = gl.getUniformLocation(p, 'uAccel');
    bloom.loc.swirl  = gl.getUniformLocation(p, 'uSwirl');
    bloom.loc.wind   = gl.getUniformLocation(p, 'uWind');
    bloom.loc.edge   = gl.getUniformLocation(p, 'uEdge');
    bloom.loc.petalA = gl.getUniformLocation(p, 'uPetalA');
    bloom.loc.petalB = gl.getUniformLocation(p, 'uPetalB');
    bloom.loc.heart  = gl.getUniformLocation(p, 'uHeart');

    bloom.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bloom.buffer);

    var stride = BLOOM_FLOATS * 4;
    bind(gl, gl.getAttribLocation(p, 'aQuad'), 2, stride, 0);
    bind(gl, gl.getAttribLocation(p, 'aSeed'), 4, stride, 8);
    bind(gl, gl.getAttribLocation(p, 'aTone'), 4, stride, 24);
    bind(gl, gl.getAttribLocation(p, 'aDrift'), 2, stride, 40);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    gl.uniform1f(bloom.loc.spread, BLOOM_SPREAD);
    gl.uniform1f(bloom.loc.flight, BLOOM_FLIGHT);
    gl.uniform1f(bloom.loc.reach,  BLOOM_REACH);
    gl.uniform1f(bloom.loc.accel,  BLOOM_ACCEL);
    gl.uniform1f(bloom.loc.swirl,  BLOOM_SWIRL);
    gl.uniform2f(bloom.loc.wind,   BLOOM_WIND[0], BLOOM_WIND[1]);
    gl.uniform1f(bloom.loc.edge,   BLOOM_EDGE);
    gl.uniform3f(bloom.loc.petalA, BLOOM_PETAL_A[0], BLOOM_PETAL_A[1], BLOOM_PETAL_A[2]);
    gl.uniform3f(bloom.loc.petalB, BLOOM_PETAL_B[0], BLOOM_PETAL_B[1], BLOOM_PETAL_B[2]);
    gl.uniform3f(bloom.loc.heart,  BLOOM_HEART[0], BLOOM_HEART[1], BLOOM_HEART[2]);

    bloom.verts = BLOOMS * 6;
    bloom.ok = true;
    guardLoss(bloom, false);
    return true;
  }

  function init() {
    if (!cover || !veil || !petal.canvas) { return false; }

    /* Arrived at index.html#toc from a story page. The cover is display:none
       and will never be dismissed, so there is nothing to animate, and every
       trip back from a story would otherwise pay for a GL context and shader
       compiles that can only ever be thrown away. Same guard, and the same
       reasoning, as the one at the top of js/cover.js. */
    if (document.documentElement.classList.contains('deep-link')) { return false; }

    if (reduceMotion) { return false; }
    if (!window.WebGLRenderingContext) { return false; }

    jitter = drawJitter();
    seeds  = drawSeeds();
    petals = drawPetalSeeds();

    /* The petals are the transition. Without them there is nothing to show
       and cover.js should take the plain fade. */
    if (!initPetals()) { return false; }

    /* The motes are a garnish. If only they fail, the close still happens,
       so this return value is deliberately ignored. */
    initMotes();

    /* And so is the bloom, twice over: it fails soft on its own, and it plays
       after the page is already revealed, so losing it costs the reader a
       flourish over content they can already read. Ignored for the same
       reason. */
    initBloom();

    ready = true;
    return true;
  }

  /* Backing store follows the viewport. Capped at RENDER_SCALE of CSS pixels
     and never above 1:1, a retina-density buffer buys nothing for shapes
     this soft and costs four times the fill. */
  function resize() {
    if (!ready) { return; }

    var w = cover.clientWidth  || window.innerWidth;
    var h = cover.clientHeight || window.innerHeight;

    var dpr   = Math.min(window.devicePixelRatio || 1, 1);
    var scale = RENDER_SCALE * dpr;
    var pw = Math.max(1, Math.round(w * scale));
    var ph = Math.max(1, Math.round(h * scale));

    if (petal.ok) {
      petal.canvas.width  = pw;
      petal.canvas.height = ph;
      petal.gl.viewport(0, 0, pw, ph);
      petal.gl.useProgram(petal.program);
      petal.gl.uniform2f(petal.loc.res, w, h);   /* shader works in CSS px  */
      petal.gl.bindBuffer(petal.gl.ARRAY_BUFFER, petal.buffer);
      petal.gl.bufferData(petal.gl.ARRAY_BUFFER, buildPetals(w, h),
                          petal.gl.STATIC_DRAW);
    }

    if (mote.ok) {
      mote.canvas.width  = pw;
      mote.canvas.height = ph;
      mote.gl.viewport(0, 0, pw, ph);
      mote.gl.useProgram(mote.program);
      mote.gl.uniform2f(mote.loc.res, w, h);
      mote.gl.bindBuffer(mote.gl.ARRAY_BUFFER, mote.buffer);
      mote.gl.bufferData(mote.gl.ARRAY_BUFFER, buildMotes(w, h),
                         mote.gl.STATIC_DRAW);
    }
  }

  /* Where the black floor starts and finishes coming up. It is solid from the
     handover onward, so the swirls play on a genuinely black frame. */
  var VEIL_FROM = CAVE_END * VEIL_AT;

  function veilAt(t) {
    return Math.min(1, Math.max(0,
      (t - VEIL_FROM) / Math.max(CAVE_END - VEIL_FROM, 0.001)));
  }

  function draw(t, veiled) {
    if (!ready) { return; }

    /* Once the veil is solid the feathers are behind an opaque black layer
       and nothing they draw can reach the screen, so the whole first pass is
       skipped for the entire second movement. Leaving stale pixels in that
       buffer is safe precisely because it is covered, and if the compositor
       clears it anyway, that is equally invisible. */
    if (petal.ok && veiled < 1) {
      var pg = petal.gl;
      pg.clear(pg.COLOR_BUFFER_BIT);
      pg.uniform1f(petal.loc.t, t);
      pg.drawArrays(pg.TRIANGLES, 0, petal.verts);
    }

    if (mote.ok) {
      var mg = mote.gl;
      mg.clear(mg.COLOR_BUFFER_BIT);
      mg.uniform1f(mote.loc.t, t);
      mg.drawArrays(mg.TRIANGLES, 0, mote.verts);
    }
  }

  /* =======================================================================
     THE BLOOM'S OWN LIFE
     -----------------------------------------------------------------------
     Everything below is deliberately independent of the sequence above. The
     bloom starts when the swirls end and runs on past the point where
     js/cover.js tears the cover down, so it cannot share `running`, cannot
     share the sequence's resize handling, and must not be caught by stop().

     It measures the VIEWPORT rather than the cover, because by the time a
     resize could arrive the cover is `hidden` and its clientWidth is 0.
     ======================================================================= */

  function resizeBloom() {
    if (!bloom.ok) { return; }

    var w = window.innerWidth;
    var h = window.innerHeight;

    var dpr   = Math.min(window.devicePixelRatio || 1, 1);
    var scale = BLOOM_SCALE * dpr;

    bloom.canvas.width  = Math.max(1, Math.round(w * scale));
    bloom.canvas.height = Math.max(1, Math.round(h * scale));

    var g = bloom.gl;
    g.viewport(0, 0, bloom.canvas.width, bloom.canvas.height);
    g.useProgram(bloom.program);
    g.uniform2f(bloom.loc.res, w, h);
    g.bindBuffer(g.ARRAY_BUFFER, bloom.buffer);
    g.bufferData(g.ARRAY_BUFFER, buildBlooms(w, h), g.STATIC_DRAW);
  }

  function playBloom() {
    if (!bloom.ok || blooming) { return; }

    blooming = true;

    /* Unhidden only now. It is a fixed, full-viewport canvas, and there is no
       reason for it to exist over the page for the two and three-quarter
       seconds before it has anything to draw. */
    bloom.canvas.hidden = false;

    resizeBloom();
    window.addEventListener('resize', resizeBloom);

    /* Belt and braces, in the same spirit as the sequence's failsafe and for
       exactly the same reason: rAF does not fire in a background tab. A
       reader who switches away mid-bloom must not come back to a frozen field
       of flowers pinned over the introduction. */
    window.setTimeout(stopBloom, BLOOM_MS + 900);

    var began = null;

    function step(now) {
      if (!blooming) { return; }

      /* A context lost mid-flight would leave every call below a silent
         no-op and the canvas sitting empty over the page until the clock ran
         out. Fold immediately instead: stopBloom() hides it and tidies up,
         and it is already written to skip loseContext() on a context that
         has gone by itself. */
      if (!bloom.ok) { stopBloom(); return; }

      if (began === null) { began = now; }

      var t = Math.min(1, (now - began) / BLOOM_MS);

      var g = bloom.gl;
      g.clear(g.COLOR_BUFFER_BIT);
      g.uniform1f(bloom.loc.t, t);
      g.drawArrays(g.TRIANGLES, 0, bloom.verts);

      if (t < 1) {
        window.requestAnimationFrame(step);
        return;
      }

      stopBloom();
    }

    window.requestAnimationFrame(step);
  }

  /* Called by the bloom itself, from whichever of its two endings arrives
     first. Never called by cover.js, see stop(). */
  function stopBloom() {
    if (!blooming) { return; }
    blooming = false;

    window.removeEventListener('resize', resizeBloom);

    if (bloom.canvas) { bloom.canvas.hidden = true; }

    if (bloom.gl && bloom.ok) {
      var ext = bloom.gl.getExtension('WEBGL_lose_context');
      if (ext) { ext.loseContext(); }
    }
    bloom.ok = false;
  }

  /* =======================================================================
     THE SEQUENCE
     -----------------------------------------------------------------------
     play(onClosed) runs the close, then calls onClosed ONCE, at REVEAL_MS,
     which is now BEFORE the last frame rather than after it. js/cover.js does
     its unlocking there and fades the whole cover away over what it finds
     underneath, while this loop carries on drawing the swirls behind the
     fade.

     HANDING BACK EARLY IS SAFE, for the one reason the split existed in the
     first place. Everything expensive in release(), the scroll unlock, the
     reflow, the re-measuring, happens on the frame the fade STARTS, and on
     that frame the cover is still fully opaque. The reader does not watch a
     column of marquee cards resize; they watch a finished layout come up
     through the black a moment later.

     onClosed fires exactly once whatever happens: normally from the frame
     loop, and otherwise from the failsafe.
     ======================================================================= */

  function play(onClosed) {
    var handedBack = false;

    function handBack() {
      if (handedBack) { return; }
      handedBack = true;

      /* Drop the resize listener BEFORE releasing, not after. Nothing from
         here on should be able to provoke a buffer rebuild in the middle of
         the fade: at 700 motes that is a 2.6MB upload plus a frame's worth of
         array-building, spent on geometry nobody can see behind a cover that
         is already on its way out.

         Releasing the scroll lock used to do exactly that, by making the page
         scrollbar appear and changing the viewport width. The site now hides
         the scrollbar everywhere (css/base.css), so that particular trigger is
         gone, but a reader who resizes the window or rotates a phone
         mid-dissolve is not, and the listener has no work left worth doing in
         either case. */
      window.removeEventListener('resize', resize);

      if (typeof onClosed === 'function') { onClosed(); }
    }

    /* Belt and braces. A lost context, a tab backgrounded so rAF never fires
       again, a driver that hangs, none of them may leave the reader
       scroll-locked behind a black screen. */
    window.setTimeout(handBack, FAILSAFE_MS);

    if (!ready) { handBack(); return; }

    resize();
    window.addEventListener('resize', resize);

    running = true;
    var began = null;

    function hold() {
      if (!running) { return; }
      draw(1, 1);
      window.requestAnimationFrame(hold);
    }

    function frame(now) {
      if (began === null) { began = now; }

      var elapsed = now - began;
      var t = Math.min(1, elapsed / CLOSE_MS);
      var v = veilAt(t);

      draw(t, v);
      veil.style.opacity = v;

      /* THE OVERLAP. The reveal starts here, with the swirls still turning,
         and they go on turning over the introduction as it comes up. Tested
         every frame rather than scheduled, because a setTimeout laid down at
         the start of the run drifts against a clock that is being read from
         rAF; handBack() is idempotent, so the cost of asking again is a
         comparison. */
      if (elapsed >= REVEAL_MS) { handBack(); }

      /* The bloom opens before this loop is finished, among the last motes.
         Same idempotent-and-tested-every-frame arrangement as the reveal
         above, and for the same reason. */
      if (elapsed >= BLOOM_AT_MS) { playBloom(); }

      if (t < 1) {
        window.requestAnimationFrame(frame);
        return;
      }

      /* The swirls are done. If REVEAL_LEAD_MS was set negative the reveal is
         still ahead of us, the old beat of held black, then the fade. At any
         positive lead this has already fired and the call is a no-op. */
      window.setTimeout(handBack, Math.max(0, REVEAL_MS - CLOSE_MS));

      /* Only reached if BLOOM_LEAD_MS was set to zero or negative, which
         puts the bloom's start at or after the end of this loop. At any
         positive lead the test above has already fired and this is a no-op.
         Same shape as the reveal's leftover timeout directly above. */
      window.setTimeout(playBloom, Math.max(0, BLOOM_AT_MS - CLOSE_MS));

      /* Keep painting the finished frame through the reveal. The drawing
         buffer is cleared after every composite unless preserveDrawingBuffer
         is on, and turning that on is the more expensive of the two ways to
         stop the last frame vanishing mid-fade. */
      hold();
    }

    window.requestAnimationFrame(frame);
  }

  /* Called by js/cover.js once the cover has finished fading and is hidden.
     It tears down the two layers that live INSIDE the cover, and DELIBERATELY
     LEAVES THE BLOOM ALONE, the flowers are still in the air when this runs,
     roughly a second and a half from landing, and they are not in the cover,
     so hiding it has nothing to do with them. The bloom tears itself down;
     see stopBloom(). */
  function stop() {
    running = false;
    window.removeEventListener('resize', resize);

    [petal, mote].forEach(function (layer) {
      if (layer.gl && layer.ok) {
        var ext = layer.gl.getExtension('WEBGL_lose_context');
        if (ext) { ext.loseContext(); }
      }
      layer.ok = false;
    });

    ready = false;
  }

  /* =======================================================================
     PUBLIC FACE
     ======================================================================= */

  var ok = false;
  try {
    ok = init();
  } catch (e) {
    ok = false;
  }

  window.GB_COVER_FX = {
    available: function () { return ok && ready; },
    play: play,
    stop: stop
  };

})();
