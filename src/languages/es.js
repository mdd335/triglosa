/* Spanish language pack.

   Everything here was calibrated by hand against a labelled corpus over
   several measurement rounds. It is the only pack with a verb
   model of its own, and it is the yardstick for what a full pack looks like.
   Nothing in here is imported by the general code paths — they ask a pack
   what it knows and fall back to the generic path when it knows nothing. */

import { stripDiacritics } from "../text.js";
import { conjugationAt } from "./conjugation.js";

/* Articles, prepositions, conjunctions, pronouns: words that carry no
   meaning worth highlighting on their own. */
const FUNCTION_WORDS =
  "el la los las un una unos unas y o pero no tambien ya despues con de del al por para " +
  "en que se lo le les su sus como mas muy sin sobre a desde hasta este estos estas ese esa";

/* Forms of ser, estar and haber. Frequent enough to matter for detection, but
   never bycatch: in a copula sentence the auxiliary is the only right spot. */
const AUXILIARIES =
  "es son era eran esta estan estoy estaba estaban estuvo hay soy eres somos fue fueron "
  + "sera seran sea sean he has ha hemos habeis han habia habias habian habra habran "
  + "haya hayan hubo hubiera hubiese voy vas va vamos van iba iban "
  + "puede pueden podia podian debe deben debia";

/* Everyday vocabulary a learner already knows. Technical terms deliberately
   do not belong here: with only three slots, a trivial entry pushes out a
   third of what the section exists to show. */
const BASIC_WORDS =
  "piso pisos chico chica chicos chicas casa casas calle calles coche coches mesa mesas " +
  "silla puerta ventana agua comida dinero semana mes dia noche hombre mujer nino nina " +
  "cosa cosas gente ciudad pueblo playa parque libro tienda terraza pan fruta cafe " +
  "supermercado hermana hermano madre padre padres amigo amiga " +
  "campo trabajo tiempo vida mundo lugar forma parte momento verano invierno sol calor " +
  "frio lluvia viento nieve fiesta familia escuela precio nombre camino cocina jardin " +
  "arbol flor perro gato pelicula musica juego deporte vacaciones viaje queso carne " +
  "verdura vino cerveza importante facil dificil rapido lento bonito bueno malo grande " +
  "pequeno nuevo viejo joven " +
  "colega colegas barrio llave llaves ropa tarde ano hoy ayer manana cita " +
  "reunion correo telefono numero hora horas minuto tio tia";

/* Endings that do not exist in Spanish — it has -cion, -idad, -encia. */
const LOANWORD_SUFFIXES = /(ing|ment|ness|ship|tion|ity|ance|ence|ous)$/;

/* Only the plain forms of ser and estar: presente, imperfecto and indefinido
   of estar, plus impersonal hay. Subjuntivo, future, conditional, gerund and
   participle stay in, as do habia/habra and fui/fue/fuimos/fueron (identical
   with ir). */
const COPULA_FORMS = new Set(
  ("soy eres es somos sois son era eras eramos erais eran estoy estas esta estamos estais " +
    "estan estaba estabas estabamos estabais estaban estuve estuviste estuvo estuvimos " +
    "estuvisteis estuvieron hay").split(" "),
);

/* How far a form leads away from its infinitive. Accents are part of the
   test: "hablo" is present, "habló" indefinido, and that difference is
   exactly the point — so these patterns are NOT compared without accents. */
const TENSES = [
  /* Subjuntivo imperfecto — the hardest form that can turn up here. Only the
     i-forms and the stressed endings: "-ara/-aran" without an accent would
     otherwise hit every second present tense in -ar (declara, prepara). */
  { points: 4, re: /(iéramos|iésemos|áramos|ásemos|iera|ieras|ieran|iese|ieses|iesen|ase|ases|asen)$/ },
  /* Indefinido. The unstressed endings -amos/-imos are left out on purpose:
     they are the same in the present, and then one would be guessing. */
  { points: 3, re: /(asteis|isteis|aste|iste|aron|ieron|yeron|yó|é|í|ó)$/ },
  /* Futuro and Condicional */
  { points: 2, re: /(ríamos|ríais|remos|réis|rías|rían|ría|rás|rán|ré|rá)$/ },
  /* Imperfecto */
  { points: 2, re: /(ábamos|abais|aban|abas|aba|íamos|íais|ían|ías|ía)$/ },
];

/* Strong preterites. They carry no recognizable ending — "puso" looks like a
   present tense and is not one, and "dijo" does not lead back to decir
   without a dictionary. Exactly the forms one gets stuck on, so listed by
   hand rather than guessed. Without ser/estar/haber: isCopula filters those
   out beforehand. */
const STRONG_PRETERITES = new Set(
  ("puso pusieron pude pudo pudieron supe supo supieron tuve tuvo tuvieron hice hizo " +
    "hicieron dije dijo dijeron vine vino vinieron quise quiso quisieron traje trajo " +
    "trajeron anduvo anduvieron cupo cupieron di dio dieron vi vio vieron").split(" "),
);

/* Base forms: infinitive, gerund, participle. They stand almost the way one
   looks them up — one point off. */
const BASE_FORM = /(ando|iendo|ado|ido|ar|er|ir)$/;
/* Present-tense endings, only for stripping before the stem check. */
const PRESENT = /(amos|emos|imos|áis|éis|an|en|as|es|a|e|o)$/;
/* An attached pronoun. Split off only when a base form really precedes it
   (transformarlos, quedarse) or the form carries an accent that attaching
   forced in the first place (cuéntame). Otherwise "sale" would lose its
   "le". */
const PRONOUN = /(me|te|se|nos|lo|la|le|los|las|les)$/;

/* The most frequent Spanish verbs, as stems. A prefix rather than a whole
   form: a verb appears in two dozen forms, its stem in a handful. The
   irregular stems belong in here, otherwise the list would miss precisely
   the forms this is about — pod/pued/pud for poder, dec/dig/dij for decir.
   Short stems like the v- of ver would sit in front of every second word, so
   those are listed as whole forms.
   Hand-picked and deliberately coarse: a frequency list would be out of
   proportion here, and the selection only decides which three of ten rows
   one gets to see. */
const COMMON_STEMS =
  ("est hab hub habr sea sean habl llev dej pas lleg llegu qued tom mir llam busc busqu trabaj entr esper cambi gan form " +
    "acept realiz explic pregunt toc estudi intent ayud pag compr necesit olvid levant acab " +
    "termin present cre viv escrib escrit abr abiert recib decid permit cumpl part sub ocurr " +
    "exist dirig dirij descubr repet repit ped pid serv sirv segu sigu sig sent sient sint " +
    "consegu consigu convert conviert convirt mor muer dorm duerm durm prefer prefier prefir ten " +
    "tien tuv tendr hac hag hic hiz har hech pod pued pud podr quer quier quis querr sab sup " +
    "sabr pon pong pus pondr puest tra traig traj cae caig cay caid conoc conozc parec parezc " +
    "aparec aparezc nac nazc ofrec ofrezc manten mantien mantuv obten obtien obtuv entend entiend " +
    "perd pierd volv vuelv vuelt mov muev resolv resuelv deb val valg valdr cab quep cup comprend " +
    "respond supon supong supus pens piens empez empiez empec comenz comienz comenc encontr " +
    "encuentr cont cuent record recuerd mostr muestr jug jueg cost cuest prob prueb cerr cierr " +
    "despert despiert gust dec dic dig dij dir dich ven vien vin vendr sal salg saldr trat result " +
    "logr alcanz utiliz consider produc produj produzc reconoc reconozc escuch voy vas va vamos " +
    "vais van iba ibas iban ido yendo ire iras ira iremos iran iria vaya vayan fui fuiste fue " +
    "fuimos fueron doy da das damos dais dan di dio dimos dieron dado dando dare dara den veo ve " +
    "ves vemos veis vi vio vimos vieron visto viendo vere vera vea vean oigo oye oyes oyen oi oyo " +
    "oyeron oido oyendo lee leo lees leen lei leyo leyeron leido leyendo").split(" ");

/* The u in que/qui/gue/gui is not spoken, it belongs to the spelling of the
   k and g sounds. Without this step the "ue" in quedado or llegue would
   count as a stem change, and every second regular verb would rank at the
   top. */
function silentU(s) {
  return String(s || "").replace(/([qg])u([ei])/g, "$1$2");
}

function isInfinitive(form) {
  const s = stripDiacritics(String(form || "")).trim().toLowerCase();
  if (!s || /[()\s|]/.test(s)) return false;
  return /(ar|er|ir)(se|me|te|le|lo|la|nos|les|los|las)?$/.test(s);
}

/* Prefix from three characters on; shorter entries have to match exactly. */
function isCommonVerb(word) {
  const w = stripDiacritics(String(word || "")).toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return false;
  return COMMON_STEMS.some((stem) => (stem.length >= 3 ? w.indexOf(stem) === 0 : w === stem));
}

function isCopula(form) {
  return COPULA_FORMS.has(stripDiacritics(String(form || "")).trim().toLowerCase());
}

function wordDifficulty(word, multipart) {
  let w = String(word || "").replace(/[^0-9a-zá-úñü]/gi, "");
  if (!w) return 0;
  /* A strong preterite is fully scored — no ending, no stem left to gain
     anything from. */
  if (STRONG_PRETERITES.has(stripDiacritics(w))) return 3;

  let points = 0;
  const attached = w.match(PRONOUN);
  if (attached) {
    const before = w.slice(0, -attached[0].length);
    if (before.length > 3 && (BASE_FORM.test(before) || /[áéíóú]/.test(before))) {
      points += 2;
      w = before;
    }
  }

  let stem = w;
  const tense = TENSES.find((t) => t.re.test(w));
  if (tense) {
    points += tense.points;
    stem = w.replace(tense.re, "");
  } else if (BASE_FORM.test(w)) {
    /* Deduct only where the base form stands on its own. In "puede
       extrapolar" or "ha llegado" it is part of the construction and does
       not make it any easier. */
    if (!multipart) points -= 1;
    stem = w.replace(BASE_FORM, "");
  } else {
    stem = w.replace(PRESENT, "");
  }

  /* Diphthongized stem: poder -> puede, adquirir -> adquiere, querer ->
     quiere. The form no longer resembles the infinitive, and that is exactly
     the hurdle. The stem is tested, not the whole word — otherwise the "ie"
     in escribiendo would count. */
  if (/(ie|ue)/.test(silentU(stripDiacritics(stem)))) points += 2;
  return points;
}

/* How hard is this verb form for someone learning Spanish? Two questions add
   up to the score. First: how far the form leads away from its base form —
   what cannot be traced back to the infinitive cannot be looked up either.
   Second: is the verb known at all. A plain present tense of a verb one has
   never seen is worth more than the third past tense of decir.

   Deliberately without a model call: the selection happens between finding
   the forms and annotating them, both on the critical path of the whole run.
   A heuristic on the bare wording costs nothing and is right in the cases
   that matter. */
function verbDifficulty(form) {
  const parts = String(form || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 0;
  /* Multipart means compound, periphrastic or reflexive — ha llegado, puede
     extrapolar, se trata. None of that is what stands in the dictionary. */
  let points = parts.length > 1 ? 2 : 0;
  parts.forEach((w) => {
    points += wordDifficulty(w, parts.length > 1);
  });
  /* How far the form leads from the infinitive is one half; whether one
     knows the verb at all is the other. "experimentan" is a plain present
     tense and still the rarer word compared to "dijo". The last word is
     weighed: in a multipart form it carries the meaning, what precedes it is
     an auxiliary or a pronoun — puede EXTRAPOLAR, ha LLEGADO, se TRATA. */
  return points + (isCommonVerb(parts[parts.length - 1]) ? -2 : 1);
}

export default {
  code: "es",
  englishName: "Spanish",
  /* What this language calls its persons and its tenses.

     Written out of a grammar rather than measured: there is nothing in it to
     tune and no corpus behind it. It is what closes both leaks at once — the
     verb prompt naming a Spanish tense under a Portuguese text, and a bare
     prompt naming a German one. Kept apart from `verbs` below, which holds
     calibration; the two are different kinds of knowledge and phase 6
     measured that only this one generalises. */
  grammar: {
    persons: ["yo", "tú", "él/ella/usted", "nosotros", "vosotros", "ellos/ustedes"],
    tenses: [
      "presente", "pretérito indefinido", "pretérito imperfecto", "futuro simple",
      "condicional", "subjuntivo presente", "subjuntivo imperfecto", "imperativo",
      "pretérito perfecto", "pretérito pluscuamperfecto", "futuro perifrástico",
      "infinitivo", "gerundio", "participio",
    ],
    genders: ["masculine", "feminine"],
  },
  /* Where a conjugation table for this language lives. A verb row offers it
     as a button; a language that names none simply does not offer one, and
     the web search beside it still does. */
  conjugationUrl: conjugationAt("spanish"),
  functionWords: FUNCTION_WORDS,
  auxiliaries: AUXILIARIES,
  /* The verbs a learner meets in the first weeks, in the form a dictionary
     lists them. A verb row whose base form stands here is left out for a
     reader from B1 up, and in their own language: a table explaining it
     explains nothing. */
  /* The definite articles, which put a noun on a flashcard the way a
     dictionary names it — with the gender a learner has to learn with it. */
  definiteArticles: "el la los las",
  conjunctions: "y e o u pero sino ni que porque si cuando aunque mientras pues como",
  basicVerbs: "ser estar haber tener hacer ir decir ver dar saber poder querer venir",
  basicWords: BASIC_WORDS,
  loanwordSuffixes: LOANWORD_SUFFIXES,
  verbs: {
    isInfinitive,
    isCommon: isCommonVerb,
    isCopula,
    difficulty: verbDifficulty,
  },
  /* How this language gives itself away in spelling — used by the
     detector prompt, where the input is often a single word. */
  spellingHints: "-ción, -dad, -able, ñ, ¿ and accented vowels point to Spanish",
  /* What the aligned tables call this language in their columns. */
  columnName: "espanol",
};
