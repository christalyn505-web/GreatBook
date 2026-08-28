# GREAT BOOK, build notes

Static site of illustrated Filipino fables with narration and per-story quizzes.
Coursework for Pambayang Dalubhasaan ng Marilao.

**The grader double-clicks `index.html`. There is no server.** Every decision
below follows from that.

---

## The other document

This file is the **build notes**: the daily loop, the reasoning behind the
decisions, how to prepare artwork, and the pre-submission checklist. One
companion sits beside it.

| File | Holds | Read it when |
|---|---|---|
| `docs/LAYOUT.md` | What every screen looks like, panel by panel, in plain words | You are changing the design, or briefing someone who will |

Keep the split. This file is *why* and *how*; `LAYOUT.md` is *what it looks
like*. Duplicating between them is how they start disagreeing.

---

## Daily loop

| I want to... | Do this |
|---|---|
| Change story text, titles, credits, quiz questions | Edit `stories.js`, then double-click **`build.bat`** |
| Add or replace artwork | Prepare the file (see "Preparing artwork" below), drop it in `assets/img/`, point `cover` / `illustration` at it, rebuild |
| Add the rest of a group's storyboard | Prepare each panel the same way, save as `NN-s2.jpg` onward, add `{ "image": …, "alt": … }` entries to that story's `body` where they belong, rebuild |
| Add narration | Drop `01.mp3` etc. in `assets/audio/`, rebuild |
| Give a story a video narration instead | Put the mp4 in `assets/video/`, set that story's `video`, clear its `audio`, rebuild |
| Check I have not broken anything | Double-click **`verify.bat`** |
| Make placeholder art for a new story | Double-click **`placeholders.bat`** |

`build.bat` refuses to run if a story breaks a brief requirement, more than
four paragraphs, a missing credit, a duplicate id. It reports everything still
marked `TODO` as a warning so you can see what is left.

There is no Node in this project. The tools are Windows PowerShell, which ships
with Windows. The `.bat` files pass `-ExecutionPolicy Bypass` for that one
invocation only; nothing is installed and no system setting changes.

---

## What is generated and what is hand-written

**Generated, do not edit, your changes will be overwritten:**

```
story-01.html ... story-05.html      from stories.js + tools/templates/story.html
```

**Hand-written:**

```
index.html      cover + intro + table of contents, one document
closing.html    closing message + credits
css/  js/       all of it
```

The footer is stamped into *every* page from `window.SITE` in `stories.js`,
between the `GB:FOOTER` marker comments. Edit `SITE`, rebuild, and all pages
update together. Do not hand-edit inside the markers.

---

## The `file://` rules

These are not style preferences. Break one and the site fails silently on the
grader's machine while still working on yours if you ever test over `http://`.

| Never | Why |
|---|---|
| `<script type="module">` | Fetched with CORS. From `file://` the whole script never runs. |
| `fetch()` / `XMLHttpRequest` | Blocked. This is why the manifest is `stories.js`, not `stories.json`. |
| `import` / `export` | Requires modules. Same failure. |
| Paths starting with `/` | Resolve to the filesystem root, not the project. Always `./`. |
| `texImage2D()` from a local image or video | Throws `SecurityError`. A `file://` asset is cross-origin to a `file://` page. |

`verify.bat` checks all five automatically.

Fine from disk: `<img>`, `<audio>`, `<video>` (both the muted background
kind and a `controls` narration the visitor presses play on),
classic `<script src>`, CSS filters and animations, `data:` URIs, and links
between pages.

---

## Preparing artwork

Each group hands in a whole storyboard. Three kinds of picture come out of it:

| Field | File | Where it shows |
|---|---|---|
| `cover` | `assets/img/NN-cover.jpg` | the marquee card in the table of contents |
| `illustration` | `assets/img/NN.jpg` | the story page, the figure, the blurred backdrop, the byline avatar. This is their **first panel**. |
| `body` panels | `assets/img/NN-s2.jpg` … | between the paragraphs, in the order the group drew them |

`cover` is **optional**. Leave it `""` and the marquee falls back to
`illustration`, which is what story 01 does because group 1 never made a title
card.

The panels are **not** optional in the same sense, they are the group's flow,
and a story printed without them is the group's words with most of their
artwork left in a folder. Prepare every panel they drew.

What a file coming out of a group's drive needs before it goes in:

1. **Trim any uniform white border.** Group 2 exported their art pasted onto a
   2000×1000 white canvas; the picture itself is 1418×1000. Those bars show as
   white edges against the dark story page.
2. **Resize to about 1500px wide.** The story column is ~550px, so that is
   already a 2.5× buffer.
3. **Save as progressive JPEG under ~260KB.** Quality 82 gets flat digital art
   there easily. A *photograph of hand-drawn art* will not, group 1's crayon
   scan needed quality 62 to fit, and at 1:1 it is indistinguishable, because
   the paper texture hides the artifacts. Step the quality down until it fits
   rather than shipping a 500KB file.
4. **Check the crop.** The marquee is `object-fit: cover` at `--card-ratio`
   (`7 / 5`, see `css/toc.css`) and a cover has the story's *title* painted
   into it, so a bad ratio does not lose scenery, it beheads a word. The
   story page's figure and its panels are `width: 100%` with no crop, so
   anything works there.

Group 1's seven panels went through exactly these steps and came out
1500px wide, quality 50–82, all under 260KB, the quality varies that widely
because it is a crayon-and-paper scan and the paper grain is what costs the
bytes. Six panels added 1.5MB to a 2.8MB site.

There is deliberately no tool for this. Node is not installed and neither is
Pillow guaranteed to be; the four steps above are a few minutes in any image
editor, and baking a dependency into the build for a once-per-group task would
cost more than it saves.

---

## The palette

Ghibli landscape: blue lake, sunlit fields, pale sky. Sampled from the
reference image. **These seven are the vocabulary**, the source colours the
Ghibli intro work should draw from.

| Swatch | Name | Hex | In the landscape |
|---|---|---|---|
| 🟦 | Bright blue | `#3b819d` | the lake |
| 🟩 | Dull green | `#8cb84e` | sunlit field |
| 🟫 | Grayish green | `#8e9b85` | far hills |
| ⬜ | Light grayish yellow green | `#cfc8b8` | pale ground |
| 🟦 | Light grayish blue | `#6b8bad` | haze |
| 🟥 | Bright red | `#cf5566` | flowers |
| 🟨 | Bright yellow | `#cfdd3e` | highlights |

They live in `css/base.css` as `--gb-blue`, `--gb-green`, `--gb-green-gray`,
`--gb-sand`, `--gb-blue-gray`, `--gb-red`, `--gb-yellow`.

> **All seven were read off the reference image, so check them against your
> source.** One is a guess: `--gb-green-gray` (`#8e9b85`), that label was not
> legible, so the value is sampled from the swatch by eye rather than read.
> Correct it in `css/base.css` and everything downstream follows.

**Nothing in the CSS uses those seven directly.** They feed a semantic layer,
so a colour can be retuned in one place without hunting through six files:

| Token | Value | Role |
|---|---|---|
| `--ink` | `#1a2e22` | deep forest, cover, story and closing grounds |
| `--ink-soft` | `#2e4a38` | raised surface on a dark ground |
| `--paper` | `#e6f0e7` | pastel mint, the table of contents ground |
| `--paper-soft` | `#f8fbf7` | near-white, the story-list card, floating on it |
| `--paper-sky` | `#dfeaf2` | pastel sky, list row hover |
| `--footer-bg` | `#3f566c` | the footer, and only the footer |
| `--accent` | `#7ca83c` | small labels and eyebrows |
| `--accent-bright` | `#c3d64a` | links and live states on dark grounds |
| `--accent-deep` | `#3f6b2e` | buttons and links on light grounds |
| `--water` | `#3b819d` | gradients, cool edges, link hover |
| `--water-soft` | `#6b8bad` | haze in the gradients |
| `--alert` | `#cf5566` | the unfinished / not-linked-yet state |

**The light surfaces are tints of the palette's green and blue, never of its
sand.** `--gb-sand` (`#cfc8b8`) is a warm grayish beige, and anything built on
it reads brown sitting next to the forest grounds. The table of contents is the
one bright interface on the site, so it is pastel: a tinted mint ground with a
near-white card floating on it, and a cool sky tint for row hover. The ground
carries the colour rather than the card, which is what lets the card read as
raised.

**The footer is deliberately not `--ink`.** It is a darker, deeper value of the
palette's light grayish blue, so every page closes on water rather than on more
forest.

Three accent roles, deliberately *not* three shades of one hue. The split
exists because contrast is directional: `--accent` is a mid green that reads
well on the dark ground (5.2:1) and badly on the pale one (2.4:1). Anything
small and green on a light background wants `--accent-deep`.

Translucent versions come from the `--*-rgb` triples beside the solid tokens,
`rgba(var(--ink-rgb), 0.86)`, not a hand-mixed `rgba(26, 46, 34, 0.86)`. That
is what stops an overlay drifting away from the palette the next time a colour
moves.

Every text pairing on the site was checked after the retune. All clear WCAG AA
for body text except the big red "quiz not written yet" placeholder, which is
display-sized and temporary.

---

## Decisions taken, and why

**No background video, and no textured WebGL.** The original plan used Studio
Ghibli clips. That is someone else's copyrighted work inside a graded artifact,
and it is Japanese-coded material in an assignment whose stated content
requirement is Filipino culture. Dropping it also removed the largest chunk of
the file-size budget and the heaviest runtime cost. Backgrounds are CSS
gradients, plus each story's own illustration blurred behind it.

That decision is about **textures**, and it is worth being precise about the
boundary, because the two halves of it have different reasons and only one of
them is absolute:

- **Anyone else's artwork: no, permanently.** Copyright does not care how the
  pixels reach the screen.
- **`texImage2D` from a local file: no, and not by choice.** A `file://` asset
  is cross-origin to a `file://` page, so it throws `SecurityError`. This one
  is a wall, not a preference.
- **A shader that computes every pixel from geometry: fine.** No image, no
  video, no texture call, nothing cross-origin, nothing of anyone else's, and
  it adds bytes only as source code.

**The cover's exit is that third thing**, the seam this section used to
reserve, taken. `js/cover-fx.js` plays it as two movements and a dissolve.
First long grey ellipses drive straight inward from the rim until the frame is
solid black (900 ms). Then, on that black and not one frame before it, seven
hundred small warm lights appear and wind toward the centre trailing long
curved streaks (1850 ms). Every pixel of both is computed from an ellipse
equation or a falloff curve; there is not one texture in it.

**The reveal overlaps the swirls rather than following them.** About a third of
the way into the second movement the cover begins to fade, and the remaining
two thirds play over an introduction that is already coming up underneath. The
close reads as one long dissolve instead of "black, then page".

**Then the bloom throws it all back out.** The swirls wind everything inward;
the third movement reverses that. Flowers open at the centre and are swept
outward on unwinding spirals, tumbling as they go, until the wind carries them
off the edges of the frame (1000 ms). It opens 850 ms before the swirls are
over, nearly half that movement still to run, and about the moment the last
mote is born, so the two layers overlap at full strength rather than handing
over. Nothing in this sequence
starts exactly where the thing before it stopped. Its colours are the palette's own, `--gb-red` is
the swatch this file's table already labels *flowers*, with `--gb-sand` for the
pale ones and `--gb-yellow` for the hearts.

It runs on **two clocks**: `BLOOM_MS` is how long the movement lasts,
`BLOOM_FLIGHT_MS` how long one flower takes to cross. They were one number to
begin with, which quietly made "longer movement" and "faster flight" opposite
requests, every flower's life was normalised over what remained of the window,
so stretching the window slowed all of them down. Splitting the two is what
lets flowers still be opening at the centre while the first are already gone.
Two rules follow from the split, and the second is the one that catches you
out. Births plus flight must fit inside the window, or the last flower born is
deleted mid-air when the canvas is hidden, so `BLOOM_SPREAD` is refitted
whenever either the flight or the window moves. And `BLOOMS` counts flowers
*issued*, not flowers on screen: the peak in the air is
`BLOOMS × min(flight, spread) / spread`, and which branch of that you are on
flips with the window. Halving the duration doubled the density without the
count changing at all. Read the formula rather than the constant; the working
is beside `BLOOMS` in `js/cover-fx.js`.

It plays **over the introduction**, not over the dark, and that is not a
detail: its canvas is a sibling of `.cover` in `index.html` rather than a child
of it, because by the time it starts the cover is 94% faded and a quarter of a
second from being hidden. A child would be carried off by the fade rather than
by the wind. It owns its own clock and its own teardown, `stop()` deliberately
does not touch it, and it takes no clicks, the page beneath is unlocked and
scrollable while it plays. It is also the only one of the three shader layers
drawn with ordinary alpha, because additive light does not register on a lit
page.

That overlap is worth more than it costs, but it costs something real: it
couples three numbers that live in three different files and cannot see each
other. They are listed as the fourth entry under "The three things that will
break" below, and the arithmetic between them is written out beside
`REVEAL_LEAD_MS` in `js/cover-fx.js`. Two of the three relationships are hard
rules, break one and the swirls are cut off mid-arc, or the cover is torn out
of the document partway through its own fade.

It also cost the reveal its `--ease`. That curve is a hard ease-out, which was
right when the fade was a curtain call with nothing behind it and wrong the
moment something plays over it: it clears half the black in the first fifth of
its run, so the sparks would finish over a fully lit page, and additive light
does not read on a bright ground. The reveal uses a symmetric curve instead.
Nothing else on the site changed.

It is entirely optional at runtime: no WebGL, a shader that will not compile, a
lost context, or `prefers-reduced-motion`, and the cover falls back to the plain
opacity fade with nothing else changed. The glow layer is optional again on top
of that, lose only its context and the petals carry on. A failsafe timer
releases the page even if not a single frame is ever drawn, which is a real
case rather than a hypothetical one: `requestAnimationFrame` does not fire in a
background tab, so anyone who clicks and immediately switches away depends on
it.

See `docs/LAYOUT.md` → "1, Cover" for the knobs, for the three-file timing
coupling, for why it takes two canvases, and for the five tuning decisions that
were measured rather than guessed.

The idle cover background stays CSS on purpose. A shader that runs for three
seconds during a dismissal costs nothing while the reader sits on the cover;
one that replaced `.cover__bg` would hold a GPU loop open for as long as they
stay there reading it.

**The marquee is vertical, and it loops forever.** An earlier build made it
horizontal, on the reasoning that a vertical drag competes with vertical page
scroll and that hover does not exist on touch. Both objections are real, but
the vertical strip is what the design calls for and it was asked for twice, so
the build follows the design. The objections are handled instead:

- The strip occupies only the right-hand column, so the story list beside it is
  always available as a way out if the wheel gets captured.
- It is the last section before the footer, so there is very little page left
  to trap someone out of.
- On narrow screens the layout stacks and the strip is capped at 55vh, leaving
  page above and below it to put a thumb on.

The loop itself is the part worth understanding before touching it. The story
list is rendered **three** times and the scroll position is parked in the
middle copy, so there is no top and no bottom in either direction. Two things
make that stable, and both were bugs in the first version:

- **Three copies, not two.** With two copies starting at scroll position zero,
  the "wrapped past the top" test is true on the very first frame, so it jumped
  a whole copy immediately, which made the "wrapped past the bottom" test true,
  and the two fought forever. The strip jumped once and then looked frozen.
- **The period is measured between two matching cards**, not as
  `scrollHeight / 3`. Eighteen cards have seventeen gaps, so the arithmetic
  version is short by a fraction of a gap every lap and the loop creeps.

The scrollbar is hidden deliberately: an endless loop has no meaningful
position to report.

> **The ratio to give the illustrators is still 4:5 portrait.**
> 1600px on the long edge, JPG, quality ~80.
>
> Note that the marquee cards are **landscape** (`--card-ratio`, 16:9 by
> default), so portrait artwork is centre-cropped there. The story pages show
> the full 4:5 image. If the crop loses too much, either set `--card-ratio` to
> `4 / 5` in `css/toc.css` or re-brief the illustrators, but do not do the
> second one lightly, six people have already been told 4:5.

The strip is still a native `overflow-y: auto` scroller underneath, so wheel,
touch and keyboard scrolling come from the browser. Auto-drift and mouse
drag-scrub are enhancements on top. A plain numbered list sits beside it as a
second, independent route to every story.

**Hover stops the marquee dead**, rather than slowing it. A half-speed drift
under the cursor just reads as lag.

**The cover advances on two things only: the button, and a scroll down.** It
used to advance on anything at all, any key, a click anywhere, a wheel in
either direction. The intent was that a cover which traps someone is the worst
outcome. In practice it was worse than that: a stray keypress threw the reader
straight past the cover before they had read a word, with no way back short of
reloading. Now the input has to mean "go down": the button, wheel with a
positive deltaY, the keys that scroll down, or a real upward swipe.

**Everything is in English, except the tales' own names.** All interface text,
story prose, and morals are English. Each story keeps its original Filipino
name in `titleFil`, rendered small beneath the English title, the native name
is content rather than interface, and it carries part of the brief's culture
requirement. To drop it entirely, set every `titleFil` to `""` and rebuild; the
line disappears on its own.

**No scrollbar, on any page.** `css/base.css` hides the document scrollbar
site-wide. Scrolling itself is untouched, wheel, trackpad, touch, Space,
PageDown, End and the arrow keys all behave exactly as before, and so do the
skip link and every fragment jump. What goes is the track: the reader loses
their position indicator and the ability to drag the thumb, which is a real
cost on a page whose introduction is five viewport-heights on its own. It was
asked for deliberately, and it is two rules to undo.

It has one knock-on that is not obvious from the rule. Releasing the cover's
scroll lock used to make the scrollbar appear, which narrowed the columns and
shortened every aspect-ratio-sized marquee panel, that reflow is the entire
reason `release()` in `js/cover.js` re-measures the marquee twice. With no
scrollbar there is no width change and nothing to correct. Both calls are kept:
they cost one measurement each, and they are what would be needed again the day
the scrollbar comes back. The marquee's own scrollbar was already hidden, for
the unrelated reason given further up.

**The cover's title does not fade out.** It stays lit and fully placed while
the feathers close over it, and the black veil finishes the job. An earlier
version faded `.cover__inner` away in 520 ms so the centre of the screen would
be empty before the petals converged there, which was solving a problem the
shader already solves. `.cover__inner` is `z-index: 1` and both canvases and
the veil sit above it, so the title is painted *over* rather than clipped.
Fading it first meant the most dramatic stretch of the cave-in closed over an
empty stage.

**The narration transport is custom.** The mockup asks for a podcast-style
player, so the controls are ours: play/pause, back and forward 15 seconds, a
speed cycle, mute, and a draggable seek bar. The `<audio>` element underneath is
still the engine, this only replaces its face. The seek bar is a real
`<input type="range">`, so keyboard seeking, touch dragging and the whole
accessibility contract come from the browser instead of hand-rolled pointer
maths.

It has three states, and all three happen while the assets are still coming in:

| State | What the reader gets |
|---|---|
| `js/story.js` ran | the custom transport |
| script blocked, or it threw | the browser's own `<audio controls>` |
| the mp3 is missing | "not recorded yet", instead of a dead control |

The swap to the custom face happens *last*, after every control is wired, when
the script sets `.is-enhanced`. A half-wired transport is worse than the native
one, so it can never replace it.

**The story pages print the group's whole storyboard, not just its first
page.** Every hand-in is a picture book: a drawing, then the words for that
drawing, over and over. Group 1's *Flow of the story (Image).pdf* is seven
panels laid out exactly that way. For a while the site showed one of those
seven and left the other six in the folder, which is the group's words with
most of their artwork missing.

The obstacle was the four-paragraph limit. Their seven panels pair with seven
beats of text; the brief allows four paragraphs, so the paragraphs merge and
the pairing stops being one-to-one. The way through is to notice that **the
limit counts paragraphs, not pictures**. `body` in `stories.js` became a mixed
list, a string is a paragraph, an object is a panel, and `build-pages.ps1`
counts only the strings. Nine panels inside four paragraphs is fine.

Panels live *in* `body`, rather than in a `panels` array beside it, because
their position is the whole point. A parallel list plus index numbers saying
where each picture goes carries the same information in a form where moving one
paragraph silently moves every picture after it. In `body` the order on the
page is the order in the file, and you can read it.

The first panel is not in the list: it is `illustration`, printed above the
narration player with the illustrator's credit, and `docs/LAYOUT.md` records
that the brief fixes that position. So the body starts at the group's *second*
panel. Down the page you get panel 1, the player, then text and pictures
alternating to the moral.

**Story 01 pairs them one-to-one, and pays the brief's four-paragraph rule to
do it.** Re-splitting merged paragraphs to spread the pictures out was the
first attempt and it was a compromise: the pictures still clumped two deep and
the text still did not line up with them. The flow group 1 drew is seven
drawings and seven blocks of text, alternating, and the only way to print that
is seven paragraphs.

So `"paragraphLimit": 7` on story 01, and the build warns about it on every
single run. That warning is the point. The four-paragraph limit is a graded
requirement, not a style preference, and this is it being spent deliberately on
one story rather than quietly relaxed for all six, the default is still 4 and
02–05 are still held to it. If the brief turns out to be strict about the
number, merge the seven blocks back into four and delete the field; nothing
else has to change.

Story 01's text is group 1's original restored in full, not the earlier
condensation. That condensation had dropped their closing line, *"For in every
helping hand a little kindness is passed on…"*, which is the sentence the
whole tale lands on. Their "Years lager" is fixed to "later", and the light
grammatical polish the site already applied is kept.

**Each group's flow is their own, and they do not agree.** Stories 02, 03 and
04 got the same treatment as 01, and the differences are worth knowing before
you touch any of them:

- **Group 2** runs picture-then-words like group 1, and drew a "THE END" card
  that pairs with no paragraph, so story 02's body ends on a picture.
- **Group 3** runs words-then-picture, the other way round. They also drew
  **two title cards**, and the site was already using both, `03-cover.jpg` on
  the marquee and `03.jpg` as the story's front image. So story 03's front is
  lettering rather than a scene, and unlike the others its body carries all
  nine panels starting at `03-s1.jpg`.
- **Group 4 documented no flow at all.** Nine unordered `Messenger_creation_*`
  files, no pairing. A first pass reconstructed an order from the story text;
  it was then corrected by hand, and the corrected order is what ships. Two
  drawings share one block, and one paragraph break falls **inside** a
  sentence, group 4 wrote the lit plaza and the blackout as one sentence but
  drew them as two pictures, so both halves carry an ellipsis. **Their four
  paragraphs were split into seven, and that split is ours, not theirs**,
  group 4's text was already inside the brief's four-paragraph limit before we
  touched it.

That last point is the one to weigh. For groups 1, 2 and 3 the paragraph count
comes from a picture book they actually drew; for group 4 it comes from us.

**One story is narrated by a video, and the page has two players.** Group 3
did not record a voice track, they recorded a fully animated retelling with
burned-in subtitles. Playing that as an mp3 throws away the half of it they
actually drew.

So `stories.js` grew a `video` field, mutually exclusive with `audio`, and
`tools/templates/story.html` now carries **both** players between
`GB:AUDIO` / `GB:VIDEO` markers. The build keeps whichever the story uses and
deletes the other, markers and all. The markup stayed in the template rather
than moving into the PowerShell: conditionally *building* forty lines of HTML
in a build script puts it in the one place nobody thinks to look for it.

The video gets **native controls, not the custom transport**. That transport
is a one-line bar built around a thumbnail of album art, and it is the right
shape for audio precisely because there is nothing to look at. A narration you
are meant to watch needs the picture to be the player. Its poster is the
story's own cover, so the frame is not black before it is pressed.

Their master was **326 MB**, more than the whole upload budget on its own,
and the exact file `tools/verify.ps1` names in its warning about hand-ins. It
is 9.2 MB now at 1280×882, full length, subtitles still legible.

`js/story.js` needed one change: it looks for `audio, video` when attaching the
missing-file handler, so a missing video degrades to "not recorded yet" the
same way a missing mp3 does. The transport wiring below it already bails when
the buttons are absent, which is exactly what the video page wants.

**The narration mp3s are re-encoded, not copied.** `assets/audio/README.txt`
asks for mono at 96–128 kbps, and the four sources were all 128 kbps stereo,
9.7 MB instead of 12.9 MB for the same spoken audio. The exception is story
05, left at its source's 64 kbps: re-encoding a 64 kbps file up to 96 adds a
megabyte and no quality.

**The subtitle under the title** is group 1's own note about what the story
reflects. They wrote it under their moral; on the page it works better as a
logline, which is where it now sits. Their "value pf bayanihan" is fixed to
"of". The field is optional and emits nothing at all when empty, not even a
blank line, because the story head is a centred stack and a stray empty
paragraph is a visible dent in it.

**There is no group 6.** They never handed anything in, and the sixth story
was a placeholder stub, a title, three `TODO` paragraphs, an empty quiz and
generated art, so it was removed at the user's request rather than shipped as
an obviously unfinished page.

Removing it was three deletions: the entry in `stories.js`, `story-06.html`,
and `assets/img/06.svg`. **Nothing else needed touching**, and that is worth
noticing, because it is the payoff for everything being manifest-driven. The
marquee and the story index build from `window.STORIES` at runtime, the
credits grid on the closing page does too, the prev/next links are computed by
the build from the entry's position, and both PowerShell tools read the
manifest for their counts. Not one file hardcodes "six".

A copy of what was deleted is in the session scratchpad. It was only ever
placeholder text, so this is reversible by pasting the entry back and
rebuilding.

**The moral has its own block.** The brief wants the lesson easy to determine.
Inside the prose it gives a grader nothing to point at.

**The quiz is played on the page, not linked out to a Google Form.** This is
the one decision here that reversed an earlier one, so it is worth the space.

A Form link needs two things the grader is not guaranteed to have: an internet
connection, and a Google account inside the school org. Miss either and a
required brief item shows them a permission wall or a spinner. That is a
strange failure for a site whose entire architecture is built around working
from a USB stick, every other constraint in this project exists to survive
`file://`, and the quiz was the one part that threw that away.

So it now runs from the file. One question at a time as the header, four
choice buttons under it, then a score with a ✅ or ❌ against every question.
No internet, no sign-in, no tab switch.

Three things about how it is built:

*The questions are baked into each page as plain markup, not read from
`stories.js`.* Story pages do not load the manifest, and adding a `<script>`
to every one of them to carry data that is already static would be worse than
reading the static thing. The bigger win is that the baked markup **is** the
no-JS fallback, scripting off gives you a readable printed quiz rather than
an empty box, and because there is only one copy of the questions, the
printed and interactive versions cannot drift apart. `js/quiz.js` reads them
back out of the DOM.

*Nothing is marked right or wrong until the end.* Being told you were wrong on
question 2 changes how you read 3 through 5. The pressed state is deliberately
neutral, the accent colour, not green, not red.

*The answers are readable in View Source.* Unavoidable: a static site has
nowhere else to keep them, and hiding them properly needs a server this project
does not have and should not grow. For a reading-comprehension exercise
attached to a folk tale, that is a fair trade, and it is written down in
`stories.js` so nobody later mistakes it for an oversight.

The cost is that `build.bat` now has something new it can only half-check. It
proves every `answer` index points *at* a choice; it cannot prove it points at
the *correct* one. That is why "play each quiz through once" is on the
pre-submission checklist in bold.

**Arriving at `index.html#toc` skips the cover entirely**, that is where every
story page's back link points, so the return trip never replays the opening.
(What advances the cover normally is covered above.)

**No `scroll-behavior: smooth`.** Every story page's back link is
`index.html#toc`. Smooth scrolling animates that jump, so the grader watches the
whole intro scroll past on every return trip.

---

## The four things that will break if you touch them carelessly

**1. The pre-paint script in `index.html` `<head>`.** It must stay inline and
stay in `<head>`. It sets `history.scrollRestoration = 'manual'` (otherwise a
reload drops the visitor mid-intro with the cover never having played) and
decides cover-vs-deep-link before the first frame. Moving it to the end of
`<body>` is too late, the browser may already have restored scroll.

**2. Parallax travel is computed, not hardcoded.** `js/scroll.js` sets the
backdrop's height from the section length and `PARALLAX_RATE` so it can never
run out of travel mid-section. The `165vh` in `css/intro.css` is only the
no-JS fallback. If you change `--intro-screens` or `PARALLAX_RATE`, nothing
else needs touching.

**3. The backdrop is `position: sticky`, not `fixed`.** Sticky is bounded by
its parent, which is exactly how the background stops existing at the table of
contents with no cleanup code. Fixed would sit behind everything forever.

`PARALLAX_RATE` is one constant at the top of `js/scroll.js`. Tune by eye.

**4. The cover's exit timing is spread across three files, and they have to
agree.** The reveal begins *while the swirls are still playing*, which is what
makes the close a dissolve rather than a cut, and which couples three numbers
that have no way of reading each other:

| Number | File | Now | Rule |
|---|---|---|---|
| `REVEAL_LEAD_MS` | `js/cover-fx.js` | 1250 | how early the fade starts, **must not exceed the fade** |
| `transition: opacity` on `.cover` | `css/cover.css` | 1500 ms | how long the fade runs |
| the teardown `setTimeout` | `js/cover.js` | 1560 ms | **must outlast the fade** |

Both shader canvases are children of `.cover`, so the instant its opacity
reaches 0 the swirls go with it wherever they are in their arc, that is what
caps the lead, and it is why "start the reveal earlier" is never a one-number
change. Going earlier means lengthening the fade, which in turn means pushing
the teardown out behind it; a teardown shorter than the fade sets the cover
`hidden` partway through its own dissolve and takes the last of the swirls with
it.

Neither failure throws. Both just quietly truncate the effect on someone else's
machine, which is the same shape of problem as the `file://` rules. The
arithmetic is written out in full beside `REVEAL_LEAD_MS`; read it before
moving any of the three.

---

## Before submitting

Run `verify.bat`. It proves: no `file://` hazards, no absolute paths, no broken
references, no unreplaced placeholders, every story credited and linked, and
reports total payload size.

Then do the part a script cannot, **from an extracted copy of the actual zip,
not this working folder**:

- [ ] `index.html` opens by double-click. No server. Console clean.
- [ ] Cover plays, dismisses, scroll unlocks afterwards
- [ ] Reload mid-page, cover does not replay, parallax is not misplaced
- [ ] Background clips abruptly to white at the table of contents
- [ ] Every story reachable, and the back link returns to the TOC, not the cover
- [ ] All audio plays, all illustrations load
- [ ] **The prev / closing / next row at the bottom of every story page is on
      ONE line**, at desktop width and on a phone. Long titles should trail off
      with an ellipsis; the arrows should always be visible.
- [ ] **The marquee cards are not cropping anyone's title in half.** They show
      each group's cover, and a cover has the title painted into it. The knob
      is `--card-ratio` in `css/toc.css`, and the bottom 20% of every card sits
      under the title bar.
- [ ] **Every quiz played through once, picking the answers you know are
      right.** `build.bat` proves each `answer` index points *at* a choice. It
      cannot prove it points at the *correct* one, and an off-by-one there
      marks a right answer wrong with no other symptom. Five clicks per story.
- [ ] **The quiz with JavaScript switched off**, you should get the printed
      version, every question and every choice, not an empty panel.
- [ ] **`greatbook group N/` folders moved out of the project root.** They are
      the raw hand-ins: 376MB, one 326MB video, nothing on the site links to
      them. `verify.ps1` warns about this.
- [ ] Works in Chrome and Firefox
- [ ] Usable on a touchscreen, especially the marquee
- [ ] Smooth on a low-end machine, not just yours
- [ ] Zip size within the LMS limit

---

## Still outstanding

- **Check story 05's panel order**, group 5's `Story.pdf` is prose with no
  pictures, so nothing documents the pairing and the order is inferred. File
  order is not story order there: `Page 3` precedes `Page 2`.
- **Credits are in for every story**, but two things want confirming:
  **group 3's are surnames only** (`Modina and Jotojot`, `Gaton, Historillo,
  and Dimacali`, `Moyon and Mariano`), check the full names, and that each is
  really two or three people rather than one person written surname-first. And
  **several people are credited by their group in a role the manifest has no
  field for**, so they appear nowhere on the site: Ashera Martinez (group 2's
  quiz), and group 4's Ashley Ann B. Molina, Hannah Enrile and Renica V. San
  Pedro (voice cast, moral, quiz). Adding a `contributors` field would fix
  that; inventing one per role would not.
- **Every story has its quiz**, 25 questions. Two need a read-back from their
  groups, because neither marked their answers: **group 3 gave question stems
  only**, so both the four choices and the answers under each were derived from
  their own story text, and **group 5 gave stems and choices but no answers**,
  so those were derived too. Correct against the text, but theirs to confirm.
  Group 4's own quiz doc spells its characters "Bitun" and "Law" where the
  story says Bituin and Ilaw; corrected in the manifest so the quiz matches the
  story printed above it.
- Narration is **complete**: 01, 02, 04 and 05 are mono mp3s in
  `assets/audio/`; 03 is a video in `assets/video/`, because group 3 recorded
  an animation rather than a voice track.
- **Sanity-check the payload against the LMS limit.** The site is 26 MB now,
  up from 2.8 MB, and essentially all of the increase is narration,
  `03.mp4` alone is 9.2 MB. If the limit is tighter than that, the video is
  where to look first: dropping it to 960px or raising the CRF gets several
  megabytes back, and re-encoding the mp3s to 64 kbps mono saves ~3 MB more.
- Artwork is **complete**: every story has a cover, a front image and every
  panel its group drew. Only story 01 has no cover, because group 1 never made
  a title card, so its card falls back to the front image, worth asking them
  for one. `assets/img/04.svg` and `05.svg` are unused leftovers, left alone
  because `make-placeholders.ps1` regenerates the whole set.
- **Confirm the four-paragraph trade.** Stories 01, 02, 03 and 04 now carry
  `paragraphLimit` values of 7, 6, 9 and 7, and each warns on every build.
  Every finished story exceeds the brief's four. That is deliberate and it is
  reversible, merge a story's blocks back and delete its `paragraphLimit`,
  but it wants a conscious yes, and story 04 is the weakest case for it
  because group 4's own text was already four paragraphs.
- **Story 04's panel order has been set by hand and is settled.** It was
  reconstructed first, then corrected: the order is `04.jpg`, s3, s4, s2, s5,
  s6, s7, s8, which is deliberately not file order. `04-s2` moved out of the
  opening block to sit with Ilaw's promise to fetch his fellow alitaptaps,
  where the drawing actually belongs.
- Nothing outstanding on group 4's artwork: all nine drawings are in use.
  `04-cover.jpg`, their painted title card, is both the marquee card and the
  header image on the story page, and `04.jpg`, the plaza scene, opens the
  body under the paragraph that describes it.
- **Three content divergences the storyboard pass turned up**, none of them
  touched:
  - **Story 03's moral is not what group 3 wrote.** Theirs ends "…letting your
    pride dictate actions that leads you to **distraction**"; the manifest says
    "**danger**". Somebody changed it; decide which stands.
  - **Story 03, panel 5**: the crow's speech balloon says "HEY, EAGLE!" while
    the prose says "Hey, Mutya!". The prose is what the page prints.
  - **Group 2 credit a quiz author**, Ashera Martinez, and the manifest has no
    field for one, so that name appears nowhere on the site. Group 4 credit a
    cast, a moral author and a quiz author with the same problem.

- **Site title.** `GREAT BOOK` says neither *fable* nor *Filipino*. The cover
  currently carries the eyebrow `Filipino Folk Tales` to cover that, but the
  main title is still a placeholder decision.
- **Re-measure the swirl brightness.** The mote population went from 130 to
  700 and `MOTE_GAIN` came down from 1.10 to 1.00 to make room for it, so the
  old "peak brightness 0.92" reading no longer describes what is on screen. It
  has been removed from `docs/LAYOUT.md` rather than guessed at. Watch for two
  cores landing on each other and clipping to flat white; if that shows, trim
  `MOTE_GAIN` further rather than thinning the population. The cave-in's
  measurements are untouched and still stand, nothing in that movement
  changed.
