/* PrepBoard — one live turn from the server, as an async stream of beats.

     for await (const beat of liveTurn({ auth, body, signal, onStart, onLimited })) …

   Reads POST /api/whiteboard/turn (NDJSON) and yields each beat as it lands.
   A 402/403 or a server "limited" line is reported through its callback and
   ends the stream; an aborted signal (the learner cut in) ends it quietly. */

const API_BASE = location.port === "5500" ? "http://127.0.0.1:5000" : "";

export async function* liveTurn({ auth, body, signal, onStart = () => {}, onLimited = () => {}, onRefused = () => {} }) {
  const user = auth?.currentUser;
  if (!user) {
    onRefused({ reason: "signed-out" });
    return;
  }
  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/api/whiteboard/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    let info = {};
    try { info = await res.json(); } catch {}
    onRefused({ status: res.status, ...info });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let evt;
      try { evt = JSON.parse(line); } catch { continue; }
      if (evt.type === "start") onStart(evt);
      else if (evt.type === "beat" && evt.beat) yield evt.beat;
      else if (evt.type === "limited") { onLimited(evt); return; }
      else if (evt.type === "error") { yield { say: evt.text || "Sorry, something went wrong. Ask me again?" }; }
      else if (evt.type === "done") return;
    }
  }
}
