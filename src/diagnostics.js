/* The text a reader copies into a problem report.

   In English whatever the interface language: it is read by whoever answers
   the report. It says what the installation is — version, system, languages,
   which engines — and what went wrong lately, and nothing else: not the key,
   not the address's path, not a word of what was read. The reader sees the
   whole of it before pasting it anywhere. */

/* One failure of the reading window, as the diagnostics keep it. */
export function faultLine(fault, when = new Date()) {
  const parts = [when.toISOString(), fault?.kind || "unknown", fault?.status || "", fault?.detail || ""];
  return parts.filter((part) => part !== "").join(" ").slice(0, 300);
}

function hostOf(endpoint) {
  try {
    return new URL(endpoint).host;
  } catch {
    return endpoint ? "(not an address)" : "";
  }
}

export function diagnosticsText({ version, report, settings, keySet, permission, system }) {
  const levels = settings.levels || {};
  const languages = (settings.languages || [])
    .map((code, index) => (index && levels[code] ? `${code} (${levels[code]})` : code))
    .join(", ");
  const host = hostOf(settings.endpoint);
  const model = host
    ? [host, settings.model || "(first the endpoint offers)", keySet ? "key set" : "no key"].join(", ")
    : "none";
  const lines = [
    `Triglosa ${version || "(outside the app)"}`,
    `System: ${report?.system || system} (${report?.arch || "?"})`,
    `Languages: ${languages}`,
    `Translator: ${settings.translator || "model"}`,
    `AI model: ${model}`,
  ];
  if (system === "mac") {
    lines.push(`Accessibility: ${permission ? "granted" : "not granted"}, direct selection ${settings.directSelection === false ? "off" : "on"}`);
  }
  const faults = report?.faults || [];
  lines.push(`Recent failures: ${faults.length ? "" : "none"}`);
  for (const fault of faults) lines.push(`  ${fault}`);
  return lines.join("\n");
}
