/**
 * Système de routes dynamiques basé sur le rôle de l'utilisateur
 *
 * Ce fichier importe dynamiquement les routes appropriées en fonction du rôle détecté
 * Les routes globales sont toujours chargées (login, register, etc.)
 * Les routes spécifiques au rôle sont chargées à la demande
 */

import globalRoutes from "./global/globalRoutes";

/**
 * Importe dynamiquement les routes d'un rôle spécifique
 * @param {string} role - Le rôle de l'utilisateur (admin, superviseur, cuisinier, livreur, vendeur)
 * @returns {Promise<Object>} Les routes du rôle spécifié
 */
export async function getRoleRoutes(role) {
  try {
    let routes;

    switch (role) {
      case "admin":
        routes = await import("./admin/adminRoutes");
        break;
      case "superviseur":
        routes = await import("./superviseur/superviseurRoutes");
        break;
      case "cuisinier":
        routes = await import("./cuisinier/cuisinierRoutes");
        break;
      case "livreur":
        routes = await import("./livreur/livreurRoutes");
        break;
      case "vendeur":
        routes = await import("./vendeur/vendeurRoutes");
        break;
      default:
        console.warn(`⚠️ Rôle inconnu: ${role}`);
        return null;
    }

    console.log("✅ Routes chargées pour le rôle:", role);
    return routes.default;
  } catch (error) {
    console.error("❌ Erreur lors du chargement des routes:", error);
    throw error;
  }
}

/**
 * Construit la configuration complète des routes en fonction du rôle
 * @param {string|null} userRole - Le rôle de l'utilisateur connecté (null si non connecté)
 * @returns {Promise<Array>} Tableau de configuration des routes pour React Router
 */
export async function buildRoutesConfig(userRole) {
  try {
    // Toujours inclure les routes globales
    const routes = [globalRoutes];

    // Si un utilisateur est connecté, charger ses routes spécifiques
    if (userRole) {
      const roleRoutes = await getRoleRoutes(userRole);
      if (roleRoutes) {
        routes.push(roleRoutes);
      }
    }

    console.log(
      "✅ Configuration des routes construite:",
      routes.length,
      "route(s)"
    );
    return routes;
  } catch (error) {
    console.error("❌ Erreur lors de la construction des routes:", error);
    // En cas d'erreur, retourner au minimum les routes globales
    return [globalRoutes];
  }
}

/**
 * Export par défaut pour compatibilité
 */
export default {
  getRoleRoutes,
  buildRoutesConfig,
  globalRoutes,
};
