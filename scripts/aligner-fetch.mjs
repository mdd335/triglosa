/* Fetches the word aligner's model into src-tauri/resources/aligner, where
   the build packs it into the app (tauri.conf.json, `resources`).

   The files are too large for the repository — one of them is 174 MB — so
   they are attachments of a release of their own, `aligner-2`, and every
   build fetches them once: `npm run app`, `npm run bundle` and the Windows
   workflow all start here. A file already there with the right checksum is
   left alone, so this costs nothing the second time. scripts/aligner-pack.py
   is how the files were made. The text recognition models for Windows come
   along from here too (scripts/ocr-fetch.mjs).

     node scripts/aligner-fetch.mjs */

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { fetchOcrModels } from "./ocr-fetch.mjs";

export const RELEASE = "https://github.com/mdd335/triglosa/releases/download/aligner-2";

/* What the app was measured with; anything else is not packed. */
export const FILES = {
  "model.onnx": "93d562bb99f16a3a1b869d0bcced963ddb7f48ac92578d8a2290480cf8dee55e",
  "model.data": "d5ab26e53c157ba34496307ae5632f87feaa4bfc728473292b0a0fb31990b69c",
  "tokenizer.json": "91f49831963db775c5891264360e8d9e27e5b4a927c68a2b7e060b996b23de36",
  "pieces.txt": "62fce312d72594ad30235447483680a6d1bbce5d7e219bbe29a241539e449f92",
  "NOTICE.txt": "daea348b6f55f8ce0e9101677884e407a729f560024d48341f81c1fbcfe921a5",
  "LICENSE.txt": "c781204cd8d1df2a4a8b0b72d70e3e35e603294c201576bb2a36ce5bd63a522a",
};

const folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src-tauri", "resources", "aligner");

async function checksum(file) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(file), hash);
  return hash.digest("hex");
}

async function fetchOne(name, wanted) {
  const target = path.join(folder, name);
  if (existsSync(target) && (await checksum(target)) === wanted) return false;
  const response = await fetch(`${RELEASE}/${name}`);
  if (!response.ok) throw new Error(`${name}: the download answered ${response.status}`);
  const partial = `${target}.part`;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
  const got = await checksum(partial);
  if (got !== wanted) {
    rmSync(partial, { force: true });
    throw new Error(`${name}: the checksum is ${got}, not the one this build was measured with`);
  }
  renameSync(partial, target);
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  mkdirSync(folder, { recursive: true });
  for (const [name, wanted] of Object.entries(FILES)) {
    if (await fetchOne(name, wanted)) console.log(`fetched ${name}`);
  }
  await fetchOcrModels();
}
