/* The preview in a collapsed caption row. */

export const PREVIEW_WORDS = 6;

/* Line breaks and doubled spaces go: the row does not wrap, so a break would
   become a space anyway, and two of them side by side would look like a gap. */
export function preview(text, limit = PREVIEW_WORDS) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return "";
  return words.slice(0, limit).join(" ") + (words.length > limit ? " …" : "");
}
