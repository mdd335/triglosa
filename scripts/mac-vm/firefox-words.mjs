// Asks Firefox in the VM where the test page's words stand: words.js through
// WebDriver BiDi, over the tunnel series.sh opens, as the VM has no WebSocket
// client of its own. Prints what words.js answers.
//   node firefox-words.mjs <port> <words.js>
import { readFileSync } from "node:fs";

const [port, file] = process.argv.slice(2);
const socket = new WebSocket(`ws://127.0.0.1:${port}/session`);
const waiting = new Map();
let id = 0;
const ask = (method, params) => new Promise((resolve, reject) => {
  waiting.set(++id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
socket.addEventListener("message", ({ data }) => {
  const answer = JSON.parse(data);
  const one = waiting.get(answer.id);
  if (!one) return;
  waiting.delete(answer.id);
  if (answer.type === "error") one.reject(new Error(answer.message));
  else one.resolve(answer.result);
});
socket.addEventListener("error", () => process.exit(1));
socket.addEventListener("open", async () => {
  try {
    await ask("session.new", { capabilities: {} });
    const { contexts } = await ask("browsingContext.getTree", {});
    const { result } = await ask("script.evaluate", {
      expression: readFileSync(file, "utf8"),
      target: { context: contexts[0].context },
      awaitPromise: false,
    });
    process.stdout.write(result.value);
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
});
