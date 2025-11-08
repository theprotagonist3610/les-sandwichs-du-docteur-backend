/**
 * Service Worker pour la PWA Comptabilité
 * Gestion des notifications de clôture et cache de l'application
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `comptabilite-pwa-${CACHE_VERSION}`;

// Ressources à mettre en cache pour le mode offline
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// ============================================================================
// INSTALLATION
// ============================================================================

self.addEventListener("install", (event) => {
  console.log("📦 Service Worker: Installation...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Service Worker: Mise en cache des assets statiques");
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error("❌ Erreur mise en cache:", error);
      });
    })
  );

  // Activer immédiatement le nouveau service worker
  self.skipWaiting();
});

// ============================================================================
// ACTIVATION
// ============================================================================

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker: Activation");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Service Worker: Suppression ancien cache ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Prendre le contrôle immédiatement
  return self.clients.claim();
});

// ============================================================================
// GESTION DES NOTIFICATIONS
// ============================================================================

/**
 * Gestion du clic sur la notification
 */
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notification cliquée:", event.action);

  event.notification.close();

  if (event.action === "cloture") {
    // Action "Faire la clôture"
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // Chercher une fenêtre déjà ouverte
          for (const client of clientList) {
            if (client.url.includes("/admin/comptabilite") && "focus" in client) {
              return client.focus().then((client) => {
                // Naviguer vers la page de clôture
                return client.navigate("/admin/comptabilite/cloture");
              });
            }
          }

          // Sinon, ouvrir une nouvelle fenêtre
          if (clients.openWindow) {
            return clients.openWindow("/admin/comptabilite/cloture");
          }
        })
    );
  } else if (event.action === "later") {
    // Action "Me rappeler dans 1h"
    console.log("⏰ Rappel dans 1h planifié");

    // Planifier une nouvelle notification dans 1h
    event.waitUntil(
      self.registration.showNotification("⏰ Rappel - Clôture journalière", {
        body: "N'oubliez pas de clôturer la journée comptable !",
        icon: "/icon-192.png",
        badge: "/badge-72.png",
        tag: "cloture-journaliere-rappel",
        requireInteraction: true,
        actions: [
          {
            action: "cloture",
            title: "✅ Faire la clôture",
          },
        ],
        data: {
          url: "/admin/comptabilite/cloture",
        },
      })
    );
  } else {
    // Clic sur le corps de la notification (pas sur un bouton)
    const urlToOpen = event.notification.data?.url || "/admin/comptabilite/cloture";

    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // Chercher une fenêtre déjà ouverte
          for (const client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }

          // Sinon, ouvrir une nouvelle fenêtre
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

/**
 * Gestion de la fermeture de la notification
 */
self.addEventListener("notificationclose", (event) => {
  console.log("🔕 Notification fermée");
  // On peut logger pour analytics si besoin
});

// ============================================================================
// GESTION DES REQUÊTES (CACHE STRATEGY)
// ============================================================================

/**
 * Stratégie Cache-First pour les assets statiques
 * Network-First pour les données dynamiques
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP (chrome-extension, etc.)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Stratégie pour les assets statiques
  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Stratégie Network-First pour les données API/Firebase
  if (url.hostname.includes("firebaseio.com") || url.hostname.includes("googleapis.com")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // Fallback offline
          return new Response(
            JSON.stringify({ error: "Offline", message: "Connexion requise" }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        })
    );
    return;
  }

  // Par défaut, essayer le réseau d'abord, puis le cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback pour les pages HTML
          if (request.destination === "document") {
            return caches.match("/index.html");
          }
        });
      })
  );
});

// ============================================================================
// PERIODIC BACKGROUND SYNC (si supporté)
// ============================================================================

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "cloture-check") {
    console.log("🔄 Periodic Sync: Vérification clôture");

    event.waitUntil(checkAndNotifyCloture());
  }
});

/**
 * Vérifie si clôture nécessaire et notifie
 */
async function checkAndNotifyCloture() {
  try {
    const now = new Date();
    const hours = now.getHours();

    // Vérifier si entre 23h et 23h59
    if (hours === 23) {
      // Vérifier si clôture déjà faite (via localStorage ou API)
      const lastCloture = await getLastClotureDate();
      const yesterday = getYesterdayKey();

      if (lastCloture !== yesterday) {
        await self.registration.showNotification("⏰ Clôture journalière", {
          body: "Il est temps de clôturer la journée comptable !",
          tag: "cloture-journaliere",
          icon: "/icon-192.png",
          badge: "/badge-72.png",
          requireInteraction: true,
          actions: [
            { action: "cloture", title: "✅ Faire la clôture" },
            { action: "later", title: "⏰ Plus tard" },
          ],
        });
      }
    }
  } catch (error) {
    console.error("❌ Erreur vérification clôture:", error);
  }
}

/**
 * Récupère la date de la dernière clôture
 */
async function getLastClotureDate() {
  // Utiliser IndexedDB ou localStorage via message au client
  return null; // À implémenter si besoin
}

/**
 * Retourne la clé du jour d'hier au format DDMMYYYY
 */
function getYesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const day = String(yesterday.getDate()).padStart(2, "0");
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const year = String(yesterday.getFullYear());

  return `${day}${month}${year}`;
}

// ============================================================================
// MESSAGES DU CLIENT
// ============================================================================

self.addEventListener("message", (event) => {
  console.log("📬 Message reçu du client:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLAIM_CLIENTS") {
    self.clients.claim();
  }
});

console.log("🚀 Service Worker chargé et prêt");
