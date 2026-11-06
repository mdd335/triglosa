/* The first steps' example as the word aligner links it, per interface
   language: written by scripts/example-links.mjs, never by hand. `texts`
   are the original, the reader's translation and the other one; `own` and
   `other` link the source text's words to each translation's, `between` the
   other translation's to the reader's. */

export const EXAMPLE_LINKS = {
 "de": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Obwohl es in Strömen regnete, gingen wir in der Altstadt spazieren.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "own": [
   [0,0],
   [1,4],
   [2,2],
   [3,3],
   [4,5],
   [4,6],
   [6,10],
   [7,7],
   [8,8],
   [9,9],
   [10,9]
  ],
  "other": [
   [0,0],
   [1,2],
   [1,3],
   [3,4],
   [3,6],
   [4,7],
   [4,8],
   [4,9],
   [5,10],
   [6,12],
   [7,13],
   [8,14],
   [9,16],
   [10,15]
  ],
  "between": [
   [0,0],
   [1,1],
   [3,4],
   [7,6],
   [8,5],
   [12,10],
   [13,7],
   [14,8],
   [15,9],
   [16,9]
  ]
 },
 "en": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Although it was raining cats and dogs, we went out for a walk in the old town.",
   "Même s’il pleuvait à verse, nous sommes sortis nous promener dans la vieille ville."
  ],
  "own": [
   [0,0],
   [1,2],
   [1,3],
   [3,4],
   [3,6],
   [4,7],
   [4,8],
   [4,9],
   [5,10],
   [6,12],
   [7,13],
   [8,14],
   [9,16],
   [10,15]
  ],
  "other": [
   [0,0],
   [1,3],
   [2,4],
   [3,5],
   [4,6],
   [4,7],
   [4,8],
   [6,10],
   [7,11],
   [8,12],
   [9,14],
   [10,13]
  ],
  "between": [
   [0,0],
   [2,1],
   [3,2],
   [3,3],
   [5,3],
   [6,7],
   [7,8],
   [8,9],
   [10,12],
   [11,13],
   [12,14],
   [13,15],
   [14,16]
  ]
 },
 "es": {
  "texts": [
   "Although it was raining cats and dogs, we went out for a walk in the old town.",
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Même s’il pleuvait à verse, nous sommes sortis nous promener dans la vieille ville."
  ],
  "own": [
   [0,0],
   [2,1],
   [3,1],
   [4,3],
   [6,3],
   [7,4],
   [8,4],
   [9,4],
   [10,5],
   [12,6],
   [13,7],
   [14,8],
   [15,10],
   [16,9]
  ],
  "other": [
   [0,0],
   [1,2],
   [2,3],
   [3,3],
   [3,5],
   [7,6],
   [8,7],
   [9,8],
   [12,10],
   [13,11],
   [14,12],
   [15,13],
   [16,14]
  ],
  "between": [
   [0,0],
   [3,1],
   [4,2],
   [5,3],
   [6,4],
   [7,4],
   [8,4],
   [10,6],
   [11,7],
   [12,8],
   [13,10],
   [14,9]
  ]
 },
 "fr": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Même s’il pleuvait à verse, nous sommes sortis nous promener dans la vieille ville.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "own": [
   [0,0],
   [1,3],
   [2,4],
   [3,5],
   [4,6],
   [4,7],
   [4,8],
   [6,10],
   [7,11],
   [8,12],
   [9,14],
   [10,13]
  ],
  "other": [
   [0,0],
   [1,2],
   [1,3],
   [3,4],
   [3,6],
   [4,7],
   [4,8],
   [4,9],
   [5,10],
   [6,12],
   [7,13],
   [8,14],
   [9,16],
   [10,15]
  ],
  "between": [
   [0,0],
   [1,2],
   [2,3],
   [3,3],
   [3,5],
   [7,6],
   [8,7],
   [9,8],
   [12,10],
   [13,11],
   [14,12],
   [15,13],
   [16,14]
  ]
 },
 "it": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Anche se pioveva a dirotto, siamo usciti a passeggiare per il centro storico.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "own": [
   [0,0],
   [0,1],
   [1,2],
   [2,3],
   [3,4],
   [4,5],
   [4,6],
   [5,7],
   [6,8],
   [7,9],
   [8,10],
   [9,11],
   [10,12]
  ],
  "other": [
   [0,0],
   [1,2],
   [1,3],
   [3,4],
   [3,6],
   [4,7],
   [4,8],
   [4,9],
   [5,10],
   [6,12],
   [7,13],
   [8,14],
   [9,16],
   [10,15]
  ],
  "between": [
   [0,0],
   [2,2],
   [3,2],
   [3,3],
   [3,4],
   [4,4],
   [6,4],
   [7,5],
   [8,6],
   [9,6],
   [10,7],
   [12,8],
   [13,9],
   [14,10],
   [15,12],
   [16,11]
  ]
 },
 "pt": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Embora chovesse a cântaros, saímos para passear pelo centro histórico.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "own": [
   [0,0],
   [1,1],
   [2,2],
   [3,3],
   [4,4],
   [5,5],
   [6,6],
   [7,7],
   [9,8],
   [10,9]
  ],
  "other": [
   [0,0],
   [1,2],
   [1,3],
   [3,4],
   [3,6],
   [4,7],
   [4,8],
   [4,9],
   [5,10],
   [6,12],
   [7,13],
   [8,14],
   [9,16],
   [10,15]
  ],
  "between": [
   [0,0],
   [2,1],
   [3,1],
   [4,3],
   [6,3],
   [7,4],
   [8,4],
   [9,4],
   [10,5],
   [12,6],
   [13,7],
   [15,9],
   [16,8]
  ]
 },
 "ru": {
  "texts": [
   "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
   "Хотя дождь лил как из ведра, мы вышли погулять по старому городу.",
   "Although it was raining cats and dogs, we went out for a walk in the old town."
  ],
  "own": [
   [0,0],
   [1,1],
   [1,2],
   [2,3],
   [2,4],
   [3,5],
   [4,6],
   [4,7],
   [6,8],
   [7,9],
   [8,11],
   [9,11],
   [10,10]
  ],
  "other": [
   [0,0],
   [1,2],
   [1,3],
   [3,4],
   [3,6],
   [4,7],
   [4,8],
   [4,9],
   [5,10],
   [6,12],
   [7,13],
   [8,14],
   [9,16],
   [10,15]
  ],
  "between": [
   [0,0],
   [1,1],
   [2,2],
   [3,2],
   [4,5],
   [6,5],
   [7,6],
   [8,7],
   [9,7],
   [12,8],
   [13,9],
   [15,10],
   [16,11]
  ]
 }
};
