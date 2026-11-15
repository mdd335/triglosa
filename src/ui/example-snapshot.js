/* The first steps' example as the reading window drew it, per interface
   language: written by scripts/example-snapshot.mjs, never by hand.
   `texts` are the original, the reader's translation and the other one;
   `sheet` the sheet as drawn; `hover` per word ("panel:start") the sign
   over it and the stretches lit, as [panel, start, end]; `picks` per word
   of the original the entry it brings, from `entries`: the three texts as
   then drawn, each as [characters kept in front, characters kept behind,
   what stands between] against `sheet`'s, and the pane under them. */

export const EXAMPLE_SNAPSHOT = {
 "de": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Obwohl es in Strömen regnete, gingen wir in der Altstadt spazieren.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "sheet": "<section class=\"pane\"><div class=\"label\"><span class=\"name\">Spanisch</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"0\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span><span class=\"g\" data-from=\"6\" data-to=\"7\"> </span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span></span><span class=\"g\" data-from=\"24\" data-to=\"26\">, </span><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span></span><span class=\"g\" data-from=\"33\" data-to=\"34\"> </span><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span><span class=\"g\" data-from=\"35\" data-to=\"36\"> </span><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span><span class=\"g\" data-from=\"42\" data-to=\"43\"> </span><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span><span class=\"g\" data-from=\"49\" data-to=\"50\"> </span><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span></span><span class=\"g\" data-from=\"63\" data-to=\"64\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"edit\" aria-label=\"Editieren\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11.2 2.6 13.4 4.8 5.6 12.6 3 13l.4-2.6z\"></path></svg><span class=\"pill-label\">Editieren</span></button><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Kopieren\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Kopieren</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Deutsch</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"1\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Obwohl</span><span class=\"g\" data-from=\"6\" data-to=\"7\"> </span><span class=\"w\" data-from=\"7\" data-to=\"9\">es</span><span class=\"g\" data-from=\"9\" data-to=\"10\"> </span><span class=\"mark wmark0\" data-mark-from=\"10\" data-mark-to=\"28\"><span class=\"w\" data-from=\"10\" data-to=\"12\">in</span><span class=\"g\" data-from=\"12\" data-to=\"13\"> </span><span class=\"w\" data-from=\"13\" data-to=\"20\">Strömen</span><span class=\"g\" data-from=\"20\" data-to=\"21\"> </span><span class=\"w\" data-from=\"21\" data-to=\"28\">regnete</span></span><span class=\"g\" data-from=\"28\" data-to=\"30\">, </span><span class=\"mark vmark0\" data-mark-from=\"30\" data-mark-to=\"36\"><span class=\"w\" data-from=\"30\" data-to=\"36\">gingen</span></span><span class=\"g\" data-from=\"36\" data-to=\"37\"> </span><span class=\"w\" data-from=\"37\" data-to=\"40\">wir</span><span class=\"g\" data-from=\"40\" data-to=\"41\"> </span><span class=\"w\" data-from=\"41\" data-to=\"43\">in</span><span class=\"g\" data-from=\"43\" data-to=\"44\"> </span><span class=\"w\" data-from=\"44\" data-to=\"47\">der</span><span class=\"g\" data-from=\"47\" data-to=\"48\"> </span><span class=\"mark wmark1\" data-mark-from=\"48\" data-mark-to=\"56\"><span class=\"w\" data-from=\"48\" data-to=\"56\">Altstadt</span></span><span class=\"g\" data-from=\"56\" data-to=\"57\"> </span><span class=\"w\" data-from=\"57\" data-to=\"66\">spazieren</span><span class=\"g\" data-from=\"66\" data-to=\"67\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Kopieren\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Kopieren</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Englisch</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"2\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span><span class=\"g\" data-from=\"8\" data-to=\"9\"> </span><span class=\"w\" data-from=\"9\" data-to=\"11\">it</span><span class=\"g\" data-from=\"11\" data-to=\"12\"> </span><span class=\"w\" data-from=\"12\" data-to=\"15\">was</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span></span><span class=\"g\" data-from=\"37\" data-to=\"39\">, </span><span class=\"w\" data-from=\"39\" data-to=\"41\">we</span><span class=\"g\" data-from=\"41\" data-to=\"42\"> </span><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span></span><span class=\"g\" data-from=\"50\" data-to=\"51\"> </span><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span><span class=\"g\" data-from=\"54\" data-to=\"55\"> </span><span class=\"w\" data-from=\"55\" data-to=\"56\">a</span><span class=\"g\" data-from=\"56\" data-to=\"57\"> </span><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span><span class=\"g\" data-from=\"61\" data-to=\"62\"> </span><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span><span class=\"g\" data-from=\"64\" data-to=\"65\"> </span><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span></span><span class=\"g\" data-from=\"77\" data-to=\"78\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Kopieren\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Kopieren</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Begriffe</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"wmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark0\">llover a cántaros</span><span class=\"equivalent\">in Strömen regnen</span></div><div class=\"explanation\">Sehr stark regnen, umgangssprachlich.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Suchen (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Suchen (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div><div class=\"row\" data-hl=\"wmark1\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark1\">casco antiguo</span><span class=\"equivalent\">Altstadt</span></div><div class=\"explanation\">Der historische Kern einer Stadt.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Suchen (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Suchen (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Verben</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"vmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark vmark0\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">hinausgehen</span><span class=\"grammar\">1. Person Plural · Indefinido</span></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Konjugation (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Konjugation (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>",
  "hover": {
   "0:0": [
    "Obwohl",
    [
     [0,0,6],
     [1,0,6],
     [2,0,8]
    ]
   ],
   "0:7": [
    "in Strömen regnete",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "0:14": [
    "in Strömen regnete",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "0:16": [
    "in Strömen regnete",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "0:26": [
    "gingen",
    [
     [0,26,33],
     [1,30,36],
     [2,42,50]
    ]
   ],
   "0:34": [
    "spazieren",
    [
     [0,34,42],
     [1,57,66],
     [2,51,61]
    ]
   ],
   "0:36": [
    "spazieren",
    [
     [0,34,42],
     [1,57,66],
     [2,51,61]
    ]
   ],
   "0:43": [
    "in",
    [
     [0,43,46],
     [1,41,43],
     [2,62,64]
    ]
   ],
   "0:47": [
    "der",
    [
     [0,47,49],
     [1,44,47],
     [2,65,68]
    ]
   ],
   "0:50": [
    "Altstadt",
    [
     [0,50,63],
     [1,48,56],
     [2,69,77]
    ]
   ],
   "0:56": [
    "Altstadt",
    [
     [0,50,63],
     [1,48,56],
     [2,69,77]
    ]
   ],
   "1:0": [
    "",
    [
     [0,0,6],
     [1,0,6],
     [2,0,8]
    ]
   ],
   "1:10": [
    "",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "1:13": [
    "",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "1:21": [
    "",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "1:30": [
    "",
    [
     [0,26,33],
     [1,30,36],
     [2,42,50]
    ]
   ],
   "1:41": [
    "",
    [
     [0,43,46],
     [1,41,43],
     [2,62,64]
    ]
   ],
   "1:44": [
    "",
    [
     [0,47,49],
     [1,44,47],
     [2,65,68]
    ]
   ],
   "1:48": [
    "",
    [
     [0,50,63],
     [1,48,56],
     [2,69,77]
    ]
   ],
   "1:57": [
    "",
    [
     [0,34,42],
     [1,57,66],
     [2,51,61]
    ]
   ],
   "2:0": [
    "Obwohl",
    [
     [0,0,6],
     [1,0,6],
     [2,0,8]
    ]
   ],
   "2:16": [
    "in Strömen regnete",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "2:24": [
    "in Strömen regnete",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "2:29": [
    "in Strömen regnete",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "2:33": [
    "in Strömen regnete",
    [
     [0,7,24],
     [1,10,28],
     [2,16,37]
    ]
   ],
   "2:42": [
    "gingen",
    [
     [0,26,33],
     [1,30,36],
     [2,42,50]
    ]
   ],
   "2:47": [
    "gingen",
    [
     [0,26,33],
     [1,30,36],
     [2,42,50]
    ]
   ],
   "2:51": [
    "spazieren",
    [
     [0,34,42],
     [1,57,66],
     [2,51,61]
    ]
   ],
   "2:55": [
    "spazieren",
    [
     [0,34,42],
     [1,57,66],
     [2,51,61]
    ]
   ],
   "2:57": [
    "spazieren",
    [
     [0,34,42],
     [1,57,66],
     [2,51,61]
    ]
   ],
   "2:62": [
    "in",
    [
     [0,43,46],
     [1,41,43],
     [2,62,64]
    ]
   ],
   "2:65": [
    "der",
    [
     [0,47,49],
     [1,44,47],
     [2,65,68]
    ]
   ],
   "2:69": [
    "Altstadt",
    [
     [0,50,63],
     [1,48,56],
     [2,69,77]
    ]
   ],
   "2:73": [
    "Altstadt",
    [
     [0,50,63],
     [1,48,56],
     [2,69,77]
    ]
   ]
  },
  "picks": {
   "0": 0,
   "7": 1,
   "14": 2,
   "16": 1,
   "26": 3,
   "34": 4,
   "36": 5,
   "43": 6,
   "47": 7,
   "50": 8,
   "56": 8
  },
  "entries": [
   {
    "boxes": [
     [
      13,
      1345,
      "sel picked\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span>"
     ],
     [
      13,
      1347,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Obwohl</span>"
     ],
     [
      13,
      1970,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Auswahl · Spanisch</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">Aunque</span><span class=\"equivalent\">obwohl</span><span class=\"grammar\">Konjunktion</span></div><div class=\"explanation\">Leitet einen Gegensatz ein, der am Folgenden nichts ändert.</div><div class=\"synonyms\"><span class=\"label\">sinnverwandt</span><button class=\"synonym\">si bien</button><button class=\"synonym\">aun cuando</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Suchen (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Suchen (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      118,
      961,
      "sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span>"
     ],
     [
      220,
      858,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"10\" data-mark-to=\"28\"><span class=\"w\" data-from=\"10\" data-to=\"12\">in</span><span class=\"g\" data-from=\"12\" data-to=\"13\"> </span><span class=\"w\" data-from=\"13\" data-to=\"20\">Strömen</span><span class=\"g\" data-from=\"20\" data-to=\"21\"> </span><span class=\"w\" data-from=\"21\" data-to=\"28\">regnete</span>"
     ],
     [
      330,
      1268,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Auswahl · Spanisch</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">llovía a cántaros</span><span class=\"arrow\">→</span><span class=\"base\">llover a cántaros</span><span class=\"equivalent\">in Strömen regnen</span><span class=\"grammar\">3. Person Singular · Imperfecto</span></div><div class=\"explanation\">Sehr stark regnen, umgangssprachlich.</div><div class=\"synonyms\"><span class=\"label\">sinnverwandt</span><button class=\"synonym\">diluviar</button><button class=\"synonym\">llover a mares</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Konjugation (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Konjugation (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      277,
      1066,
      "/span><span class=\"sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span></span></span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\""
     ],
     [
      1395,
      0,
      ""
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Auswahl · Spanisch</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"equivalent\">zu</span><span class=\"grammar\">Präposition</span></div><div class=\"explanation\">Zeigt nach einem Verb der Bewegung an, was man vorhat.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Suchen (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Suchen (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      512,
      779,
      "sel picked\"><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span>"
     ],
     [
      617,
      677,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"30\" data-mark-to=\"36\"><span class=\"w\" data-from=\"30\" data-to=\"36\">gingen</span>"
     ],
     [
      937,
      878,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Auswahl · Spanisch</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">hinausgehen</span><span class=\"grammar\">1. Person Plural · Indefinido</span></div><div class=\"explanation\">Einen Ort verlassen, hier, um spazieren zu gehen.</div><div class=\"synonyms\"><span class=\"label\">sinnverwandt</span><button class=\"synonym\">irse</button><button class=\"synonym\">marcharse</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Konjugation (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Konjugation (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      693,
      668,
      "sel picked\"><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span>"
     ],
     [
      1395,
      0,
      ""
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Auswahl · Spanisch</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"equivalent\">zu</span><span class=\"grammar\">Präposition</span></div><div class=\"explanation\">Zeigt nach einem Verb der Bewegung an, was man vorhat.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Suchen (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Suchen (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      797,
      559,
      "sel picked\"><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span>"
     ],
     [
      1296,
      59,
      "sel\"><span class=\"w\" data-from=\"57\" data-to=\"66\">spazieren</span>"
     ],
     [
      1431,
      554,
      "sel\"><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Auswahl · Spanisch</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">pasear</span><span class=\"equivalent\">spazieren gehen</span></div><div class=\"explanation\">Zu Fuß unterwegs sein, ohne Eile und zum Vergnügen.</div><div class=\"synonyms\"><span class=\"label\">sinnverwandt</span><button class=\"synonym\">caminar</button><button class=\"synonym\">andar</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Konjugation (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Konjugation (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      906,
      453,
      "sel picked\"><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span>"
     ],
     [
      903,
      459,
      "sel\"><span class=\"w\" data-from=\"41\" data-to=\"43\">in</span>"
     ],
     [
      1538,
      449,
      "sel\"><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Auswahl · Spanisch</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">por</span><span class=\"equivalent\">durch</span><span class=\"grammar\">Präposition</span></div><div class=\"explanation\">Nennt den Raum, in dem man sich bewegt.</div><div class=\"synonyms\"><span class=\"label\">sinnverwandt</span><button class=\"synonym\">a través de</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Suchen (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Suchen (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1012,
      348,
      "sel picked\"><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span>"
     ],
     [
      1008,
      353,
      "sel\"><span class=\"w\" data-from=\"44\" data-to=\"47\">der</span>"
     ],
     [
      1643,
      343,
      "sel\"><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Auswahl · Spanisch</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">el</span><span class=\"equivalent\">der</span><span class=\"grammar\">Artikel · Singular · Maskulinum</span></div><div class=\"explanation\">Bestimmter Artikel vor einem männlichen Substantiv.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Suchen (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Suchen (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1117,
      66,
      "sel picked\"><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span>"
     ],
     [
      1114,
      178,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"48\" data-mark-to=\"56\"><span class=\"w\" data-from=\"48\" data-to=\"56\">Altstadt</span>"
     ],
     [
      1749,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Auswahl · Spanisch</span><span class=\"status on-hover\">erklärt vom KI-Modell</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">casco antiguo</span><span class=\"equivalent\">Altstadt</span><span class=\"grammar\">Substantiv · Singular · Maskulinum</span></div><div class=\"explanation\">Der historische Kern einer Stadt.</div><div class=\"synonyms\"><span class=\"label\">sinnverwandt</span><button class=\"synonym\">centro histórico</button><button class=\"synonym\">ciudad vieja</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Aussprechen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Aussprechen</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Ausführlicher erklären\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ausführlicher erklären</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Beispielsatz hinzufügen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Beispielsatz hinzufügen</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Suchen (extern)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Suchen (extern)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Lernkarte erstellen\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Lernkarte erstellen</span></button></div></div></div></div></section>"
   }
  ]
 },
 "en": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Although it was raining cats and dogs, we went out for a walk in the old town.",
   "Même s’il pleuvait à verse, nous sommes sortis nous promener dans la vieille ville."
  ],
  "sheet": "<section class=\"pane\"><div class=\"label\"><span class=\"name\">Spanish</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"0\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span><span class=\"g\" data-from=\"6\" data-to=\"7\"> </span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span></span><span class=\"g\" data-from=\"24\" data-to=\"26\">, </span><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span></span><span class=\"g\" data-from=\"33\" data-to=\"34\"> </span><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span><span class=\"g\" data-from=\"35\" data-to=\"36\"> </span><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span><span class=\"g\" data-from=\"42\" data-to=\"43\"> </span><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span><span class=\"g\" data-from=\"49\" data-to=\"50\"> </span><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span></span><span class=\"g\" data-from=\"63\" data-to=\"64\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"edit\" aria-label=\"Edit\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11.2 2.6 13.4 4.8 5.6 12.6 3 13l.4-2.6z\"></path></svg><span class=\"pill-label\">Edit</span></button><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copy\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copy</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">English</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"1\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span><span class=\"g\" data-from=\"8\" data-to=\"9\"> </span><span class=\"w\" data-from=\"9\" data-to=\"11\">it</span><span class=\"g\" data-from=\"11\" data-to=\"12\"> </span><span class=\"w\" data-from=\"12\" data-to=\"15\">was</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span></span><span class=\"g\" data-from=\"37\" data-to=\"39\">, </span><span class=\"w\" data-from=\"39\" data-to=\"41\">we</span><span class=\"g\" data-from=\"41\" data-to=\"42\"> </span><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span></span><span class=\"g\" data-from=\"50\" data-to=\"51\"> </span><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span><span class=\"g\" data-from=\"54\" data-to=\"55\"> </span><span class=\"w\" data-from=\"55\" data-to=\"56\">a</span><span class=\"g\" data-from=\"56\" data-to=\"57\"> </span><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span><span class=\"g\" data-from=\"61\" data-to=\"62\"> </span><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span><span class=\"g\" data-from=\"64\" data-to=\"65\"> </span><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span></span><span class=\"g\" data-from=\"77\" data-to=\"78\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copy\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copy</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">French</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"2\"><span class=\"w\" data-from=\"0\" data-to=\"4\">Même</span><span class=\"g\" data-from=\"4\" data-to=\"5\"> </span><span class=\"w\" data-from=\"5\" data-to=\"6\">s</span><span class=\"g\" data-from=\"6\" data-to=\"7\">’</span><span class=\"w\" data-from=\"7\" data-to=\"9\">il</span><span class=\"g\" data-from=\"9\" data-to=\"10\"> </span><span class=\"mark wmark0\" data-mark-from=\"10\" data-mark-to=\"26\"><span class=\"w\" data-from=\"10\" data-to=\"18\">pleuvait</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"20\">à</span><span class=\"g\" data-from=\"20\" data-to=\"21\"> </span><span class=\"w\" data-from=\"21\" data-to=\"26\">verse</span></span><span class=\"g\" data-from=\"26\" data-to=\"28\">, </span><span class=\"w\" data-from=\"28\" data-to=\"32\">nous</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"mark vmark0\" data-mark-from=\"33\" data-mark-to=\"46\"><span class=\"w\" data-from=\"33\" data-to=\"39\">sommes</span><span class=\"g\" data-from=\"39\" data-to=\"40\"> </span><span class=\"w\" data-from=\"40\" data-to=\"46\">sortis</span></span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"51\">nous</span><span class=\"g\" data-from=\"51\" data-to=\"52\"> </span><span class=\"w\" data-from=\"52\" data-to=\"60\">promener</span><span class=\"g\" data-from=\"60\" data-to=\"61\"> </span><span class=\"w\" data-from=\"61\" data-to=\"65\">dans</span><span class=\"g\" data-from=\"65\" data-to=\"66\"> </span><span class=\"w\" data-from=\"66\" data-to=\"68\">la</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"82\"><span class=\"w\" data-from=\"69\" data-to=\"76\">vieille</span><span class=\"g\" data-from=\"76\" data-to=\"77\"> </span><span class=\"w\" data-from=\"77\" data-to=\"82\">ville</span></span><span class=\"g\" data-from=\"82\" data-to=\"83\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copy\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copy</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Terms</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"wmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark0\">llover a cántaros</span><span class=\"equivalent\">rain cats and dogs</span></div><div class=\"explanation\">To rain very heavily, said informally.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Look up (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Look up (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div><div class=\"row\" data-hl=\"wmark1\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark1\">casco antiguo</span><span class=\"equivalent\">old town</span></div><div class=\"explanation\">The historic center of a town.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Look up (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Look up (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Verbs</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"vmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark vmark0\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">go out</span><span class=\"grammar\">1st person plural · Indefinido</span></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugation (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugation (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>",
  "hover": {
   "0:0": [
    "Although",
    [
     [0,0,6],
     [1,0,8],
     [2,0,4]
    ]
   ],
   "0:7": [
    "raining cats and dogs",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "0:14": [
    "raining cats and dogs",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "0:16": [
    "raining cats and dogs",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "0:26": [
    "went out",
    [
     [0,26,33],
     [1,42,50],
     [2,33,46]
    ]
   ],
   "0:34": [
    "for a walk",
    [
     [0,34,42],
     [1,51,61],
     [2,47,60]
    ]
   ],
   "0:36": [
    "for a walk",
    [
     [0,34,42],
     [1,51,61],
     [2,47,60]
    ]
   ],
   "0:43": [
    "in",
    [
     [0,43,46],
     [1,62,64],
     [2,61,65]
    ]
   ],
   "0:47": [
    "the",
    [
     [0,47,49],
     [1,65,68],
     [2,66,68]
    ]
   ],
   "0:50": [
    "old town",
    [
     [0,50,63],
     [1,69,77],
     [2,69,82]
    ]
   ],
   "0:56": [
    "old town",
    [
     [0,50,63],
     [1,69,77],
     [2,69,82]
    ]
   ],
   "1:0": [
    "",
    [
     [0,0,6],
     [1,0,8],
     [2,0,4]
    ]
   ],
   "1:16": [
    "",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "1:24": [
    "",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "1:29": [
    "",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "1:33": [
    "",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "1:42": [
    "",
    [
     [0,26,33],
     [1,42,50],
     [2,33,46]
    ]
   ],
   "1:47": [
    "",
    [
     [0,26,33],
     [1,42,50],
     [2,33,46]
    ]
   ],
   "1:51": [
    "",
    [
     [0,34,42],
     [1,51,61],
     [2,47,60]
    ]
   ],
   "1:55": [
    "",
    [
     [0,34,42],
     [1,51,61],
     [2,47,60]
    ]
   ],
   "1:57": [
    "",
    [
     [0,34,42],
     [1,51,61],
     [2,47,60]
    ]
   ],
   "1:62": [
    "",
    [
     [0,43,46],
     [1,62,64],
     [2,61,65]
    ]
   ],
   "1:65": [
    "",
    [
     [0,47,49],
     [1,65,68],
     [2,66,68]
    ]
   ],
   "1:69": [
    "",
    [
     [0,50,63],
     [1,69,77],
     [2,69,82]
    ]
   ],
   "1:73": [
    "",
    [
     [0,50,63],
     [1,69,77],
     [2,69,82]
    ]
   ],
   "2:0": [
    "Although",
    [
     [0,0,6],
     [1,0,8],
     [2,0,4]
    ]
   ],
   "2:5": [
    "it",
    [
     [1,9,11],
     [2,5,9]
    ]
   ],
   "2:7": [
    "it",
    [
     [1,9,11],
     [2,5,9]
    ]
   ],
   "2:10": [
    "raining cats and dogs",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "2:19": [
    "raining cats and dogs",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "2:21": [
    "raining cats and dogs",
    [
     [0,7,24],
     [1,16,37],
     [2,10,26]
    ]
   ],
   "2:33": [
    "went out",
    [
     [0,26,33],
     [1,42,50],
     [2,33,46]
    ]
   ],
   "2:40": [
    "went out",
    [
     [0,26,33],
     [1,42,50],
     [2,33,46]
    ]
   ],
   "2:47": [
    "for a walk",
    [
     [0,36,42],
     [1,51,61],
     [2,47,60]
    ]
   ],
   "2:52": [
    "for a walk",
    [
     [0,36,42],
     [1,51,61],
     [2,47,60]
    ]
   ],
   "2:61": [
    "in",
    [
     [0,43,46],
     [1,62,64],
     [2,61,65]
    ]
   ],
   "2:66": [
    "the",
    [
     [0,47,49],
     [1,65,68],
     [2,66,68]
    ]
   ],
   "2:69": [
    "old town",
    [
     [0,50,63],
     [1,69,77],
     [2,69,82]
    ]
   ],
   "2:77": [
    "old town",
    [
     [0,50,63],
     [1,69,77],
     [2,69,82]
    ]
   ]
  },
  "picks": {
   "0": 0,
   "7": 1,
   "14": 2,
   "16": 1,
   "26": 3,
   "34": 4,
   "36": 5,
   "43": 6,
   "47": 7,
   "50": 8,
   "56": 8
  },
  "entries": [
   {
    "boxes": [
     [
      13,
      1345,
      "sel picked\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span>"
     ],
     [
      13,
      1970,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span>"
     ],
     [
      13,
      1568,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"4\">Même</span><span class=\"g\" data-from=\"4\" data-to=\"5\"> </span><span class=\"w\" data-from=\"5\" data-to=\"6\">s</span><span class=\"g\" data-from=\"6\" data-to=\"7\">’</span><span class=\"w\" data-from=\"7\" data-to=\"9\">il</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selection · Spanish</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">Aunque</span><span class=\"equivalent\">although</span><span class=\"grammar\">conjunction</span></div><div class=\"explanation\">Introduces a contrast that does not change what follows.</div><div class=\"synonyms\"><span class=\"label\">related</span><button class=\"synonym\">si bien</button><button class=\"synonym\">aun cuando</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Look up (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Look up (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      118,
      961,
      "sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span>"
     ],
     [
      330,
      1268,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span>"
     ],
     [
      318,
      1182,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"10\" data-mark-to=\"26\"><span class=\"w\" data-from=\"10\" data-to=\"18\">pleuvait</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"20\">à</span><span class=\"g\" data-from=\"20\" data-to=\"21\"> </span><span class=\"w\" data-from=\"21\" data-to=\"26\">verse</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selection · Spanish</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">llovía a cántaros</span><span class=\"arrow\">→</span><span class=\"base\">llover a cántaros</span><span class=\"equivalent\">rain cats and dogs</span><span class=\"grammar\">3rd person singular · Imperfecto</span></div><div class=\"explanation\">To rain very heavily, said informally.</div><div class=\"synonyms\"><span class=\"label\">related</span><button class=\"synonym\">diluviar</button><button class=\"synonym\">llover a mares</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugation (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugation (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      277,
      1066,
      "/span><span class=\"sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span></span></span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\""
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ],
     [
      1815,
      0,
      ""
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selection · Spanish</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"equivalent\">to</span><span class=\"grammar\">preposition</span></div><div class=\"explanation\">After a verb of motion, says what one sets out to do.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Look up (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Look up (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      512,
      779,
      "sel picked\"><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span>"
     ],
     [
      937,
      878,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span>"
     ],
     [
      820,
      785,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"33\" data-mark-to=\"46\"><span class=\"w\" data-from=\"33\" data-to=\"39\">sommes</span><span class=\"g\" data-from=\"39\" data-to=\"40\"> </span><span class=\"w\" data-from=\"40\" data-to=\"46\">sortis</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selection · Spanish</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">go out</span><span class=\"grammar\">1st person plural · Indefinido</span></div><div class=\"explanation\">To leave a place, here to take a walk.</div><div class=\"synonyms\"><span class=\"label\">related</span><button class=\"synonym\">irse</button><button class=\"synonym\">marcharse</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugation (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugation (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      693,
      668,
      "sel picked\"><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span>"
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ],
     [
      1815,
      0,
      ""
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selection · Spanish</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"equivalent\">to</span><span class=\"grammar\">preposition</span></div><div class=\"explanation\">After a verb of motion, says what one sets out to do.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Look up (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Look up (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      797,
      559,
      "sel picked\"><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span>"
     ],
     [
      1431,
      554,
      "sel\"><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span>"
     ],
     [
      1216,
      560,
      "sel\"><span class=\"w\" data-from=\"52\" data-to=\"60\">promener</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selection · Spanish</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">pasear</span><span class=\"equivalent\">go for a walk</span></div><div class=\"explanation\">To go about on foot, unhurried and for pleasure.</div><div class=\"synonyms\"><span class=\"label\">related</span><button class=\"synonym\">caminar</button><button class=\"synonym\">andar</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugation (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugation (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      906,
      453,
      "sel picked\"><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span>"
     ],
     [
      1538,
      449,
      "sel\"><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span>"
     ],
     [
      1327,
      453,
      "sel\"><span class=\"w\" data-from=\"61\" data-to=\"65\">dans</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selection · Spanish</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">por</span><span class=\"equivalent\">through</span><span class=\"grammar\">preposition</span></div><div class=\"explanation\">Names the space one moves about in.</div><div class=\"synonyms\"><span class=\"label\">related</span><button class=\"synonym\">a través de</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Look up (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Look up (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1012,
      348,
      "sel picked\"><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span>"
     ],
     [
      1643,
      343,
      "sel\"><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span>"
     ],
     [
      1434,
      348,
      "sel\"><span class=\"w\" data-from=\"66\" data-to=\"68\">la</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selection · Spanish</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">el</span><span class=\"equivalent\">the</span><span class=\"grammar\">article · singular · masculine</span></div><div class=\"explanation\">The definite article before a masculine noun.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Look up (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Look up (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1117,
      66,
      "sel picked\"><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span>"
     ],
     [
      1749,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span>"
     ],
     [
      1539,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"82\"><span class=\"w\" data-from=\"69\" data-to=\"76\">vieille</span><span class=\"g\" data-from=\"76\" data-to=\"77\"> </span><span class=\"w\" data-from=\"77\" data-to=\"82\">ville</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selection · Spanish</span><span class=\"status on-hover\">explained by the AI model</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">casco antiguo</span><span class=\"equivalent\">old town</span><span class=\"grammar\">noun · singular · masculine</span></div><div class=\"explanation\">The historic center of a town.</div><div class=\"synonyms\"><span class=\"label\">related</span><button class=\"synonym\">centro histórico</button><button class=\"synonym\">ciudad vieja</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Say aloud\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Say aloud</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explain in more detail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explain in more detail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Add an example sentence\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Add an example sentence</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Look up (external)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Look up (external)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Make a flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Make a flashcard</span></button></div></div></div></div></section>"
   }
  ]
 },
 "es": {
  "texts": [
   "Although it was raining cats and dogs, we went out for a walk in the old town.",
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Même s’il pleuvait à verse, nous sommes sortis nous promener dans la vieille ville."
  ],
  "sheet": "<section class=\"pane\"><div class=\"label\"><span class=\"name\">Inglés</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"0\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span><span class=\"g\" data-from=\"8\" data-to=\"9\"> </span><span class=\"w\" data-from=\"9\" data-to=\"11\">it</span><span class=\"g\" data-from=\"11\" data-to=\"12\"> </span><span class=\"w\" data-from=\"12\" data-to=\"15\">was</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span></span><span class=\"g\" data-from=\"37\" data-to=\"39\">, </span><span class=\"w\" data-from=\"39\" data-to=\"41\">we</span><span class=\"g\" data-from=\"41\" data-to=\"42\"> </span><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span></span><span class=\"g\" data-from=\"50\" data-to=\"51\"> </span><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span><span class=\"g\" data-from=\"54\" data-to=\"55\"> </span><span class=\"w\" data-from=\"55\" data-to=\"56\">a</span><span class=\"g\" data-from=\"56\" data-to=\"57\"> </span><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span><span class=\"g\" data-from=\"61\" data-to=\"62\"> </span><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span><span class=\"g\" data-from=\"64\" data-to=\"65\"> </span><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span></span><span class=\"g\" data-from=\"77\" data-to=\"78\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"edit\" aria-label=\"Editar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11.2 2.6 13.4 4.8 5.6 12.6 3 13l.4-2.6z\"></path></svg><span class=\"pill-label\">Editar</span></button><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copiar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copiar</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Español</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"1\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span><span class=\"g\" data-from=\"6\" data-to=\"7\"> </span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span></span><span class=\"g\" data-from=\"24\" data-to=\"26\">, </span><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span></span><span class=\"g\" data-from=\"33\" data-to=\"34\"> </span><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span><span class=\"g\" data-from=\"35\" data-to=\"36\"> </span><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span><span class=\"g\" data-from=\"42\" data-to=\"43\"> </span><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span><span class=\"g\" data-from=\"49\" data-to=\"50\"> </span><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span></span><span class=\"g\" data-from=\"63\" data-to=\"64\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copiar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copiar</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Francés</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"2\"><span class=\"w\" data-from=\"0\" data-to=\"4\">Même</span><span class=\"g\" data-from=\"4\" data-to=\"5\"> </span><span class=\"w\" data-from=\"5\" data-to=\"6\">s</span><span class=\"g\" data-from=\"6\" data-to=\"7\">’</span><span class=\"w\" data-from=\"7\" data-to=\"9\">il</span><span class=\"g\" data-from=\"9\" data-to=\"10\"> </span><span class=\"mark wmark0\" data-mark-from=\"10\" data-mark-to=\"26\"><span class=\"w\" data-from=\"10\" data-to=\"18\">pleuvait</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"20\">à</span><span class=\"g\" data-from=\"20\" data-to=\"21\"> </span><span class=\"w\" data-from=\"21\" data-to=\"26\">verse</span></span><span class=\"g\" data-from=\"26\" data-to=\"28\">, </span><span class=\"w\" data-from=\"28\" data-to=\"32\">nous</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"mark vmark0\" data-mark-from=\"33\" data-mark-to=\"46\"><span class=\"w\" data-from=\"33\" data-to=\"39\">sommes</span><span class=\"g\" data-from=\"39\" data-to=\"40\"> </span><span class=\"w\" data-from=\"40\" data-to=\"46\">sortis</span></span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"51\">nous</span><span class=\"g\" data-from=\"51\" data-to=\"52\"> </span><span class=\"w\" data-from=\"52\" data-to=\"60\">promener</span><span class=\"g\" data-from=\"60\" data-to=\"61\"> </span><span class=\"w\" data-from=\"61\" data-to=\"65\">dans</span><span class=\"g\" data-from=\"65\" data-to=\"66\"> </span><span class=\"w\" data-from=\"66\" data-to=\"68\">la</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"82\"><span class=\"w\" data-from=\"69\" data-to=\"76\">vieille</span><span class=\"g\" data-from=\"76\" data-to=\"77\"> </span><span class=\"w\" data-from=\"77\" data-to=\"82\">ville</span></span><span class=\"g\" data-from=\"82\" data-to=\"83\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copiar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copiar</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Términos</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"wmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark0\">rain cats and dogs</span><span class=\"equivalent\">llover a cántaros</span></div><div class=\"explanation\">Llover muchísimo, en lenguaje coloquial.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div><div class=\"row\" data-hl=\"wmark1\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark1\">old town</span><span class=\"equivalent\">casco antiguo</span></div><div class=\"explanation\">El centro histórico de una ciudad.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Verbos</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"vmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark vmark0\">went out</span><span class=\"arrow\">→</span><span class=\"base\">to go out</span><span class=\"equivalent\">salir</span><span class=\"grammar\">1.ª persona del plural · Past Simple</span></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugación (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugación (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>",
  "hover": {
   "0:0": [
    "Aunque",
    [
     [0,0,8],
     [1,0,6],
     [2,0,4]
    ]
   ],
   "0:9": [
    "",
    [
     [0,9,15],
     [2,7,9]
    ]
   ],
   "0:12": [
    "",
    [
     [0,9,15],
     [2,7,9]
    ]
   ],
   "0:16": [
    "llovía a cántaros",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "0:24": [
    "llovía a cántaros",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "0:29": [
    "llovía a cántaros",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "0:33": [
    "llovía a cántaros",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "0:39": [
    "",
    [
     [0,39,41],
     [2,28,32]
    ]
   ],
   "0:42": [
    "salimos",
    [
     [0,42,50],
     [1,26,33],
     [2,33,46]
    ]
   ],
   "0:47": [
    "salimos",
    [
     [0,42,50],
     [1,26,33],
     [2,33,46]
    ]
   ],
   "0:51": [
    "a pasear",
    [
     [0,51,61],
     [1,34,42],
     [2,47,60]
    ]
   ],
   "0:55": [
    "a pasear",
    [
     [0,51,61],
     [1,34,42],
     [2,47,60]
    ]
   ],
   "0:57": [
    "a pasear",
    [
     [0,51,61],
     [1,34,42],
     [2,47,60]
    ]
   ],
   "0:62": [
    "por",
    [
     [0,62,64],
     [1,43,46],
     [2,61,65]
    ]
   ],
   "0:65": [
    "el",
    [
     [0,65,68],
     [1,47,49],
     [2,66,68]
    ]
   ],
   "0:69": [
    "casco antiguo",
    [
     [0,69,77],
     [1,50,63],
     [2,69,82]
    ]
   ],
   "0:73": [
    "casco antiguo",
    [
     [0,69,77],
     [1,50,63],
     [2,69,82]
    ]
   ],
   "1:0": [
    "",
    [
     [0,0,8],
     [1,0,6],
     [2,0,4]
    ]
   ],
   "1:7": [
    "",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "1:14": [
    "",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "1:16": [
    "",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "1:26": [
    "",
    [
     [0,42,50],
     [1,26,33],
     [2,33,46]
    ]
   ],
   "1:34": [
    "",
    [
     [0,51,61],
     [1,34,42],
     [2,47,60]
    ]
   ],
   "1:36": [
    "",
    [
     [0,51,61],
     [1,34,42],
     [2,47,60]
    ]
   ],
   "1:43": [
    "",
    [
     [0,62,64],
     [1,43,46],
     [2,61,65]
    ]
   ],
   "1:47": [
    "",
    [
     [0,65,68],
     [1,47,49],
     [2,66,68]
    ]
   ],
   "1:50": [
    "",
    [
     [0,69,77],
     [1,50,63],
     [2,69,82]
    ]
   ],
   "1:56": [
    "",
    [
     [0,69,77],
     [1,50,63],
     [2,69,82]
    ]
   ],
   "2:0": [
    "Aunque",
    [
     [0,0,8],
     [1,0,6],
     [2,0,4]
    ]
   ],
   "2:5": [
    "",
    [
     [0,9,15],
     [2,5,9]
    ]
   ],
   "2:7": [
    "",
    [
     [0,9,15],
     [2,5,9]
    ]
   ],
   "2:10": [
    "llovía a cántaros",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "2:19": [
    "llovía a cántaros",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "2:21": [
    "llovía a cántaros",
    [
     [0,16,37],
     [1,7,24],
     [2,10,26]
    ]
   ],
   "2:28": [
    "",
    [
     [0,39,41],
     [2,28,32]
    ]
   ],
   "2:33": [
    "salimos",
    [
     [0,42,50],
     [1,26,33],
     [2,33,46]
    ]
   ],
   "2:40": [
    "salimos",
    [
     [0,42,50],
     [1,26,33],
     [2,33,46]
    ]
   ],
   "2:47": [
    "a pasear",
    [
     [0,57,61],
     [1,34,42],
     [2,47,60]
    ]
   ],
   "2:52": [
    "a pasear",
    [
     [0,57,61],
     [1,34,42],
     [2,47,60]
    ]
   ],
   "2:61": [
    "por",
    [
     [0,62,64],
     [1,43,46],
     [2,61,65]
    ]
   ],
   "2:66": [
    "el",
    [
     [0,65,68],
     [1,47,49],
     [2,66,68]
    ]
   ],
   "2:69": [
    "casco antiguo",
    [
     [0,69,77],
     [1,50,63],
     [2,69,82]
    ]
   ],
   "2:77": [
    "casco antiguo",
    [
     [0,69,77],
     [1,50,63],
     [2,69,82]
    ]
   ]
  },
  "picks": {
   "0": 0,
   "9": 1,
   "12": 2,
   "16": 3,
   "24": 3,
   "29": 3,
   "33": 3,
   "39": 4,
   "42": 5,
   "47": 5,
   "51": 6,
   "55": 7,
   "57": 8,
   "62": 9,
   "65": 10,
   "69": 11,
   "73": 11
  },
  "entries": [
   {
    "boxes": [
     [
      13,
      1970,
      "sel picked\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span>"
     ],
     [
      13,
      1345,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span>"
     ],
     [
      13,
      1568,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"4\">Même</span><span class=\"g\" data-from=\"4\" data-to=\"5\"> </span><span class=\"w\" data-from=\"5\" data-to=\"6\">s</span><span class=\"g\" data-from=\"6\" data-to=\"7\">’</span><span class=\"w\" data-from=\"7\" data-to=\"9\">il</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">Although</span><span class=\"equivalent\">aunque</span><span class=\"grammar\">conjunción</span></div><div class=\"explanation\">Introduce un contraste que no cambia lo que sigue.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">though</button><button class=\"synonym\">even though</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      120,
      1868,
      "sel picked\"><span class=\"w\" data-from=\"9\" data-to=\"11\">it</span>"
     ],
     [
      1393,
      0,
      ""
     ],
     [
      1815,
      0,
      ""
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">it</span><span class=\"grammar\">pronombre · singular</span></div><div class=\"explanation\">Sujeto vacío de verbos como «llover», que no se traduce.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      224,
      1762,
      "sel picked\"><span class=\"w\" data-from=\"12\" data-to=\"15\">was</span>"
     ],
     [
      1393,
      0,
      ""
     ],
     [
      1815,
      0,
      ""
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">was</span><span class=\"arrow\">→</span><span class=\"base\">to be</span><span class=\"equivalent\">estar</span><span class=\"grammar\">3.ª persona del singular · Past Simple</span></div><div class=\"explanation\">Verbo auxiliar que acompaña a otro verbo.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugación (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugación (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      330,
      1268,
      "sel picked\"><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span>"
     ],
     [
      118,
      961,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span>"
     ],
     [
      318,
      1182,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"10\" data-mark-to=\"26\"><span class=\"w\" data-from=\"10\" data-to=\"18\">pleuvait</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"20\">à</span><span class=\"g\" data-from=\"20\" data-to=\"21\"> </span><span class=\"w\" data-from=\"21\" data-to=\"26\">verse</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">raining cats and dogs</span><span class=\"arrow\">→</span><span class=\"base\">to rain cats and dogs</span><span class=\"equivalent\">llover a cántaros</span></div><div class=\"explanation\">Llover muchísimo, en lenguaje coloquial.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">pour</button><button class=\"synonym\">bucket down</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugación (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugación (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      832,
      1155,
      "sel picked\"><span class=\"w\" data-from=\"39\" data-to=\"41\">we</span>"
     ],
     [
      1393,
      0,
      ""
     ],
     [
      1109,
      671,
      "sel\"><span class=\"w\" data-from=\"47\" data-to=\"51\">nous</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">we</span><span class=\"equivalent\">nosotros</span><span class=\"grammar\">pronombre · plural</span></div><div class=\"explanation\">Quien habla junto con otras personas.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      937,
      878,
      "sel picked\"><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span>"
     ],
     [
      512,
      779,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span>"
     ],
     [
      820,
      785,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"33\" data-mark-to=\"46\"><span class=\"w\" data-from=\"33\" data-to=\"39\">sommes</span><span class=\"g\" data-from=\"39\" data-to=\"40\"> </span><span class=\"w\" data-from=\"40\" data-to=\"46\">sortis</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">went out</span><span class=\"arrow\">→</span><span class=\"base\">to go out</span><span class=\"equivalent\">salir</span><span class=\"grammar\">1.ª persona del plural · Past Simple</span></div><div class=\"explanation\">Dejar un lugar, aquí para dar un paseo.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">leave</button><button class=\"synonym\">head out</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugación (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugación (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1221,
      765,
      "sel picked\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ],
     [
      693,
      668,
      "sel\"><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span>"
     ],
     [
      1815,
      0,
      ""
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">for</span><span class=\"equivalent\">para</span><span class=\"grammar\">preposición</span></div><div class=\"explanation\">Indica el propósito de lo que se hace.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1327,
      661,
      "sel picked\"><span class=\"w\" data-from=\"55\" data-to=\"56\">a</span>"
     ],
     [
      1393,
      0,
      ""
     ],
     [
      1815,
      0,
      ""
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"equivalent\">un</span><span class=\"grammar\">artículo · singular</span></div><div class=\"explanation\">Artículo indefinido ante un sustantivo en singular.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1431,
      554,
      "sel picked\"><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span>"
     ],
     [
      797,
      559,
      "sel\"><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span>"
     ],
     [
      1216,
      560,
      "sel\"><span class=\"w\" data-from=\"52\" data-to=\"60\">promener</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">walk</span><span class=\"equivalent\">paseo</span><span class=\"grammar\">sustantivo · singular</span></div><div class=\"explanation\">Una salida a pie, sin prisa y por placer.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">stroll</button><button class=\"synonym\">ramble</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1538,
      449,
      "sel picked\"><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span>"
     ],
     [
      906,
      453,
      "sel\"><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span>"
     ],
     [
      1327,
      453,
      "sel\"><span class=\"w\" data-from=\"61\" data-to=\"65\">dans</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">in</span><span class=\"equivalent\">en</span><span class=\"grammar\">preposición</span></div><div class=\"explanation\">Indica el lugar dentro del cual ocurre algo.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1643,
      343,
      "sel picked\"><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span>"
     ],
     [
      1012,
      348,
      "sel\"><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span>"
     ],
     [
      1434,
      348,
      "sel\"><span class=\"w\" data-from=\"66\" data-to=\"68\">la</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">the</span><span class=\"equivalent\">el</span><span class=\"grammar\">artículo</span></div><div class=\"explanation\">Artículo definido, igual para todos los géneros y números.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1749,
      66,
      "sel picked\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span>"
     ],
     [
      1117,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span>"
     ],
     [
      1539,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"82\"><span class=\"w\" data-from=\"69\" data-to=\"76\">vieille</span><span class=\"g\" data-from=\"76\" data-to=\"77\"> </span><span class=\"w\" data-from=\"77\" data-to=\"82\">ville</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selección · Inglés</span><span class=\"status on-hover\">explicado por el modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">old town</span><span class=\"equivalent\">casco antiguo</span><span class=\"grammar\">sustantivo · singular</span></div><div class=\"explanation\">El centro histórico de una ciudad.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">historic center</button><button class=\"synonym\">old quarter</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar con más detalle\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar con más detalle</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Añadir una frase de ejemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Añadir una frase de ejemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Buscar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Buscar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crear tarjeta\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crear tarjeta</span></button></div></div></div></div></section>"
   }
  ]
 },
 "fr": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Même s’il pleuvait à verse, nous sommes sortis nous promener dans la vieille ville.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "sheet": "<section class=\"pane\"><div class=\"label\"><span class=\"name\">Espagnol</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"0\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span><span class=\"g\" data-from=\"6\" data-to=\"7\"> </span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span></span><span class=\"g\" data-from=\"24\" data-to=\"26\">, </span><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span></span><span class=\"g\" data-from=\"33\" data-to=\"34\"> </span><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span><span class=\"g\" data-from=\"35\" data-to=\"36\"> </span><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span><span class=\"g\" data-from=\"42\" data-to=\"43\"> </span><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span><span class=\"g\" data-from=\"49\" data-to=\"50\"> </span><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span></span><span class=\"g\" data-from=\"63\" data-to=\"64\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"edit\" aria-label=\"Modifier\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11.2 2.6 13.4 4.8 5.6 12.6 3 13l.4-2.6z\"></path></svg><span class=\"pill-label\">Modifier</span></button><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copier\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copier</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Français</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"1\"><span class=\"w\" data-from=\"0\" data-to=\"4\">Même</span><span class=\"g\" data-from=\"4\" data-to=\"5\"> </span><span class=\"w\" data-from=\"5\" data-to=\"6\">s</span><span class=\"g\" data-from=\"6\" data-to=\"7\">’</span><span class=\"w\" data-from=\"7\" data-to=\"9\">il</span><span class=\"g\" data-from=\"9\" data-to=\"10\"> </span><span class=\"mark wmark0\" data-mark-from=\"10\" data-mark-to=\"26\"><span class=\"w\" data-from=\"10\" data-to=\"18\">pleuvait</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"20\">à</span><span class=\"g\" data-from=\"20\" data-to=\"21\"> </span><span class=\"w\" data-from=\"21\" data-to=\"26\">verse</span></span><span class=\"g\" data-from=\"26\" data-to=\"28\">, </span><span class=\"w\" data-from=\"28\" data-to=\"32\">nous</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"mark vmark0\" data-mark-from=\"33\" data-mark-to=\"46\"><span class=\"w\" data-from=\"33\" data-to=\"39\">sommes</span><span class=\"g\" data-from=\"39\" data-to=\"40\"> </span><span class=\"w\" data-from=\"40\" data-to=\"46\">sortis</span></span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"51\">nous</span><span class=\"g\" data-from=\"51\" data-to=\"52\"> </span><span class=\"w\" data-from=\"52\" data-to=\"60\">promener</span><span class=\"g\" data-from=\"60\" data-to=\"61\"> </span><span class=\"w\" data-from=\"61\" data-to=\"65\">dans</span><span class=\"g\" data-from=\"65\" data-to=\"66\"> </span><span class=\"w\" data-from=\"66\" data-to=\"68\">la</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"82\"><span class=\"w\" data-from=\"69\" data-to=\"76\">vieille</span><span class=\"g\" data-from=\"76\" data-to=\"77\"> </span><span class=\"w\" data-from=\"77\" data-to=\"82\">ville</span></span><span class=\"g\" data-from=\"82\" data-to=\"83\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copier\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copier</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Anglais</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"2\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span><span class=\"g\" data-from=\"8\" data-to=\"9\"> </span><span class=\"w\" data-from=\"9\" data-to=\"11\">it</span><span class=\"g\" data-from=\"11\" data-to=\"12\"> </span><span class=\"w\" data-from=\"12\" data-to=\"15\">was</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span></span><span class=\"g\" data-from=\"37\" data-to=\"39\">, </span><span class=\"w\" data-from=\"39\" data-to=\"41\">we</span><span class=\"g\" data-from=\"41\" data-to=\"42\"> </span><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span></span><span class=\"g\" data-from=\"50\" data-to=\"51\"> </span><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span><span class=\"g\" data-from=\"54\" data-to=\"55\"> </span><span class=\"w\" data-from=\"55\" data-to=\"56\">a</span><span class=\"g\" data-from=\"56\" data-to=\"57\"> </span><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span><span class=\"g\" data-from=\"61\" data-to=\"62\"> </span><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span><span class=\"g\" data-from=\"64\" data-to=\"65\"> </span><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span></span><span class=\"g\" data-from=\"77\" data-to=\"78\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copier\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copier</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Termes</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"wmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark0\">llover a cántaros</span><span class=\"equivalent\">pleuvoir à verse</span></div><div class=\"explanation\">Pleuvoir très fort, dans la langue familière.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Rechercher (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Rechercher (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div><div class=\"row\" data-hl=\"wmark1\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark1\">casco antiguo</span><span class=\"equivalent\">vieille ville</span></div><div class=\"explanation\">Le centre historique d’une ville.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Rechercher (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Rechercher (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Verbes</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"vmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark vmark0\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">sortir</span><span class=\"grammar\">1re personne du pluriel · Indefinido</span></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugaison (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugaison (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>",
  "hover": {
   "0:0": [
    "Même",
    [
     [0,0,6],
     [1,0,4],
     [2,0,8]
    ]
   ],
   "0:7": [
    "pleuvait à verse",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "0:14": [
    "pleuvait à verse",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "0:16": [
    "pleuvait à verse",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "0:26": [
    "sommes sortis",
    [
     [0,26,33],
     [1,33,46],
     [2,42,50]
    ]
   ],
   "0:34": [
    "nous promener",
    [
     [0,34,42],
     [1,47,60],
     [2,51,61]
    ]
   ],
   "0:36": [
    "nous promener",
    [
     [0,34,42],
     [1,47,60],
     [2,51,61]
    ]
   ],
   "0:43": [
    "dans",
    [
     [0,43,46],
     [1,61,65],
     [2,62,64]
    ]
   ],
   "0:47": [
    "la",
    [
     [0,47,49],
     [1,66,68],
     [2,65,68]
    ]
   ],
   "0:50": [
    "vieille ville",
    [
     [0,50,63],
     [1,69,82],
     [2,69,77]
    ]
   ],
   "0:56": [
    "vieille ville",
    [
     [0,50,63],
     [1,69,82],
     [2,69,77]
    ]
   ],
   "1:0": [
    "",
    [
     [0,0,6],
     [1,0,4],
     [2,0,8]
    ]
   ],
   "1:10": [
    "",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "1:19": [
    "",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "1:21": [
    "",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "1:33": [
    "",
    [
     [0,26,33],
     [1,33,46],
     [2,42,50]
    ]
   ],
   "1:40": [
    "",
    [
     [0,26,33],
     [1,33,46],
     [2,42,50]
    ]
   ],
   "1:47": [
    "",
    [
     [0,34,42],
     [1,47,60],
     [2,51,61]
    ]
   ],
   "1:52": [
    "",
    [
     [0,34,42],
     [1,47,60],
     [2,51,61]
    ]
   ],
   "1:61": [
    "",
    [
     [0,43,46],
     [1,61,65],
     [2,62,64]
    ]
   ],
   "1:66": [
    "",
    [
     [0,47,49],
     [1,66,68],
     [2,65,68]
    ]
   ],
   "1:69": [
    "",
    [
     [0,50,63],
     [1,69,82],
     [2,69,77]
    ]
   ],
   "1:77": [
    "",
    [
     [0,50,63],
     [1,69,82],
     [2,69,77]
    ]
   ],
   "2:0": [
    "Même",
    [
     [0,0,6],
     [1,0,4],
     [2,0,8]
    ]
   ],
   "2:16": [
    "pleuvait à verse",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "2:24": [
    "pleuvait à verse",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "2:29": [
    "pleuvait à verse",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "2:33": [
    "pleuvait à verse",
    [
     [0,7,24],
     [1,10,26],
     [2,16,37]
    ]
   ],
   "2:42": [
    "sommes sortis",
    [
     [0,26,33],
     [1,33,46],
     [2,42,50]
    ]
   ],
   "2:47": [
    "sommes sortis",
    [
     [0,26,33],
     [1,33,46],
     [2,42,50]
    ]
   ],
   "2:51": [
    "nous promener",
    [
     [0,34,42],
     [1,47,60],
     [2,51,61]
    ]
   ],
   "2:55": [
    "nous promener",
    [
     [0,34,42],
     [1,47,60],
     [2,51,61]
    ]
   ],
   "2:57": [
    "nous promener",
    [
     [0,34,42],
     [1,47,60],
     [2,51,61]
    ]
   ],
   "2:62": [
    "dans",
    [
     [0,43,46],
     [1,61,65],
     [2,62,64]
    ]
   ],
   "2:65": [
    "la",
    [
     [0,47,49],
     [1,66,68],
     [2,65,68]
    ]
   ],
   "2:69": [
    "vieille ville",
    [
     [0,50,63],
     [1,69,82],
     [2,69,77]
    ]
   ],
   "2:73": [
    "vieille ville",
    [
     [0,50,63],
     [1,69,82],
     [2,69,77]
    ]
   ]
  },
  "picks": {
   "0": 0,
   "7": 1,
   "14": 2,
   "16": 1,
   "26": 3,
   "34": 4,
   "36": 5,
   "43": 6,
   "47": 7,
   "50": 8,
   "56": 8
  },
  "entries": [
   {
    "boxes": [
     [
      13,
      1345,
      "sel picked\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span>"
     ],
     [
      13,
      1568,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"4\">Même</span><span class=\"g\" data-from=\"4\" data-to=\"5\"> </span><span class=\"w\" data-from=\"5\" data-to=\"6\">s</span><span class=\"g\" data-from=\"6\" data-to=\"7\">’</span><span class=\"w\" data-from=\"7\" data-to=\"9\">il</span>"
     ],
     [
      13,
      1970,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Sélection · Espagnol</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">Aunque</span><span class=\"equivalent\">bien que</span><span class=\"grammar\">conjonction</span></div><div class=\"explanation\">Introduit une opposition qui ne change rien à la suite.</div><div class=\"synonyms\"><span class=\"label\">apparentés</span><button class=\"synonym\">si bien</button><button class=\"synonym\">aun cuando</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Rechercher (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Rechercher (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      118,
      961,
      "sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span>"
     ],
     [
      318,
      1182,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"10\" data-mark-to=\"26\"><span class=\"w\" data-from=\"10\" data-to=\"18\">pleuvait</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"20\">à</span><span class=\"g\" data-from=\"20\" data-to=\"21\"> </span><span class=\"w\" data-from=\"21\" data-to=\"26\">verse</span>"
     ],
     [
      330,
      1268,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Sélection · Espagnol</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">llovía a cántaros</span><span class=\"arrow\">→</span><span class=\"base\">llover a cántaros</span><span class=\"equivalent\">pleuvoir à verse</span><span class=\"grammar\">3e personne du singulier · Imperfecto</span></div><div class=\"explanation\">Pleuvoir très fort, dans la langue familière.</div><div class=\"synonyms\"><span class=\"label\">apparentés</span><button class=\"synonym\">diluviar</button><button class=\"synonym\">llover a mares</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugaison (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugaison (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      277,
      1066,
      "/span><span class=\"sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span></span></span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\""
     ],
     [
      1815,
      0,
      ""
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Sélection · Espagnol</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"equivalent\">pour</span><span class=\"grammar\">préposition</span></div><div class=\"explanation\">Après un verbe de mouvement, indique ce qu’on va faire.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Rechercher (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Rechercher (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      512,
      779,
      "sel picked\"><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span>"
     ],
     [
      820,
      785,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"33\" data-mark-to=\"46\"><span class=\"w\" data-from=\"33\" data-to=\"39\">sommes</span><span class=\"g\" data-from=\"39\" data-to=\"40\"> </span><span class=\"w\" data-from=\"40\" data-to=\"46\">sortis</span>"
     ],
     [
      937,
      878,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Sélection · Espagnol</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">sortir</span><span class=\"grammar\">1re personne du pluriel · Indefinido</span></div><div class=\"explanation\">Quitter un lieu, ici pour aller se promener.</div><div class=\"synonyms\"><span class=\"label\">apparentés</span><button class=\"synonym\">irse</button><button class=\"synonym\">marcharse</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugaison (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugaison (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      693,
      668,
      "sel picked\"><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span>"
     ],
     [
      1815,
      0,
      ""
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Sélection · Espagnol</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"equivalent\">pour</span><span class=\"grammar\">préposition</span></div><div class=\"explanation\">Après un verbe de mouvement, indique ce qu’on va faire.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Rechercher (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Rechercher (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      797,
      559,
      "sel picked\"><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span>"
     ],
     [
      1216,
      560,
      "sel\"><span class=\"w\" data-from=\"52\" data-to=\"60\">promener</span>"
     ],
     [
      1431,
      554,
      "sel\"><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Sélection · Espagnol</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">pasear</span><span class=\"equivalent\">se promener</span></div><div class=\"explanation\">Aller à pied, sans hâte et pour le plaisir.</div><div class=\"synonyms\"><span class=\"label\">apparentés</span><button class=\"synonym\">caminar</button><button class=\"synonym\">andar</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugaison (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugaison (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      906,
      453,
      "sel picked\"><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span>"
     ],
     [
      1327,
      453,
      "sel\"><span class=\"w\" data-from=\"61\" data-to=\"65\">dans</span>"
     ],
     [
      1538,
      449,
      "sel\"><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Sélection · Espagnol</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">por</span><span class=\"equivalent\">par</span><span class=\"grammar\">préposition</span></div><div class=\"explanation\">Indique l’espace dans lequel on se déplace.</div><div class=\"synonyms\"><span class=\"label\">apparentés</span><button class=\"synonym\">a través de</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Rechercher (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Rechercher (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1012,
      348,
      "sel picked\"><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span>"
     ],
     [
      1434,
      348,
      "sel\"><span class=\"w\" data-from=\"66\" data-to=\"68\">la</span>"
     ],
     [
      1643,
      343,
      "sel\"><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Sélection · Espagnol</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">el</span><span class=\"equivalent\">le</span><span class=\"grammar\">article · singulier · masculin</span></div><div class=\"explanation\">Article défini devant un nom masculin.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Rechercher (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Rechercher (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1117,
      66,
      "sel picked\"><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span>"
     ],
     [
      1539,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"82\"><span class=\"w\" data-from=\"69\" data-to=\"76\">vieille</span><span class=\"g\" data-from=\"76\" data-to=\"77\"> </span><span class=\"w\" data-from=\"77\" data-to=\"82\">ville</span>"
     ],
     [
      1749,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Sélection · Espagnol</span><span class=\"status on-hover\">expliqué par le modèle d’IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">casco antiguo</span><span class=\"equivalent\">vieille ville</span><span class=\"grammar\">nom · singulier · masculin</span></div><div class=\"explanation\">Le centre historique d’une ville.</div><div class=\"synonyms\"><span class=\"label\">apparentés</span><button class=\"synonym\">centro histórico</button><button class=\"synonym\">ciudad vieja</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Prononcer\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Prononcer</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Expliquer plus en détail\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Expliquer plus en détail</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Ajouter une phrase d’exemple\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Ajouter une phrase d’exemple</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Rechercher (externe)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Rechercher (externe)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Créer une fiche\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Créer une fiche</span></button></div></div></div></div></section>"
   }
  ]
 },
 "it": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Anche se pioveva a dirotto, siamo usciti a passeggiare per il centro storico.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "sheet": "<section class=\"pane\"><div class=\"label\"><span class=\"name\">Spagnolo</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"0\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span><span class=\"g\" data-from=\"6\" data-to=\"7\"> </span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span></span><span class=\"g\" data-from=\"24\" data-to=\"26\">, </span><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span></span><span class=\"g\" data-from=\"33\" data-to=\"34\"> </span><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span><span class=\"g\" data-from=\"35\" data-to=\"36\"> </span><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span><span class=\"g\" data-from=\"42\" data-to=\"43\"> </span><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span><span class=\"g\" data-from=\"49\" data-to=\"50\"> </span><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span></span><span class=\"g\" data-from=\"63\" data-to=\"64\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"edit\" aria-label=\"Modifica\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11.2 2.6 13.4 4.8 5.6 12.6 3 13l.4-2.6z\"></path></svg><span class=\"pill-label\">Modifica</span></button><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copia</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Italiano</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"1\"><span class=\"w\" data-from=\"0\" data-to=\"5\">Anche</span><span class=\"g\" data-from=\"5\" data-to=\"6\"> </span><span class=\"w\" data-from=\"6\" data-to=\"8\">se</span><span class=\"g\" data-from=\"8\" data-to=\"9\"> </span><span class=\"mark wmark0\" data-mark-from=\"9\" data-mark-to=\"26\"><span class=\"w\" data-from=\"9\" data-to=\"16\">pioveva</span><span class=\"g\" data-from=\"16\" data-to=\"17\"> </span><span class=\"w\" data-from=\"17\" data-to=\"18\">a</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"26\">dirotto</span></span><span class=\"g\" data-from=\"26\" data-to=\"28\">, </span><span class=\"mark vmark0\" data-mark-from=\"28\" data-mark-to=\"40\"><span class=\"w\" data-from=\"28\" data-to=\"33\">siamo</span><span class=\"g\" data-from=\"33\" data-to=\"34\"> </span><span class=\"w\" data-from=\"34\" data-to=\"40\">usciti</span></span><span class=\"g\" data-from=\"40\" data-to=\"41\"> </span><span class=\"w\" data-from=\"41\" data-to=\"42\">a</span><span class=\"g\" data-from=\"42\" data-to=\"43\"> </span><span class=\"w\" data-from=\"43\" data-to=\"54\">passeggiare</span><span class=\"g\" data-from=\"54\" data-to=\"55\"> </span><span class=\"w\" data-from=\"55\" data-to=\"58\">per</span><span class=\"g\" data-from=\"58\" data-to=\"59\"> </span><span class=\"w\" data-from=\"59\" data-to=\"61\">il</span><span class=\"g\" data-from=\"61\" data-to=\"62\"> </span><span class=\"mark wmark1\" data-mark-from=\"62\" data-mark-to=\"76\"><span class=\"w\" data-from=\"62\" data-to=\"68\">centro</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"w\" data-from=\"69\" data-to=\"76\">storico</span></span><span class=\"g\" data-from=\"76\" data-to=\"77\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copia</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Inglese</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"2\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span><span class=\"g\" data-from=\"8\" data-to=\"9\"> </span><span class=\"w\" data-from=\"9\" data-to=\"11\">it</span><span class=\"g\" data-from=\"11\" data-to=\"12\"> </span><span class=\"w\" data-from=\"12\" data-to=\"15\">was</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span></span><span class=\"g\" data-from=\"37\" data-to=\"39\">, </span><span class=\"w\" data-from=\"39\" data-to=\"41\">we</span><span class=\"g\" data-from=\"41\" data-to=\"42\"> </span><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span></span><span class=\"g\" data-from=\"50\" data-to=\"51\"> </span><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span><span class=\"g\" data-from=\"54\" data-to=\"55\"> </span><span class=\"w\" data-from=\"55\" data-to=\"56\">a</span><span class=\"g\" data-from=\"56\" data-to=\"57\"> </span><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span><span class=\"g\" data-from=\"61\" data-to=\"62\"> </span><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span><span class=\"g\" data-from=\"64\" data-to=\"65\"> </span><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span></span><span class=\"g\" data-from=\"77\" data-to=\"78\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copia</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Termini</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"wmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark0\">llover a cántaros</span><span class=\"equivalent\">piovere a dirotto</span></div><div class=\"explanation\">Piovere moltissimo, nel linguaggio familiare.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Cerca (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Cerca (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div><div class=\"row\" data-hl=\"wmark1\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark1\">casco antiguo</span><span class=\"equivalent\">centro storico</span></div><div class=\"explanation\">La parte storica di una città.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Cerca (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Cerca (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Verbi</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"vmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark vmark0\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">uscire</span><span class=\"grammar\">1ª persona plurale · Indefinido</span></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Coniugazione (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Coniugazione (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>",
  "hover": {
   "0:0": [
    "Anche se",
    [
     [0,0,6],
     [1,0,8],
     [2,0,8]
    ]
   ],
   "0:7": [
    "pioveva a dirotto",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "0:14": [
    "pioveva a dirotto",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "0:16": [
    "pioveva a dirotto",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "0:26": [
    "siamo usciti",
    [
     [0,26,33],
     [1,28,40],
     [2,42,50]
    ]
   ],
   "0:34": [
    "a passeggiare",
    [
     [0,34,42],
     [1,41,54],
     [2,51,61]
    ]
   ],
   "0:36": [
    "a passeggiare",
    [
     [0,34,42],
     [1,41,54],
     [2,51,61]
    ]
   ],
   "0:43": [
    "per",
    [
     [0,43,46],
     [1,55,58],
     [2,62,64]
    ]
   ],
   "0:47": [
    "il",
    [
     [0,47,49],
     [1,59,61],
     [2,65,68]
    ]
   ],
   "0:50": [
    "centro storico",
    [
     [0,50,63],
     [1,62,76],
     [2,69,77]
    ]
   ],
   "0:56": [
    "centro storico",
    [
     [0,50,63],
     [1,62,76],
     [2,69,77]
    ]
   ],
   "1:0": [
    "",
    [
     [0,0,6],
     [1,0,8],
     [2,0,8]
    ]
   ],
   "1:6": [
    "",
    [
     [0,0,6],
     [1,0,8],
     [2,0,8]
    ]
   ],
   "1:9": [
    "",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "1:17": [
    "",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "1:19": [
    "",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "1:28": [
    "",
    [
     [0,26,33],
     [1,28,40],
     [2,42,50]
    ]
   ],
   "1:34": [
    "",
    [
     [0,26,33],
     [1,28,40],
     [2,42,50]
    ]
   ],
   "1:41": [
    "",
    [
     [0,34,42],
     [1,41,54],
     [2,51,61]
    ]
   ],
   "1:43": [
    "",
    [
     [0,34,42],
     [1,41,54],
     [2,51,61]
    ]
   ],
   "1:55": [
    "",
    [
     [0,43,46],
     [1,55,58],
     [2,62,64]
    ]
   ],
   "1:59": [
    "",
    [
     [0,47,49],
     [1,59,61],
     [2,65,68]
    ]
   ],
   "1:62": [
    "",
    [
     [0,50,63],
     [1,62,76],
     [2,69,77]
    ]
   ],
   "1:69": [
    "",
    [
     [0,50,63],
     [1,62,76],
     [2,69,77]
    ]
   ],
   "2:0": [
    "Anche se",
    [
     [0,0,6],
     [1,0,8],
     [2,0,8]
    ]
   ],
   "2:16": [
    "pioveva a dirotto",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "2:24": [
    "pioveva a dirotto",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "2:29": [
    "pioveva a dirotto",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "2:33": [
    "pioveva a dirotto",
    [
     [0,7,24],
     [1,9,26],
     [2,16,37]
    ]
   ],
   "2:42": [
    "siamo usciti",
    [
     [0,26,33],
     [1,28,40],
     [2,42,50]
    ]
   ],
   "2:47": [
    "siamo usciti",
    [
     [0,26,33],
     [1,28,40],
     [2,42,50]
    ]
   ],
   "2:51": [
    "a passeggiare",
    [
     [0,34,42],
     [1,41,54],
     [2,51,61]
    ]
   ],
   "2:55": [
    "a passeggiare",
    [
     [0,34,42],
     [1,41,54],
     [2,51,61]
    ]
   ],
   "2:57": [
    "a passeggiare",
    [
     [0,34,42],
     [1,41,54],
     [2,51,61]
    ]
   ],
   "2:62": [
    "per",
    [
     [0,43,46],
     [1,55,58],
     [2,62,64]
    ]
   ],
   "2:65": [
    "il",
    [
     [0,47,49],
     [1,59,61],
     [2,65,68]
    ]
   ],
   "2:69": [
    "centro storico",
    [
     [0,50,63],
     [1,62,76],
     [2,69,77]
    ]
   ],
   "2:73": [
    "centro storico",
    [
     [0,50,63],
     [1,62,76],
     [2,69,77]
    ]
   ]
  },
  "picks": {
   "0": 0,
   "7": 1,
   "14": 2,
   "16": 1,
   "26": 3,
   "34": 4,
   "36": 5,
   "43": 6,
   "47": 7,
   "50": 8,
   "56": 8
  },
  "entries": [
   {
    "boxes": [
     [
      13,
      1345,
      "sel picked\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span>"
     ],
     [
      13,
      1458,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"5\">Anche</span><span class=\"g\" data-from=\"5\" data-to=\"6\"> </span><span class=\"w\" data-from=\"6\" data-to=\"8\">se</span>"
     ],
     [
      13,
      1970,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selezione · Spagnolo</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">Aunque</span><span class=\"equivalent\">anche se</span><span class=\"grammar\">congiunzione</span></div><div class=\"explanation\">Introduce un contrasto che non cambia ciò che segue.</div><div class=\"synonyms\"><span class=\"label\">affini</span><button class=\"synonym\">si bien</button><button class=\"synonym\">aun cuando</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Cerca (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Cerca (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      118,
      961,
      "sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span>"
     ],
     [
      218,
      1074,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"9\" data-mark-to=\"26\"><span class=\"w\" data-from=\"9\" data-to=\"16\">pioveva</span><span class=\"g\" data-from=\"16\" data-to=\"17\"> </span><span class=\"w\" data-from=\"17\" data-to=\"18\">a</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"26\">dirotto</span>"
     ],
     [
      330,
      1268,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selezione · Spagnolo</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">llovía a cántaros</span><span class=\"arrow\">→</span><span class=\"base\">llover a cántaros</span><span class=\"equivalent\">piovere a dirotto</span><span class=\"grammar\">3ª persona singolare · Imperfecto</span></div><div class=\"explanation\">Piovere moltissimo, nel linguaggio familiare.</div><div class=\"synonyms\"><span class=\"label\">affini</span><button class=\"synonym\">diluviar</button><button class=\"synonym\">llover a mares</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Coniugazione (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Coniugazione (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      277,
      1066,
      "/span><span class=\"sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span></span></span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\""
     ],
     [
      378,
      1178,
      "/span><span class=\"sel\"><span class=\"mark wmark0\" data-mark-from=\"9\" data-mark-to=\"26\"><span class=\"w\" data-from=\"17\" data-to=\"18\">a</span></span></span><span class=\"mark wmark0\" data-mark-from=\"9\" data-mark-to=\"26\""
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selezione · Spagnolo</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"grammar\">preposizione</span></div><div class=\"explanation\">Dopo un verbo di movimento, indica che cosa si va a fare.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Cerca (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Cerca (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      512,
      779,
      "sel picked\"><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span>"
     ],
     [
      612,
      785,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"28\" data-mark-to=\"40\"><span class=\"w\" data-from=\"28\" data-to=\"33\">siamo</span><span class=\"g\" data-from=\"33\" data-to=\"34\"> </span><span class=\"w\" data-from=\"34\" data-to=\"40\">usciti</span>"
     ],
     [
      937,
      878,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selezione · Spagnolo</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">uscire</span><span class=\"grammar\">1ª persona plurale · Indefinido</span></div><div class=\"explanation\">Lasciare un luogo, qui per andare a passeggiare.</div><div class=\"synonyms\"><span class=\"label\">affini</span><button class=\"synonym\">irse</button><button class=\"synonym\">marcharse</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Coniugazione (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Coniugazione (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      693,
      668,
      "sel picked\"><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span>"
     ],
     [
      900,
      674,
      "sel\"><span class=\"w\" data-from=\"41\" data-to=\"42\">a</span>"
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selezione · Spagnolo</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"grammar\">preposizione</span></div><div class=\"explanation\">Dopo un verbo di movimento, indica che cosa si va a fare.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Cerca (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Cerca (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      797,
      559,
      "sel picked\"><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span>"
     ],
     [
      1004,
      560,
      "sel\"><span class=\"w\" data-from=\"43\" data-to=\"54\">passeggiare</span>"
     ],
     [
      1431,
      554,
      "sel\"><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selezione · Spagnolo</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">pasear</span><span class=\"equivalent\">passeggiare</span></div><div class=\"explanation\">Andare a piedi, senza fretta e per piacere.</div><div class=\"synonyms\"><span class=\"label\">affini</span><button class=\"synonym\">caminar</button><button class=\"synonym\">andar</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Coniugazione (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Coniugazione (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      906,
      453,
      "sel picked\"><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span>"
     ],
     [
      1118,
      454,
      "sel\"><span class=\"w\" data-from=\"55\" data-to=\"58\">per</span>"
     ],
     [
      1538,
      449,
      "sel\"><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selezione · Spagnolo</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">por</span><span class=\"equivalent\">per</span><span class=\"grammar\">preposizione</span></div><div class=\"explanation\">Indica lo spazio in cui ci si muove.</div><div class=\"synonyms\"><span class=\"label\">affini</span><button class=\"synonym\">a través de</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Cerca (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Cerca (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1012,
      348,
      "sel picked\"><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span>"
     ],
     [
      1224,
      349,
      "sel\"><span class=\"w\" data-from=\"59\" data-to=\"61\">il</span>"
     ],
     [
      1643,
      343,
      "sel\"><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selezione · Spagnolo</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">el</span><span class=\"equivalent\">il</span><span class=\"grammar\">articolo · singolare · maschile</span></div><div class=\"explanation\">Articolo determinativo davanti a un nome maschile.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Cerca (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Cerca (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1117,
      66,
      "sel picked\"><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span>"
     ],
     [
      1329,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"62\" data-mark-to=\"76\"><span class=\"w\" data-from=\"62\" data-to=\"68\">centro</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"w\" data-from=\"69\" data-to=\"76\">storico</span>"
     ],
     [
      1749,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Selezione · Spagnolo</span><span class=\"status on-hover\">spiegato dal modello di IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">casco antiguo</span><span class=\"equivalent\">centro storico</span><span class=\"grammar\">sostantivo · singolare · maschile</span></div><div class=\"explanation\">La parte storica di una città.</div><div class=\"synonyms\"><span class=\"label\">affini</span><button class=\"synonym\">centro histórico</button><button class=\"synonym\">ciudad vieja</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronuncia\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronuncia</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Spiega più nel dettaglio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Spiega più nel dettaglio</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Aggiungi una frase d’esempio\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Aggiungi una frase d’esempio</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Cerca (esterno)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Cerca (esterno)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Crea flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Crea flashcard</span></button></div></div></div></div></section>"
   }
  ]
 },
 "pt": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Embora chovesse a cântaros, saímos para passear pelo centro histórico.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "sheet": "<section class=\"pane\"><div class=\"label\"><span class=\"name\">Espanhol</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"0\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span><span class=\"g\" data-from=\"6\" data-to=\"7\"> </span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span></span><span class=\"g\" data-from=\"24\" data-to=\"26\">, </span><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span></span><span class=\"g\" data-from=\"33\" data-to=\"34\"> </span><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span><span class=\"g\" data-from=\"35\" data-to=\"36\"> </span><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span><span class=\"g\" data-from=\"42\" data-to=\"43\"> </span><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span><span class=\"g\" data-from=\"49\" data-to=\"50\"> </span><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span></span><span class=\"g\" data-from=\"63\" data-to=\"64\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"edit\" aria-label=\"Editar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11.2 2.6 13.4 4.8 5.6 12.6 3 13l.4-2.6z\"></path></svg><span class=\"pill-label\">Editar</span></button><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copiar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copiar</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Português</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"1\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Embora</span><span class=\"g\" data-from=\"6\" data-to=\"7\"> </span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"26\"><span class=\"w\" data-from=\"7\" data-to=\"15\">chovesse</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"17\">a</span><span class=\"g\" data-from=\"17\" data-to=\"18\"> </span><span class=\"w\" data-from=\"18\" data-to=\"26\">cântaros</span></span><span class=\"g\" data-from=\"26\" data-to=\"28\">, </span><span class=\"mark vmark0\" data-mark-from=\"28\" data-mark-to=\"34\"><span class=\"w\" data-from=\"28\" data-to=\"34\">saímos</span></span><span class=\"g\" data-from=\"34\" data-to=\"35\"> </span><span class=\"w\" data-from=\"35\" data-to=\"39\">para</span><span class=\"g\" data-from=\"39\" data-to=\"40\"> </span><span class=\"w\" data-from=\"40\" data-to=\"47\">passear</span><span class=\"g\" data-from=\"47\" data-to=\"48\"> </span><span class=\"w\" data-from=\"48\" data-to=\"52\">pelo</span><span class=\"g\" data-from=\"52\" data-to=\"53\"> </span><span class=\"mark wmark1\" data-mark-from=\"53\" data-mark-to=\"69\"><span class=\"w\" data-from=\"53\" data-to=\"59\">centro</span><span class=\"g\" data-from=\"59\" data-to=\"60\"> </span><span class=\"w\" data-from=\"60\" data-to=\"69\">histórico</span></span><span class=\"g\" data-from=\"69\" data-to=\"70\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copiar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copiar</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Inglês</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"2\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span><span class=\"g\" data-from=\"8\" data-to=\"9\"> </span><span class=\"w\" data-from=\"9\" data-to=\"11\">it</span><span class=\"g\" data-from=\"11\" data-to=\"12\"> </span><span class=\"w\" data-from=\"12\" data-to=\"15\">was</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span></span><span class=\"g\" data-from=\"37\" data-to=\"39\">, </span><span class=\"w\" data-from=\"39\" data-to=\"41\">we</span><span class=\"g\" data-from=\"41\" data-to=\"42\"> </span><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span></span><span class=\"g\" data-from=\"50\" data-to=\"51\"> </span><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span><span class=\"g\" data-from=\"54\" data-to=\"55\"> </span><span class=\"w\" data-from=\"55\" data-to=\"56\">a</span><span class=\"g\" data-from=\"56\" data-to=\"57\"> </span><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span><span class=\"g\" data-from=\"61\" data-to=\"62\"> </span><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span><span class=\"g\" data-from=\"64\" data-to=\"65\"> </span><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span></span><span class=\"g\" data-from=\"77\" data-to=\"78\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Copiar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Copiar</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Termos</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"wmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark0\">llover a cántaros</span><span class=\"equivalent\">chover a cântaros</span></div><div class=\"explanation\">Chover muito forte, na linguagem informal.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Pesquisar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Pesquisar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div><div class=\"row\" data-hl=\"wmark1\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark1\">casco antiguo</span><span class=\"equivalent\">centro histórico</span></div><div class=\"explanation\">A parte histórica de uma cidade.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Pesquisar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Pesquisar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Verbos</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"vmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark vmark0\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">sair</span><span class=\"grammar\">1ª pessoa do plural · Indefinido</span></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugação (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugação (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>",
  "hover": {
   "0:0": [
    "Embora",
    [
     [0,0,6],
     [1,0,6],
     [2,0,8]
    ]
   ],
   "0:7": [
    "chovesse a cântaros",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "0:14": [
    "chovesse a cântaros",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "0:16": [
    "chovesse a cântaros",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "0:26": [
    "saímos",
    [
     [0,26,33],
     [1,28,34],
     [2,42,50]
    ]
   ],
   "0:34": [
    "para passear",
    [
     [0,34,42],
     [1,35,47],
     [2,51,61]
    ]
   ],
   "0:36": [
    "para passear",
    [
     [0,34,42],
     [1,35,47],
     [2,51,61]
    ]
   ],
   "0:43": [
    "pelo",
    [
     [0,43,49],
     [1,48,52],
     [2,62,68]
    ]
   ],
   "0:47": [
    "pelo",
    [
     [0,43,49],
     [1,48,52],
     [2,62,68]
    ]
   ],
   "0:50": [
    "centro histórico",
    [
     [0,50,63],
     [1,53,69],
     [2,69,77]
    ]
   ],
   "0:56": [
    "centro histórico",
    [
     [0,50,63],
     [1,53,69],
     [2,69,77]
    ]
   ],
   "1:0": [
    "",
    [
     [0,0,6],
     [1,0,6],
     [2,0,8]
    ]
   ],
   "1:7": [
    "",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "1:16": [
    "",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "1:18": [
    "",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "1:28": [
    "",
    [
     [0,26,33],
     [1,28,34],
     [2,42,50]
    ]
   ],
   "1:35": [
    "",
    [
     [0,34,42],
     [1,35,47],
     [2,51,61]
    ]
   ],
   "1:40": [
    "",
    [
     [0,34,42],
     [1,35,47],
     [2,51,61]
    ]
   ],
   "1:48": [
    "",
    [
     [0,43,49],
     [1,48,52],
     [2,62,68]
    ]
   ],
   "1:53": [
    "",
    [
     [0,50,63],
     [1,53,69],
     [2,69,77]
    ]
   ],
   "1:60": [
    "",
    [
     [0,50,63],
     [1,53,69],
     [2,69,77]
    ]
   ],
   "2:0": [
    "Embora",
    [
     [0,0,6],
     [1,0,6],
     [2,0,8]
    ]
   ],
   "2:16": [
    "chovesse a cântaros",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "2:24": [
    "chovesse a cântaros",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "2:29": [
    "chovesse a cântaros",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "2:33": [
    "chovesse a cântaros",
    [
     [0,7,24],
     [1,7,26],
     [2,16,37]
    ]
   ],
   "2:42": [
    "saímos",
    [
     [0,26,33],
     [1,28,34],
     [2,42,50]
    ]
   ],
   "2:47": [
    "saímos",
    [
     [0,26,33],
     [1,28,34],
     [2,42,50]
    ]
   ],
   "2:51": [
    "para passear",
    [
     [0,34,42],
     [1,35,47],
     [2,51,61]
    ]
   ],
   "2:55": [
    "para passear",
    [
     [0,34,42],
     [1,35,47],
     [2,51,61]
    ]
   ],
   "2:57": [
    "para passear",
    [
     [0,34,42],
     [1,35,47],
     [2,51,61]
    ]
   ],
   "2:62": [
    "pelo",
    [
     [0,43,49],
     [1,48,52],
     [2,62,68]
    ]
   ],
   "2:65": [
    "pelo",
    [
     [0,43,49],
     [1,48,52],
     [2,62,68]
    ]
   ],
   "2:69": [
    "centro histórico",
    [
     [0,50,63],
     [1,53,69],
     [2,69,77]
    ]
   ],
   "2:73": [
    "centro histórico",
    [
     [0,50,63],
     [1,53,69],
     [2,69,77]
    ]
   ]
  },
  "picks": {
   "0": 0,
   "7": 1,
   "14": 2,
   "16": 1,
   "26": 3,
   "34": 4,
   "36": 5,
   "43": 6,
   "47": 7,
   "50": 8,
   "56": 8
  },
  "entries": [
   {
    "boxes": [
     [
      13,
      1345,
      "sel picked\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span>"
     ],
     [
      13,
      1249,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Embora</span>"
     ],
     [
      13,
      1970,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Seleção · Espanhol</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">Aunque</span><span class=\"equivalent\">embora</span><span class=\"grammar\">conjunção</span></div><div class=\"explanation\">Introduz um contraste que não muda o que vem depois.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">si bien</button><button class=\"synonym\">aun cuando</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Pesquisar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Pesquisar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      118,
      961,
      "sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span>"
     ],
     [
      118,
      863,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"26\"><span class=\"w\" data-from=\"7\" data-to=\"15\">chovesse</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"17\">a</span><span class=\"g\" data-from=\"17\" data-to=\"18\"> </span><span class=\"w\" data-from=\"18\" data-to=\"26\">cântaros</span>"
     ],
     [
      330,
      1268,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Seleção · Espanhol</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">llovía a cántaros</span><span class=\"arrow\">→</span><span class=\"base\">llover a cántaros</span><span class=\"equivalent\">chover a cântaros</span><span class=\"grammar\">3ª pessoa do singular · Imperfecto</span></div><div class=\"explanation\">Chover muito forte, na linguagem informal.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">diluviar</button><button class=\"synonym\">llover a mares</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugação (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugação (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      277,
      1066,
      "/span><span class=\"sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span></span></span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\""
     ],
     [
      694,
      568,
      "sel\"><span class=\"w\" data-from=\"35\" data-to=\"39\">para</span>"
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Seleção · Espanhol</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"grammar\">preposição</span></div><div class=\"explanation\">Depois de um verbo de movimento, indica o que se vai fazer.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Pesquisar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Pesquisar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      512,
      779,
      "sel picked\"><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span>"
     ],
     [
      514,
      682,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"28\" data-mark-to=\"34\"><span class=\"w\" data-from=\"28\" data-to=\"34\">saímos</span>"
     ],
     [
      937,
      878,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Seleção · Espanhol</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">sair</span><span class=\"grammar\">1ª pessoa do plural · Indefinido</span></div><div class=\"explanation\">Deixar um lugar, aqui para ir passear.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">irse</button><button class=\"synonym\">marcharse</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugação (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugação (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      693,
      668,
      "sel picked\"><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span>"
     ],
     [
      694,
      568,
      "sel\"><span class=\"w\" data-from=\"35\" data-to=\"39\">para</span>"
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Seleção · Espanhol</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"grammar\">preposição</span></div><div class=\"explanation\">Depois de um verbo de movimento, indica o que se vai fazer.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Pesquisar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Pesquisar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      797,
      559,
      "sel picked\"><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span>"
     ],
     [
      801,
      458,
      "sel\"><span class=\"w\" data-from=\"40\" data-to=\"47\">passear</span>"
     ],
     [
      1431,
      554,
      "sel\"><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Seleção · Espanhol</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">pasear</span><span class=\"equivalent\">passear</span></div><div class=\"explanation\">Andar a pé, sem pressa e por prazer.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">caminar</button><button class=\"synonym\">andar</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Conjugação (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Conjugação (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      906,
      453,
      "sel picked\"><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span>"
     ],
     [
      911,
      351,
      "sel\"><span class=\"w\" data-from=\"48\" data-to=\"52\">pelo</span>"
     ],
     [
      1538,
      449,
      "sel\"><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Seleção · Espanhol</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">por</span><span class=\"grammar\">preposição</span></div><div class=\"explanation\">Indica o espaço por onde alguém se desloca.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">a través de</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Pesquisar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Pesquisar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1012,
      348,
      "sel picked\"><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span>"
     ],
     [
      1297,
      0,
      ""
     ],
     [
      1643,
      343,
      "sel\"><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Seleção · Espanhol</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">el</span><span class=\"equivalent\">o</span><span class=\"grammar\">artigo · singular · masculino</span></div><div class=\"explanation\">Artigo definido antes de um substantivo masculino.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Pesquisar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Pesquisar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1117,
      66,
      "sel picked\"><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span>"
     ],
     [
      1018,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"53\" data-mark-to=\"69\"><span class=\"w\" data-from=\"53\" data-to=\"59\">centro</span><span class=\"g\" data-from=\"59\" data-to=\"60\"> </span><span class=\"w\" data-from=\"60\" data-to=\"69\">histórico</span>"
     ],
     [
      1749,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Seleção · Espanhol</span><span class=\"status on-hover\">explicado pelo modelo de IA</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">casco antiguo</span><span class=\"equivalent\">centro histórico</span><span class=\"grammar\">substantivo · singular · masculino</span></div><div class=\"explanation\">A parte histórica de uma cidade.</div><div class=\"synonyms\"><span class=\"label\">relacionadas</span><button class=\"synonym\">centro histórico</button><button class=\"synonym\">ciudad vieja</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Pronunciar\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Pronunciar</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Explicar em mais detalhe\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Explicar em mais detalhe</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Adicionar uma frase de exemplo\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Adicionar uma frase de exemplo</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Pesquisar (externo)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Pesquisar (externo)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Criar flashcard\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Criar flashcard</span></button></div></div></div></div></section>"
   }
  ]
 },
 "ru": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Хотя дождь лил как из ведра, мы вышли погулять по старому городу.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "sheet": "<section class=\"pane\"><div class=\"label\"><span class=\"name\">Испанский</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"0\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span><span class=\"g\" data-from=\"6\" data-to=\"7\"> </span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span></span><span class=\"g\" data-from=\"24\" data-to=\"26\">, </span><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span></span><span class=\"g\" data-from=\"33\" data-to=\"34\"> </span><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span><span class=\"g\" data-from=\"35\" data-to=\"36\"> </span><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span><span class=\"g\" data-from=\"42\" data-to=\"43\"> </span><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span><span class=\"g\" data-from=\"49\" data-to=\"50\"> </span><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span></span><span class=\"g\" data-from=\"63\" data-to=\"64\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"edit\" aria-label=\"Изменить\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11.2 2.6 13.4 4.8 5.6 12.6 3 13l.4-2.6z\"></path></svg><span class=\"pill-label\">Изменить</span></button><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Копировать\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Копировать</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Русский</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"1\"><span class=\"w\" data-from=\"0\" data-to=\"4\">Хотя</span><span class=\"g\" data-from=\"4\" data-to=\"5\"> </span><span class=\"w\" data-from=\"5\" data-to=\"10\">дождь</span><span class=\"g\" data-from=\"10\" data-to=\"11\"> </span><span class=\"mark wmark0\" data-mark-from=\"11\" data-mark-to=\"27\"><span class=\"w\" data-from=\"11\" data-to=\"14\">лил</span><span class=\"g\" data-from=\"14\" data-to=\"15\"> </span><span class=\"w\" data-from=\"15\" data-to=\"18\">как</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"21\">из</span><span class=\"g\" data-from=\"21\" data-to=\"22\"> </span><span class=\"w\" data-from=\"22\" data-to=\"27\">ведра</span></span><span class=\"g\" data-from=\"27\" data-to=\"29\">, </span><span class=\"w\" data-from=\"29\" data-to=\"31\">мы</span><span class=\"g\" data-from=\"31\" data-to=\"32\"> </span><span class=\"mark vmark0\" data-mark-from=\"32\" data-mark-to=\"37\"><span class=\"w\" data-from=\"32\" data-to=\"37\">вышли</span></span><span class=\"g\" data-from=\"37\" data-to=\"38\"> </span><span class=\"w\" data-from=\"38\" data-to=\"46\">погулять</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"49\">по</span><span class=\"g\" data-from=\"49\" data-to=\"50\"> </span><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"64\"><span class=\"w\" data-from=\"50\" data-to=\"57\">старому</span><span class=\"g\" data-from=\"57\" data-to=\"58\"> </span><span class=\"w\" data-from=\"58\" data-to=\"64\">городу</span></span><span class=\"g\" data-from=\"64\" data-to=\"65\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Копировать\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Копировать</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Английский</span><span class=\"status\"></span></div><div class=\"frame\"><div class=\"box words\" dir=\"ltr\" data-panel=\"2\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span><span class=\"g\" data-from=\"8\" data-to=\"9\"> </span><span class=\"w\" data-from=\"9\" data-to=\"11\">it</span><span class=\"g\" data-from=\"11\" data-to=\"12\"> </span><span class=\"w\" data-from=\"12\" data-to=\"15\">was</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span></span><span class=\"g\" data-from=\"37\" data-to=\"39\">, </span><span class=\"w\" data-from=\"39\" data-to=\"41\">we</span><span class=\"g\" data-from=\"41\" data-to=\"42\"> </span><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span></span><span class=\"g\" data-from=\"50\" data-to=\"51\"> </span><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span><span class=\"g\" data-from=\"54\" data-to=\"55\"> </span><span class=\"w\" data-from=\"55\" data-to=\"56\">a</span><span class=\"g\" data-from=\"56\" data-to=\"57\"> </span><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span><span class=\"g\" data-from=\"61\" data-to=\"62\"> </span><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span><span class=\"g\" data-from=\"64\" data-to=\"65\"> </span><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span><span class=\"g\" data-from=\"68\" data-to=\"69\"> </span><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span></span><span class=\"g\" data-from=\"77\" data-to=\"78\">.</span></div><div class=\"actions\"><button class=\"pill icon\" data-icon=\"copy\" aria-label=\"Копировать\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5\" width=\"8\" height=\"8\" rx=\"1.8\"></rect><path d=\"M10.5 3h-6a2 2 0 0 0-2 2v6\"></path></svg><span class=\"pill-label\">Копировать</span></button></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Термины</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"wmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark0\">llover a cántaros</span><span class=\"equivalent\">лить как из ведра</span></div><div class=\"explanation\">Об очень сильном дожде, разговорное.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Искать (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Искать (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div><div class=\"row\" data-hl=\"wmark1\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark wmark1\">casco antiguo</span><span class=\"equivalent\">старый город</span></div><div class=\"explanation\">Историческая часть города.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Искать (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Искать (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section><section class=\"pane\"><div class=\"label\"><span class=\"name\">Глаголы</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"vmark0\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term mark vmark0\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">выходить</span><span class=\"grammar\">1-е лицо, мн. число · Indefinido</span></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Спряжение (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Спряжение (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>",
  "hover": {
   "0:0": [
    "Хотя",
    [
     [0,0,6],
     [1,0,4],
     [2,0,8]
    ]
   ],
   "0:7": [
    "лил как из ведра",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "0:14": [
    "лил как из ведра",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "0:16": [
    "лил как из ведра",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "0:26": [
    "вышли",
    [
     [0,26,33],
     [1,32,37],
     [2,42,50]
    ]
   ],
   "0:34": [
    "погулять",
    [
     [0,34,42],
     [1,38,46],
     [2,51,61]
    ]
   ],
   "0:36": [
    "погулять",
    [
     [0,34,42],
     [1,38,46],
     [2,51,61]
    ]
   ],
   "0:43": [
    "по",
    [
     [0,43,49],
     [1,47,49],
     [2,62,68]
    ]
   ],
   "0:47": [
    "по",
    [
     [0,43,49],
     [1,47,49],
     [2,62,68]
    ]
   ],
   "0:50": [
    "старому городу",
    [
     [0,50,63],
     [1,50,64],
     [2,69,77]
    ]
   ],
   "0:56": [
    "старому городу",
    [
     [0,50,63],
     [1,50,64],
     [2,69,77]
    ]
   ],
   "1:0": [
    "",
    [
     [0,0,6],
     [1,0,4],
     [2,0,8]
    ]
   ],
   "1:11": [
    "",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "1:15": [
    "",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "1:19": [
    "",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "1:22": [
    "",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "1:32": [
    "",
    [
     [0,26,33],
     [1,32,37],
     [2,42,50]
    ]
   ],
   "1:38": [
    "",
    [
     [0,34,42],
     [1,38,46],
     [2,51,61]
    ]
   ],
   "1:47": [
    "",
    [
     [0,43,49],
     [1,47,49],
     [2,62,68]
    ]
   ],
   "1:50": [
    "",
    [
     [0,50,63],
     [1,50,64],
     [2,69,77]
    ]
   ],
   "1:58": [
    "",
    [
     [0,50,63],
     [1,50,64],
     [2,69,77]
    ]
   ],
   "2:0": [
    "Хотя",
    [
     [0,0,6],
     [1,0,4],
     [2,0,8]
    ]
   ],
   "2:16": [
    "лил как из ведра",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "2:24": [
    "лил как из ведра",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "2:29": [
    "лил как из ведра",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "2:33": [
    "лил как из ведра",
    [
     [0,7,24],
     [1,11,27],
     [2,16,37]
    ]
   ],
   "2:42": [
    "вышли",
    [
     [0,26,33],
     [1,32,37],
     [2,42,50]
    ]
   ],
   "2:47": [
    "вышли",
    [
     [0,26,33],
     [1,32,37],
     [2,42,50]
    ]
   ],
   "2:51": [
    "погулять",
    [
     [0,34,42],
     [1,38,46],
     [2,51,61]
    ]
   ],
   "2:55": [
    "погулять",
    [
     [0,34,42],
     [1,38,46],
     [2,51,61]
    ]
   ],
   "2:57": [
    "погулять",
    [
     [0,34,42],
     [1,38,46],
     [2,51,61]
    ]
   ],
   "2:62": [
    "по",
    [
     [0,43,46],
     [1,47,49],
     [2,62,64]
    ]
   ],
   "2:65": [
    "городу",
    [
     [0,47,49],
     [1,58,64],
     [2,65,68]
    ]
   ],
   "2:69": [
    "старому городу",
    [
     [0,50,63],
     [1,50,64],
     [2,69,77]
    ]
   ],
   "2:73": [
    "старому городу",
    [
     [0,50,63],
     [1,50,64],
     [2,69,77]
    ]
   ]
  },
  "picks": {
   "0": 0,
   "7": 1,
   "14": 2,
   "16": 1,
   "26": 3,
   "34": 4,
   "36": 5,
   "43": 6,
   "47": 7,
   "50": 8,
   "56": 8
  },
  "entries": [
   {
    "boxes": [
     [
      13,
      1345,
      "sel picked\"><span class=\"w\" data-from=\"0\" data-to=\"6\">Aunque</span>"
     ],
     [
      13,
      1451,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"4\">Хотя</span>"
     ],
     [
      13,
      1970,
      "sel\"><span class=\"w\" data-from=\"0\" data-to=\"8\">Although</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Выделение · Испанский</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">Aunque</span><span class=\"equivalent\">хотя</span><span class=\"grammar\">союз</span></div><div class=\"explanation\">Вводит противопоставление, которое не меняет сказанного дальше.</div><div class=\"synonyms\"><span class=\"label\">близкие по смыслу</span><button class=\"synonym\">si bien</button><button class=\"synonym\">aun cuando</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Искать (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Искать (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      118,
      961,
      "sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"7\" data-to=\"13\">llovía</span><span class=\"g\" data-from=\"13\" data-to=\"14\"> </span><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span><span class=\"g\" data-from=\"15\" data-to=\"16\"> </span><span class=\"w\" data-from=\"16\" data-to=\"24\">cántaros</span>"
     ],
     [
      223,
      857,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"11\" data-mark-to=\"27\"><span class=\"w\" data-from=\"11\" data-to=\"14\">лил</span><span class=\"g\" data-from=\"14\" data-to=\"15\"> </span><span class=\"w\" data-from=\"15\" data-to=\"18\">как</span><span class=\"g\" data-from=\"18\" data-to=\"19\"> </span><span class=\"w\" data-from=\"19\" data-to=\"21\">из</span><span class=\"g\" data-from=\"21\" data-to=\"22\"> </span><span class=\"w\" data-from=\"22\" data-to=\"27\">ведра</span>"
     ],
     [
      330,
      1268,
      "sel\"><span class=\"mark wmark0\" data-mark-from=\"16\" data-mark-to=\"37\"><span class=\"w\" data-from=\"16\" data-to=\"23\">raining</span><span class=\"g\" data-from=\"23\" data-to=\"24\"> </span><span class=\"w\" data-from=\"24\" data-to=\"28\">cats</span><span class=\"g\" data-from=\"28\" data-to=\"29\"> </span><span class=\"w\" data-from=\"29\" data-to=\"32\">and</span><span class=\"g\" data-from=\"32\" data-to=\"33\"> </span><span class=\"w\" data-from=\"33\" data-to=\"37\">dogs</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Выделение · Испанский</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">llovía a cántaros</span><span class=\"arrow\">→</span><span class=\"base\">llover a cántaros</span><span class=\"equivalent\">лить как из ведра</span><span class=\"grammar\">3-е лицо, ед. число · Imperfecto</span></div><div class=\"explanation\">Об очень сильном дожде, разговорное.</div><div class=\"synonyms\"><span class=\"label\">близкие по смыслу</span><button class=\"synonym\">diluviar</button><button class=\"synonym\">llover a mares</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Спряжение (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Спряжение (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      277,
      1066,
      "/span><span class=\"sel picked\"><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\"><span class=\"w\" data-from=\"14\" data-to=\"15\">a</span></span></span><span class=\"mark wmark0\" data-mark-from=\"7\" data-mark-to=\"24\""
     ],
     [
      1497,
      0,
      ""
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Выделение · Испанский</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"equivalent\">чтобы</span><span class=\"grammar\">предлог</span></div><div class=\"explanation\">После глагола движения указывает, зачем идут.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Искать (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Искать (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      512,
      779,
      "sel picked\"><span class=\"mark vmark0\" data-mark-from=\"26\" data-mark-to=\"33\"><span class=\"w\" data-from=\"26\" data-to=\"33\">salimos</span>"
     ],
     [
      825,
      572,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"32\" data-mark-to=\"37\"><span class=\"w\" data-from=\"32\" data-to=\"37\">вышли</span>"
     ],
     [
      937,
      878,
      "sel\"><span class=\"mark vmark0\" data-mark-from=\"42\" data-mark-to=\"50\"><span class=\"w\" data-from=\"42\" data-to=\"46\">went</span><span class=\"g\" data-from=\"46\" data-to=\"47\"> </span><span class=\"w\" data-from=\"47\" data-to=\"50\">out</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Выделение · Испанский</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">salimos</span><span class=\"arrow\">→</span><span class=\"base\">salir</span><span class=\"equivalent\">выходить</span><span class=\"grammar\">1-е лицо, мн. число · Indefinido</span></div><div class=\"explanation\">Покинуть место, здесь чтобы пойти погулять.</div><div class=\"synonyms\"><span class=\"label\">близкие по смыслу</span><button class=\"synonym\">irse</button><button class=\"synonym\">marcharse</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Спряжение (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Спряжение (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      693,
      668,
      "sel picked\"><span class=\"w\" data-from=\"34\" data-to=\"35\">a</span>"
     ],
     [
      1497,
      0,
      ""
     ],
     [
      1221,
      765,
      "sel\"><span class=\"w\" data-from=\"51\" data-to=\"54\">for</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Выделение · Испанский</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">a</span><span class=\"equivalent\">чтобы</span><span class=\"grammar\">предлог</span></div><div class=\"explanation\">После глагола движения указывает, зачем идут.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Искать (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Искать (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      797,
      559,
      "sel picked\"><span class=\"w\" data-from=\"36\" data-to=\"42\">pasear</span>"
     ],
     [
      1004,
      454,
      "sel\"><span class=\"w\" data-from=\"38\" data-to=\"46\">погулять</span>"
     ],
     [
      1431,
      554,
      "sel\"><span class=\"w\" data-from=\"57\" data-to=\"61\">walk</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Выделение · Испанский</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">pasear</span><span class=\"equivalent\">гулять</span></div><div class=\"explanation\">Ходить пешком, не спеша и ради удовольствия.</div><div class=\"synonyms\"><span class=\"label\">близкие по смыслу</span><button class=\"synonym\">caminar</button><button class=\"synonym\">andar</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"conjugation\" aria-label=\"Спряжение (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"6.2\" cy=\"4.6\" r=\"2.3\"></circle><path d=\"M1.8 13.6c0-2.6 2-4.4 4.4-4.4 1 0 1.9.3 2.6.8\"></path><circle cx=\"11.6\" cy=\"11.4\" r=\"3\"></circle><path d=\"M11.6 9.9v1.5l1 .7\"></path></svg><span class=\"pill-label\">Спряжение (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      906,
      453,
      "sel picked\"><span class=\"w\" data-from=\"43\" data-to=\"46\">por</span>"
     ],
     [
      1115,
      349,
      "sel\"><span class=\"w\" data-from=\"47\" data-to=\"49\">по</span>"
     ],
     [
      1538,
      449,
      "sel\"><span class=\"w\" data-from=\"62\" data-to=\"64\">in</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Выделение · Испанский</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">por</span><span class=\"equivalent\">по</span><span class=\"grammar\">предлог</span></div><div class=\"explanation\">Указывает пространство, по которому движутся.</div><div class=\"synonyms\"><span class=\"label\">близкие по смыслу</span><button class=\"synonym\">a través de</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Искать (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Искать (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1012,
      348,
      "sel picked\"><span class=\"w\" data-from=\"47\" data-to=\"49\">el</span>"
     ],
     [
      1497,
      0,
      ""
     ],
     [
      1643,
      343,
      "sel\"><span class=\"w\" data-from=\"65\" data-to=\"68\">the</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Выделение · Испанский</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">el</span><span class=\"grammar\">артикль · единственное число · мужской род</span></div><div class=\"explanation\">Определённый артикль перед существительным мужского рода.</div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Искать (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Искать (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>"
   },
   {
    "boxes": [
     [
      1117,
      66,
      "sel picked\"><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"63\"><span class=\"w\" data-from=\"50\" data-to=\"55\">casco</span><span class=\"g\" data-from=\"55\" data-to=\"56\"> </span><span class=\"w\" data-from=\"56\" data-to=\"63\">antiguo</span>"
     ],
     [
      1220,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"50\" data-mark-to=\"64\"><span class=\"w\" data-from=\"50\" data-to=\"57\">старому</span><span class=\"g\" data-from=\"57\" data-to=\"58\"> </span><span class=\"w\" data-from=\"58\" data-to=\"64\">городу</span>"
     ],
     [
      1749,
      66,
      "sel\"><span class=\"mark wmark1\" data-mark-from=\"69\" data-mark-to=\"77\"><span class=\"w\" data-from=\"69\" data-to=\"72\">old</span><span class=\"g\" data-from=\"72\" data-to=\"73\"> </span><span class=\"w\" data-from=\"73\" data-to=\"77\">town</span>"
     ]
    ],
    "pane": "<section class=\"pane\" data-section=\"marked\"><div class=\"label\"><span class=\"name\">Выделение · Испанский</span><span class=\"status on-hover\">объяснение: ИИ-модель</span></div><div class=\"frame\"><div class=\"box rows\"><div class=\"row\" data-hl=\"sel\" style=\"--actions: 136px;\"><div class=\"row-main\"><div class=\"row-head\"><span class=\"term\">casco antiguo</span><span class=\"equivalent\">старый город</span><span class=\"grammar\">существительное · единственное число · мужской род</span></div><div class=\"explanation\">Историческая часть города.</div><div class=\"synonyms\"><span class=\"label\">близкие по смыслу</span><button class=\"synonym\">centro histórico</button><button class=\"synonym\">ciudad vieja</button></div></div><div class=\"row-actions\"><button class=\"pill icon\" data-icon=\"speak\" aria-label=\"Произнести\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z\"></path><path d=\"M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2\"></path></svg><span class=\"pill-label\">Произнести</span></button><button class=\"pill icon\" data-icon=\"more\" aria-label=\"Объяснить подробнее\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 4h11M2.5 7.5h11M2.5 11h5.5\"></path><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Объяснить подробнее</span></button><button class=\"pill icon\" data-icon=\"example\" aria-label=\"Добавить пример\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4\"></path><rect x=\"2.5\" y=\"8.8\" width=\"3.2\" height=\"3.4\" rx=\"0.6\"></rect><path d=\"M12 9.5v5M9.5 12h5\"></path></svg><span class=\"pill-label\">Добавить пример</span></button><button class=\"pill icon\" data-icon=\"search\" aria-label=\"Искать (внешний сайт)\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.3\"></circle><path d=\"m10.2 10.2 3.3 3.3\"></path></svg><span class=\"pill-label\">Искать (внешний сайт)</span></button><button class=\"pill icon\" data-icon=\"card\" aria-label=\"Создать карточку\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2.2\" y=\"4\" width=\"11.6\" height=\"8\" rx=\"1.6\"></rect><path d=\"M2.2 8h11.6\"></path></svg><span class=\"pill-label\">Создать карточку</span></button></div></div></div></div></section>"
   }
  ]
 }
};
