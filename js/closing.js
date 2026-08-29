/* ===========================================================================
   closing.js, builds the credits grid on closing.html from window.STORIES
   ---------------------------------------------------------------------------
   Reading credits from the same manifest the story pages are generated from
   means the brief's per-member attribution requirement can only ever be
   satisfied in one place. There is no second list to forget to update.
   =========================================================================== */

(function () {
  'use strict';

  var stories = window.STORIES || [];
  var grid    = document.getElementById('credits-grid');

  if (!grid || !stories.length) { return; }

  /* The three the brief requires always print, with a dash where a name is
     missing - a visible gap is the honest state, not a hidden one.

     "Group members" is EXTRA, so it is marked optional and is skipped
     entirely on a story that has no roster. Printing it for everyone would
     pad four cards with a dash against a field their group never filled
     in, which reads as missing work rather than as an absent extra. */
  var ROLES = [
    { key: 'writer',       label: 'Written by' },
    { key: 'illustrator',  label: 'Illustrated by' },
    { key: 'narrator',     label: 'Narrated by' },
    { key: 'contributors', label: 'Group members', optional: true }
  ];

  var frag = document.createDocumentFragment();

  for (var i = 0; i < stories.length; i++) {
    var s = stories[i];

    var card = document.createElement('article');
    card.className = 'credits__card';

    var h = document.createElement('h3');
    h.textContent = s.id + '. ' + s.title;

    var g = document.createElement('span');
    g.className = 'credits__group';
    g.textContent = s.group;

    var dl = document.createElement('dl');

    for (var r = 0; r < ROLES.length; r++) {
      var value = s[ROLES[r].key];
      var text  = (value === null || value === undefined) ? '' : String(value).replace(/^\s+|\s+$/g, '');

      if (!text && ROLES[r].optional) { continue; }

      var dt = document.createElement('dt');
      dt.textContent = ROLES[r].label;

      var dd = document.createElement('dd');
      dd.textContent = text || '-';

      dl.appendChild(dt);
      dl.appendChild(dd);
    }

    card.appendChild(h);
    card.appendChild(g);
    card.appendChild(dl);
    frag.appendChild(card);
  }

  grid.appendChild(frag);

})();
