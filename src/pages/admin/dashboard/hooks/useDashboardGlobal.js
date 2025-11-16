/**
 * Hook personnalisé pour le Dashboard Global - Centre de Contrôle
 * Centralise toutes les données des différents modules pour les KPIs globaux
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { ref, onChildAdded } from "firebase/database";
import { rtdb } from "@/firebase.js";

// Imports des toolkits
import {
  getAllComptesTresorerie,
  getOperationsToday,
} from "@/toolkits/admin/comptabilite";
import { getAllLivraisons, getLivraisonsEnCours } from "@/toolkits/admin/livraisons";
import { GetCommandes } from "@/toolkits/admin/commandeToolkit";
import { getProductionsEnAttente, formatDayKey } from "@/toolkits/admin/productionToolkit";
import { listElements } from "@/toolkits/admin/stockToolkit";
import { getAllUsers, getAllUsersPresences } from "@/toolkits/admin/userToolkit";

// ============================================================================
// FONCTIONS WRAPPER POUR LES TOOLKITS
// ============================================================================

/**
 * Récupère les commandes du jour depuis le toolkit
 */
const getCommandesJour = async () => {
  try {
    const allCommandes = await GetCommandes();

    // Filtrer les commandes du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const commandesJour = (allCommandes || []).filter((commande) => {
      if (!commande.dates?.creation) return false;
      return commande.dates.creation >= todayTimestamp;
    });

    return { commandes: commandesJour };
  } catch (error) {
    console.error("❌ Erreur getCommandesJour:", error);
    return { commandes: [] };
  }
};

/**
 * Récupère les productions en attente depuis le toolkit
 */
const getProductionsJour = async () => {
  try {
    const productions = await getProductionsEnAttente();
    return { productions: productions || [] };
  } catch (error) {
    console.error("❌ Erreur getProductionsJour:", error);
    return { productions: [] };
  }
};

/**
 * Récupère les alertes stock depuis le toolkit
 */
const getAlertesStock = async () => {
  try {
    const elements = await listElements({ status: true });

    // Filtrer les éléments en alerte (quantité <= seuil)
    const alertes = (elements || [])
      .filter((element) => {
        const quantite = element.quantite_actuelle || 0;
        const seuil = element.seuil_alerte || 0;
        return seuil > 0 && quantite <= seuil;
      })
      .map((element) => ({
        id: element.id,
        element: element.denomination,
        quantite: element.quantite_actuelle || 0,
        seuil: element.seuil_alerte || 0,
        niveau: (element.quantite_actuelle || 0) === 0 ? "critique" : "attention",
        unite: element.unite,
        type: element.type,
      }));

    return { alertes };
  } catch (error) {
    console.error("❌ Erreur getAlertesStock:", error);
    return { alertes: [] };
  }
};

/**
 * Récupère les utilisateurs présents depuis le toolkit
 */
const getUtilisateursPresents = async () => {
  try {
    const [users, presences] = await Promise.all([
      getAllUsers(),
      getAllUsersPresences(),
    ]);

    // Compter les utilisateurs réellement actifs (online et lastSeen < 90s)
    const now = Date.now();
    const activeThreshold = 90000; // 90 secondes

    const activeUsers = presences.filter((presence) => {
      const isOnline = presence.status === "online";
      const isRecent = presence.lastSeen && (now - presence.lastSeen) < activeThreshold;
      return isOnline && isRecent;
    });

    return {
      presents: activeUsers.length,
      total: users.length,
    };
  } catch (error) {
    console.error("❌ Erreur getUtilisateursPresents:", error);
    return { presents: 0, total: 0 };
  }
};

/**
 * Hook principal pour le dashboard global
 * @returns {Object} Données centralisées pour tous les KPIs
 */
const useDashboardGlobal = () => {
  // ============================================================================
  // ÉTATS
  // ============================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Données Comptabilité/Trésorerie
  const [comptesTresorerie, setComptesTresorerie] = useState([]);
  const [operationsJour, setOperationsJour] = useState([]);

  // Données Commandes/Ventes
  const [commandesJour, setCommandesJour] = useState([]);

  // Données Livraisons
  const [livraisons, setLivraisons] = useState([]);
  const [livraisonsEnCours, setLivraisonsEnCours] = useState([]);

  // Données Production (à implémenter avec toolkit)
  const [productionsJour, setProductionsJour] = useState([]);

  // Données Stock (à implémenter avec toolkit)
  const [alertesStock, setAlertesStock] = useState([]);

  // Données Utilisateurs/Présence (à implémenter)
  const [utilisateursPresents, setUtilisateursPresents] = useState([]);
  const [totalUtilisateurs, setTotalUtilisateurs] = useState(0);

  // ============================================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================================
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 Dashboard: Chargement des données...");

      // Charger les données en parallèle
      const [
        comptesData,
        opsToday,
        livraisonsData,
        livraisonsEnCoursData,
        commandesData,
        productionsData,
        alertesStockData,
        utilisateursData,
      ] = await Promise.all([
        getAllComptesTresorerie(),
        getOperationsToday(),
        getAllLivraisons().catch(() => ({ livraisons: [] })),
        getLivraisonsEnCours().catch(() => ({ livraisons: [] })),
        getCommandesJour().catch(() => ({ commandes: [] })),
        getProductionsJour().catch(() => ({ productions: [] })),
        getAlertesStock().catch(() => ({ alertes: [] })),
        getUtilisateursPresents().catch(() => ({ presents: 0, total: 0 })),
      ]);

      setComptesTresorerie(comptesData.comptes || []);
      setOperationsJour(opsToday.operations || []);
      setLivraisons(livraisonsData.livraisons || []);
      setLivraisonsEnCours(livraisonsEnCoursData.livraisons || []);
      setCommandesJour(commandesData.commandes || []);
      setProductionsJour(productionsData.productions || []);
      setAlertesStock(alertesStockData.alertes || []);
      setUtilisateursPresents(
        Array.from({ length: utilisateursData.presents }, (_, i) => ({ id: i }))
      );
      setTotalUtilisateurs(utilisateursData.total || 0);

      console.log("✅ Dashboard global chargé avec succès");
      console.log(`📊 Commandes: ${commandesData.commandes.length}, Productions: ${productionsData.productions.length}, Alertes: ${alertesStockData.alertes.length}`);
    } catch (err) {
      console.error("❌ Erreur chargement dashboard global:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // EFFET 1: CHARGEMENT INITIAL UNIQUEMENT
  // ============================================================================
  useEffect(() => {
    loadData();
    // Plus d'auto-refresh automatique - uniquement sur trigger RTDB
  }, [loadData]);

  // ============================================================================
  // EFFET 2: LISTENERS RTDB POUR SYNCHRONISATION TEMPS RÉEL (DEUX NŒUDS)
  // ============================================================================
  useEffect(() => {
    console.log("🔌 Dashboard: Configuration des listeners RTDB...");
    const RTDB_NOTIFICATIONS_PATHS = ["notification", "notifications"];
    console.log(`📡 Dashboard: Écoute de ${RTDB_NOTIFICATIONS_PATHS.length} nœuds:`, RTDB_NOTIFICATIONS_PATHS);

    let debounceTimer = null;
    let isInitialLoad = true;

    // Handler pour les nouvelles notifications
    const handleNotification = (nodePath) => (snapshot) => {
      // Ignorer les notifications au montage initial
      if (isInitialLoad) {
        return;
      }

      const notification = snapshot.val();
      if (!notification) return;

      const title = notification.title || "";
      const message = notification.message || "";

      console.log(`🔔 Dashboard: Notification RTDB reçue depuis ${nodePath}`, {
        title,
        message,
        timestamp: notification.timestamp,
      });

      // Vérifier si la notification concerne un module du dashboard
      const shouldRefresh =
        title.includes("Transaction stock") ||
        title.includes("stock") ||
        title.includes("Commande") ||
        title.includes("commande") ||
        title.includes("Production") ||
        title.includes("production") ||
        title.includes("Livraison") ||
        title.includes("livraison") ||
        title.includes("comptable") ||
        title.includes("Opération") ||
        message.includes("stock") ||
        message.includes("commande");

      if (shouldRefresh) {
        console.log("🔄 Dashboard: Déclenchement du refresh différé (500ms)");

        // Annuler le timer précédent
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Attendre 500ms avant de recharger (debounce)
        debounceTimer = setTimeout(() => {
          console.log("🔄 Dashboard: Refresh déclenché par RTDB");
          loadData();
        }, 500);
      }
    };

    // Créer un listener pour chaque nœud
    const unsubscribers = RTDB_NOTIFICATIONS_PATHS.map((nodePath) => {
      const notificationsRef = ref(rtdb, nodePath);
      console.log(`🔌 Dashboard: Listener actif sur ${nodePath}`);
      return onChildAdded(notificationsRef, handleNotification(nodePath));
    });

    // Marquer le chargement initial comme terminé après 1s
    const initTimer = setTimeout(() => {
      isInitialLoad = false;
      console.log("✅ Dashboard: Listeners RTDB actifs");
    }, 1000);

    return () => {
      console.log("🔌 Dashboard: Nettoyage des listeners RTDB");
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      clearTimeout(initTimer);
    };
  }, [loadData]);

  // ============================================================================
  // KPI 1: TRÉSORERIE
  // ============================================================================
  const kpiTresorerie = useMemo(() => {
    const soldeTotal = comptesTresorerie.reduce(
      (sum, compte) => sum + (compte.solde || 0),
      0
    );

    // Calculer la balance du jour
    const entrees = operationsJour
      .filter((op) => op.type_operation === "entree")
      .reduce((sum, op) => sum + op.montant, 0);

    const sorties = operationsJour
      .filter((op) => op.type_operation === "sortie")
      .reduce((sum, op) => sum + op.montant, 0);

    const balanceJour = entrees - sorties;

    // Calcul variation (simplifié pour l'instant)
    const variation = soldeTotal > 0 ? ((balanceJour / soldeTotal) * 100).toFixed(1) : 0;

    return {
      titre: "Trésorerie",
      valeur: soldeTotal,
      format: "currency",
      variation: parseFloat(variation),
      trend: balanceJour >= 0 ? "up" : "down",
      icon: "Wallet",
      color: "blue",
      details: {
        soldeTotal,
        entrees,
        sorties,
        balanceJour,
        nbOperations: operationsJour.length,
      },
    };
  }, [comptesTresorerie, operationsJour]);

  // ============================================================================
  // KPI 2: COMMANDES
  // ============================================================================
  const kpiCommandes = useMemo(() => {
    const nbCommandes = commandesJour.length;

    // Calculer stats
    const surPlace = commandesJour.filter((c) => c.type === "sur_place").length;
    const aLivrer = commandesJour.filter((c) => c.type === "a_livrer").length;
    const totalMontant = commandesJour.reduce((sum, c) => sum + (c.montant || 0), 0);
    const panierMoyen = nbCommandes > 0 ? totalMontant / nbCommandes : 0;

    // Variation simulée (TODO: calculer vs hier)
    const variation = 8;

    return {
      titre: "Commandes",
      valeur: nbCommandes,
      format: "number",
      variation: variation,
      trend: variation >= 0 ? "up" : "down",
      icon: "ShoppingCart",
      color: "green",
      details: {
        aujourdhui: nbCommandes,
        surPlace,
        aLivrer,
        panierMoyen,
      },
    };
  }, [commandesJour]);

  // ============================================================================
  // KPI 3: LIVRAISONS
  // ============================================================================
  const kpiLivraisons = useMemo(() => {
    const nbEnCours = livraisonsEnCours.length;

    // Détecter les livraisons en retard (durée > 60 min)
    const maintenant = Date.now();
    const livraisonsEnRetard = livraisonsEnCours.filter((livraison) => {
      if (livraison.dates?.depart) {
        const duree = (maintenant - livraison.dates.depart) / (1000 * 60); // en minutes
        return duree > 60;
      }
      return false;
    });

    const nbEnRetard = livraisonsEnRetard.length;

    return {
      titre: "Livraisons",
      valeur: nbEnCours,
      format: "number",
      variation: null, // Pas de variation pour les livraisons
      trend: nbEnRetard > 0 ? "warning" : "neutral",
      icon: "Truck",
      color: "orange",
      details: {
        enCours: nbEnCours,
        enRetard: nbEnRetard,
        total: livraisons.length,
      },
    };
  }, [livraisons, livraisonsEnCours]);

  // ============================================================================
  // KPI 4: PRODUCTION
  // ============================================================================
  const kpiProduction = useMemo(() => {
    const nbProductions = productionsJour.length;

    // Calculer stats par statut
    const terminees = productionsJour.filter((p) => p.statut === "termine").length;
    const enCours = productionsJour.filter((p) => p.statut === "en_cours").length;
    const planifiees = productionsJour.filter((p) => p.statut === "planifie").length;

    return {
      titre: "Production",
      valeur: nbProductions,
      format: "number",
      variation: null,
      trend: enCours > 0 ? "up" : "neutral",
      icon: "ChefHat",
      color: "purple",
      details: {
        recettes: nbProductions,
        enCours,
        terminees,
        planifiees,
      },
    };
  }, [productionsJour]);

  // ============================================================================
  // KPI 5: STOCK
  // ============================================================================
  const kpiStock = useMemo(() => {
    const nbAlertes = alertesStock.length;

    // Compter par niveau
    const critiques = alertesStock.filter((a) => a.niveau === "critique").length;
    const attention = alertesStock.filter((a) => a.niveau === "attention").length;

    return {
      titre: "Stock",
      valeur: nbAlertes,
      format: "number",
      variation: null,
      trend: critiques > 0 ? "warning" : nbAlertes > 0 ? "neutral" : "up",
      icon: "Package",
      color: "yellow",
      details: {
        alertes: nbAlertes,
        stockBas: critiques,
        elementsTotal: nbAlertes,
        critiques,
        attention,
      },
    };
  }, [alertesStock]);

  // ============================================================================
  // KPI 6: PRÉSENCE
  // ============================================================================
  const kpiPresence = useMemo(() => {
    const nbPresents = utilisateursPresents.length || 0;
    const total = totalUtilisateurs || 12; // Placeholder
    const pourcentage = total > 0 ? Math.round((nbPresents / total) * 100) : 0;

    return {
      titre: "Présence",
      valeur: nbPresents,
      format: "fraction",
      fractionTotal: total,
      variation: pourcentage,
      trend: pourcentage >= 70 ? "up" : pourcentage >= 50 ? "neutral" : "down",
      icon: "Users",
      color: "indigo",
      details: {
        presents: nbPresents,
        total: total,
        pourcentage: pourcentage,
      },
    };
  }, [utilisateursPresents, totalUtilisateurs]);

  // ============================================================================
  // ALERTES GLOBALES
  // ============================================================================
  const alertesGlobales = useMemo(() => {
    const alerts = [];

    // Alertes comptabilité
    comptesTresorerie.forEach((compte) => {
      if (compte.solde < 0) {
        alerts.push({
          id: `compte-negatif-${compte.id}`,
          type: "error",
          module: "Comptabilité",
          titre: "Compte négatif",
          message: `${compte.denomination}: ${new Intl.NumberFormat("fr-FR").format(compte.solde)} FCFA`,
          timestamp: Date.now(),
        });
      }
    });

    // Alertes livraisons en retard
    const maintenant = Date.now();
    livraisonsEnCours.forEach((livraison) => {
      if (livraison.dates?.depart) {
        const duree = (maintenant - livraison.dates.depart) / (1000 * 60);
        if (duree > 60) {
          alerts.push({
            id: `livraison-retard-${livraison.id}`,
            type: "error",
            module: "Livraisons",
            titre: "Livraison en retard",
            message: `Livraison #${livraison.commande_code} - Retard ${Math.round(duree - 60)}min`,
            timestamp: Date.now(),
          });
        }
      }
    });

    // TODO: Ajouter alertes stock
    // TODO: Ajouter alertes budgets

    return alerts.sort((a, b) => {
      // Trier par type (error > warning > info) puis par timestamp
      const typeOrder = { error: 0, warning: 1, info: 2 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return b.timestamp - a.timestamp;
    });
  }, [comptesTresorerie, livraisonsEnCours]);

  // ============================================================================
  // RETOUR
  // ============================================================================
  return {
    isLoading,
    error,

    // KPIs
    kpis: {
      tresorerie: kpiTresorerie,
      commandes: kpiCommandes,
      livraisons: kpiLivraisons,
      production: kpiProduction,
      stock: kpiStock,
      presence: kpiPresence,
    },

    // Alertes
    alertes: alertesGlobales,
    nbAlertes: alertesGlobales.length,

    // Données pour les widgets
    livraisonsEnCours,
    comptesTresorerie,
    operationsJour,

    // Actions
    refresh: loadData,
  };
};

export default useDashboardGlobal;
