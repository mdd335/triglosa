/* The AI model's questions, through the shell rather than the http plugin.

   The plugin builds a client for every request, so every question pays for a
   connection of its own — measured against the cloud model, about 0.3 s each,
   a quarter of a dictionary entry. The shell keeps one client and with it the
   connection (`model.rs`). This is the fetch the model backend is handed
   inside the app: it takes what `llm.js` sends and answers in the shape it
   reads, so nothing there knows which way a question went. */

const PREFIX = /^(timed out|unreachable|insecure):\s*/;

function answerResponse({ status, statusText, retryAfter, body }) {
  const raw = String(body ?? "");
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: statusText || "",
    headers: {
      get: (name) => (String(name).toLowerCase() === "retry-after" ? retryAfter ?? null : null),
    },
    text: async () => raw,
    json: async () => JSON.parse(raw),
  };
}

/* The shell says in its first words whether time ran out or the address was
   plain http outside the reader's own network; `faultForThrow` tells both by
   name, the way `AbortSignal.timeout` names a timeout. */
function thrownBy(message) {
  const said = String(message?.message || message || "");
  const error = new Error(said.replace(PREFIX, ""));
  if (said.startsWith("timed out")) error.name = "TimeoutError";
  if (said.startsWith("insecure")) error.name = "InsecureAddressError";
  return error;
}

/* The window's own deadline: the shell's request cannot be called back, so
   the answer is simply no longer waited for. The shell has a ceiling of its
   own and lets go by then. */
function withinDeadline(asked, signal) {
  if (!signal) return asked;
  return new Promise((resolve, reject) => {
    const stop = () => reject(signal.reason);
    if (signal.aborted) return stop();
    signal.addEventListener("abort", stop, { once: true });
    asked.then(resolve, reject).finally(() => signal.removeEventListener("abort", stop));
  });
}

export function shellFetch(invoke) {
  return async (url, init = {}) => {
    const request = {
      url: String(url),
      method: init.method || "GET",
      headers: Object.entries(init.headers || {}),
      body: init.body ?? null,
    };
    const asked = Promise.resolve()
      .then(() => invoke("model_request", { request }))
      .catch((error) => {
        throw thrownBy(error);
      });
    return answerResponse(await withinDeadline(asked, init.signal));
  };
}
