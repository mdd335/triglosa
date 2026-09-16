/* What went wrong, as something the window can put into words.

   Every failure the reader ever sees comes from outside the process — an
   endpoint that is not there, a key that was not accepted, a model that will
   not stop thinking. The words for it belong in labels.js, in the language
   the interface is in, and the code that meets the failure is in
   `platform/`, which has no language at all. So nothing is described where it
   happens: it is *classified* there, and the wording comes later.

   A fault is a small plain object and nothing more:

     kind    which of the cases below it is
     status  the HTTP number, where there was one — named in the sentence,
             because somebody reading a support answer needs it
     detail  what the service itself said, where it said anything. Kept
             even though it is English: for a refused request it is often
             the whole of the explanation, and it stands after the sentence
             rather than instead of it
     model   the model's name, where the fault is about the model

   Every kind is a different thing for the reader to *do*, which is the only
   reason to tell two failures apart. */

export const FAULTS = [
  /* Nothing answered at the address. A local server that is not running, an
     address with a typo in it. */
  "unreachable",
  /* It answered, but not in time. */
  "timeout",
  /* 401, 403 — the key, or the lack of one. */
  "key",
  /* 404 — the address is right as a host and wrong as a path, or the model
     name is not one this service has. */
  "notFound",
  /* 400 — the service would not take the request. Almost always the model
     name against a service that does not have it. */
  "refused",
  /* 429 — too many requests. The app has already waited twice by the time
     this arrives. */
  "busy",
  /* 5xx — the service's own fault, and a second attempt often works. */
  "server",
  /* Any other number. */
  "status",
  /* A well-formed answer with nothing in it. */
  "empty",
  /* The model spent its budget thinking and never wrote an answer, on every
     rung of the ladder. */
  "thinking",
  /* The endpoint is there and holds no model, which LM Studio does with
     nothing loaded. */
  "noModel",
  /* Nothing here recognised it. The message goes through as it stands. */
  "unknown",
];

export function fault(kind, extra = {}) {
  return { kind, ...extra };
}

/* Which kind an HTTP answer is. */
export function faultForStatus(status, detail) {
  if (status === 401 || status === 403) return fault("key", { status, detail });
  if (status === 404) return fault("notFound", { status, detail });
  if (status === 400) return fault("refused", { status, detail });
  if (status === 429) return fault("busy", { status, detail });
  if (status >= 500) return fault("server", { status, detail });
  return fault("status", { status, detail });
}

/* Which kind a thrown thing is, where it was thrown by something that does
   not know about any of this — a fetch that could not reach the address, or
   one that ran out of time. The two are told apart by name: `AbortSignal.timeout`
   rejects with a `TimeoutError`, and everything else at that level is the
   address not answering. */
export function faultForThrow(error) {
  const name = String(error?.name || "");
  const message = String(error?.message || error || "");
  if (name === "TimeoutError" || /timed? ?out/i.test(message)) return fault("timeout");
  return fault("unreachable", { detail: message });
}

/* The fault of an error, whatever it is. Anything that came through the model
   seam carries one; anything else is passed on with its own words, because a
   sentence nobody wrote is worse than an English one somebody did. */
export function faultOf(error) {
  if (error && typeof error === "object" && error.fault) return error.fault;
  return fault("unknown", { detail: String(error?.message || error || "") });
}
