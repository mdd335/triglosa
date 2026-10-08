# What happens behind a translation

Who is asked what, from the moment a text arrives until the sheet is
complete — and who answers instead where the first one cannot.

Three kinds of helper do the work, and every box below names its own:

| | Who | Where it runs |
|---|---|---|
| **Q1 … Q19** | the **AI model** set up in the settings | wherever its endpoint is — the only requests that leave the app |
| **Triglosa** | two small models that come with the app: the language identifier and the word aligner | on this machine |
| **Apple** | the system's recognizer and translation | on this machine, Mac only |

Every request to the AI model has a number. The [table at the end](#every-request-to-the-ai-model)
lists them all.

## The whole way

```mermaid
flowchart TD
  IN["A text arrives"] --> SAME{"Same text as one of the last five?"}
  SAME -->|yes| KEPT["Shown again, nothing asked"]
  SAME -->|no| LANG["1 · Name the language"]
  LANG --> LEN{"More than three words?"}
  LEN -->|yes| TRANS["2 · Translate"]
  LEN -->|no| SHORT["4 · Short mode: a dictionary entry"]
  TRANS --> BELOW["3 · Terms, verbs, marks, hover"]
  BELOW --> CLICK["5 · On request: a picked word"]
  SHORT --> CLICK
```

## 1 · Naming the language

Four stages, cheapest first. Each may stay silent, and only then is the next
one asked.

```mermaid
flowchart TD
  T["Text"] --> CH{"Language corrected by the reader?"}
  CH -->|yes| DONE(["Language named"])
  CH -->|no| FW["Function words, counted in the app"]
  FW -->|sure| DONE
  FW -->|silent| ID["Triglosa · language identifier"]
  ID -->|"sure, a language the app offers"| DONE
  ID -->|unsure| AR["Apple · recognizer"]
  ID -->|"sure, a language the app does not offer"| Q1
  AR -->|sure| DONE
  AR -->|"unsure, or on Windows"| Q1["Q1 · AI model names the language"]
  Q1 -->|answers| DONE
  Q1 -->|"no AI model, or not reachable"| GUESS{"Apple has a best guess?"}
  GUESS -->|yes| DONE
  GUESS -->|no| NONE(["Language not named"])

  classDef model stroke:#18daf1,stroke-width:3px
  classDef own stroke-dasharray:6 4
  class Q1 model
  class ID own
```

- A language the app has no pack for keeps its name and is still translated
  by the AI model; the terms are asked, the verbs and the hover are not.
- Not named and no AI model: the panels say so, and nothing else happens.

## 2 · Translating

One translation per panel. A setting decides who goes first; the other steps
in wherever the first comes back empty, and the panel's heading says so.
The AI model translates both panels side by side, Apple one after the other.

```mermaid
flowchart TD
  P["One panel to fill"] --> WHO{"Who goes first?"}
  WHO -->|"AI model (preset; always on Windows)"| Q2A["Q2 · AI model translates"]
  WHO -->|"Apple (chosen, or no AI model)"| AP1["Apple · translation"]

  Q2A -->|answers| OK(["Panel filled"])
  Q2A -->|empty| AP2["Apple · translation"]
  AP2 -->|answers| OKF(["Panel filled, marked as a stand-in"])
  AP2 -->|"empty, or on Windows"| NA(["No answer received"])

  AP1 -->|answers| OK
  AP1 -->|empty| HAS{"AI model set up?"}
  HAS -->|yes| Q2B["Q2 · AI model translates"]
  HAS -->|no| MISS(["Language pack missing, or Apple's translation unavailable"])
  Q2B -->|answers| OKF
  Q2B -->|empty| NA

  classDef model stroke:#18daf1,stroke-width:3px
  class Q2A,Q2B model
```

Without an AI model the run ends here — except for the hover, which the word
aligner works out by itself (next section).

## 3 · Below the translations

Three strands start together with the translations and wait only on what
they need. The terms and verbs are asked of the AI model; where they ended up
in the translations is worked out on the machine wherever it can be.

```mermaid
flowchart TD
  START(["Language named"]) --> Q3["Q3 · Find the terms"]
  START --> Q6["Q6 · Find the verb forms"]
  START --> TR["Translations (section 2)"]

  Q3 --> Q4["Q4 · Write out each abbreviation"]
  Q3 --> Q5["Q5 · Word class of each single word"]
  Q6 --> Q7["Q7 · Explain the hardest verbs"]

  TR --> AL["Triglosa · word aligner"]

  Q4 --> PT
  Q5 --> PT
  Q6 --> PT
  AL --> PT{"Every term a single word the aligner found?"}
  PT -->|yes| MT(["Terms marked in the translations"])
  PT -->|no| Q8["Q8 · AI model places the terms"]
  Q8 --> MT

  Q7 --> PV
  AL --> PV{"Every verb form a single word the aligner found?"}
  PV -->|yes| MV(["Verbs marked in the translations"])
  PV -->|no| Q9["Q9 · AI model places the verbs"]
  Q9 --> MV

  AL --> HV{"Aligner answered?"}
  HV -->|yes| HOV(["Hover ready"])
  HV -->|no| Q10["Q10 · AI model, sentence by sentence"]
  Q10 --> HOV

  classDef model stroke:#18daf1,stroke-width:3px
  classDef own stroke-dasharray:6 4
  class Q3,Q4,Q5,Q6,Q7,Q8,Q9,Q10 model
  class AL own
```

- Terms or verbs switched off in the settings are neither asked nor drawn.
- Where Q8 or Q9 is asked, the aligner's places are kept for the single
  words, and it says which occurrence is meant where a word stands twice.
- The aligner cannot answer where a translation does not come apart into the
  same sentences as the source text, or where its model is not there.
- The hover never asks while the pointer rests on a word: it is worked out
  beforehand, and gives way to a word the reader clicks meanwhile.

## 4 · Short mode: up to three words

A dictionary entry per panel instead of a translation, and at most one term
below it. The AI model goes first here whatever the translator setting says.

```mermaid
flowchart TD
  W["One to three words"] --> S{"Looked up with their sentence?"}
  S -->|yes| LS["Language named from the sentence (section 1)"]
  S -->|no| LW["Language named from the words (section 1)"]
  LS --> Q11
  LW --> Q11["Q11 · Dictionary entry, upper panel"]
  Q11 --> Q11B["Q11 · Dictionary entry, lower panel"]
  Q11 --> Q3S["Q3 · Find the one term"]

  Q11 -->|"empty, or no AI model"| APS["Apple · plain translation"]
  Q11B -->|"empty, or no AI model"| APS
  APS -->|empty| NAS(["No answer received, or language pack missing"])

  Q3S --> Q45["Q4 · Q5: abbreviation, word class"]
  Q3S --> VB{"With its sentence?"}
  VB -->|yes| Q6S["Q6 · Find the sentence's verb forms"]
  VB -->|no| Q12["Q12 · Is it a verb form?"]
  Q6S -->|"a form holds the word"| Q7S["Q7 · Explain that one verb"]
  Q12 -->|"it is one"| Q7S
  Q7S --> ROW(["The term drawn as a verb"])

  classDef model stroke:#18daf1,stroke-width:3px
  class Q11,Q11B,Q3S,Q45,Q6S,Q12,Q7S model
```

The lower panel's entry and the term are asked side by side, after the upper
panel's entry has arrived. Nothing is placed in the translations and no hover
is worked out: the panels hold lists, not sentences.

## 5 · On request

Nothing here is asked until the reader clicks.

```mermaid
flowchart LR
  PICK["Words picked in a panel"] --> LONG{"More than six words?"}

  LONG -->|"yes: a passage"| Q15P["Q15 · Translate the pick whole"]
  LONG -->|"yes: a passage"| Q17["Q17 · Find the passage in the other panels"]

  LONG -->|no| Q13["Q13 · Meaning and note"]
  LONG -->|no| Q12["Q12 · Person and tense"]
  LONG -->|no| Q5["Q5 · Word class (a single word)"]
  LONG -->|no| Q4["Q4 · Write out an abbreviation"]
  LONG -->|no| Q15["Q15 · Translate the pick whole (several words)"]
  LONG -->|no| SP{"A single word the aligner found?"}
  SP -->|yes| SPA(["Marked in the other panels"])
  SP -->|no| Q14["Q14 · Find it in the other panels"]

  Q13 --> Q16["Q16 · Synonyms (up to two words)"]
  Q12 --> Q16
  Q16 --> SYN["A synonym clicked"]
  SYN --> AGAIN["Q13 · Q12 · Q5 · Q16 about the synonym"]

  classDef model stroke:#18daf1,stroke-width:3px
  class Q15P,Q17,Q13,Q12,Q5,Q4,Q15,Q14,Q16,AGAIN model
```

And on every row — a term, a verb, a picked word — two buttons:

```mermaid
flowchart LR
  ROWS["A row's buttons"] --> Q18["Q18 · A longer explanation"]
  ROWS --> Q19["Q19 · One more example (four at most)"]

  classDef model stroke:#18daf1,stroke-width:3px
  class Q18,Q19 model
```

The questions about a picked word go out together; only the synonyms wait,
for the base form the meaning's answer brings. A picked word needs the AI
model: without one the area is not drawn. A synonym already looked up, and a
step back along the synonyms, asks nothing again.

## Every request to the AI model

| | Asks for | When | How many | Who answers otherwise |
|---|---|---|---|---|
| Q1 | the language of the text (its first 600 characters) | function words, identifier and Apple's recognizer were all unsure — or the identifier is sure of a language the app does not offer | 1 | Apple's best guess; else the language stays unnamed |
| Q2 | the translation of the whole text | the AI model goes first, or Apple came back empty | 1 per panel | Apple's translation (Mac) |
| Q3 | the difficult terms, up to three, each with a meaning and a note | terms switched on; in short mode held to one term | 1; once more where the notes came back in the wrong language, or only loanwords were found | nobody — the section is not drawn |
| Q4 | an abbreviation written out | a term or a picked word looks like an abbreviation | 1 each | nobody — the row stands without it |
| Q5 | the word class | a term or a picked word is a single word, or one with its article | 1 each | nobody |
| Q6 | every verb form in the text | verbs switched on; in short mode on the looked-up word's sentence | 1 | nobody — the section is not drawn |
| Q7 | base form, meaning, person and tense of the hardest forms | Q6 found any | 1 | nobody |
| Q8 | where the terms went in the translations | a term is several words, or the aligner has no place for it | 1 | the word aligner, for single words |
| Q9 | where the verb forms went in the translations | a form is several words, or the aligner has no place for it | 1 | the word aligner, for single words |
| Q10 | what each word of a sentence became, for the hover | the aligner could not answer | 1 per sentence, three at a time | the word aligner, as a rule |
| Q11 | a dictionary entry: up to three translations with notes | short mode | 1 per panel | Apple's plain translation (Mac) |
| Q12 | person and tense, or that it is no verb form | a picked word; a looked-up word without its sentence | 1 | nobody |
| Q13 | meaning and note of a picked word | a word is picked, or a synonym clicked | 1; once more where the note came back in the wrong language | nobody |
| Q14 | where a picked word stands in the other panels | not a single word the aligner found; not in short mode | 1 | the word aligner, for single words |
| Q15 | the pick translated whole | several words picked, not in the reader's own language | 1 | nobody |
| Q16 | synonyms | a pick of up to two words | 1 | nobody |
| Q17 | where a passage stands in the other panels | more than six words picked | 1 | nobody |
| Q18 | a longer explanation | its button | 1 | nobody |
| Q19 | one more example sentence | its button | 1 | nobody |

For a text of a few sentences with everything switched on and the aligner
answering, that comes to about ten requests: two translations, the terms with
a word class or two, two for the verbs, and one or two to place whatever is
several words.

Every request asks the model not to think. A rate limit or a server error is
waited out twice; a wrong key or address answers at once.
