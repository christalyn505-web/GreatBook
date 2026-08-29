/* ===========================================================================
   GREAT BOOK - story manifest
   ===========================================================================

   This is DATA, not code. It is a .js file rather than .json on purpose:
   fetch() is blocked under file://, so the manifest has to arrive through a
   <script> tag. The browser reads it directly; the build script reads the
   same file.

   THE VALUES BELOW ARE STRICT JSON - quoted keys, no comments inside the
   literals, no trailing commas. Keep it that way: the build script parses
   this file, and it will refuse to run if the JSON is malformed.

   ---------------------------------------------------------------------------
   AFTER EDITING THIS FILE, REBUILD:   double-click  build.bat
   ---------------------------------------------------------------------------

   FIELDS
     id            two digits, unique          "01"
     slug          filename without .html      "story-01"  -> story-01.html
     title         English title. This is the main heading.
     titleFil      the tale's original Filipino name, shown small underneath.
                   Optional - leave "" to show nothing.
     subtitle      one sentence under the title, saying what the tale is about.
                   Group 1 wrote theirs as the note under their moral. Optional
                   - leave "" and nothing is printed, not even an empty line.
     group         "Title with Group Name" from the plan
     writer        credited on the page - required by the brief
     illustrator   credited under the illustration - required by the brief
     narrator      credited under the audio player - required by the brief
     contributors  optional. The group's own roster, printed as an extra
                   "Group members" row on the closing page's credits card.
                   Leave it out and NO ROW APPEARS - unlike the three above
                   it is not padded with a dash, because a dash against a
                   field a group never filled in reads as missing work.
     cover         relative path. The group's COVER image - the one with the
                   title painted into it. Used ONLY by the marquee card in the
                   table of contents. Leave "" and the marquee falls back to
                   "illustration".
     illustration  relative path. The group's FRONT image - the first page of
                   the story. This is what the story page shows, and what its
                   blurred backdrop and byline avatar are made from.
     audio         relative path, mono mp3. Leave "" if the story uses "video".
     video         relative path to an mp4, for a group who recorded a narrated
                   ANIMATION rather than a voice track. Optional, and mutually
                   exclusive with "audio": set it and the page shows a video
                   player with native controls instead of the mp3 transport.
                   Story 03 is the one that uses this.
     quiz          the story's multiple-choice quiz - see below
     moral         one sentence, English
     body          the story, read top to bottom. See "THE BODY" below.
     paragraphLimit  optional. Raises this story's paragraph cap above the
                   brief's four. See "THE BODY". Every build warns when a
                   story sets it, on purpose.

   THE BODY
   ---------------------------------------------------------------------------
   "body" is a MIXED list, read top to bottom, exactly as it appears on the
   page. There are two kinds of entry:

     a string        a PARAGRAPH of the story.

     an object       a PANEL - one of the group's own storyboard drawings,
                     printed between the paragraphs:

                       { "image": "./assets/img/01-s2.jpg",
                         "alt":   "what the picture shows" }

   Every group hands in a picture book: a drawing, then the words for that
   drawing, over and over. This is how that flow survives onto the page. Put
   each panel next to the sentences it illustrates and the story reads the way
   the group drew it.

   FOUR PARAGRAPHS is the brief's limit and the default, and the build fails
   if a story exceeds its own cap. PANELS DO NOT COUNT toward it - a picture is
   not a paragraph.

   A story may raise the cap with "paragraphLimit". Story 01 does, and here is
   the reasoning, because it is the brief's rule being traded away:

     Group 1's flow is SEVEN blocks of text, each with its own drawing or
     two. Four paragraphs means merging those seven blocks into four, which
     leaves drawings stacked three and four deep with no words between
     them. Their hand-in is a picture book and it stops reading like one.

   So story 01 prints one text block per beat of the story, seven of them,
   with its twelve drawings threaded between - one where a beat has a single
   picture, two where the group drew the moment twice. The paragraph count is
   what the cap governs; PANELS ARE FREE.
   THE BUILD WARNS ABOUT THIS ON EVERY RUN and that warning is meant to stay:
   if the brief turns out to be strict about the number, merge the blocks back
   and drop "paragraphLimit". Nothing else has to change.

   The story's own "illustration" is already printed above the body, with the
   illustrator's credit, and that position is fixed by the brief. It is the
   group's FIRST panel, so start the body list at their SECOND one or the
   opening picture appears twice.

   "alt" is not optional in practice. Leave it out and the build warns, and a
   reader using a screen reader - or anyone whose image failed to load - gets
   a file name where a picture should be.

   THE QUIZ
   ---------------------------------------------------------------------------
   The quiz is PLAYED ON THE PAGE. It used to be a link out to a Google Form;
   it is now a scored, one-question-at-a-time quiz that needs no internet and
   no sign-in, which is the whole point - the grader double-clicks the file.

     "quiz": [
       {
         "q":       "the question, asked in full",
         "choices": ["first", "second", "third", "fourth"],
         "answer":  1
       }
     ]

   "answer" is a ZERO-BASED INDEX into "choices". 0 is the first choice,
   1 the second, and so on. Getting this off by one is the single easiest
   mistake to make here, so the build checks that it is a whole number and
   that it actually points at a choice - but it cannot check that you picked
   the RIGHT one. Read them back once after editing.

   Four choices per question is the house style. The build warns, but does
   not stop, if a question has some other number.

   Leave "quiz": [] and the page shows an honest "not written yet" state
   instead of an empty box.

   NOTE ON SECRECY: the answers are in the page, because a static site has
   nowhere else to put them. Anyone who opens View Source can read them.
   That is fine for a reading-comprehension quiz and is not fixable without
   a server, which this project deliberately does not have.

   RULES THE BUILD ENFORCES (it stops and writes nothing if you break them)
     - body has between 1 and 4 paragraphs
     - id is two digits and unique
     - slug is unique, lowercase, hyphens only
     - title, group, writer, illustrator, narrator are all non-empty
     - every quiz question has text, at least two choices, and an "answer"
       index that points at one of them

   Missing assets and leftover TODOs are reported as warnings, not errors,
   so you can keep building while the artwork and recordings come in.
   =========================================================================== */

window.STORIES = [

  {
    "id": "01",
    "slug": "story-01",
    "title": "Someday, Little Carabao Will Know",
    "titleFil": "",
    "subtitle": "The story reflects the Filipino value of bayanihan, where people help one another and share their strength, especially during difficult times.",
    "group": "Group 1",
    "writer": "Clarizze Andrea Mae Nieves, Sabina Kristina Nuestro, Ryan Sagun, and Jilliane Satera",
    "illustrator": "Josh Pagaduan",
    "narrator": "Hershey Mangahas, Sabina Kristina Nuestro, and Ryan Sagun",
    "contributors": "Josh Pagaduan, Sabina Kristina Nuestro, Clarizze Andrea Mae Nieves, and Jilliane Satera",
    "cover": "./assets/img/01-cover.jpg",
    "illustration": "./assets/img/01.jpg",
    "audio": "./assets/audio/01.mp3",
    "video": "",
    "moral": "Bayanihan makes every burden lighter.",
    "paragraphLimit": 7,
    "body": [
      "In a quiet Filipino village surrounded by green rice fields, where the air whistles softly, there lived a young carabao named Bago and his mother, Nanay Tala. Every morning Nanay Tala would wake early, earlier than the sun, and she would wake Bago before the sun rose. “Come, anak, we need to help at the barrio,” she would say.",
      { "image": "./assets/img/01-s2.jpg", "alt": "Nanay Tala says “let me help you” to four villagers holding baskets of produce, while a question mark hangs over Bago’s head." },
      { "image": "./assets/img/01-s3.jpg", "alt": "Bago wonders “huh? why do nanay keeps helping?” as Nanay Tala offers “let me help you” to a farmer and a young rice picker." },
      "Bago would follow his mother through the village, but he would often wonder why she always stopped to help others.",
      { "image": "./assets/img/01-s4.jpg", "alt": "Nanay Tala calls “Come anak, we need to help at the Barrio” while Bago dozes beside the nipa hut in the rice field." },
      "She helped the farmers carry heavy bundles of vegetables. She would share their food with hungry goats. She would help the smallest animals cross the muddy road.",
      { "image": "./assets/img/01-s5.jpg", "alt": "Bago asks “Nanay, why do you always help them?” and Nanay Tala answers “Someday, you will understand.”" },
      "One morning Bago asked, “Nanay, why do you always help everyone? What benefit will you receive? Aren’t you tired?” Nanay Tala smiled. “Of course I get tired, anak, but life is easier when we help one another.” “But what if they never help us back?” Bago asked. Nanay Tala gently touched his head with hers. “Helping is not always about getting something in return. Someday you will understand.” But Bago did not completely understand.",
      { "image": "./assets/img/01-s6.jpg", "alt": "Lightning over the flooding field. Nanay Tala asks “what should we do, anak?” as an idea lights up above Bago and the rabbit, monkey, turtle and bird call for help from the last dry ground." },
      { "image": "./assets/img/01-s7.jpg", "alt": "Rain falls across the field and the animals scatter, a basket spilled beside the goat and the monkey crying out." },
      "As the years passed, Bago grew bigger and stronger. One rainy afternoon a strong storm flooded the village. The animals struggled to move their food and belongings to a safer place. Bago stood at the edge of the field. He remembered all the times he had watched his mother help others. Then he stepped forward. “Come on, let’s help each other,” he called. There, the animals worked together, the birds carried small twigs, the goats pulled ropes, the monkeys gathered the food, and Bago used his strength to carry the heaviest things. By the time the rain stopped, everyone was safe.",
      { "image": "./assets/img/01-s8.jpg", "alt": "The animals work together in the rain: Bago hauls a chain with the goat, the birds carry twigs, and Nanay Tala carries the heaviest basket." },
      { "image": "./assets/img/01-s9.jpg", "alt": "Mother and son out in the barrio, among a farmer with a basket, a woman on a tractor, a man carrying vegetables on a shoulder pole, a monkey, a rabbit and a goat." },
      "Upon looking, Bago saw Nanay Tala watching her son with a proud look. “You finally understand. That someday has finally arrived,” she said. Bago looked at her. “I think I do, Nanay,” he answered. “What did you learn?” Bago smiled. “That being strong isn’t only about being able to carry something heavy.” He looked around. “Sometimes being strong means being there for someone who needs you.” Nanay Tala smiled. “That is what bayanihan means, anak.”",
      { "image": "./assets/img/01-s10.jpg", "alt": "Bago, now grown, stands in the rice field beside a small pale carabao." },
      { "image": "./assets/img/01-s11.jpg", "alt": "A farmer and his wife carry heavy baskets of vegetables and fruit past Bago and a small pale carabao." },
      "Years later, Bago would become a father himself, and whenever his son asked why he always stopped for others, Bago would always answer, “Someday, you will understand.” And just as his mother had taught him, he would teach his child that no one should have to carry life’s burdens alone, because at the end of the day, bayanihan exists, and every person has a heart willing to lend a hand. For in every helping hand a little kindness is passed on, and through every act of kindness the love of a person lives on.",
      { "image": "./assets/img/01-s12.jpg", "alt": "The End, painted in the sky above the green field and the flowering bush." }
    ],
    "quiz": [
      {
        "q": "Who is the main character of the story?",
        "choices": ["Bago", "Goat", "Cat", "Monkey"],
        "answer": 0
      },
      {
        "q": "Who is Bago’s mother?",
        "choices": ["Nanay Maya", "Nanay Tala", "Nanay Luna", "Nanay Rosa"],
        "answer": 1
      },
      {
        "q": "What did Nanay Tala always do?",
        "choices": ["Sleep", "Play", "Help others", "Travel"],
        "answer": 2
      },
      {
        "q": "What happened to the village?",
        "choices": [
          "A strong storm flooded the village",
          "It became very hot",
          "The animals left",
          "Nothing happened"
        ],
        "answer": 0
      },
      {
        "q": "What Filipino value did Bago learn?",
        "choices": ["Katamaran", "Pagmamataas", "Bayanihan", "Pagiging makasarili"],
        "answer": 2
      }
    ]
  },

  {
    "id": "02",
    "slug": "story-02",
    "title": "The Wish",
    "titleFil": "",
    "subtitle": "",
    "group": "Group 2",
    "writer": "Jhaydee Aceña",
    "illustrator": "Danny Andi Jr. and Ashley Gutierrez",
    "narrator": "Jhaydee Aceña, Mary Ann Casalhay, John Bernard De Guzman, and Ayesha Sultan",
    "cover": "./assets/img/02-cover.jpg",
    "illustration": "./assets/img/02.jpg",
    "audio": "./assets/audio/02.mp3",
    "video": "",
    "moral": "Wanting what others have makes you blind to your own blessings, be happy with who you are.",
    "paragraphLimit": 6,
    "body": [
      "Cockcock the chicken lived on a peaceful farm. Every single day, he ate rice and seeds, took naps, and walked around the dusty yard. Agila the eagle lived high in the mountains. Every single day, he flew across the sky and hunted for fish to eat.",
      { "image": "./assets/img/02-s2.jpg", "alt": "The eagle sneers down at the rooster across two speech bubbles, each bird calling the other’s life the lazy and easy one." },
      "One hot day, Agila flew down to the farm and saw Cockcock eating. “Your life is so lazy and easy!” Agila mocked. “You just eat and sleep all day!” Cockcock got angry and clucked back, “You are the one with the easy life! You have no owner, no cage, and you can fly anywhere you want!” They argued and argued. Finally, Agila said, “If I were you, I would love that easy chicken life!” Cockcock snapped back, “If I were you, I would love flying freely!” Cockcock jokingly wished that they could swap bodies. Agila the eagle had the same thought, but he did not say it. They both walked away, not knowing that the god named Lakapati had heard their wish.",
      { "image": "./assets/img/02-s3.jpg", "alt": "A dark bird tumbles headfirst out of a tall leafy tree in a burst of loose feathers, shouting in alarm." },
      "The next morning, Cockcock woke up falling from a very tall tree! He flapped his wings in panic and flew, he was shocked! When he looked at his reflection in the river, he saw an eagle’s sharp face. He was now Agila! Meanwhile, Agila the eagle woke up inside the dirty chicken coop. He pecked at the grains the farmer gave him. When he drank water from a puddle, he saw a chicken’s round face, he was now Cockcock! At first, both were very excited.",
      { "image": "./assets/img/02-s4.jpg", "alt": "A rooster stares at his own reflection in a tall oval mirror, scowling back at himself against a patch of blue sky." },
      "As the days passed, things became awful. Cockcock (now an eagle) was always starving because he did not know how to hunt. He also kept running away from hunters who wanted to catch him. Agila (now a chicken) was forced by the farmer’s nephew to fight other roosters in the “sabong” (cockfighting) pit. He got cuts and bruises every single day, and he was locked in a tiny cage. He was so bored and tired.",
      { "image": "./assets/img/02-s5.jpg", "alt": "The eagle and the rooster stand side by side in bloodied bandages, one thinking that he is starving and the other that he is exhausted." },
      "One sad afternoon, the tired and wounded Agila (in the chicken’s body) pecked his way to the farm fence. At the same time, the weak and hungry Cockcock (in the eagle’s body) landed on that same fence. They stared at each other and saw how broken and miserable the other one was. They both started crying and said sorry. They realized they had been so wrong to mock each other’s lives. The eagle’s freedom was dangerous and hungry, while the chicken’s safety came with a cage and painful fights. They both prayed to Lakapati, begging to go back to their own bodies. They promised to never wish for someone else’s life again.",
      { "image": "./assets/img/02-s6.jpg", "alt": "Two open hands reach down through the clouds in a shaft of golden light, speech bubbles beside them carrying Lakapati’s words about being happy with who you are." },
      "The kind spirit Lakapati heard their sad prayers. She appeared in a swirl of golden rice and said, “Wanting what others have makes you blind to your own blessings. Be happy with who you are.” She waved her hand, and in a blink, they were back to their real bodies! Cockcock woke up on the farm, hugged his fellow chickens, and happily ate his simple rice. Agila woke up on his mountain rock, spread his strong wings, and joyfully flew over the river. They both learned a very important lesson: being someone you are not can cost you who you are. They never wished to trade places again.",
      { "image": "./assets/img/02-s7.jpg", "alt": "An eagle’s wing and a rooster’s wing clasped together in a handshake over the words THE END." }
    ],
    "quiz": [
      {
        "q": "What dangerous Filipino practice did Agila (as the chicken) have to do every day?",
        "choices": [
          "Fighting with other birds",
          "Training with other roosters",
          "Cockfighting / Sabong",
          "Competing with other chickens"
        ],
        "answer": 2
      },
      {
        "q": "What food did the farmer give the chicken to eat on the farm?",
        "choices": [
          "Rice and vegetables",
          "Rice and seeds/grains",
          "Seeds and fruits",
          "Grains and vegetables"
        ],
        "answer": 1
      },
      {
        "q": "Why was Cockcock (now the eagle) always hungry and weak?",
        "choices": [
          "Because he was used to being fed and did not know how to hunt.",
          "Because he was used to hunting but did not know how to eat.",
          "Because he was used to eating and did not know how to fly.",
          "Because he was used to flying but did not know how to hunt."
        ],
        "answer": 0
      },
      {
        "q": "What did the chicken and eagle learn at the end of the story?",
        "choices": [
          "To be happy with their own life and avoid fighting others.",
          "To be happy with who they are and not envy another animal’s life.",
          "To accept their differences and follow each other’s lifestyle.",
          "To appreciate their lives but still wish to have what others have."
        ],
        "answer": 1
      },
      {
        "q": "In the story, Agila (who was now a chicken) was put inside a ring to fight other roosters. What traditional Filipino event is this called?",
        "choices": [
          "Fiesta, which is a big town festival with parades",
          "Sabong, a cockfight where roosters battle each other",
          "Harana, a serenade sung outside a loved one’s window",
          "Palayok, a game where you break a clay pot blindfolded"
        ],
        "answer": 1
      }
    ]
  },

  {
    "id": "03",
    "slug": "story-03",
    "title": "The Philippine Eagle and the Right Wind",
    "titleFil": "",
    "subtitle": "",
    "group": "Group 3",
    "writer": "Modina and Jotojot",
    "illustrator": "Gaton, Historillo, and Dimacali",
    "narrator": "Moyon and Mariano",
    "cover": "./assets/img/03-cover.jpg",
    "illustration": "./assets/img/03.jpg",
    "audio": "",
    "video": "./assets/video/03.mp4",
    "moral": "True strength comes from patience, wisdom, and staying focused on your goals, instead of rushing and letting pride lead you into danger.",
    "paragraphLimit": 9,
    "body": [
      "Once upon a time, on a rainy day with a gentle breeze, a Philippine eagle named Mutya was worried about her eaglets, who were crying from hunger. “Scree! Screech… scree!” the eaglets cried.",
      { "image": "./assets/img/03-s1.jpg", "alt": "A rainy village of rice fields, farmers and a nipa hut on the left, and on the right Mutya perched at her cliffside nest where three eaglets cry out." },
      "Determined, she decided to fly down from her cliffside nest to search for something to eat. As she scanned the area from high above, she spotted a fish swimming in a small pond below. She dived down immediately and gripped the fish with her strong claws. “Finally! I can feed my babies!” she said happily, excited to return to her nest.",
      { "image": "./assets/img/03-s2.jpg", "alt": "Mutya lifts a silver fish out of a rain-dimpled pond, thinking “Finally! I can feed my babies!”" },
      "However, on her way back the wind suddenly became violently strong, and a heavy storm came towards her path, blocking her way. “Oh no…” she said worriedly.",
      { "image": "./assets/img/03-s3.jpg", "alt": "Mutya stops on a rock with the fish at her feet and cries “Oh no!” as lightning forks down the green mountain behind her." },
      "Even though she was desperate to return to her starving eaglets, she chose to land on a tree branch, thinking that if she tried to fight the violent storm she might get injured and end up unable to return home at all. So she decided to wait until the storm passed.",
      { "image": "./assets/img/03-s4.jpg", "alt": "Mutya waits out the downpour on a bare branch at the edge of a grey lake, the fish tucked beside her feet." },
      "While she was waiting, a crow named Siklab suddenly appeared. True to her nature, Siklab mocked her, saying, “Hey, Mutya! Aren’t you supposed to be strong and unstoppable? Why not fly with me through the storm?”",
      { "image": "./assets/img/03-s5.jpg", "alt": "Siklab the crow hovers over the water taunting Mutya, who answers only with a silent “…” from her branch." },
      "Mutya remained silent, as she always did. She did not want to waste her energy, because her only goal was to ensure a safe return home to feed her hungry eaglets. Proclaiming herself to be much braver, Siklab recklessly flew straight into the violent winds. Unable to handle the violent weather, Siklab quickly lost control and fell down towards the ground.",
      { "image": "./assets/img/03-s6.jpg", "alt": "Siklab tumbles down towards the rocks beside a yellow lightning strike while Mutya keeps her grip on the branch." },
      "Meanwhile, Mutya held firmly onto the tree branch until the storm finally blew over. Once the skies cleared, she took flight with the fish in her beak.",
      { "image": "./assets/img/03-s7.jpg", "alt": "The storm gone and the sky blue again, Mutya flies out over the calm water carrying the fish." },
      "She returned safely to her nest, and fed her eaglets.",
      { "image": "./assets/img/03-s8.jpg", "alt": "Back at the cliff, Mutya sets a large fish in the nest as her three eaglets call out to her." },
      "They ate their food, and lived happily ever after.",
      { "image": "./assets/img/03-s9.jpg", "alt": "The village and the cliff under a rainbow, with “The End” painted in big yellow letters across the scene." }
    ],
    "quiz": [
      {
        "q": "Who was worried about her hungry eaglets?",
        "choices": [
          "Mutya the Philippine eagle",
          "Siklab the crow",
          "The fish in the pond",
          "The eaglets themselves"
        ],
        "answer": 0
      },
      {
        "q": "What did the eagle find in the pond?",
        "choices": ["A frog", "A fish", "A snake", "A fallen branch"],
        "answer": 1
      },
      {
        "q": "When did the eagle decide to wait on the tree branch?",
        "choices": [
          "Before she left her nest to hunt",
          "When a heavy storm blocked her way home",
          "After she had already fed her eaglets",
          "When Siklab invited her to race"
        ],
        "answer": 1
      },
      {
        "q": "Where did the eagle land while waiting for the storm to pass?",
        "choices": [
          "On a tree branch",
          "Back in her cliffside nest",
          "Beside the small pond",
          "On the ground below"
        ],
        "answer": 0
      },
      {
        "q": "Why did the eagle choose not to fly through the violent storm?",
        "choices": [
          "Because she was afraid of Siklab",
          "Because she had already lost the fish",
          "Because she might get injured and never make it home to her eaglets",
          "Because crows are faster fliers than eagles"
        ],
        "answer": 2
      }
    ]
  },

  {
    "id": "04",
    "slug": "story-04",
    "title": "The Alitaptap and the Parol",
    "titleFil": "",
    "subtitle": "",
    "group": "Group 4",
    "writer": "Nathaniel S. Nicodemus, Krystel Kyle L. Filoteo, and Marklex V. Baning",
    "illustrator": "Princess Eunice M. Buenaobra",
    "narrator": "Krystel Kyle L. Filoteo and Marklex V. Baning",
    "cover": "./assets/img/04-cover.jpg",
    "illustration": "./assets/img/04-cover.jpg",
    "audio": "./assets/audio/04.mp3",
    "video": "",
    "moral": "You should never insult others, no matter how small someone may seem, because they are capable of making a big difference.",
    "paragraphLimit": 7,
    "body": [
      "Once upon a time in a small town called San Jose, the ber months season came and there lived a colorful and bright Parol named “Bituin”. She views the alitaptaps as weak and useless because of their tiny bodies and dull light, for she believes that she’s the most important light in the town because she possesses the brightest glow. “Twinkle twinkle twinkle poor little alitaptaps, completely worthless and too small to be recognized by the others!” said Bituin as she shows off her powerful majestic light.",
      { "image": "./assets/img/04.jpg", "alt": "Bituin the parol glows smugly in the middle of the lit plaza with her hands on her hips, children dancing round her with tambourines, and a small dejected alitaptap hovering at her side." },
      "But on Christmas Eve, when the town people were preparing for Noche Buena after attending Simbang Gabi…",
      { "image": "./assets/img/04-s3.jpg", "alt": "The town plaza on Christmas Eve with its lanterns and string lights burning, children caroling with tambourines, neighbours cooking at a long table, and Bituin the parol glowing proudly at the right." },
      "…a sudden blackout occurred while a few kids were doing their pangangaroling. With no source of energy to serve as the town’s power, Bituin stared in shame at the confused people for being unable to serve as their light. “WAAAAA!” a sudden cry of a child was heard from a distance.",
      { "image": "./assets/img/04-s4.jpg", "alt": "The same plaza in darkness after the blackout, the children startled mid-carol, the food left on the table, and Bituin covering her face in shame as a cry of “WAHHH!” goes up." },
      "In curiosity, Ilaw the alitaptap approached the sobbing kid and asked “Blink blink blink what’s wrong my dear friend?” The kid then replied “I lost my parents when I was doing my Christmas carols and now I can’t find them because there’s no lights!” he cried even more while explaining to Ilaw. “Don’t worry my friend, I will ask my fellow alitaptap to help you! What’s your name?” Ilaw asked the kid while reassuring him. With light sniffles, the kid replied “I’m Gabriel.”",
      { "image": "./assets/img/04-s2.jpg", "alt": "Ilaw the firefly glides over a dark field where dozens of tiny alitaptaps glow in the grass beneath a crescent moon." },
      { "image": "./assets/img/04-s5.jpg", "alt": "Gabriel stands crying outside a darkened house while Ilaw the firefly flies up to him, his little lamp the only light on the ground." },
      "With the help of Ilaw and his fellow alitaptaps who created a glowing path to guide Gabriel, they eventually found his parents.",
      { "image": "./assets/img/04-s6.jpg", "alt": "Gabriel laughs with Ilaw in the middle of a field where his fellow alitaptaps have lit up all around the two of them." },
      "“Nanay! Tatay! Mano po!” said Gabriel in excitement as he approached his parents and took their hands to his forehead.",
      { "image": "./assets/img/04-s7.jpg", "alt": "Gabriel takes his father’s hand to his forehead in a mano po while his mother stands smiling beside them and a firefly glows at her skirt." },
      "“Oh Gabriel, we were so worried!” Tatay said to express his relief as they both hugged Gabriel. “Thank you fireflies! We don’t know how else we were going to find Gabriel if none of you were there to light the way!” Nanay said with gratitude. Bituin, who was watching the whole moment unfold while still being unable to light up, realized that one should never insult another because no matter how small someone can be, they’re capable of creating a big difference.",
      { "image": "./assets/img/04-s8.jpg", "alt": "Gabriel hugs his father while his mother clasps her hands in thanks, fireflies fill the yard, and an unlit Bituin watches sadly from among the buntings above." }
    ],
    "quiz": [
      {
        "q": "Who was the colorful and bright parol in the story?",
        "choices": ["Ilaw", "Bituin", "Gabriel", "Nanay"],
        "answer": 1
      },
      {
        "q": "Why did Bituin look down on the alitaptaps?",
        "choices": [
          "They were noisy",
          "They were too small and had dull lights",
          "They lived far away",
          "They could not fly"
        ],
        "answer": 1
      },
      {
        "q": "What happened on Christmas Eve?",
        "choices": [
          "It rained heavily",
          "A fire started",
          "A sudden blackout occurred",
          "The town had a party"
        ],
        "answer": 2
      },
      {
        "q": "Who was the lost child?",
        "choices": ["Gabriel", "Ilaw", "Bituin", "Tatay"],
        "answer": 0
      },
      {
        "q": "How did Ilaw and the other alitaptaps help Gabriel?",
        "choices": [
          "They carried him home",
          "They created a glowing path to guide him",
          "They called his parents",
          "They gave him a parol"
        ],
        "answer": 1
      }
    ]
  },

  {
    "id": "05",
    "slug": "story-05",
    "title": "A Festival to Remember",
    "titleFil": "",
    "subtitle": "",
    "group": "Group 5",
    "writer": "Leo Kid Gregorio",
    "illustrator": "Alianah Mischa Bigting and Marian Brusas",
    "narrator": "Glesy Casino",
    "cover": "./assets/img/05-cover.jpg",
    "illustration": "./assets/img/05.jpg",
    "audio": "./assets/audio/05.mp3",
    "video": "",
    "moral": "Helping, sharing, and remembering where we came from are traditions worth carrying home.",
    "body": [
      "Once upon a time, there were four unlikely friends living in a peaceful village in Aklan, alongside the villagers. Bago the carabao was strong and always ready to help, but he kept to himself. Kiko the monkey was playful and adventurous, forever climbing trees, exploring, and asking questions. Tala the rabbit was quiet and observant, noticing things the others missed. And then there was Puti the dog, the spoiled one of the group, pampered by the villagers and happiest when she was eating, sleeping, and repeating the cycle.",
      { "image": "./assets/img/05-s2.jpg", "alt": "Two villagers hang colorful banderitas from a bamboo pole strung with an Ati-Atihan Festival banner, while Kiko, Puti, Bago and Tala watch from the street." },
      "One morning, the villagers began preparing for the Ati-Atihan festival. Colorful banderitas were strung across the streets, bamboo decorations went up, and the sound of drums could already be heard. “What are they doing?” Kiko asked. “They’re celebrating the Ati-Atihan festival, the villagers do it every year,” Puti replied. “Then let’s join in!” said Kiko. Tala cut in, “We’re not invited. We’re animals.” Bago looked at them and said, “Sometimes we don’t need an invitation to join, helping them is the least we can do.” Kiko raised an eyebrow. “What do you mean?” Bago glanced back at the village. “Look at the villagers, everyone is doing something. In a place where everyone is working, we help too. It’s not mandatory, but it’s a way to get along with others.”",
      { "image": "./assets/img/05-s3.jpg", "alt": "Puti stands on her hind legs to take a basket of fruit from an old man in the village street, with Bago, Tala and Kiko gathered around him under the festival banderitas." },
      "By afternoon, the village was ready. Kiko looked around and said, “So this is what they call bayanihan?” Tala smiled. “Yes.” Just then, Puti woke from her nap and saw an old man carrying a basket of fruits. She trotted over and offered to help him. “I thought you were the lazy one,” Kiko teased, “I never thought you’d help someone without even thinking about it.” The four of them laughed and went on celebrating the festival together.",
      { "image": "./assets/img/05-s4.jpg", "alt": "Costumed dancers perform in the village square under a full moon at the Ati-Atihan festival while Bago, Puti, Tala and Kiko watch from the foreground." },
      "By evening, Kiko asked, “So what is this whole event really about?” “About celebrating the festival, dancing, and more,” Puti said. Tala shook her head. “Not just that. It’s also about the people, remembering our culture, our history, and those who came before us.” Bago smiled. “See you all tomorrow, then?” “Sure, tomorrow,” the others agreed. Bago headed home first, and one by one, the rest followed."
    ],
    "quiz": [
      {
        "q": "Who was the strong and quiet carabao?",
        "choices": ["Kiko", "Bago", "Puti", "Tala"],
        "answer": 1
      },
      {
        "q": "What festival were the villagers preparing for?",
        "choices": ["Panagbenga", "Sinulog", "Ati-Atihan", "Pahiyas"],
        "answer": 2
      },
      {
        "q": "Who was the playful and adventurous monkey?",
        "choices": ["Tala", "Puti", "Kiko", "Bago"],
        "answer": 2
      },
      {
        "q": "What did Puti do when she saw an old man with a basket of fruits?",
        "choices": [
          "She ignored him.",
          "She went back to sleep.",
          "She offered to help him.",
          "She ate the fruits."
        ],
        "answer": 2
      },
      {
        "q": "What is the main lesson of the story?",
        "choices": [
          "Always sleep and eat.",
          "Helping, sharing, and remembering our culture are important.",
          "Animals should not join festivals.",
          "Festivals are only for dancing."
        ],
        "answer": 1
      }
    ]
  }

];


/* Site-wide metadata. Feeds the footer on every page - edit here only,
   then rebuild, and all pages update together. */

window.SITE = {
  "title": "GREAT BOOK",
  "subtitle": "Filipino Folk Tales, Illustrated and Narrated",
  "school": "Pambayang Dalubhasaan ng Marilao",
  "course": "TM11A",
  "instructor": "Josh Bernardo",
  "schoolYear": "2026-2027",
  "website": "Christalyn Calamanan"
};
