// DinhEuro Finanças - Progressive Web App Service Worker
// Versão estável sem loops de recarregamento para GitHub Pages e Produção
const CACHE_NAME = "dinheuro-v2-cache";
const OFFLINE_URL = "./index.html";

// Recursos estáticos fundamentais do App Shell
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.svg",
  "./favicon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
];

// 1. Install Event: Pré-carrega o Shell e força ativação imediata (skipWaiting)
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn("[SW] Aviso ao pré-carregar assets estáticos:", err);
        });
      })
  );
});

// 2. Activate Event: Limpa apenas caches de versões anteriores sem loop de recarga
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log("[SW] Removendo cache obsoleto:", key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Estratégia resiliente para SPA estática
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora requisições não-GET ou esquemas não HTTP/HTTPS
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // A. APIs Financeiras e Webhooks em tempo real: Network com fallback seguro offline
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("awesomeapi.com.br") ||
    url.hostname.includes("finnhub.io") ||
    url.hostname.includes("financialmodelingprep.com") ||
    url.hostname.includes("brapi.dev") ||
    url.hostname.includes("hgbrasil.com") ||
    url.hostname.includes("open.er-api.com")
  ) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => networkResponse)
        .catch(() => {
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: "Conexão de rede offline. Reconecte para obter cotações em tempo real.",
              timestamp: new Date().toISOString(),
            }),
            {
              headers: { "Content-Type": "application/json" },
              status: 200,
            }
          );
        })
    );
    return;
  }

  // B. Navegação SPA: Network-First com fallback para cache do index.html (sem reload loop)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match(OFFLINE_URL) || caches.match("./index.html");
        })
    );
    return;
  }

  // C. Assets estáticos (JS, CSS, Imagens, Fontes): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.origin === location.origin || url.hostname.includes("fonts"))
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Ouvinte de Mensagens para skipWaiting seguro
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 5. PUSH NOTIFICATIONS & REAL-TIME ALERTS (Desktop & Mobile)
self.addEventListener("push", (event) => {
  let data = {
    title: "DinhEuro • Alerta de Mercado",
    body: "Atualização de cotação ou notícia financeira em tempo real.",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: "dinheuro-market-alert",
    url: "./",
    data: { url: "./" },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
      if (!data.data) {
        data.data = { url: data.url || "./" };
      }
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "./icon-192.png",
    badge: data.badge || "./icon-192.png",
    image: data.image || undefined,
    tag: data.tag || "dinheuro-alert",
    renotify: true,
    vibrate: [120, 60, 120, 60, 200],
    requireInteraction: false,
    silent: false,
    timestamp: Date.now(),
    data: data.data || { url: data.url || "./" },
    actions: [
      {
        action: "view_market",
        title: "📈 Ver no DinhEuro",
      },
      {
        action: "dismiss",
        title: "Fechar",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 6. Notification Click Handler (Deep-Linking & Window Focus)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "./";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client && targetUrl !== "./") {
              client.navigate(targetUrl);
            }
            if (event.notification.data && event.notification.data.assetId) {
              client.postMessage({
                type: "NOTIFICATION_OPEN_ASSET",
                assetId: event.notification.data.assetId,
              });
            }
            return client;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// 7. Notification Close Handler
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification dismissed by user:", event.notification.tag);
});
