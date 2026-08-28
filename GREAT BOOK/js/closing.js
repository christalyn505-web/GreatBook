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

  var ROLES = [
    { key: 'writer',      label: 'Written by' },
    { key: 'illustrator', label: 'Illustrated by' },
    { key: 'narrator',    label: 'Narrated by' }
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
      var dt = document.createElement('dt');
      dt.textContent = ROLES[r].label;

      var dd = document.createElement('dd');
      dd.textContent = s[ROLES[r].key] || '-';

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
