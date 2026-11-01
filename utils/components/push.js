/* ============================================================================
   Notifications on this device, and results by email
   ----------------------------------------------------------------------------
   Turning notifications on asks the browser, subscribes the site's service worker (sw.js shows them) with the server's VAPID
   key, and hands the subscription to the server (/api/notify/push). The server then sends a notice there when a teacher sets a
   task, when written answers are marked and when results are released (server/lib/notify-out.js).

     pushState()          "on" | "off" | "blocked" | "unsupported"
     pushOn(token)        ask and subscribe; resolves to the new state
     pushOff(token)       unsubscribe this device
     emailPref(token)     true | false: result emails
     setEmailPref(token, on)
   `token` is the signed-in person's Firebase ID token.
   ========================================================================== */

const BASE = location.port === "5500" ? "http://127.0.0.1:5000" : "";
const supported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function call(path, token, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}
const keyBytes = (b64) => { const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(s, (c) => c.charCodeAt(0)); };
async function reg() {
  const r = (await navigator.serviceWorker.getRegistration("/")) || (await navigator.serviceWorker.register("/sw.js"));
  return navigator.serviceWorker.ready.then(() => r);
}

export async function pushState() {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  try { const r = await navigator.serviceWorker.getRegistration("/"); const s = r && (await r.pushManager.getSubscription()); return s && Notification.permission === "granted" ? "on" : "off"; }
  catch { return "off"; }
}

export async function pushOn(token) {
  if (!supported()) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "blocked" : "off";
  const { key } = await call("/api/notify/vapid");
  if (!key) throw new Error("Notifications are not set up on the site yet.");
  const r = await reg();
  let sub = await r.pushManager.getSubscription();
  if (!sub) sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
  await call("/api/notify/push", token, { sub: sub.toJSON() });
  return "on";
}

export async function pushOff(token) {
  if (!supported()) return "unsupported";
  const r = await navigator.serviceWorker.getRegistration("/");
  const sub = r && (await r.pushManager.getSubscription());
  if (sub) { await call("/api/notify/push/off", token, { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe().catch(() => {}); }
  return "off";
}

export async function emailPref(token) { return (await call("/api/notify/prefs", token)).email !== false; }
export async function setEmailPref(token, on) { await call("/api/notify/prefs", token, { email: !!on }); return !!on; }
