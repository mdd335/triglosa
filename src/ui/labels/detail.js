/* What goes in brackets after the fact: the HTTP number, where there is one,
   and the service's own words where they explain something. For a refusal
   they are often the whole of it — "model not found", "Reasoning is mandatory
   for this endpoint" — and for "nothing answered" they are "Failed to fetch",
   which explains nothing. English, because that is what came back. Right
   after the fact and before what to do, so the sentence still ends on that.
   Shared by every language's messages, so the bracket looks the same in all
   of them. */
export const why = (f) => {
  const said = [f.status, f.shown].filter(Boolean).join(": ");
  return said ? ` (${said})` : "";
};
