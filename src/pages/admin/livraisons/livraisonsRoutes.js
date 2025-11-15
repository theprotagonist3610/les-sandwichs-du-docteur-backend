/**
 * Configuration des routes de Livraisons
 * Ces routes seront intégrées dans adminRoutes
 */

import Livraisons from "@/pages/admin/livraisons/Livraisons";

/**
 * Routes du module Livraisons
 * Une seule route principale pour la gestion des livraisons et livreurs
 */
export const livraisonsSubRoutes = [
  {
    path: "livraisons",
    nom: "Gestion des Livraisons",
    description: "Suivi des livraisons et gestion des livreurs",
    url: "/users.svg",
    component: Livraisons,
  },
];

export default livraisonsSubRoutes;
