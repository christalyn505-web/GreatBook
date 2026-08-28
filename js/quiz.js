/* ===========================================================================
   quiz.js, the on-page, scored, one-question-at-a-time quiz
   ---------------------------------------------------------------------------
   Replaces the old "Click here to take Quiz!" link out to a Google Form. The
   grader double-clicks index.html on a machine that may well have no internet
   and is certainly not signed in to the school's Google org, and a Form link
   fails on both counts. This runs from the page.

   WHERE THE QUESTIONS COME FROM
     Not from stories.js. tools/build-pages.ps1 bakes each story's quiz into
     its own page as plain markup, the same way it bakes the body text, and
     this file reads that markup back out of the DOM. Two reasons:

       - the story pages do not load the manifest, and adding a second
         <script> to every page to carry data that is already static is worse
         than reading the static thing;
       - the baked markup IS the no-JS fallback. With scripting off you get a
         readable printed quiz, every question, every choice, instead of an
         empty box. This file only takes over once it knows it can.

   HOW IT PLAYS
     One question at a time as the heading, four choice buttons underneath.
     Choosing advances to the next question after a short beat, long enough
     to see which button you pressed, short enough not to feel like waiting.
     Nothing is marked right or wrong until the end, so an early answer can't
     colour how you read the rest. At the end: a score, then every question
     listed with a tick or a cross, and the correct answer shown wherever you
     missed it.

   THE ANSWERS ARE IN THE PAGE. They have to be, a static site has nowhere
   else to keep them. View Source defeats this quiz completely. That is an
   acceptable trade for a reading-comprehension exercise that has to work off
   a USB stick, and it is not fixable without a server.

   No fetch, no modules, no template literals, this has to run from file://
   in whatever browser the grader happens to have.
   =========================================================================== */

(function () {
  'use strict';

  /* --- tuning ---------------------------------------------------------------
     The only numbers worth touching. ADVANCE_MS is the pause between pressing
     a choice and the next question arriving: below about 150ms the press is
     not visible and the quiz feels like it skipped, above about 600ms it
     feels like it is loading something.
     ----------------------------------------------------------------------- */

  var ADVANCE_MS = 320;
  var LETTERS    = ['A', 'B', 'C', 'D', 'E', 'F'];

  var root = document.querySelector('[data-quiz]');
  if (!root) { return; }

  /* --- read the baked markup ----------------------------------------------
     Each question is one <li data-answer="N"> holding the question text and
     its choices. Anything malformed is dropped rather than allowed to score
     wrongly: a quiz that silently marks a right answer wrong is worse than
     no quiz at all.
     ----------------------------------------------------------------------- */

  function parse() {
    var items = root.querySelectorAll('.quiz__static-item');
    var out   = [];
    var i, j, node, qText, choiceNodes, choices, answer;

    for (i = 0; i < items.length; i++) {
      node = items[i];

      qText = node.querySelector('.quiz__static-q');
      if (!qText) { continue; }

      choiceNodes = node.querySelectorAll('.quiz__static-choices > li');
      choices = [];
      for (j = 0; j < choiceNodes.length; j++) {
        choices.push(choiceNodes[j].textContent.replace(/\s+/g, ' ').trim());
      }
      if (choices.length < 2) { continue; }

      answer = parseInt(node.getAttribute('data-answer'), 10);
      if (isNaN(answer) || answer < 0 || answer >= choices.length) { continue; }

      out.push({
        q: qText.textContent.replace(/\s+/g, ' ').trim(),
        choices: choices,
        answer: answer
      });
    }

    return out;
  }

  var QUESTIONS = parse();

  /* Nothing usable in the markup. Leave the printed version exactly as the
     build wrote it, it is still a perfectly readable quiz on paper. */
  if (QUESTIONS.length === 0) { return; }

  /* --- small DOM helpers --------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  function clear(node) {
    while (node.firstChild) { node.removeChild(node.firstChild); }
  }

  /* --- state --------------------------------------------------------------- */

  var current  = 0;        /* index of the question on screen                  */
  var picked   = [];       /* picked[i] = index chosen for question i, or -1   */
  var locked   = false;    /* true during the beat between answer and advance  */
  var timer    = null;
  var replay   = false;    /* true once "Try the quiz again" has been pressed  */

  /* --- the shell -----------------------------------------------------------
     Built once. Only .quiz__stage is rewritten as the quiz runs, so the
     progress row does not flicker on every question.
     ----------------------------------------------------------------------- */

  var shell    = el('div', 'quiz__play');

  var bar      = el('div', 'quiz__bar');
  var barFill  = el('span', 'quiz__bar-fill');
  bar.appendChild(barFill);
  bar.setAttribute('aria-hidden', 'true');

  var counter  = el('p', 'quiz__counter');

  var stage    = el('div', 'quiz__stage');

  /* NO aria-live HERE, on purpose, and it is worth writing down why because
     it looks like an omission.

     The stage is already in the DOM when the first question is written into
     it, so a live region would announce the whole quiz on page load, before
     the reader has even reached the story's last paragraph. And on every
     advance it would read the new question a second time, on top of the
     heading that focus has just landed on.

     Moving focus to the question heading does the announcing instead: it is
     the standard pattern for a step that replaces its own content, it speaks
     once, and it leaves the keyboard in the right place for Tab to reach the
     choices. See renderQuestion(). */

  shell.appendChild(counter);
  shell.appendChild(bar);
  shell.appendChild(stage);

  /* --- rendering: one question -------------------------------------------- */

  function renderQuestion() {
    var item = QUESTIONS[current];
    var i, choice, button, letter, label;

    counter.textContent = 'Question ' + (current + 1) + ' of ' + QUESTIONS.length;
    barFill.style.width = ((current / QUESTIONS.length) * 100) + '%';

    clear(stage);

    var heading = el('h2', 'quiz__q', item.q);
    /* Focusable only by script. Moving focus here on advance is what makes
       the quiz usable by keyboard and screen reader: without it, focus dies
       on the button that was just replaced and lands back on <body>. */
    heading.setAttribute('tabindex', '-1');
    stage.appendChild(heading);

    var list = el('ul', 'quiz__choices');

    for (i = 0; i < item.choices.length; i++) {
      choice = el('li', 'quiz__choice-row');

      button = el('button', 'quiz__choice');
      button.type = 'button';

      letter = el('span', 'quiz__choice-letter', LETTERS[i] || String(i + 1));
      letter.setAttribute('aria-hidden', 'true');

      label  = el('span', 'quiz__choice-text', item.choices[i]);

      button.appendChild(letter);
      button.appendChild(label);

      /* A closure per button rather than one delegated listener: the stage is
         rebuilt every question anyway, so there is nothing to clean up, and
         the index is captured plainly instead of parsed back out of an
         attribute. */
      button.onclick = (function (index) {
        return function () { answer(index); };
      }(i));

      choice.appendChild(button);
      list.appendChild(choice);
    }

    stage.appendChild(list);

    /* Do not steal focus for the FIRST question on a fresh page, the reader
       is still scrolling the story and being yanked down to the quiz would be
       rude. Once they are inside the quiz they expect it, and that includes
       question one of a replay, which they reached by pressing a button that
       no longer exists. */
    if (current > 0 || replay) { heading.focus(); }
  }

  /* --- answering ----------------------------------------------------------- */

  function answer(index) {
    if (locked) { return; }
    locked = true;

    picked[current] = index;

    /* Mark the press, and stop every button in the row from being pressed
       again during the beat before the next question. Double-clicking the
       same choice used to answer the NEXT question too. */
    var buttons = stage.querySelectorAll('.quiz__choice');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (i === index) { buttons[i].className = 'quiz__choice is-picked'; }
    }

    timer = window.setTimeout(function () {
      locked = false;
      current += 1;
      if (current < QUESTIONS.length) { renderQuestion(); }
      else { renderResults(); }
    }, ADVANCE_MS);
  }

  /* --- rendering: the score ------------------------------------------------ */

  function renderResults() {
    var score = 0;
    var i, item, chosen, right, row, mark, body, line;

    for (i = 0; i < QUESTIONS.length; i++) {
      if (picked[i] === QUESTIONS[i].answer) { score += 1; }
    }

    counter.textContent = 'Result';
    barFill.style.width = '100%';

    clear(stage);

    var head = el('div', 'quiz__score');
    head.setAttribute('tabindex', '-1');

    var big = el('p', 'quiz__score-figure');
    big.appendChild(el('strong', null, String(score)));
    big.appendChild(document.createTextNode(' out of ' + QUESTIONS.length));
    head.appendChild(big);

    head.appendChild(el('p', 'quiz__score-word', remark(score, QUESTIONS.length)));
    stage.appendChild(head);

    var list = el('ol', 'quiz__review');

    for (i = 0; i < QUESTIONS.length; i++) {
      item   = QUESTIONS[i];
      chosen = picked[i];
      right  = (chosen === item.answer);

      row = el('li', 'quiz__review-item ' + (right ? 'is-right' : 'is-wrong'));

      mark = el('span', 'quiz__mark', right ? '✅' : '❌');
      mark.setAttribute('aria-hidden', 'true');
      row.appendChild(mark);

      body = el('div', 'quiz__review-body');

      /* Spelled out for screen readers, which would otherwise read the emoji
         by whatever name their vendor gave it, or skip it entirely. */
      body.appendChild(el('span', 'u-visually-hidden',
        right ? 'Correct. ' : 'Incorrect. '));

      body.appendChild(el('p', 'quiz__review-q', (i + 1) + '. ' + item.q));

      line = el('p', 'quiz__review-answer');
      line.appendChild(el('span', 'quiz__review-label', 'Your answer: '));
      line.appendChild(document.createTextNode(
        chosen >= 0 && chosen < item.choices.length
          ? item.choices[chosen]
          : 'not answered'));
      body.appendChild(line);

      if (!right) {
        line = el('p', 'quiz__review-answer quiz__review-answer--correct');
        line.appendChild(el('span', 'quiz__review-label', 'Correct answer: '));
        line.appendChild(document.createTextNode(item.choices[item.answer]));
        body.appendChild(line);
      }

      row.appendChild(body);
      list.appendChild(row);
    }

    stage.appendChild(list);

    var again = el('button', 'quiz__again', 'Try the quiz again');
    again.type = 'button';
    again.onclick = function () { replay = true; start(); };
    stage.appendChild(again);

    head.focus();
  }

  /* A word on the score. Kept warm at the bottom end on purpose: this sits
     under a children's folk tale, and "0 out of 5" on its own is a hard thing
     to be handed. */
  function remark(score, total) {
    if (total === 0)      { return ''; }
    var share = score / total;
    if (share === 1)      { return 'Perfect, you read every word.'; }
    if (share >= 0.8)     { return 'Very good. You know this tale well.'; }
    if (share >= 0.5)     { return 'Not bad. Read it once more and try again.'; }
    return 'Give the story another read, then come back to this.';
  }

  /* --- run ----------------------------------------------------------------- */

  function start() {
    if (timer) { window.clearTimeout(timer); timer = null; }
    locked  = false;
    current = 0;
    picked  = [];
    for (var i = 0; i < QUESTIONS.length; i++) { picked.push(-1); }
    renderQuestion();
  }

  /* Swap the printed fallback for the interactive one. This is the last thing
     that happens: if anything above threw, the printed quiz is still standing
     and the reader still has something to answer. */
  clear(root);
  root.appendChild(shell);

  start();

}());
