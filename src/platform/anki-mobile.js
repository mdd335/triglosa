/* Anki on a phone: AnkiMobile, asked through addresses of its own.

   There is no add-on to talk to and nothing listening on a port. AnkiMobile
   takes two questions as addresses — add this note, and say which decks and
   note types there are — comes to the front to answer, and sends the reader
   back through an address the question names. So every question is a trip
   there and back, and what this app learns from one is that the reader came
   back the way Anki sends them, or some other way.

   The same shape as the AnkiConnect backend (anki.js) wherever the settings
   and the card ask the same thing, so neither knows which one it holds.
   No profile is named: the note goes into the one that is open, which for a
   reader with one profile is the only one there is. */

import { noteFields } from "../card.js";
import { CARD_TAG } from "./anki.js";

/* Where AnkiMobile sends the reader afterwards: an address of this app's
   own (Info.ios.plist), with what was asked behind it. */
export const RETURN = "triglosa://anki/";
const ANKI = "anki://x-callback-url/";
const INFO_KEY = "triglosa.anki-info";

/* How long after the app is in front again the way back may still be told:
   the two arrive in no fixed order. */
const GRACE_MS = 1500;

const nameOf = (entry) =>
  typeof entry === "string" ? entry : entry && typeof entry.name === "string" ? entry.name : "";
const listOf = (value) => (Array.isArray(value) ? value : []);

/* What AnkiMobile says about itself, down to the names this app asks for.
   Null where nothing in it can be read. */
export function readAnkiInfo(raw) {
  let said = raw;
  if (typeof raw === "string") {
    try {
      said = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!said || typeof said !== "object") return null;
  const decks = listOf(said.decks).map(nameOf).filter(Boolean);
  const noteTypes = listOf(said.notetypes || said.noteTypes)
    .map((type) => ({ name: nameOf(type), fields: listOf(type && type.fields).map(nameOf).filter(Boolean) }))
    .filter((type) => type.name);
  if (!decks.length && !noteTypes.length) return null;
  return { decks, noteTypes };
}

const query = (pairs) =>
  pairs.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");

/* One note as AnkiMobile's address for it. A note it already has is its own
   business, as on a computer: it says so there, and the reader stays. */
export function addNoteUrl(card, { deck, noteType, fields }, order) {
  const written = Object.entries(noteFields(card, fields, order));
  return `${ANKI}addnote?${query([
    ["type", noteType],
    ["deck", deck],
    ...written.map(([name, value]) => [`fld${name}`, value]),
    ["tags", CARD_TAG],
    ["x-success", `${RETURN}added`],
  ])}`;
}

export const infoUrl = () => `${ANKI}infoForAdding?${query([["x-success", `${RETURN}info`]])}`;

/* The shell's side: opening an address, hearing the way back, and reading
   what Anki left behind. */
async function shellSeams() {
  const [{ invoke }, { listen }] = await Promise.all([
    import("@tauri-apps/api/core"),
    import("@tauri-apps/api/event"),
  ]);
  return {
    open: (url) => invoke("open_anki", { url }),
    left: () => invoke("read_anki_info"),
    /* Told which address the app was opened with, and that it is in front
       again — the second also by the page, which sees itself shown. */
    async onReturn(opened, shown) {
      const stop = [
        await listen("opened", (event) => opened(String(event.payload || ""))),
        await listen("resumed", () => shown()),
      ];
      const seen = () => { if (document.visibilityState === "visible") shown(); };
      document.addEventListener("visibilitychange", seen);
      return () => {
        for (const one of stop) one();
        document.removeEventListener("visibilitychange", seen);
      };
    },
  };
}

const browserStore = {
  read() {
    try {
      return globalThis.localStorage?.getItem(INFO_KEY) || "";
    } catch {
      return "";
    }
  },
  write(value) {
    try {
      globalThis.localStorage?.setItem(INFO_KEY, value);
    } catch {
      /* Asked again next time. */
    }
  },
};

export function createAnkiMobile(seams, store = browserStore, wait = (ms) => new Promise((done) => setTimeout(done, ms))) {
  let shell = seams || null;
  const reach = async () => (shell = shell || (await shellSeams()));
  let info = readAnkiInfo(store.read());

  /* One trip to Anki. True where the reader came back the way Anki sends
     them, false where they came back by themselves, null where there is no
     Anki to go to. */
  async function trip(url, tag) {
    const { open, onReturn } = await reach();
    let away = false;
    let settle = null;
    const back = new Promise((done) => { settle = done; });
    /* The listeners stand before the app is left. */
    const stop = await onReturn(
      (address) => { if (address.startsWith(RETURN + tag)) settle(true); },
      () => { if (away) wait(GRACE_MS).then(() => settle(false)); },
    );
    const went = await open(url).catch(() => false);
    if (!went) {
      stop();
      return null;
    }
    away = true;
    const came = await back;
    stop();
    return came;
  }

  const typeNamed = (name) => (info ? info.noteTypes.find((type) => type.name === name) : null);

  async function fetchLists() {
    const came = await trip(infoUrl(), "info");
    if (came === null) return "absent";
    const { left } = await reach();
    const raw = await left().catch(() => "");
    const read = readAnkiInfo(raw);
    if (!read) return "left";
    info = read;
    store.write(JSON.stringify(read));
    return true;
  }

  return {
    /* Known, here, is what the last trip brought back: the lists stand
       until the reader fetches them again. */
    answering: async () => !!info,

    /* Fetches the decks and note types. "absent" where no Anki is installed,
       "left" where the reader came back without them. */
    start: fetchLists,

    decks: async () => (info ? info.decks : []),
    noteTypes: async () => (info ? info.noteTypes.map((type) => type.name) : []),
    fieldsOf: async (noteType) => typeNamed(noteType)?.fields || [],
    /* Which note types a deck is built out of AnkiMobile does not say. */
    noteTypesIn: async () => [],

    async add(card, { deck, noteType, fields }) {
      if (!deck || !noteType) return { kind: "unconfigured", detail: "" };
      /* The first field is only known from the lists, and a note without it
         is refused: lists lost with a new install are fetched on the way. */
      if (!typeNamed(noteType)) {
        const fetched = await fetchLists();
        if (fetched === "absent") return { kind: "absent", detail: "" };
        if (!typeNamed(noteType)) return { kind: "unconfigured", detail: "" };
      }
      const order = typeNamed(noteType).fields;
      const came = await trip(addNoteUrl(card, { deck, noteType, fields }, order), "added");
      if (came === null) return { kind: "absent", detail: "" };
      /* Back by themselves: Anki said why on its own screen, or the reader
         changed their mind. Nothing is known, and nothing is claimed. */
      return came ? { kind: "saved", detail: "" } : { kind: "left", detail: "" };
    },
  };
}
