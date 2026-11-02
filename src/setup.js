/* The two ways to an AI model the settings offer.

   Online is OpenRouter with the model the README recommends; any other
   provider, a model on this machine among them, is written into the fields by
   hand. Each way keeps its own address, model and key (settings.ways, and a
   key of its own in the system's store), so going from one to the other and
   back loses nothing, and a key never reaches a provider other than the one
   that issued it. Which way is in use is settings.way; a settings file from
   before there were ways takes the one its address names (setupOf). */

export const ONLINE = {
  provider: "OpenRouter",
  endpoint: "https://openrouter.ai/api/v1",
  model: "deepseek/deepseek-v4.1-flash",
  /* The model as a reader would write it. */
  title: "DeepSeek V4.1 Flash",
  /* Free of charge and without credit, but held to a few dozen questions a
     day: enough to try the app, not to read with it. */
  free: { model: "google/gemma-4-26b-a4b-it:free", title: "Gemma 4 26B" },
};
/* Servers on this machine, for the reader who enters their own: a button fills
   in the address, the rest is theirs. */
export const LOCAL_SERVERS = [
  { name: "LM Studio", endpoint: "http://127.0.0.1:1234/v1" },
  { name: "Ollama", endpoint: "http://127.0.0.1:11434/v1" },
];

export const WAYS = ["online", "own"];

/* What a way fills in the first time it is chosen. */
export function presetOf(way) {
  if (way === "online") return { endpoint: ONLINE.endpoint, model: ONLINE.model };
  return { endpoint: "", model: "" };
}

/* Whether an address is the one a way fills in, give or take a slash at its
   end. */
export function holdsPreset(way, endpoint) {
  const preset = presetOf(way).endpoint;
  if (!preset) return true;
  const typed = String(endpoint || "").trim().replace(/\/+$/, "");
  return typed === preset;
}

/* The entry in the system's store a way's key lives under; a hand-typed
   address with no way chosen counts as the reader's own provider. */
export function keyAccount(settings) {
  return `model-${settings.way || setupOf(settings) || "own"}`;
}

export function setupOf(settings) {
  const endpoint = String(settings.endpoint || "").trim().replace(/\/+$/, "");
  if (!endpoint) return "";
  if (endpoint.startsWith("https://openrouter.ai/")) return "online";
  return "own";
}
