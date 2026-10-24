// Service worker de Crasher: permite abrir la app sin internet.
// - Páginas: primero la red (para recibir actualizaciones) y, si no hay conexión, la copia guardada.
// - Archivos de la app (JS, CSS, íconos, fuentes): primero la copia guardada, y se actualiza en segundo plano.
// Vite les pone un hash a los archivos al compilar, por eso al instalar se lee index.html
// para saber qué archivos guardar.

const CACHE = "crasher-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./favicon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

function assetsIn(html) {
  const urls = new Set();
  const re = /(?:src|href)="(\.?\/?assets\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) urls.add(new URL(m[1], self.registration.scope).href);
  return [...urls];
}

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(CORE);
  const res = await cache.match("./index.html");
  if (res) await cache.addAll(assetsIn(await res.text()));
}

// Guarda los archivos de la versión nueva y borra los de versiones anteriores
async function refreshAssets(html) {
  const cache = await caches.open(CACHE);
  const keep = new Set(assetsIn(html));
  await Promise.all([...keep].map((u) => cache.match(u).then((hit) => hit || cache.add(u).catch(() => {}))));
  for (const req of await cache.keys()) {
    if (req.url.includes("/assets/") && !keep.has(req.url)) await cache.delete(req);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navegación: red primero, copia guardada si no hay conexión
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(async (res) => {
          if (res.ok) {
            const cache = await caches.open(CACHE);
            await cache.put("./index.html", res.clone());
            event.waitUntil(res.clone().text().then(refreshAssets));
          }
          return res;
        })
        .catch(async () => (await caches.match("./index.html")) || (await caches.match("./"))),
    );
    return;
  }

  // Archivos propios y fuentes de Google: copia guardada primero, actualización en segundo plano
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      const net = fetch(req)
        .then((res) => {
          if (res.ok || res.type === "opaque") cache.put(req, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
