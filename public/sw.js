// DinhEuro Finanças - Progressive Web App Service Worker
// Versão do Cache Forçada para Produção (Hostinger / dinheuro.com)
const CACHE_NAME = "dinheuro-pwa-v15-fresh";
const OFFLINE_URL = "/";

// Recursos estáticos essenciais do App Shell
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
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

// 2. Activate Event: Limpa e DELETA AUTOMATICAMENTE todos os caches antigos do navegador
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            console.log("[SW] Deletando cache antigo:", key);
            return caches.delete(key);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event Strategy:
// STRICT NETWORK-FIRST para todas as rotas (estáticas e APIs)
// Sempre busca a versão mais recente publicada no domínio dinheuro.com antes de recorrer ao cache local.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora requisições não-GET ou esquemas não HTTP/HTTPS
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // A. REQUISIÇÕES DE DADOS FINANCEIROS E APIS (/api/*, AwesomeAPI, BRAPI, HG Brasil)
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("awesomeapi.com.br") ||
    url.hostname.includes("brapi.dev") ||
    url.hostname.includes("hgbrasil.com")
  ) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          // Fallback gracioso offline sem travar o aplicativo
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

  // B. RECURSOS ESTÁTICOS, SCRIPTS, ESTILOS E NAVEGAÇÃO: NETWORK-FIRST
  event.respondWith(
    fetch(request)
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
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (request.mode === "navigate") {
          return caches.match(OFFLINE_URL);
        }
      })
  );
});

// 4. Ouvinte de Mensagens para atualização instantânea
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 5. PUSH NOTIFICATIONS & REAL-TIME ALERTS (Desktop & Mobile)
// Recebe eventos de push do servidor ou triggers do sistema
self.addEventListener("push", (event) => {
  console.log("[SW] Push event received:", event);

  let data = {
    title: "DinhEuro • Alerta de Mercado",
    body: "Atualização de cotação ou notícia financeira em tempo real.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "dinheuro-market-alert",
    url: "/",
    data: { url: "/" },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
      if (!data.data) {
        data.data = { url: data.url || "/" };
      }
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    image: data.image || undefined,
    tag: data.tag || "dinheuro-alert",
    renotify: true,
    vibrate: [120, 60, 120, 60, 200], // Haptic vibration on mobile devices
    requireInteraction: false,
    silent: false,
    timestamp: Date.now(),
    data: data.data || { url: data.url || "/" },
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
  console.log("[SW] Notification clicked:", event.notification.tag, event.action);
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If window already open, focus it and navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client && targetUrl !== "/") {
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
        // Otherwise open a new window
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
