/**
 * Hook personnalisé pour le Dashboard Global - Centre de Contrôle
 * Centralise toutes les données des différents modules pour les KPIs globaux
 */

import { useState, useEffect, useMemo } from "react";
import {
  getAllComptesTresorerie,
  getOperationsToday,
} from "@/toolkits/admin/comptabilite";
import { getAllLivraisons, getLivraisonsEnCours } from "@/toolkits/admin/livraisons";

// ============================================================================
// FONCTIONS MOCK TEMPORAIRES (en attendant les vrais toolkits)
// ============================================================================

/**
 * Mock: Récupère les commandes du jour
 * TODO: Remplacer par import depuis commandeToolkit
 */
const getCommandesJour = async () => {
  // Données simulées
  return {
    commandes: [
      { id: 1, type: "sur_place", montant: 15000, vendeur: "Jean Dosseh" },
      { id: 2, type: "a_livrer", montant: 22000, vendeur: "Marie Koffi" },
      // ... plus de données simulées
    ],
  };
};

/**
 * Mock: Récupère les productions du jour
 * TODO: Remplacer par import depuis productionToolkit
 */
const getProductionsJour = async () => {
  // Données simulées
  return {
    productions: [
      { id: 1, nom: "Sandwich Poulet", statut: "termine", quantite: 50 },
      { id: 2, nom: "Sandwich Viande", statut: "en_cours", quantite: 30 },
      // ... plus de données simulées
    ],
  };
};

/**
 * Mock: Récupère les alertes stock
 * TODO: Remplacer par import depuis stockToolkit
 */
const getAlertesStock = async () => {
  // Données simulées
  return {
    alertes: [
      { id: 1, element: "Tomates", niveau: "critique", quantite: 12, seuil: 20 },
      { id: 2, element: "Pain", niveau: "critique", quantite: 8, seuil: 15 },
      { id: 3, element: "Oignons", niveau: "attention", quantite: 22, seuil: 20 },
    ],
  };
};

/**
 * Mock: Récupère les utilisateurs présents
 * TODO: Remplacer par import depuis userToolkit
 */
const getUtilisateursPresents = async () => {
  // Données simulées
  return {
    presents: 8,
    total: 12,
  };
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
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

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
        getUtilisateursPresents().catch(() => ({ presents: 0, total: 12 })),
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
      setTotalUtilisateurs(utilisateursData.total || 12);

      console.log("✅ Dashboard global chargé avec succès");
    } catch (err) {
      console.error("❌ Erreur chargement dashboard global:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

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
