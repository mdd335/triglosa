/* Where a verb's table is looked up.

   One site for all eight languages, and it is the one a pack names rather
   than one this file decides: a pack that wants to point somewhere else says
   so, and a pack that names nothing offers no such button at all — the web
   search beside it still does.

   Why one site rather than the best one per language: the button has to work,
   and that is checkable. Reverso answers a plain request with the finished
   table for every one of the eight — measured, including the two written in
   another script, an English phrasal verb ("swing by"), a German reflexive
   ("sich freuen"), and Arabic, whose base form is the third person of the
   perfect rather than an infinitive and which the site takes exactly as the
   packs hand it over. A verb it does not know answers 404 with a page that
   suggests what it does know, which is a better dead end than a blank one.

   The language is the segment in the address, which is its English name in
   lower case for all eight — named per pack all the same, because that is a
   fact about the site and not about the language. */
export const conjugationAt = (language) => (infinitive) =>
  `https://conjugator.reverso.net/conjugation-${language}-verb-`
  + `${encodeURIComponent(infinitive)}.html`;
