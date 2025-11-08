/**
 * registerServiceWorker.js
 * Enregistrement du Service Worker pour la PWA
 */

/**
 * Enregistre le service worker
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("⚠️ Service Worker non supporté par ce navigateur");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("✅ Service Worker enregistré:", registration.scope);

    // Gestion des mises à jour
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.log("🔄 Nouvelle version du Service Worker disponible");

          // Optionnel : notifier l'utilisateur qu'une mise à jour est disponible
          if (window.confirm("Une nouvelle version est disponible. Recharger ?")) {
            newWorker.postMessage({ type: "SKIP_WAITING" });
            window.location.reload();
          }
        }
      });
    });

    // Écouter les changements de contrôleur (nouveau SW activé)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("🔄 Service Worker mis à jour");
      window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error("❌ Erreur enregistrement Service Worker:", error);
    return null;
  }
}

/**
 * Désenregistre le service worker (pour debug)
 */
export async function unregisterServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      const unregistered = await registration.unregister();
      console.log("🗑️ Service Worker désenregistré:", unregistered);
      return unregistered;
    }

    return false;
  } catch (error) {
    console.error("❌ Erreur désenregistrement Service Worker:", error);
    return false;
  }
}

/**
 * Enregistre le Periodic Background Sync (si supporté)
 */
export async function registerPeriodicSync() {
  if (!("serviceWorker" in navigator) || !("periodicSync" in ServiceWorkerRegistration.prototype)) {
    console.warn("⚠️ Periodic Background Sync non supporté");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.periodicSync.register("cloture-check", {
      minInterval: 12 * 60 * 60 * 1000, // 12 heures
    });

    console.log("✅ Periodic Background Sync enregistré");
    return true;
  } catch (error) {
    console.error("❌ Erreur enregistrement Periodic Sync:", error);
    return false;
  }
}
