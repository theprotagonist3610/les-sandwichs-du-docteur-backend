/**
 * Hook personnalisé pour charger toutes les données du Dashboard Comptabilité
 * Gère les KPIs, statistiques, graphiques et alertes
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getAllComptesTresorerie,
  getOperationsToday,
} from "@/toolkits/admin/comptabiliteToolkit";
import { loadOperationsForDateRange } from "@/utils/comptabilite/loadOperationsForPeriod";

const useDashboardData = (periodeFiltre = "7jours") => {
  const [comptesTresorerie, setComptesTresorerie] = useState([]);
  const [operationsJour, setOperationsJour] = useState([]);
  const [operationsPeriode, setOperationsPeriode] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données initiales
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculer les dates selon le filtre
      const now = new Date();
      let dateDebut, dateFin;

      switch (periodeFiltre) {
        case "7jours":
          dateDebut = new Date(now);
          dateDebut.setDate(dateDebut.getDate() - 7);
          dateDebut.setHours(0, 0, 0, 0);
          dateFin = new Date().setHours(23, 59, 59, 999);
          break;
        case "30jours":
          dateDebut = new Date(now);
          dateDebut.setDate(dateDebut.getDate() - 30);
          dateDebut.setHours(0, 0, 0, 0);
          dateFin = new Date().setHours(23, 59, 59, 999);
          break;
        case "moisActuel":
          dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
          dateDebut.setHours(0, 0, 0, 0);
          dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          dateFin.setHours(23, 59, 59, 999);
          break;
        case "annee":
          dateDebut = new Date(now.getFullYear(), 0, 1);
          dateDebut.setHours(0, 0, 0, 0);
          dateFin = new Date(now.getFullYear(), 11, 31);
          dateFin.setHours(23, 59, 59, 999);
          break;
        default:
          dateDebut = new Date().setHours(0, 0, 0, 0);
          dateFin = new Date().setHours(23, 59, 59, 999);
      }

      // Charger en parallèle
      const [comptesData, opsToday, opsPeriode] = await Promise.all([
        getAllComptesTresorerie(),
        getOperationsToday(),
        loadOperationsForDateRange(dateDebut, dateFin),
      ]);

      setComptesTresorerie(comptesData.comptes || []);
      setOperationsJour(opsToday.operations || []);
      setOperationsPeriode(opsPeriode.operations || []);

      console.log(
        `✅ Dashboard chargé: ${comptesData.comptes?.length || 0} comptes, ${opsToday.operations?.length || 0} ops aujourd'hui`
      );
    } catch (err) {
      console.error("❌ Erreur chargement dashboard:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [periodeFiltre]);

  // Charger au montage et quand le filtre change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculer le solde total
  const soldeTotal = useMemo(() => {
    return comptesTresorerie.reduce((sum, compte) => sum + (compte.solde || 0), 0);
  }, [comptesTresorerie]);

  // Calculer les entrées du jour
  const entreesJour = useMemo(() => {
    const ops = operationsJour.filter((op) => op.type_operation === "entree");
    return {
      montant: ops.reduce((sum, op) => sum + op.montant, 0),
      nombre: ops.length,
    };
  }, [operationsJour]);

  // Calculer les sorties du jour
  const sortiesJour = useMemo(() => {
    const ops = operationsJour.filter((op) => op.type_operation === "sortie");
    return {
      montant: ops.reduce((sum, op) => sum + op.montant, 0),
      nombre: ops.length,
    };
  }, [operationsJour]);

  // Calculer la balance du jour
  const balanceJour = useMemo(() => {
    return entreesJour.montant - sortiesJour.montant;
  }, [entreesJour, sortiesJour]);

  // Calculer la variation % (simulée pour l'instant - comparaison avec hier)
  const variationPourcentage = useMemo(() => {
    // Pour l'instant, simulation - dans une vraie app, il faudrait charger les données d'hier
    if (soldeTotal === 0) return 0;
    return ((balanceJour / soldeTotal) * 100).toFixed(1);
  }, [soldeTotal, balanceJour]);

  // Dernières opérations (5 plus récentes)
  const dernieresOperations = useMemo(() => {
    return [...operationsJour]
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
  }, [operationsJour]);

  // Top 5 comptes par solde
  const topComptes = useMemo(() => {
    return [...comptesTresorerie]
      .sort((a, b) => (b.solde || 0) - (a.solde || 0))
      .slice(0, 5);
  }, [comptesTresorerie]);

  // Statistiques globales
  const statistiques = useMemo(() => {
    const nbOperations = operationsJour.length;
    const nbComptes = comptesTresorerie.length;
    const moyEntree =
      entreesJour.nombre > 0 ? entreesJour.montant / entreesJour.nombre : 0;
    const moySortie =
      sortiesJour.nombre > 0 ? sortiesJour.montant / sortiesJour.nombre : 0;

    return {
      nbOperations,
      nbComptes,
      moyEntree,
      moySortie,
    };
  }, [operationsJour, comptesTresorerie, entreesJour, sortiesJour]);

  // État de clôture (simulation - vérifier s'il y a eu une clôture aujourd'hui)
  const etatCloture = useMemo(() => {
    // Dans une vraie app, il faudrait vérifier dans la base de données
    // Pour l'instant, on considère que ce n'est pas clôturé
    return {
      cloture: false,
      nbOperations: operationsJour.length,
    };
  }, [operationsJour]);

  // Alertes basiques
  const alertes = useMemo(() => {
    const alerts = [];

    // Alerte si un compte est négatif
    comptesTresorerie.forEach((compte) => {
      if (compte.solde < 0) {
        alerts.push({
          type: "compte_negatif",
          message: `${compte.denomination} : ${new Intl.NumberFormat("fr-FR").format(compte.solde)} FCFA`,
          severity: "error",
        });
      }
    });

    // Alerte si aucune opération aujourd'hui
    if (operationsJour.length === 0) {
      alerts.push({
        type: "aucune_operation",
        message: "Aucune opération enregistrée aujourd'hui",
        severity: "warning",
      });
    }

    // Alerte si balance négative
    if (balanceJour < 0) {
      alerts.push({
        type: "balance_negative",
        message: `Balance du jour négative : ${new Intl.NumberFormat("fr-FR").format(balanceJour)} FCFA`,
        severity: "warning",
      });
    }

    return alerts;
  }, [comptesTresorerie, operationsJour, balanceJour]);

  // Données pour le graphique d'évolution (par jour sur la période)
  const evolutionTresorerie = useMemo(() => {
    if (operationsPeriode.length === 0) return [];

    // Grouper par jour
    const operationsParJour = {};

    operationsPeriode.forEach((op) => {
      const dateObj = new Date(op.date);
      const dateKey = dateObj.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      });

      if (!operationsParJour[dateKey]) {
        operationsParJour[dateKey] = { entrees: 0, sorties: 0 };
      }

      if (op.type_operation === "entree") {
        operationsParJour[dateKey].entrees += op.montant;
      } else {
        operationsParJour[dateKey].sorties += op.montant;
      }
    });

    // Convertir en tableau avec balance cumulée
    let balanceCumulee = soldeTotal - balanceJour; // Partir du solde initial estimé
    const data = Object.entries(operationsParJour).map(([date, ops]) => {
      const balance = ops.entrees - ops.sorties;
      balanceCumulee += balance;

      return {
        date,
        entrees: ops.entrees,
        sorties: ops.sorties,
        solde: balanceCumulee,
      };
    });

    return data;
  }, [operationsPeriode, soldeTotal, balanceJour]);

  // Données pour le graphique Entrées vs Sorties (par semaine du mois)
  const entreesVsSorties = useMemo(() => {
    if (operationsPeriode.length === 0) return [];

    // Grouper par semaine
    const parSemaine = {};

    operationsPeriode.forEach((op) => {
      const dateObj = new Date(op.date);
      const weekNumber = Math.ceil(dateObj.getDate() / 7);
      const key = `Sem ${weekNumber}`;

      if (!parSemaine[key]) {
        parSemaine[key] = { entrees: 0, sorties: 0 };
      }

      if (op.type_operation === "entree") {
        parSemaine[key].entrees += op.montant;
      } else {
        parSemaine[key].sorties += op.montant;
      }
    });

    return Object.entries(parSemaine).map(([semaine, data]) => ({
      semaine,
      entrees: data.entrees,
      sorties: data.sorties,
    }));
  }, [operationsPeriode]);

  // Données pour le graphique répartition par type
  const repartitionParType = useMemo(() => {
    const entreeTotal = operationsPeriode
      .filter((op) => op.type_operation === "entree")
      .reduce((sum, op) => sum + op.montant, 0);

    const sortieTotal = operationsPeriode
      .filter((op) => op.type_operation === "sortie")
      .reduce((sum, op) => sum + op.montant, 0);

    return [
      { name: "Entrées", value: entreeTotal, color: "#16a34a" },
      { name: "Sorties", value: sortieTotal, color: "#dc2626" },
    ];
  }, [operationsPeriode]);

  return {
    // États
    isLoading,
    error,

    // KPIs
    soldeTotal,
    entreesJour,
    sortiesJour,
    balanceJour,
    variationPourcentage,

    // Données
    comptesTresorerie,
    operationsJour,
    dernieresOperations,
    topComptes,

    // Statistiques
    statistiques,
    etatCloture,
    alertes,

    // Graphiques
    evolutionTresorerie,
    entreesVsSorties,
    repartitionParType,

    // Actions
    refresh: loadData,
  };
};

export default useDashboardData;
