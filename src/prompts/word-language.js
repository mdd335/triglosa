/* Which language a word looked up in its sentence is in, where the
   sentence is in another — asked only where the system's dictionaries
   cannot tell (src/spelling.js, wordLanguage): on Windows, which has a
   dictionary only for a language added to the system.

   The sentence's language and the reader's other languages are the
   answers, the sentence's first. A loan is the sentence's: looked up where
   it stands, "Meeting" is a German word. Said only as "a word taken in and
   used as its own", the cloud model moved 96 of 192 loans to the language
   they came from and the local one 106; told outright that a word in
   everyday use the way its speakers say it is theirs, 20 and 28, at the
   price of 2 and 14 of 256 foreign words not moved (run fifty-three). */

import { englishName } from "../languages/index.js";

export function wordLanguagePrompt({ source, others }) {
  const name = englishName(source);
  const codes = [source, ...others].map((code) => `${code} (${englishName(code)})`).join(", ");
  return (
    `You name the language of a word or short phrase as it stands in a ${name} sentence. ` +
    `Reply with exactly one lowercase code and nothing else: ${codes}. ` +
    `Reply ${source} where the input is ${name} - however rare, regional, colloquial or inflected - or a name. ` +
    `A word that came from another language but is in everyday ${name} use, the way ${name} speakers say it, is ${name} too: reply ${source}. ` +
    `Reply with another code only where the input is not ${name} at all - a word of that language that the sentence quotes or mixes in.`
  );
}

export const wordLanguageInput = ({ sentence, words }) => `Sentence: ${sentence}\nInput: ${words}`;
