/* Anki, over its AnkiConnect add-on.

   One of two ways a card leaves this app, and the one that is off until
   somebody switches it on: most people who use this app have no Anki at all,
   and the other way — copying the three fields — needs nothing installed.

   Nothing here assumes a deck, a note type or a field name. The deck and the
   note type are the reader's own, chosen from what Anki reports, and which of
   the three fields goes where is a mapping they can see. A deck is created
   where it does not exist, because that saves a detour and takes nothing
   away; a note type never is — that would reach into somebody's own card
   templates. */

import { noteFields } from "../card.js";
import { insideApp } from "./env.js";

export const ANKI_URL = "http://127.0.0.1:8765";
export const CARD_TAG = "Triglosa";

/* The add-on's code, so the one sentence about it can name it. AnkiConnect is
   what every program that talks to Anki uses; there is no other route in. */
export const ANKICONNECT_CODE = "2055492159";

/* What happened, in a shape the window can put into words.

   `{ kind, detail }` — the kind for the window to word, and Anki's own
   sentence kept beside it. Everything AnkiConnect says was thrown away
   before, so a card that was refused said only "not added" and the reader had
   no way at all to find out why. It cost an afternoon to find out that the
   note type's first field was the reason.

   A duplicate is not a failure: the card is in the deck, which is what the
   reader wanted. */
export function readAddResult(response) {
  const said = response && response.error ? String(response.error) : "";
  if (said) {
    if (/duplicate/i.test(said)) return { kind: "duplicate", detail: said };
    /* The one Anki refuses on its own terms rather than on ours: it judges a
       note empty by the note type's first field. */
    if (/empty/i.test(said)) return { kind: "empty", detail: said };
    if (/deck was not found/i.test(said)) return { kind: "no-deck", detail: said };
    if (/model was not found/i.test(said)) return { kind: "no-note-type", detail: said };
    return { kind: "error", detail: said };
  }
  if (response && response.result) return { kind: "saved", detail: "" };
  /* An answer with neither a result nor an error is one this version cannot
     read, and saying nothing about it would claim it worked. */
  return { kind: "error", detail: "" };
}

/* Anki is not running. Starting it is the one thing this app does to another
   program, and it does it only on a button that says so. It comes up in the
   background and takes its time — measured,
   fourteen seconds is enough and a cold start is most of it. */
export async function launchAnki() {
  if (!insideApp()) return false;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("launch_anki");
  return true;
}

/* One question, and the answer parsed. Inside the app it goes through the
   shell, and that is not a detail of the platform but the only route there
   is: Tauri's own fetch appends `Origin: tauri://localhost` to every request
   and will not let a caller remove it, and AnkiConnect answers a foreign
   origin with 403. Outside the app — in tests, in a browser checking the
   display — a plain fetch is right and finds Anki or does not.

   Everything that leaves the process in this app goes through a seam, and
   this is that seam: a caller may hand in its own. */
export async function ankiPost(body) {
  if (insideApp()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke("anki_request", { body });
  }
  const response = await fetch(ANKI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.text();
}

export function createAnkiBackend(post = ankiPost) {
  async function call(action, params) {
    const answer = await post(
      JSON.stringify({ action, version: 6, ...(params ? { params } : {}) }),
    );
    /* An empty reply is not an answer. AnkiConnect always sends one, so this
       is a helper that went away mid-question. */
    if (!answer || !String(answer).trim()) return null;
    return JSON.parse(answer);
  }

  const listing = async (action, params) => {
    const r = await call(action, params);
    return (r && r.result) || [];
  };

  return {
    async answering() {
      try {
        const r = await call("version");
        return !!(r && r.result);
      } catch {
        return false;
      }
    },

    /* Started in the background, then asked for until it answers. Anki has a
       collection to open before it listens, so the first few tries fail even
       on a machine where everything is right. */
    async start(wait = (ms) => new Promise((done) => setTimeout(done, ms))) {
      if (await this.answering()) return true;
      try {
        await launchAnki();
      } catch {
        /* Not installed, or macOS refused. The next twenty tries say so
           without a second message. */
      }
      for (let attempt = 0; attempt < 20; attempt++) {
        await wait(700);
        if (await this.answering()) return true;
      }
      return false;
    },

    /* What the settings offer: the decks and note types Anki actually has.
       A free field beside the decks takes a name that is not in the list,
       and that deck is created on first use. */
    decks: () => listing("deckNames"),
    noteTypes: () => listing("modelNames"),
    fieldsOf: (noteType) => listing("modelFieldNames", { modelName: noteType }),

    /* Which note types the cards already in a deck use, most-used first.

       The one question about Anki nobody can answer off the top of their head
       is which note type they mean, and Anki knows: whatever the deck is
       already built out of. A sample rather than the whole deck — five
       thousand notes would be five thousand notes over the wire to answer a
       question the first hundred answer just as well. */
    async noteTypesIn(deck, sample = 100) {
      const inDeck = `deck:"${deck.replace(/"/g, '\\"')}"`;
      const ids = await listing("findNotes", { query: inDeck });
      if (!ids.length) return [];
      /* Which types there are is read off a sample — five thousand notes over
         the wire say nothing the first hundred do not. How many use each is
         not: a count of the sample reads "(100)" under a deck of thousands.
         Anki counts a query for the price of a list of numbers. */
      const notes = await listing("notesInfo", { notes: ids.slice(0, sample) });
      const found = new Map();
      for (const note of notes) {
        if (!note || !note.modelName) continue;
        found.set(note.modelName, (found.get(note.modelName) || 0) + 1);
      }
      const counted = await Promise.all([...found.entries()].map(async ([noteType, seen]) => {
        const query = `${inDeck} note:"${noteType.replace(/"/g, '\\"')}"`;
        const all = ids.length > sample ? (await listing("findNotes", { query })).length : seen;
        return { noteType, cards: all || seen };
      }));
      return counted.sort((one, other) => other.cards - one.cards);
    },

    /* Duplicates are Anki's own business: it compares the note type's first
       field, whichever of the three the reader put there. */
    async add(card, { deck, noteType, fields }) {
      if (!deck || !noteType) return { kind: "unconfigured", detail: "" };
      if (!(await this.answering())) return { kind: "unreachable", detail: "" };
      try {
        await call("createDeck", { deck });
      } catch {
        /* Already there, or Anki refused — addNote answers either way. */
      }
      /* The note type's fields in Anki's own order. What that buys is the
         first one, which Anki judges emptiness and duplicates by — see
         noteFields. A note type that cannot be asked about still gets a
         note; addNote then says what is wrong with it. */
      let order = [];
      try {
        order = await this.fieldsOf(noteType);
      } catch {
        order = [];
      }
      try {
        return readAddResult(
          await call("addNote", {
            note: {
              deckName: deck,
              modelName: noteType,
              fields: noteFields(card, fields, order),
              tags: [CARD_TAG],
              options: { allowDuplicate: false, duplicateScope: "deck" },
            },
          }),
        );
      } catch (error) {
        /* Not an answer from Anki but the request itself failing — the port
           closed mid-question, or a reply this end could not read. */
        return { kind: "error", detail: (error && error.message) || "" };
      }
    },
  };
}
