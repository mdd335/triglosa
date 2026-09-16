/* Talking to a language model.

   One seam, one code path. Cloud providers and local servers speak the same
   interface, so the app holds an endpoint, a key and a model name and asks no
   further questions. Nothing above this file knows which of the two answered.

   Errors are thrown, never swallowed: a silent failure here reaches the
   reader as "no verbs found", which is worse than a message. */

import { stripModelWrapping } from "../text.js";
import { fault, faultForStatus, faultForThrow } from "../faults.js";

/* Every error that leaves this file carries a fault: which kind of failure it
   was, in a form the window can put into the reader's own language. The
   English sentence stays on the error as well — it is what a log and a
   measurement run read, and it is the fall-back for anything unclassified. */
function throwing(message, kind, extra) {
  const error = new Error(message);
  error.fault = typeof kind === "string" ? fault(kind, extra) : kind;
  return error;
}

export const DEFAULT_TEMPERATURE = 0.2;
export const REQUEST_TIMEOUT_MS = 180000;
export const MODEL_LIST_TIMEOUT_MS = 6000;

/* A cloud endpoint rate-limits; a local server does not. Since the app holds
   one field for both, it has to survive the one that does. Measured over the
   everyday corpus against a shared cloud account, a third of the texts came
   back with nothing at all for want of this — and every one of them was a
   working request a second later.

   Only where waiting can help: too many requests, or the service being
   briefly away. A wrong key or a wrong address is answered at once, because
   asking again would only make the reader wait for the same answer. */
export const RETRY_STATUS = [429, 500, 502, 503, 504];
export const RETRIES = 2;
const BACKOFF_MS = 1200;

/* Servers that mean it say how long to wait. The header holds either seconds
   or a date; anything else, and the plain backoff applies. A server asking
   for longer than the request timeout is not worth waiting for. */
export function retryDelay(header, attempt) {
  const plain = BACKOFF_MS * Math.pow(2, attempt);
  const raw = String(header || "").trim();
  if (!raw) return plain;
  const seconds = Number(raw);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(raw) - Date.now();
  if (!Number.isFinite(ms) || ms < 0 || ms > REQUEST_TIMEOUT_MS) return plain;
  return Math.max(ms, plain);
}

/* Pick a model out of what the endpoint offers. Not simply the first match:
   a server lists alphabetically, and an uncensored variant sorts before the
   instruction-tuned one. That variant answers technical vocabulary with
   slang and invents words. */
export function pickModel(ids) {
  const list = (ids || []).filter(Boolean);
  if (!list.length) return "";
  const usable = list.filter((id) => !/uncensor|abliterat|aggressive|nsfw|roleplay/i.test(id));
  const tuned = usable.filter((id) => /(^|[-_])it([-_.]|$)|instruct/i.test(id));
  return tuned[0] || usable[0] || list[0];
}

/* What a well-formed answer looks like, and what to do with the two ways it
   can be malformed. */
export function readAnswer(body) {
  if (!body) throw throwing("The endpoint returned nothing.", "empty");
  if (body.error) {
    const detail = body.error.message || String(body.error);
    /* An answer of 200 with an error in it. The service took the request and
       then would not do it, which is the same thing for the reader as a
       refusal with a number on it. */
    throw throwing(detail, "refused", { detail });
  }
  const choice = (body.choices && body.choices[0]) || {};
  const message = choice.message || {};
  const content = String(message.content || "").trim();
  /* An empty answer with thinking behind it means the model spent the budget
     before it began writing. Three ways an endpoint says so: its own field,
     OpenRouter's, or nothing at all but a request that ended on "length".
     The flag is what lets `chat` ask again with room instead of handing the
     reader an empty section. */
  if (!content) {
    const thought =
      String(message.reasoning_content || "").trim() ||
      String(message.reasoning || "").trim() ||
      (body.usage?.completion_tokens_details?.reasoning_tokens || 0) > 0 ||
      choice.finish_reason === "length";
    if (thought) {
      const error = throwing(
        "The model only reasoned — it never wrote an answer.",
        "thinking",
      );
      error.onlyReasoned = true;
      throw error;
    }
  }
  return stripModelWrapping(message.content);
}

/* How to ask a model not to think, and why there are three answers.

   Measured across the models this app is likely to meet. They fall into four kinds and no single
   field covers them:

     never thinks      gemma-4-e4b-it, gemma-4-31b-it. Any of the fields is
                       harmless — except "minimal", which switches thinking
                       ON for gemma-4-31b-it, 201 tokens where there were none
     thinks unless told otherwise  deepseek-v4-flash, kimi-k3.
                       reasoning_effort "none" turns it off cleanly
     must think        the GLM family answers HTTP 400, "Reasoning is
                       mandatory for this endpoint and cannot be disabled",
                       to "none" — the request never happens at all.
                       "minimal" is accepted and spends no thinking tokens
     always thinks     minimax-m3 thinks whatever is sent. Nothing to switch

   So the app starts at "none", which is the OpenAI-standard field and right
   for the middle two kinds, and steps down only when a model says it cannot.
   "minimal" is never sent first, because for one whole kind it is the switch
   that turns thinking on.

   And it stops there. There used to be a third rung — no field at all and a
   flat allowance on top of the budget — which bought room for a model that
   thinks whatever is sent. It is gone, because what it actually did was
   worse than the failure it was catching: the rung is remembered for the
   whole backend, so ONE awkward text put every later question of that
   session into a thinking mode nobody asked for. Measured against
   gemini-3.8-flash, a three-word Arabic phrase did exactly that and the run
   cost 142,000 output tokens instead of about 5,000 — thirty times the money
   and the latency, on a reading that fires from a keystroke.

   A model that cannot be made to answer without thinking is therefore a
   model this app does not use, and says so. */
export const REASONING_LADDER = ["none", "minimal"];
/* Which rung to try next, or nothing when there is nothing left to try.

   Both kinds of failure climb the same ladder now: a refusal that names
   reasoning, and an answer that was nothing but reasoning. The second used
   to jump straight past "minimal" to a rung that simply paid for the
   thinking; since "minimal" is the one field that quiets the models which
   refuse "none", jumping over it skipped the only rung that could have
   helped. */
export function nextReasoningMode(current, error) {
  if (!error || !(error.reasoningRefused || error.onlyReasoned)) return "";
  return REASONING_LADDER[REASONING_LADDER.indexOf(current) + 1] || "";
}

/* A 400 naming reasoning is the one refusal worth answering differently. Any
   other 400 is a wrong request and asking again changes nothing. */
export function refusesReasoning(status, detail) {
  return status === 400 && /reason/i.test(String(detail || ""));
}

export function chatPayload({ model, system, user, maxTokens, temperature, reasoning }) {
  const mode = reasoning || "none";
  return {
    model,
    temperature: typeof temperature === "number" ? temperature : DEFAULT_TEMPERATURE,
    max_tokens: maxTokens,
    stream: false,
    reasoning_effort: mode,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
}

const trimSlash = (s) => String(s || "").replace(/\/+$/, "");

/* The message inside a refusal, where there is one. A test double and a
   server that answers plain text both have to survive this, so every step is
   allowed to fail and the caller simply gets nothing. */
async function errorDetail(response) {
  try {
    const raw = await response.text();
    if (!raw) return "";
    try {
      const body = JSON.parse(raw);
      return String(body?.error?.message || body?.message || "").slice(0, 200);
    } catch {
      return raw.slice(0, 200);
    }
  } catch {
    return "";
  }
}

/* settings: { endpoint, apiKey, model }. model may be empty, in which case
   the endpoint is asked what it has. fetchImpl exists so tests can answer
   without a server. */
export function createLlmBackend({ endpoint, apiKey, model }, fetchImpl = fetch) {
  const base = trimSlash(endpoint);
  let chosen = model || "";
  let reasoning = REASONING_LADDER[0];

  const headers = () => ({
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  });

  async function request(path, init, timeout) {
    for (let attempt = 0; ; attempt++) {
      let response;
      try {
        response = await fetchImpl(base + path, {
          ...init,
          headers: headers(),
          signal: AbortSignal.timeout(timeout),
        });
      } catch (error) {
        /* Thrown by the fetch rather than answered by the service: nothing
           was reached, or nothing came back in time. Neither carries a
           status, and the two mean different things to do. */
        if (error && error.fault) throw error;
        throw throwing(String(error?.message || error), faultForThrow(error));
      }
      if (response.ok) return response.json();
      if (attempt < RETRIES && RETRY_STATUS.includes(response.status)) {
        const wait = retryDelay(response.headers?.get?.("retry-after"), attempt);
        await new Promise((done) => setTimeout(done, wait));
        continue;
      }
      /* What the endpoint said, not only that it said no. A refusal used to
         arrive as "answered 400 Bad Request" with the reason thrown away —
         and the reason is sometimes the whole of it: the GLM family refuses
         a request that asks it not to think, and there is a rung for that. */
      const detail = await errorDetail(response);
      const error = throwing(
        `The endpoint answered ${response.status} ${response.statusText}.` +
          (detail ? ` ${detail}` : ""),
        faultForStatus(response.status, detail),
      );
      error.status = response.status;
      error.reasoningRefused = refusesReasoning(response.status, detail);
      throw error;
    }
  }

  async function listModels() {
    const body = await request("/models", { method: "GET" }, MODEL_LIST_TIMEOUT_MS);
    return (body.data || []).map((m) => m.id).filter(Boolean);
  }

  async function modelName() {
    if (chosen) return chosen;
    const ids = await listModels();
    chosen = pickModel(ids);
    if (!chosen) throw throwing("The endpoint has no model loaded.", "noModel");
    return chosen;
  }

  return {
    listModels,
    /* Used by the connection test in the settings window: it says what
       answered, which saves half the support traffic. */
    async test() {
      const ids = await listModels();
      return { reachable: true, models: ids, chosen: chosen || pickModel(ids) };
    },
    /* Which rung of the reasoning ladder this endpoint turned out to want.
       Found once and kept: a model does not change its mind between two
       questions, and a reading asks eight of them. */
    get reasoning() {
      return reasoning;
    },
    async chat({ system, user, maxTokens, temperature }) {
      const name = await modelName();
      for (;;) {
        /* Which rung this attempt is using. A reading asks eight questions at
           once, so by the time one of them fails another may already have
           moved the shared rung on — and then this one has nothing to decide:
           it simply asks again on the rung that now applies. Reading the
           shared value instead cost the verb list of a Russian text, which
           gave up at the top of the ladder because a neighbour had climbed it
           first. */
        const used = reasoning;
        try {
          const body = await request(
            "/chat/completions",
            {
              method: "POST",
              body: JSON.stringify(
                chatPayload({ model: name, system, user, maxTokens, temperature, reasoning: used }),
              ),
            },
            REQUEST_TIMEOUT_MS,
          );
          return readAnswer(body);
        } catch (error) {
          if (reasoning !== used) continue;
          const next = nextReasoningMode(used, error);
          if (next) {
            reasoning = next;
            continue;
          }
          /* The end of the ladder, and the failure was about thinking: this
             model cannot be made to answer without it. Say that, rather than
             hand on "it never wrote an answer" — the reader can act on the
             first and not on the second. */
          if (error.reasoningRefused || error.onlyReasoned) {
            /* What the endpoint said is kept: for a refusal it is often the
               whole of the explanation, and throwing it away once already
               left a reader with "answered 400 Bad Request". */
            throw throwing(
              `${name} answers only by thinking first, and this app asks models not to. ` +
                `Choose a model whose thinking can be switched off. ${error.message}`,
              "thinking",
              { model: name, detail: error.fault?.detail || "" },
            );
          }
          throw error;
        }
      }
    },
  };
}
