/* Fetches the text recognition models into src-tauri/resources/ocr, where the
   Windows build packs them into the app (tauri.windows.conf.json,
   `resources`). The Mac reads text with Apple's own recognition and carries
   none of them.

   PaddleOCR's PP-OCRv5 mobile models as RapidOCR publishes them in ONNX, at
   the version run sixty-six measured: one detector that finds the lines,
   and a recogniser per script for the eight languages with a pack — Latin,
   Cyrillic, Arabic, and Chinese, which reads Japanese too. About 43 MB.
   A file already there with the right checksum is left alone. Run by
   scripts/aligner-fetch.mjs, so every build that fetches the aligner
   fetches these too; NOTICE.txt and LICENSE.txt beside them are in the
   repository.

     node scripts/ocr-fetch.mjs */

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const SOURCE = "https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.10.0/onnx/PP-OCRv5";

/* The name the app reads, where it comes from, and what it was measured as. */
export const FILES = {
  "detector.onnx": ["det/ch_PP-OCRv5_det_mobile.onnx", "4d97c44a20d30a81aad087d6a396b08f786c4635742afc391f6621f5c6ae78ae"],
  "latin.onnx": ["rec/latin_PP-OCRv5_rec_mobile.onnx", "b20bd37c168a570f583afbc8cd7925603890efbcdc000a59e22c269d160b5f5a"],
  "cyrillic.onnx": ["rec/cyrillic_PP-OCRv5_rec_mobile.onnx", "90f761b4bfcce0c8c561c0cb5c887b0971d3ec01c32164bdf7374a35b0982711"],
  "arabic.onnx": ["rec/arabic_PP-OCRv5_rec_mobile.onnx", "c1192e632d0baa9146ae5b756a0e635e3dc63c1733737ebfd1629e87144e9295"],
  "chinese.onnx": ["rec/ch_PP-OCRv5_rec_mobile.onnx", "5825fc7ebf84ae7a412be049820b4d86d77620f204a041697b0494669b1742c5"],
};

const folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src-tauri", "resources", "ocr");

async function checksum(file) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(file), hash);
  return hash.digest("hex");
}

/* Tried three times: the server once handed the VM a file that broke off,
   and the next download of the same address was whole. */
async function fetchOne(name, [from, wanted], tries = 3) {
  const target = path.join(folder, name);
  if (existsSync(target) && (await checksum(target)) === wanted) return false;
  const partial = `${target}.part`;
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${SOURCE}/${from}`);
    if (!response.ok) throw new Error(`${name}: the download answered ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
    const got = await checksum(partial);
    if (got === wanted) break;
    rmSync(partial, { force: true });
    if (attempt === tries) throw new Error(`${name}: the checksum is ${got}, not the one this build was measured with`);
  }
  renameSync(partial, target);
  return true;
}

export async function fetchOcrModels() {
  mkdirSync(folder, { recursive: true });
  for (const [name, source] of Object.entries(FILES)) {
    if (await fetchOne(name, source)) console.log(`fetched ${name}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await fetchOcrModels();
}
