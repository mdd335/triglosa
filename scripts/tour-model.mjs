// Stands in for an AI model during scripts/tour.sh, on this machine: every
// question gets the same fixed line, so a panel holds something to insert and
// nothing is asked of a real model. Reached from a test machine through an
// SSH tunnel, as http://127.0.0.1:1240/v1.
import { createServer } from "node:http";

const ANSWER = "Inserted by the tour";

createServer((request, response) => {
  request.resume();
  request.on("end", () => {
    const body = request.url.endsWith("/models")
      ? { data: [{ id: "tour" }] }
      : { choices: [{ message: { role: "assistant", content: ANSWER }, finish_reason: "stop" }] };
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(body));
  });
}).listen(1240, "127.0.0.1");
