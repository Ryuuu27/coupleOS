// Keeps a copy of Couple OS on the phone so it opens with no internet,
// and (if push is ever turned on) shows reminders sent from the server.
const C = "couple-os-v2";
const SHELL = ["./", "index.html", "style.css", "script.js", "firebase-bundle.js", "hero.jpg", "site.webmanifest",
  "favicon.ico", "android-chrome-192x192.png", "privacy.html"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => clients.claim()));
});

// open instantly from the saved copy (no waiting for the network), and update the copy quietly
// in the background, so a new version shows the next time you open the app
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(C).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => null);
    e.waitUntil(net);
    return hit || net.then(res => res || (r.mode === "navigate" ? caches.match("index.html") : Response.error()));
  }));
});

self.addEventListener("push", e => {
  let p = {};
  try { p = e.data.json(); } catch (x) {}
  const n = p.data || p.notification || {};
  e.waitUntil(self.registration.showNotification(n.title || "Couple OS", {
    body: n.body || "", icon: "android-chrome-192x192.png", badge: "favicon-32x32.png"
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then(l => l.length ? l[0].focus() : clients.openWindow("./")));
});
