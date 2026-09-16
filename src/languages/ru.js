/* Russian language pack. Function words only so far; see fr.js. */

import { conjugationAt } from "./conjugation.js";

/* Everyday vocabulary a learner past the first weeks already has. An entry
   whose words are all in here is not worth a slot, and the filter in
   vocabulary.js drops it. Nouns, adjectives and the words of daily life -
   never a verb, which the verb section answers for. Accents are written
   normally: the lookup folds both sides. */
const BASIC_WORDS =
  "квартира квартиры дом дома улица улицы машина стол стул дверь окно вода еда деньги неделя месяц " +
  "день дни ночь мужчина женщина ребёнок дети мальчик девочка вещь вещи люди город деревня пляж " +
  "парк книга магазин балкон хлеб фрукты кофе супермаркет сестра брат мать отец родители друг " +
  "подруга поле работа время жизнь мир место форма часть момент лето зима солнце жара холод дождь " +
  "ветер снег праздник семья школа цена имя дорога кухня сад дерево цветок собака кошка фильм " +
  "музыка игра спорт отпуск поездка сыр мясо овощи вино пиво важный лёгкий трудный быстрый " +
  "медленный красивый хороший плохой большой маленький новый старый молодой коллега район ключ " +
  "ключи одежда вечер год сегодня вчера завтра встреча телефон номер час часы минута дядя тётя";

export default {
  code: "ru",
  englishName: "Russian",
  /* What this language calls its persons and its tenses.

     Written out of a grammar rather than measured: there is nothing in it to
     tune and no corpus behind it. It is what closes both leaks at once — the
     verb prompt naming a Spanish tense under a Portuguese text, and a bare
     prompt naming a German one. Kept apart from `verbs` below, which holds
     calibration; the two are different kinds of knowledge and phase 6
     measured that only this one generalises. */
  grammar: {
    persons: ["я", "ты", "он/она/оно", "мы", "вы", "они"],
    tenses: [
      "настоящее время", "прошедшее время", "будущее время", "повелительное наклонение",
      "сослагательное наклонение", "инфинитив", "причастие", "деепричастие",
    ],
    genders: ["masculine", "feminine", "neuter"],
  },
  /* Where a conjugation table for this language lives. A verb row offers it
     as a button; a language that names none simply does not offer one, and
     the web search beside it still does. */
  conjugationUrl: conjugationAt("russian"),
  verbs: {
    /* A Russian infinitive ends in -ть, -ти or -чь, reflexive or not. A
       grammar fact rather than a calibration, and it catches the one kind of
       wrong row measured here: "снижения", a noun, arriving with "снижение"
       as its base form. */
    isInfinitive: (form) => /(ть|ти|чь)(ся|сь)?$/.test(String(form || "").trim().toLowerCase()),
  },
  /* Articles, prepositions, conjunctions, pronouns: words that carry no
     meaning worth highlighting on their own. */
  functionWords:
    "и в на не что с он она они как по за из но к у это этот эта эти для же так все " +
    "еще уже или бы мы вы я то от при чтобы если",
  /* Forms of to be, to have and the modals. Frequent enough to matter for
     detection, but never bycatch: in a copula sentence the auxiliary is the
     only right spot to highlight. */
  auxiliaries: "был была было были быть будет буду будешь будем будут есть может могут должен должна должны",
  /* The verbs a learner meets in the first weeks, in the form a dictionary
     lists them. A verb row whose base form stands here is left out for a
     reader from B1 up, and in their own language: a table explaining it
     explains nothing. */
  conjunctions: "и а но или да что чтобы если когда хотя потому ли либо",
  basicVerbs: "быть иметь делать сделать идти пойти говорить сказать видеть увидеть знать хотеть мочь дать",
  basicWords: BASIC_WORDS,
  loanwordSuffixes: null,
  /* How this language gives itself away in spelling — used by the
     detector prompt, where the input is often a single word. */
  spellingHints: "Cyrillic with ы, э, ъ, ь and the ending -ость points to Russian",
};
