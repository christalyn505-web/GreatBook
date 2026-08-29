# GREAT BOOK, the layout, in plain words

What every screen of this website looks like, what sits where, and which file
owns it.

`README.md` describes **what the project is**. This document
describes **what it looks like**. When those disagree with the running site,
the running site is right and this file needs updating, say so rather than
quietly building to a stale description.

---

## How to ask for a layout change

The most useful description names three things: **where in the stack**, **what
it contains**, and **what it does when the reader interacts with it**. A
sketch is an excellent way to produce the first two. It is bad at the third,
and worse at the four things below, so say those in words:

- **What happens when it gets narrower.** Every layout here is fluid. "Four
  cards across" needs a companion answer for a phone.
- **What happens when the content is missing.** Half this project's assets are
  not in yet, and every block already has a defined empty state. A new block
  needs one too.
- **What is fixed and what scrolls.** Several backgrounds here are pinned
  while their content moves over them. That distinction is invisible in a
  still image.
- **Which existing thing it replaces or sits between.** "A panel above the
  marquee" is unambiguous; "a panel in the table of contents" is not.

Colour and exact spacing are the two things worth *not* specifying, they come
from the shared tokens below, and inventing new values is how a site stops
looking like one site.

---

## The map

Five interfaces live in **three** HTML files.

```
index.html      ┌ 1. Cover                fixed overlay; button or scroll down
                ├ 2. Introduction         five panels over a parallax backdrop
                └ 3. Table of Contents    looping vertical strip + plain list

story-NN.html     4. Story                one per tale, generated ×6

closing.html      5. Closing              closing message + contributor credits
```

Every page ends with the same dark footer.

The cover, introduction, and table of contents are **one continuous scroll**.
That is deliberate: arriving at `index.html#toc`, which is where every story
page's back link points, skips the cover and lands on the list without
replaying the opening.

---

## Shared design language

Everything comes from tokens at the top of `css/base.css`. Use these; do not
introduce new colours.

**Palette, Ghibli landscape: lake blue, sunlit green, pale sky**

Seven source colours sampled from the reference landscape, and a semantic layer
on top of them. The full swatch table and the reasoning live in `README.md` →
"The palette"; this is the working summary.

| Token | Value | Used for |
|---|---|---|
| `--ink` | `#1a2e22` | deep forest; cover, story and closing grounds |
| `--ink-soft` | `#2e4a38` | raised surfaces on dark |
| `--paper` | `#e6f0e7` | pastel mint; the table of contents ground |
| `--paper-soft` | `#f8fbf7` | near-white; the story-list card |
| `--paper-sky` | `#dfeaf2` | pastel sky; list row hover |
| `--footer-bg` | `#3f566c` | the footer, and nothing else |
| `--accent` | `#7ca83c` | small labels and eyebrows |
| `--accent-bright` | `#c3d64a` | links and live states on dark grounds |
| `--accent-deep` | `#3f6b2e` | buttons and links on light grounds |
| `--water` | `#3b819d` | gradients, cool edges, link hover |
| `--water-soft` | `#6b8bad` | haze in the gradients |
| `--alert` | `#cf5566` | the unfinished / not-linked-yet state |
| `--text` | `#1f2c24` | body text on the pale ground |
| `--text-muted` | `#5a6a5e` | secondary text on the pale ground |
| `--text-on-dark` | `#ecf0e4` | body text on a dark ground |

The seven raw palette colours are `--gb-blue`, `--gb-green`, `--gb-green-gray`,
`--gb-sand`, `--gb-blue-gray`, `--gb-red`, `--gb-yellow`. **Do not use them
directly in a rule**, they are the vocabulary the semantic tokens above are
built from, kept separate so a colour can be retuned in one place.

Contrast is directional and the three accent roles exist because of it:
`--accent` reads well on the dark ground (5.2:1) and badly on the pale one
(2.4:1). Small green text on a light background wants `--accent-deep`.

The light surfaces are tints of green and blue, never of `--gb-sand`, that one
is a warm beige and reads brown beside the forest grounds. The table of contents
ground carries the tint and the card sits near-white on top of it, which is what
makes the card read as raised.

For anything translucent, use the `--*-rgb` triples,
`rgba(var(--ink-rgb), 0.86)`, never a hand-mixed `rgba(26, 46, 34, 0.86)`.

The three big gradient backdrops, cover, intro, closing, are all built the
same way now: lake blue high on the left, haze to the right, a field-green glow
low down, over a deep forest base.

**Type**, serif for reading (Georgia stack, `--serif`), sans for interface
chrome (system UI stack, `--sans`). No downloaded fonts: a webfont is another
file that can fail to load from a zip.

The recurring chrome pattern is the **eyebrow**: small, bold, uppercase,
heavily letterspaced, green. It labels almost every section on the site.

**Rhythm**, `--measure` (34rem) is the comfortable reading width.
`--gutter` is the fluid page margin. `--radius` is 3px, deliberately almost
square. `--ease` is the shared easing curve.

**Column widths in use**, story text 46rem · cover 46rem · closing 48rem ·
table-of-contents head, index and footer 62rem · credits 56rem.

Nearly every size on this site is a `clamp()`, so there are few hard
breakpoints. Things resize continuously rather than snapping.

---

## 1, Cover

**Owned by** `index.html` (`#cover`) · `css/cover.css` · `js/cover.js` ·
`js/cover-fx.js`

A fixed full-viewport overlay above everything else, `z-index: 100`. It is not
part of the document flow, and while it is up the page behind it is
scroll-locked.

```
┌────────────────────────────────────────────────┐
│                                                │
│                                                │
│              FILIPINO FOLK TALES               │  eyebrow, green
│                                                │
│               GREAT BOOK                       │  huge, near-white
│                                                │
│           Stories we were handed down          │  subtitle
│        Pambayang Dalubhasaan ng Marilao        │  school
│                                                │
│              ┌──────────────────┐              │
│              │  Open the Book   │              │  yellow-green
│              └──────────────────┘              │
│                                                │
│             or scroll to continue              │  faint hint
│                                                │
└────────────────────────────────────────────────┘
        forest ground, sky-blue and field-green glow, CSS only
```

Everything is centred in a 46rem column. The resting background is pure CSS
gradient, no image, no video. The **exit** is a WebGL shader; see "Leaving the
cover" below.

**Behaviour.** Exactly two things advance it: the button, and a deliberate
scroll **down**, wheel with a positive deltaY, one of the keys that scroll
down (Down, PageDown, End, Space), or a real upward swipe on touch. Everything
else is ignored on purpose: letters, Escape, Tab, arrow-up, a wheel upward, and
a click on the background all leave the cover where it is.

An earlier version advanced on any input at all, reasoning that a cover which
traps someone is the worst outcome. The result was worse, a stray keypress
threw the reader past the cover before they had read a word of it, with no way
back short of reloading.

**Leaving the cover, the raven veil.** Dismissal does not fade the cover out.
It plays **two movements**, one after the other. They do not overlap, and the
handover between them is a full blackout.

**1, the cave-in** (900 ms). Long grey ellipses drive inward from the rim of
the frame. They are **straight, the feathers do not turn.** They start at the
bottom centre and unfurl around both sides until they meet at the top. Where
they overlap they multiply into one another, so the mass banked against the
edges reads near-black while the leading tips stay a pale raven grey. A black
veil rises behind them over the tail of this movement and reaches solid exactly
on the handover. Measured at that instant: **100% black, nothing lit, peak
brightness zero.**

**The title neither moves nor fades while this happens.** It stays lit and
fully placed, and the feathers close over it, `.cover__inner` is `z-index: 1`,
below both canvases and the veil, so it is painted *over* rather than clipped.
It used to fade itself out in 520 ms, which emptied the centre of the screen
just before the most dramatic part of the movement arrived there. Being buried
is the point; the shader already does it.

**2, the swirls** (1850 ms). On that black, and not one frame before it,
several hundred small warm lights appear and wind toward the centre, each
drawing a long curved streak behind it. They **add** light rather than
covering anything, which is why the veil sits *under* them, the black is the
stage they play on, not a curtain over them.

**3, the reveal** (1500 ms), and it begins **while movement 2 is still
running.** Six hundred milliseconds into the swirls, about a third of the way
through them, the cover starts to fade, and the remaining two thirds of the
movement play over an introduction that is already coming up underneath. The
close is no longer "black, then page". It is a long dissolve with the sparks
still turning inside it.

**The reveal cannot start earlier than the fade is long.** Both shader canvases
are children of `.cover`, so the moment its opacity reaches 0 the swirls go
with it, wherever they happen to be in their arc. `REVEAL_LEAD_MS` is therefore
capped by the CSS transition duration, to start earlier than that, the fade
has to lengthen too. Three numbers in three files have to agree about this
handover; they are set out under "The knobs" below.

**4, the bloom** (1000 ms). The swirls wound everything inward; this throws
it all back out. Flowers open at the centre and are swept outward along
unwinding spirals, tumbling end over end, until the wind carries them off the
edges of the frame. **They open from nothing and never stop opening**, a
flower's scale runs 0.0 to 1.0 across its whole life, so it is still growing
as it leaves the frame and its size reads as how far along its arc it is. It
used to reach full size in the first sixth of its life and merely travel after
that. The trade is that the field reads smaller overall; `BLOOM_MIN/MAX` are
where you buy that back. It opens 850 ms **before** the swirls are over, getting
on for half of that movement still to run, and near enough the exact moment the
last mote is born, so the two layers run at full strength together rather than
handing over: the vortex is still drawing sparks inward while it is already
throwing flowers out. The rest of it plays over the
introduction, which by then is there and already scrollable.

**It runs on two clocks, and that is the thing to understand before retuning
it.** `BLOOM_MS` (1000 ms) is how long the *movement* lasts. `BLOOM_FLIGHT_MS`
(715 ms) is how long *one flower* takes to cross the frame. Stating the second
in milliseconds rather than as a fraction is what makes "half the duration,
same speed" a one-number edit. They used to be
the same number, each flower's life was normalised over whatever remained of
the window, so every one of them landed together on the final frame and the
field drifted to a halt in unison, like a held chord. Splitting them is what
lets flowers still be opening at the centre while the first ones are already
gone, and it is what makes "a longer movement" and "a faster flight" possible
at the same time instead of being opposite requests.

There are two rules between them, and they squeeze from opposite ends.
**Births plus flight have to fit inside the window**, or the last flower born
is deleted in mid-air when the canvas is hidden. But `BLOOM_SPREAD` also has to
be wide enough to *fill* the window, a quick flight under a narrow spread
means every flower has come and gone before the movement is over, and the tail
of it is a blank canvas sitting over the page waiting to be hidden. Nothing
errors; there is simply nothing to see. So the birth spread rises whenever the
flight gets quicker, and the two are retuned together.

**The test that binds is the off-screen one, not the finishing one**, and on a
window this short the two disagree. A flower passes the screen corner at about
86% of its life, because `BLOOM_REACH` overshoots on purpose, so the real rule
is `spread + 0.86 × flight × slowest-vary ≤ 1.0`. At these values the strict
"every flower finishes" form comes to 1.06 and fails, while the real test comes
to 0.95 and passes with about 54 ms to spare. The slowest last-born flowers are
genuinely cut off before completing, off screen, where it costs nothing. Use
the strict form when you want them all to finish cleanly; use the real one when
the window is tight. Leaving the spread at 0.62 when the window was halved
would have put the real test at 1.23: flowers cut off in mid-air, a fifth of a
flight short of the edge.

**And a third rule, which is the one that catches you out.** `BLOOMS` is how
many flowers are *issued*, not how many are on screen. The number in the air at
the peak is roughly `BLOOMS × min(flight, spread) / spread`, and **which
branch of that `min()` you are on is set by the window, and it flips.**

Against the old 2000 ms window the flight was 0.31 and the spread 0.62, so half
the field had left before the other half opened and 350 issued put about 175 in
the air. Halving the window doubled the flight fraction to 0.62 and forced the
spread down to 0.28, which lands on the other branch: every flower issued is
still flying when the last one opens, so all 350 are on screen together. **The
constant did not change and the density doubled anyway.** Halve `BLOOMS` to 175
to put the sky back to what the longer window showed.

It runs the other way too, shortening the flight from 990 ms to 620 ms under
the old window, without touching anything else, took the peak from 175 down to
88. Read the formula, not the constant.

**The bloom is not inside `.cover`, and cannot be.** Its canvas is a sibling of
the cover in `index.html`, fixed, at `z-index: 101`. By the time it starts, the
cover is 94% faded and a quarter of a second from being `hidden`, so anything
parented to it would be carried off by the fade rather than by the wind. It
owns its own clock, its own resize handling and its own teardown, `stop()` in
`cover-fx.js` deliberately does not touch it. It never takes a click: the page
underneath is unlocked and scrollable by then, and a full-viewport canvas that
swallowed input would be a trap.

It is also the only layer drawn with ordinary source-over alpha. The petals
multiply and the motes add, and both of those depend on knowing what is
underneath them. The flowers do not, they play over whatever gradient the
introduction happens to be showing, and additive light does not register on a
lit page.

All of it is drawn by WebGL shaders in `js/cover-fx.js`, across **three**
canvases, none of which is a stylistic choice, see "The knobs" below.

```
     ── 1. THE CAVE-IN ─────────────┤├── 2. THE SWIRLS ─────────────
   t = 0.16            t = 0.29      ││  t = 0.42        t = 0.75
┌──────────────┐    ┌──────────────┐ ││ ┌────────────┐ ┌────────────┐
│              │    │██        ███ │ ││ │            │ │      ✦～   │
│      ·       │    │███      ████ │ ││ │    ～✦      │ │  ～✦   ～✦ │
│    GREAT     │    │████    █████ │ ││ │            │ │ ✦～    ～   │
│    BOOK      │    │█████  ██████ │ ││ │       ～✦   │ │    ～✦  ✦～│
│  █        █  │    │████████████  │ ││ │  ✦～        │ │ ～✦   ～✦  │
│ ███      ███ │    │██████████████│ ││ │            │ │   ～✦      │
└──────────────┘    └──────────────┘ ││ └────────────┘ └────────────┘
  in from the rim    almost shut     ││  lights appear  the page is
  17% black          89% black       ││  on 100% black  already rising
                                     ││                 behind them
                  t = 0.327  ─────────┘└─────── the handover
                  ┌──────────────┐
                  │██████████████│   100% black · nothing lit
                  │██████████████│   peak brightness 0
                  └──────────────┘
```

Note where the t labels sit now. The cave-in is unchanged in every respect,
same petals, same veil ramp, same frames, but it is a **smaller share of a
longer run**, so the handover moved from t = 0.514 to t = 0.327. The two
percentages above are the same measured frames, re-labelled.

And the four beats against the clock, with the overlaps drawn out:

```
   0 ms     900        1500  1900      2750 2900 3000
    ├────────┼──────────┼─────┼─────────┼────┼────┤
    │ 1.CAVE │ 2. SWIRLS ░░░░░░░░░░░░░░ │    │    │
    │ 900 ms │  1850 ms │     │         │    │    │
    │        │          │▓ 3. REVEAL ▓▓▓▓▓▓▓▓▓▓▓▓▓│
    │        │          │     │ 1500 ms │    │    │
    │        │          │     │ ✿ 4. BLOOM, 1000 ms
    └────────┴──────────┴─────┴─────────┴────┴────┘
                        │     │         │    │
           the fade opens,    │         │  flowers gone
           1250 ms of swirl   │         │
           still to run       │      swirls end
                     the bloom opens, the last
                     mote is born at 1917 ms
```

Note where the bloom now sits. It used to run on for a second past the reveal.
It now opens before the swirl is finished and lands *before the fade has*, so
**the flowers play out entirely over the closing dark**, they never touch the
fully revealed page. They appear against a screen still more than half black,
and the introduction is still arriving underneath as the last of them leave.
To get the old flowers-over-the-page reading back, reduce `BLOOM_LEAD_MS` so
the whole movement starts later.

Every boundary in that picture is a lead rather than a cut, the reveal opens
1250 ms before the swirls finish, the bloom 450 ms before them. Nothing in this
sequence begins exactly where the thing before it stopped, which is most of why
it reads as one movement rather than four.

The whole thing is about 3.1 seconds, effectively all of it spent getting to
the page, the bloom now lands just *before* the reveal completes rather than
trailing a second behind it. Nothing waits on the bloom. If any of
it runs long for you, the movement lengths are plain millisecond knobs at the
top of the file, but read the note beside `REVEAL_LEAD_MS` before you move the
fade, because that one does not move alone.

**The dismissal is two steps, and the split matters.** `dismiss()` stops
listening and starts the exit; `release()` unlocks the scroll, re-measures the
parallax and the marquee, and moves focus. `release()` does not run until the
screen is black, which it still is at that moment, because the veil is solid
and the cover has not begun to fade. Unlocking restores the document's real
height, and everything measured against a locked page has to look again; doing
that in front of the reader is a visible jolt, and doing it behind the black is
free.

Unlocking used to make the page scrollbar appear as well, narrowing every
column and shortening every marquee panel. The site now hides the scrollbar
site-wide, so that particular reflow no longer happens and the marquee
re-measures in `release()` are belt and braces rather than load-bearing. They
are kept; the reasoning is in `css/base.css`.

**It degrades to the old crossfade, silently.** No WebGL, a driver that will
not compile the shaders, a lost context, or `prefers-reduced-motion` and
`cover-fx.js` is simply absent; `cover.js` then unlocks immediately and the
cover fades exactly as it always did. The glow layer is optional *on top of
that*, kill only its context and the petals carry on without it (tested by
forcing the loss: the effect stays available and the petals still ink 70% of
the frame). The bloom is optional on top of *that*, and is the cheapest of the
three to lose: it plays after the reveal, so losing it costs the reader a
flourish over a page they are already reading. Its canvas stays `hidden` and
nothing else changes.

A failsafe timer guarantees the page is released even if the animation never
finishes, so there is no path where the reader is left scroll-locked behind a
black screen. This is not theoretical: `requestAnimationFrame` does not fire in
a background tab, so a reader who clicks and immediately switches away hits it
every time. Tested, in a hidden tab, with not one frame drawn, the page still
unlocked and the document height was restored.

**It never appears on a deep link.** An inline script in `index.html`'s
`<head>` checks for a URL fragment *before the first frame is painted*. With
one present, the cover is `display: none` from the start and the lock is never
applied.

**The knobs.** `css/cover.css` builds the resting ground in `.cover__bg`.
Everything about the exit is tuned from the block of named constants at the top
of `js/cover-fx.js`, nothing below that block needs touching to change how it
looks. The ones worth knowing:

| Knob | Now | What it does |
|---|---|---|
| `PETALS` | 46 | how many ellipses ring the frame |
| `CAVE_MS` | 900 | **movement 1**, how long the feathers take to close the frame |
| `MAGIC_MS` | 1850 | **movement 2**, how long the swirls play, on black |
| `REVEAL_LEAD_MS` | 1250 | **movement 3**, how far *before* the swirls end the cover starts fading. **Capped by the fade duration**; see the coupling note below |
| `VEIL_AT` | 0.68 | where in the cave phase the black starts rising. It reaches solid *at the handover*, which is what makes the blackout total |
| `WIDTH` | 0.150 | **the elongation**, half-width as a fraction of length; ~7:1. Raise it and the petals become blunt lozenges |
| `CURL` | **0** | radians a feather's spine bends. **Zero by design, the feathers cave straight in.** The arc machinery is kept, tested and live; raise it to bend them as they come |
| `REACH` | 1.18 | length, as a multiple of that petal's own distance to the centre. Below 1.0 they never meet |
| `STAGGER` | 0.62 | how much of the run is spent fanning around the rim |
| `TONE_LO/HI` | 0.15 / 0.46 | the band of greys |
| `TILT` | 0.30 | radians of lean off the inward normal. At 0 they are bicycle spokes |
| `MOTES` | 700 | how many lights. The first knob to turn down if the close ever stutters, buffer size and fill both scale straight off it |
| `MOTE_SPIN` | 3.10 | radians each sweeps around the centre. **The arc it sweeps IS the swirl**, at the 1.35 this used when the layer was only a garnish, the streaks came out near enough straight. It is a **total turn, not a rate**, so it has to rise whenever `MAGIC_MS` does or the same arc just plays slower |
| `MOTE_DRIFT` | 0.62 | how far inward each travels. **Negative blooms them outward instead**, the other reading of this beat, free to try |
| `MOTE_SPREAD` | 0.55 | share of the magic window over which they are born, so they arrive as a drift rather than switching on together. Widened with the window, so sparks are still being lit as the reveal begins |
| `MOTE_MIN/MAX` | 0.004 / 0.013 | light size, as a fraction of the screen half-diagonal |
| `MOTE_TRAIL` | 18 | samples per streak. **Raise this for a longer tail, not `MOTE_LAG`** |
| `MOTE_GAIN` | 1.00 | master brightness. Additive on black, so it clips past ~1.4. Trimmed from 1.10 when the population went up, for headroom against two cores landing on each other |
| `BLOOM_MS` | 1000 | **movement 4**, how long the whole movement lasts. The only number to move for a shorter or longer bloom at unchanged speed, but refit `BLOOM_SPREAD` after, since this is the denominator under the flight |
| `BLOOM_FLIGHT_MS` | 715 | how long **one flower** takes to cross the frame. About 72% of the window, that gap is what keeps the centre issuing flowers long after the first ones have gone. **Births plus flight must fit inside `BLOOM_MS`** |
| `BLOOM_SPREAD` | 0.24 | share of the window over which flowers open, 240 ms, a burst rather than a stream, with no room left for more. A slower flight buys its time from here and nowhere else; raise `BLOOM_MS` to get the stagger back. Squeezed from both ends: capped by the rule above, but also **has a floor**, too narrow against a quick flight and the movement ends on an empty canvas. Raise it whenever the flight gets faster |
| `BLOOM_LEAD_MS` | 850 | how far **before** the swirls end the bloom opens, nearly half the swirl still to run, so the two layers overlap at full strength instead of handing over. Unlike `REVEAL_LEAD_MS` this has no ceiling: the bloom's canvas is outside the cover, so no fade can truncate it |
| `BLOOMS` | 225 | how many flowers are **issued**. At the current 1000 ms window that is also how many are on screen at the peak; at the old 2000 ms one it was about half. The gap flips with the window, read the formula above, not this number |
| `BLOOM_ACCEL` | 1.6 | exponent on the outward travel. **Above 1 is the whole feeling**, they dawdle near the centre and tear away at the rim. At 1.0 they slide out at constant speed and read as a screensaver |
| `BLOOM_SWIRL` | 2.20 | radians of orbit over a flower's life, applied against `sqrt(life)` so the turn is fast near the middle and slackens on the way out |
| `BLOOM_TUMBLE` | 3.40 | radians each turns on its **own** axis. Signed per flower. The cheapest line in the file for how much it adds, without it they slide outward face-on and look pasted on |
| `BLOOM_REACH` | 1.45 | how far out they travel, in half-diagonals. **The screen corner is exactly 1.0**, so anything at or below that strands flowers on screen |
| `BLOOM_WIND` | `[0.14, -0.09]` | the prevailing wind. **One direction for all of them**, that is what separates "swept away" from "exploded". Bites against `life²`, so the burst stays radial and only the exit leans |
| `BLOOM_MIN/MAX` | 0.011 / 0.027 | flower size **at the end of its life**, as a fraction of the half-diagonal, a flower scales from 0.0 to 1.0 across its whole flight, so it is at half of this mid-air. Bigger than the motes: a spark can be a point, a flower has to show it has petals. **Near the floor of that**, the smallest is ~19px across, a petal ~6px; much lower and the rose curve stops resolving and they are just dots |

**Three numbers, three files, one handover.** Because the reveal now overlaps
the swirls, the timing is spread across files that cannot see one another, and
two of the three relationships between them are hard rules rather than taste:

| Number | File | Now | Rule |
|---|---|---|---|
| `REVEAL_LEAD_MS` | `js/cover-fx.js` | 1250 | how early the fade starts, **must not exceed the fade** |
| `transition: opacity` on `.cover` | `css/cover.css` | 1500 ms | how long the fade runs |
| the teardown `setTimeout` | `js/cover.js` | 1560 ms | **must outlast the fade** |

Overshoot the first and the swirls are cut off mid-arc when the cover hits
opacity 0. Undershoot the third and the cover is set `hidden` partway through
its own dissolve. Raise the fade and both neighbours want raising with it. The
arithmetic is written out in full beside `REVEAL_LEAD_MS`.

**The reveal is also the one transition on the site that does not use
`--ease`.** `--ease` is a hard ease-out, it clears half the black in the first
fifth of its run, which was fine when this fade was a curtain call with nothing
behind it. With the swirls playing over it, that would throw the reader onto a
fully lit page while the sparks were still building, and additive light does
not read on a bright ground. The reveal gets a symmetric curve instead, whose
midpoint is exactly (0.5, 0.5): it opens slowly, so the black holds while the
swirls come up to strength, and half the duration really is half the black.

Five of these were found by measuring rather than by taste, and every one of
them will look wrong if it is reset casually:

- **`REACH` is measured per petal, against its own distance to the centre**,
  not against the screen diagonal. On a wide screen a petal entering from the
  left has nearly twice as far to travel as one from the bottom, so one shared
  length makes the short ones spear out the far side.
- **Every feather finishes at the same moment**, and only its *start* is
  staggered. Give them equal-length windows instead and the bottom ones reach
  full extension a third of the way in and cross the whole frame before the top
  ones have started, an explosion from below, not a ring closing.
- **The veil goes UNDER the swirls, not over them.** This is the easiest thing
  in the whole effect to get backwards, and it fails loudly: the black covers
  the lights and the second movement simply never appears. It still has to sit
  *above* the feathers, though, a floor beneath them cannot finish the job,
  because they are grey and paint on top of it, so the frame stalls around
  three-quarters black no matter how long it runs.
- **The sparks are small and their falloff is steep.** The first version was
  three times the size with a gentler curve and it read as fog: at that scale
  the halos overlap into an even wash that lifts the whole frame and flattens
  the petals out behind it. Sparks want to be points with light around them.
- **A comet tail fades but does not narrow.** Shrinking each sample as it dims
  is the obvious thing to write and it is wrong, the samples pull apart faster
  than they fade and the tail comes out as a row of beads. `MOTE_WAIST` is 0.97
  for that reason. `MOTE_LAG` has the same trap: its step has to land *inside*
  the spark, and at 0.035 it was a 22px step against a 10px spark. It is now
  0.0075, eased down from 0.009 when `MOTE_SPIN` went up, the step is the lag
  times the speed along the path, so a faster sweep lengthens it for free and
  the smallest sparks have the least room to give.

**Why three canvases.** Two of them for a blend reason and the third for a
lifetime one. Taking the blend pair first: the petals blend by MULTIPLYING,
which needs a white ground; the motes blend by ADDING, which needs a black
one. No single clear
colour is the identity for both, so sharing a buffer gives every spark a pale
halo where its soft edge picks up the white the petals need. Rendering each to
its own framebuffer and compositing in a third pass would also work and is what
you would reach for at four or five layers, for two it is a lot of machinery
and two more things to break on an unfamiliar driver. The glow canvas
composites additively for free by writing colour at *zero alpha* into a
premultiplied context; the reasoning is in the header of `js/cover-fx.js`.

The third canvas, the bloom, is separate for a different reason again, and
it is the more absolute of the two. It is not about blending but about
**outliving the cover**: it is still drawing a second and a half after
`.cover` has been hidden and its two canvases have had their contexts dropped.
It could not be a child of an element that no longer exists. Its blend mode
being ordinary source-over follows from where it plays rather than the other
way round.

---

## 2, Introduction

**Owned by** `index.html` (`#intro`) · `css/intro.css` · `js/scroll.js`

Five full-height panels scrolling over a backdrop that moves slower than they
do. The section is **five viewport-heights tall**, set by `--intro-screens` in
`css/intro.css`, not by how much text the panels happen to contain.

```
                 backdrop: sticky, travels at 0.35× reader speed
              ╔═══════════════════════════════════════════╗
              ║ ┌─────────────────────┐                   ║
   scroll     ║ │ INTRODUCTION        │                   ║   panel 1  left
     │        ║ │ A book of stories   │                   ║
     │        ║ │ we inherited.       │                   ║
     │        ║ │ ¶ …                 │                   ║
     │        ║ │ Scroll ↓            │                   ║
     │        ║ └─────────────────────┘                   ║
     │        ║                   ┌─────────────────────┐ ║
     │        ║                   │     01, THE COLL…  │ ║   panel 2  right
     ▼        ║                   │  Fables and legends │ ║
              ║                   │  from the Phil…     │ ║
              ║                   └─────────────────────┘ ║
              ║ ┌─────────────────────┐                   ║   panel 3  left
              ║ │ 02, THE ILLUSTRA…  │                   ║
              ╚═══════════════════════════════════════════╝
```

The five panels, in order: **Introduction** (what the book is) ·
**01 The Collection** · **02 The Illustrations** · **03 The Narration** ·
**04 The Quiz**.

Each panel is an eyebrow, a short headline capped at 14 characters per line,
and one paragraph capped at 46 characters per line. Panels alternate
left-aligned and right-aligned so the eye travels instead of tracking a rail.
The first panel carries a "Scroll" cue; the others do not.

**Behaviour.** Panels fade up as they enter the viewport
(`IntersectionObserver` → `.is-visible`). The backdrop is `position: sticky`,
not `fixed`, sticky is bounded by its parent, which is exactly how the
background stops existing at the table of contents with no cleanup code.

**The knobs.** `--intro-screens` in `css/intro.css` controls how much scrolling
the section takes. `PARALLAX_RATE` at the top of `js/scroll.js` (currently
`0.35`) controls how much slower the backdrop moves; lower is more dramatic,
`0` would pin it completely.

**Do not hardcode the backdrop height.** `js/scroll.js` computes it from the
section length and the rate so it can never run out of travel mid-section. The
`165vh` in `css/intro.css` is only the no-JS fallback.

---

## 3, Table of Contents

**Owned by** `index.html` (`#toc`) · `css/toc.css` · `js/toc.js`

The pale ground starts here, and it starts **abruptly**, `.toc` is
opaque and sits above the intro backdrop, so the dark section simply stops.
That hard edge is intended, not an oversight.

Two columns: the story list on the left, the looping strip running down the
right and bleeding off the page edge.

```
┌───────────────────────────┬──────────────────────────┐  pale ground
┌───────────────────────────┬──────────────────────────┐
│  TABLE OF CONTENTS        │ ┌──────────────────────┐ │
│  The Stories              │ │   illustration       │ │    ▲
│  Pick a story from the…   │ │ ░░░░░░░░░░░░░░░░░░░░ │ │    │
│                           │ │ 01  The Turtle and…  │ │    │
│  ┌─────────────────────┐  │ └──────────────────────┘ │    │
│  │ 01 The Turtle…  G1  │  │ ┌──────────────────────┐ │  drifts
│  │ 02 The Pineapple G2 │  │ │   illustration       │ │  upward,
│  │ 03 The Ant…     G3  │  │ │ ░░░░░░░░░░░░░░░░░░░░ │ │  forever
│  │ 04 Sampaguita   G4  │  │ │ 02  The Legend of…   │ │    │
│  │ 05 A Festival…  G5  │  │ └──────────────────────┘ │    │
│  └─────────────────────┘  │ ┌──────────────────────┐ │    │
│                           │ │   illustration       │ │    │
│                           │ │ ░░░░░░░░░░░░░░░░░░░░ │ │    │
│  [ Read the Closing… → ]  │ │ 03  The Ant and…     │ │    │
│                           │ └──────────────────────┘ │
└───────────────────────────┴──────────────────────────┘
                              no scrollbar · no top · no bottom
```

**The marquee is vertical and it never ends.** Each panel is an illustration
with the title and group on a translucent dark bar across the bottom fifth of
it, and a yellow-green story-number badge in the top-left corner. It drifts
slowly upward on its own.

**How the loop works, because you will break it otherwise.** `js/toc.js`
renders the six stories **three times over**, eighteen panels, and parks the
scroll position inside the middle copy. When the drift carries you off the end
of that copy, the script moves the scroll position back by exactly one
copy-height, which lands on a visually identical panel. Scrolling up does the
same thing in reverse. There is therefore no edge to hit in either direction.

Three copies rather than two, and starting in the middle rather than at zero,
is what keeps that stable. It is not belt-and-braces: with two copies starting
at zero the two wrap tests fire alternately and fight each other, which is
exactly how this was broken before.

The repeat distance is measured **between two matching panels**, never as
`scrollHeight / 3`, eighteen panels have seventeen gaps, so the division is
short by a fraction of a gap and the loop creeps out of alignment.

**The scrollbar is hidden on purpose.** An endless loop has no meaningful
position to report; the thumb would only twitch.

**Behaviour.** The drift stops dead while the mouse is over the strip and
resumes on leave. It also pauses on keyboard focus inside the strip, while
dragging, when the strip scrolls out of view, when the tab is hidden, and
entirely under `prefers-reduced-motion`. The strip is a native
`overflow-y: auto` scroller underneath, so wheel, touch and keyboard scrolling
all come from the browser; auto-drift and mouse drag-to-scrub are layered on
top.

**One consequence to know about:** while the cursor is over the strip, the
wheel scrolls the strip rather than the page, and since the loop has no end it
never hands scrolling back. The story list beside it is the way out, and the
table of contents is the last section before the footer, so there is little
page left to be trapped out of. On narrow screens the layout stacks and the
strip is capped at 55vh so there is always page above and below it.

**The address bar follows the reader.** Once the table of contents climbs past
the middle of the screen the URL becomes `index.html#toc`, and it drops back to
`index.html` when the section falls below the middle again. The point is what
happens next time: the pre-paint script reads that fragment and skips the cover,
so someone who scrolled down and then reloaded, bookmarked or shared the page
lands back on the story list instead of watching the opening again. It uses
`replaceState`, so no history entries pile up, verified at zero across seven
crossings. Lives in `js/scroll.js`.

**The plain list is not decoration.** It is a second, independent route to
every story, and it is what survives if every line of JavaScript fails. Do not
remove it to save space.

**Both lists are built from `window.STORIES` in `stories.js`.** Adding a story
to the manifest adds it to both automatically.

**A card shows the group's COVER, not the story page's illustration.** They
are two different pictures. The cover is the one with the story's title painted
into it; the illustration is the story's first page. `js/toc.js` reads
`story.cover` and falls back to `story.illustration` for a group that never
made a title card. **Every story now has one**, so nothing falls back today;
the fallback is kept because it is what a half-finished group looks like.

That changes what a bad crop costs here. On the story page a crop would lose
scenery; on a card it beheads a word.

**The knobs.** `--card-ratio` on `.marquee` in `css/toc.css` is the shape of
one panel, `7 / 5`, chosen to sit inside the 1.20 / 1.42 / 1.45 cluster the
three real covers actually are. The image is `object-fit: cover`, so any
mismatch is a centre crop, and the bottom 20% of the card is under the title
bar. `--card-gap` is the spacing.
`SPEED` at the top of the loop section in `js/toc.js` is the drift rate, and
`COPIES` is how many times the list repeats (must stay odd and at least 3).

## 4, Story

**Owned by** `tools/templates/story.html` · `css/story.css` · `js/story.js`

⚠️ **Generated.** Edit the template, then rebuild. Editing `story-01.html`
directly loses the work on the next build.

The whole page sits on the story's own illustration, blurred to 26px and
dimmed, fixed behind everything, with a vertical gradient darkening toward the
bottom. Text sits in a 46rem column.

```
┌──────────────────────────────────────────────────────┐
│  ← BACK TO TABLE OF CONTENTS                         │  returns to #toc
│                                                      │
│                     STORY 01                         │  eyebrow, green
│              The Turtle and the Monkey               │  title
│              Ang Pagong at ang Matsing               │  Filipino name
│      The story reflects the Filipino value of…       │  subtitle, optional,
│                                                      │  capped at 34rem
│         (◕) written by  NAME  │  GROUP 1             │  byline row
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │        the group's FRONT image                 │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│              Illustrated by NAME                     │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ ┌────┐  GREAT BOOK · STORY 01                  │  │
│  │ │ art│  The Turtle and the Monkey              │  │  narration
│  │ │    │  (▶) ────────●─────────  01:12 │ 06:37  │  │  player
│  │ └────┘  ↺15  1x  ↻15  🔊                       │  │
│  │            Narrated by NAME                    │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Ⓘn a quiet village beside a river, a turtle and     │  drop cap on ¶1
│  a monkey were walking together when they…           │
│                                                      │  4 paragraphs, or as
│  ┌────────────────────────────────────────────────┐  │  many as the story's
│  │        the group's next storyboard panel       │  │  paragraphLimit says
│  └────────────────────────────────────────────────┘  │
│                                                      │  a panel, then the
│  The monkey climbed to the highest branch and…       │  words for it, all
│                                                      │  the way down
│  ▌ MORAL OF THE STORY                                │  green left border
│  ▌ Deceit bears no sweet fruit…                      │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  CHECK WHAT YOU REMEMBER                       │  │  the quiz panel,
│  │  Question 2 of 5                               │  │  played in place
│  │  ▬▬▬▬▬▬▬▬▬▬▬▬░░░░░░░░░░░░░░░░░░░░░░░░░         │  │
│  │                                                │  │
│  │  Who is Bago's mother?                         │  │  display type
│  │                                                │  │
│  │  ⓐ  Nanay Maya                                 │  │  four buttons,
│  │  ⓑ  Nanay Tala                                 │  │  full width
│  │  ⓒ  Nanay Luna                                 │  │
│  │  ⓓ  Nanay Rosa                                 │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ← SOMEDAY, LITTLE…  CLOSING MESSAGE  THE PHILIPP… → │
└──────────────────────────────────────────────────────┘
```

…and at the end of the quiz, in the same frame:

```
┌──────────────────────────────────────────────────────┐
│  RESULT                                              │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬            │
│                                                      │
│           4 out of 5                                 │  the figure is the
│    Very good. You know this tale well.               │  loudest thing here
│                                                      │
│  ▌✅ 1. Who is the main character of the story?      │  green left border
│  ▌   Your answer: Bago                               │
│  ▌❌ 2. Who is Bago's mother?                        │  red left border
│  ▌   Your answer: Nanay Maya                         │
│  ▌   Correct answer: Nanay Tala                      │
│                                                      │
│              [ Try the quiz again ]                  │
└──────────────────────────────────────────────────────┘
```

The order, back link, title with group, illustration with illustrator, audio
with narrator, body, moral, quiz, is fixed by the assignment brief. Do not
rearrange it.

**The panels are the group's own flow.** Every hand-in is a picture book: a
drawing, then the words for that drawing, over and over. Their storyboards run
to seven, eight, nine panels.

Story 01 prints that flow with **twelve drawings across seven blocks of
text**. Seven blocks needs seven paragraphs where the brief allows four, so the
story sets `paragraphLimit` in `stories.js` and **every build warns about it**.
The warning is meant to stay, it is the brief's rule being deliberately traded
for the group's layout, and if the brief turns out to be strict, merging the
blocks back and deleting the field is the whole of the fix.

A story that does *not* raise its limit still shows every panel; the panels
just sit between merged paragraphs rather than pairing with them one-to-one,
next to the sentences they illustrate.

**The groups do not agree on which comes first.** Groups 1, 2 and 4 draw a
picture and then write the words for it; group 3 writes the words and then
draws the picture. On the page this is invisible, every body is a run of
`<p>` and `.story__panel` alternating, but it decides which text a given
drawing sits against, so follow the group's own document rather than the
neighbouring story.

**A group's front image is not necessarily a scene.** Group 3 drew two title
cards and both are in use: one on the marquee, one as the story's front image
above the narration player. Story 03 therefore opens on lettering under an
`<h1>` that already prints the same title, and its body carries all nine
panels from `03-s1.jpg`. Pointing `illustration` at `03-s1.jpg` and dropping
that panel from the body is a one-line change if the duplicate title reads
badly, it costs a drawing the group made deliberately, which is why it has
not been made for them.

The first panel is not in the body. It is the story's `illustration`, printed
above the narration player with the illustrator's credit, and that position is
fixed by the brief. So the body list starts at the group's *second* panel.
Reading down the page you get panel 1, the player, then text and pictures
alternating to the moral.

They are the same width as the opening illustration and carry a softer shadow,
so the picture above the player still reads as the story's front and these read
as the story continuing. Full width, no crop, unlike a marquee card, nothing
here has a fixed ratio to fight, so whatever shape the group drew is the shape
that shows.

**The byline row** carries two brief requirements in one line: the writer's
credit and the group name. The round avatar is currently a circular crop of
the story's own illustration, because the project has no photographs of the
members. Swapping in real photos is one `background-image` per story.

**Two narration players live in the template and the build keeps one.** A
story with an `audio` gets the custom transport drawn above; a story with a
`video` gets a plain `<video controls>` with the story's cover as its poster,
and no transport at all. Story 03 is the video one, because group 3 recorded
an animated retelling rather than a voice track. The frame reserves its space
with `aspect-ratio` so the moral below it does not jump when the metadata
lands.

**The moral has its own block** on purpose. The brief asks for the lesson to be
easy to determine, and buried in the prose it gives a grader nothing to point
at.

**The quiz is played on the page.** It used to be one big link out to a Google
Form. It is now a scored, one-question-at-a-time quiz that runs from the file
itself, no internet, no Google account, no permission wall between the grader
and a required part of the brief.

The plan's "in big letters" now attaches to the *question*, which is the header
the four choices answer, so the display type never left the panel, it moved
one level down.

How it behaves:

| Moment | What happens |
|---|---|
| A choice is pressed | it lights up in the accent colour, neutral, **not** green or red |
| ~320ms later | the next question replaces it, and focus moves to the new heading |
| After the last one | the score, then every question with ✅ or ❌ and the right answer wherever it was missed |
| "Try the quiz again" | back to question one, answers cleared |

**Nothing is marked right or wrong until the end.** Telling a reader they were
wrong on question 2 changes how they read questions 3 to 5, and this is a
reading-comprehension exercise, not a game show. The pressed state is
deliberately neutral for the same reason.

**The review list never uses colour alone.** Every row carries a ✅ or ❌ *and*
a coloured left border, because roughly one boy in twelve cannot separate that
green from that red. The tick and cross are `aria-hidden`; the word "Correct"
or "Incorrect" is in the row for screen readers.

**Where the questions live.** In the page, as plain markup, baked in by
`build-pages.ps1`, not in a data file. That markup *is* the no-JS fallback:
with scripting off you get a readable printed quiz, all five questions and all
their choices, instead of an empty box. `js/quiz.js` reads it back out of the
DOM and swaps in the interactive version. One copy of the questions, so the
two can never disagree.

The consequence is that **the answers are visible in View Source.** A static
site has nowhere else to put them. That is not fixable without a server, which
this project deliberately does not have, and it is an acceptable trade for a
quiz that has to work off a USB stick.

**The narration player** is custom: play/pause, back and forward 15 seconds, a
speed cycle, mute, and a draggable seek bar. The `<audio>` element underneath
is still the engine; the custom controls only replace its face. The seek bar is
a real `<input type="range">`, so keyboard seeking and touch dragging come from
the browser.

It has three states, and all three happen in normal use right now:

| State | What the reader gets |
|---|---|
| `js/story.js` ran | the custom transport |
| script blocked, or it threw | the browser's own `<audio controls>` |
| the mp3 is missing | "not recorded yet", instead of a dead control |

The swap to the custom face happens *last*, once every control is wired. A
half-wired transport is worse than the native one, so it can never replace it.

**The prev / closing / next row never wraps.** It used to, and that was fine
only for as long as the titles were short placeholders. The real ones,
*Someday, Little Carabao Will Know* and *The Philippine Eagle and the Right
Wind*, want about 830px of uppercase between them in a 736px column, so the
third link dropped onto a second line under a border that then read as a gap
in the page.

Now the two outer links split whatever the middle one leaves and their titles
ellipsis out. Three CSS declarations hold that together and all three are
load-bearing: `flex-wrap: nowrap`, `flex: 1 1 0` on prev and next, and
**`min-width: 0`**, the one that is easy to leave out and without which the
other two do nothing, because a flex item defaults to `min-width: auto`
meaning "never shrink below my content".

**The arrows are separate elements from the titles**, emitted that way by
`build-pages.ps1`. Inside the same text run, the ellipsis eats the arrow off
the end of "next" before it touches a single letter of the title.

**Below 34rem the titles go visually hidden and only the arrows show.** There
is no width left to truncate into at that size, three uppercase labels would
get about six characters each, which is not a word. The titles are *hidden,
not removed*, so the link is still announced as "Previous story: The Wish"
rather than as a nameless arrow. That is what the `.u-visually-hidden`
direction prefix in each link is for.

**Empty states elsewhere on this page.** A missing illustration hides the image
and drops the blurred backdrop to a plain gradient rather than showing a broken
frame. A story with an empty `quiz` array shows a red dashed "Quiz not written
yet" instead of an empty panel.

---

## 5, Closing

**Owned by** `closing.html` · `css/closing.css` · `js/closing.js`

Dark ground again, fixed gradient backdrop, 48rem centred column.

```
┌──────────────────────────────────────────────────────┐
│                       ✦✦✦                            │
│                     The End                          │
│      Thank you for reading. People treat fables      │  lede
│      like they are only for kids, but…               │
│                                                      │
│      ¶ closing message, two paragraphs               │
│                                                      │
│               , The Whole Class                     │
│                                                      │
│   [ ← Back to Table of Contents ]  [ Back to Start ] │
├──────────────────────────────────────────────────────┤
│  CONTRIBUTORS                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ 01. Title    │ │ 02. Title    │ │ 03. Title    │  │  one card
│  │ Group 1      │ │ Group 2      │ │ Group 3      │  │  per story
│  │ Written by … │ │ Written by … │ │ Written by … │  │
│  │ Illustr. by… │ │ Illustr. by… │ │ Illustr. by… │  │
│  │ Narrated by… │ │ Narrated by… │ │ Narrated by… │  │
│  │ Group memb.… │ │              │ │              │  │  optional, story 01
│  └──────────────┘ └──────────────┘ └──────────────┘  │
└──────────────────────────────────────────────────────┘
```

The credits grid is built by `js/closing.js` from `window.STORIES`, the same
manifest the story pages are generated from. That is the point: the brief's
per-member attribution requirement can only ever be satisfied in one place, so
there is no second list to forget.

**Written by / Illustrated by / Narrated by always print**, with a dash where
a name is missing, because those three are the brief's and a visible gap is
the honest state. A card may also carry a fourth row, **Group members**, from
an optional `contributors` field, the group's own roster where it differs from
who took which role. That one is skipped entirely on a story without it rather
than printed as a dash: padding four cards against a field their group never
filled in reads as missing work, not as an absent extra. Story 01 is currently
the only one with a roster.

The closing message is written: a lede and two paragraphs arguing that fables
are not a warm-up act for literature but the floor it was built on, and that
without them stories would carry events but no moral weight. It replaced an
earlier lede that disclaimed the stories entirely, "these stories were never
ours", which said the opposite of what the collection is for.

---

## The footer

On every page, generated into all of them from `window.SITE` in `stories.js`,
between the `GB:FOOTER` marker comments. Never hand-edit inside the markers.

Three columns that collapse to one on narrow screens: the site title and
tagline · School and Course · Instructor and Academic Year.

---

## Deliberate departures from the original plan

These look like omissions. They are decisions. Check with the user before
reversing any of them.

**No Ghibli video, and no textured WebGL.** The original plan called for
looping Studio Ghibli clips as backgrounds. That is someone else's copyrighted
work inside a graded artifact, and it is Japanese-coded material in an
assignment whose stated content requirement is Filipino culture. It also
happens to be technically impossible here: sampling a local video or image into
a WebGL texture throws `SecurityError` from `file://`. Backgrounds are CSS
gradients, plus each story's own illustration blurred behind it.

Note what that decision does and does not cover. It rules out **textures**,
anyone else's artwork, and `texImage2D` from a local file. It does not rule out
a shader that computes every pixel from geometry, which is what the cover's
exit does: no image, no video, no `texImage2D`, nothing cross-origin, nothing
of anyone else's, and no file-size cost. A **purely procedural** shader is
fine. Reaching for one to display someone's picture is not.

**The marquee is vertical, and looping is a hard requirement.** An earlier
build turned it horizontal because a vertical drag competes with vertical page
scroll and because hover does not exist on touch. Both objections are real and
neither was accepted: the vertical strip is the design, and it was asked for
twice. The objections are mitigated in the layout instead, see the
"one consequence" note in section 3. Do not turn it horizontal again.

**Hover stops the marquee dead**, rather than slowing it. A half-speed drift
under the cursor just reads as lag.

**The cover advances on the button or a scroll down, and nothing else.** It
used to advance on any input at all, on the reasoning that a cover which traps
someone is the worst outcome. The result was worse: a stray keypress threw the
reader past the cover before they had read a word of it. Letters, Escape, Tab,
arrow-up, a wheel upward and a click on the background all now leave it alone.

**No smooth scrolling anywhere.** Every story page's back link is
`index.html#toc`. With `scroll-behavior: smooth` the browser animates that
jump, so the reader watches the entire introduction scroll past on every return
trip, the precise thing the back link exists to avoid.

**Everything is in English except the tales' own names.** Interface text, story
prose, and morals are English; each story keeps its Filipino name in
`titleFil`, small beneath the English title. The native name is content rather
than interface, and it carries part of the brief's culture requirement.

---

## Open layout questions

- **The site title.** `GREAT BOOK` says neither *fable* nor *Filipino*. The
  cover carries the eyebrow "Filipino Folk Tales" to cover for that, but the
  main title is still an unmade decision.
- **The story byline avatar** is a crop of the story illustration, standing in
  for member photographs that do not exist yet.
- **Every story now carries its group's whole storyboard**, one block of text
  per drawing, and no placeholder art is left in use. See `README.md` →
  "Preparing artwork" for what a file needs before it goes in.
- **There are five stories, not six.** Group 6 never handed in and was removed
  from the project. Nothing here hardcodes a count, the marquee, the index,
  the credits grid and the prev/next links all build from `window.STORIES`.
