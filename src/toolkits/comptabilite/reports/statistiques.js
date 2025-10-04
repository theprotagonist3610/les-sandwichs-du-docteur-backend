// ==========================================
// 📄 toolkits/comptabilite/reports/statistiques.js
// ==========================================

import { TransactionService } from "../services/transactions";
import { SemaineModel } from "../models/semaine";
import { AnneeModel } from "../models/annee";
import { FirestoreService } from "../services/firestore";
import { validators } from "../utils/validators";
import { dateUtils } from "../utils/dates";

export class StatistiquesService {
  /**
   * Calcule les statistiques comparatives entre périodes
   */
  static async calculerComparatives(periodes) {
    const stats = [];

    for (const periode of periodes) {
      const { dateDebut, dateFin, label } = periode;
      const transactions = await TransactionService.getTransactionsByPeriod(
        dateDebut,
        dateFin
      );

      let ca_total = 0;
      let encaissements_total = 0;
      let decaissements_total = 0;
      let charges_total = 0;

      transactions.forEach((t) => {
        const compte = validators.findCompteByCode(t.compte_lsd);

        if (t.type === "entree") {
          encaissements_total += t.montant;
          if (compte?.type === "produit") {
            ca_total += t.montant;
          }
        } else {
          decaissements_total += t.montant;
          if (compte?.type === "charge" || compte?.code_ohada.startsWith("6")) {
            charges_total += t.montant;
          }
        }
      });

      stats.push({
        label,
        dateDebut,
        dateFin,
        chiffre_affaires: ca_total,
        encaissements: encaissements_total,
        decaissements: decaissements_total,
        charges: charges_total,
        balance: encaissements_total - decaissements_total,
        resultat: ca_total - charges_total,
        nombre_transactions: transactions.length,
        taux_marge:
          ca_total > 0 ? ((ca_total - charges_total) / ca_total) * 100 : 0,
      });
    }

    return {
      periodes: stats,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Calcule l'évolution de la trésorerie sur une période
   */
  static async calculerEvolutionTresorerie(dateDebut, dateFin) {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const yearDebut = debut.getFullYear();
    const yearFin = fin.getFullYear();

    const evolution = [];

    for (let y = yearDebut; y <= yearFin; y++) {
      const semaines = SemaineModel.genererSemainesAnnee(y);

      for (const semaine of semaines) {
        const dateDebutSemaine = new Date(semaine.dateDebut);
        const dateFinSemaine = new Date(semaine.dateFin);

        if (dateFinSemaine >= debut && dateDebutSemaine <= fin) {
          const weekData = await FirestoreService.getWeekDocument(
            y,
            semaine.weekId
          );
          if (weekData) {
            evolution.push({
              date: semaine.dateDebut,
              label: semaine.label,
              weekId: semaine.weekId,
              annee: y,
              tresorerie_debut: weekData.resume.tresorerie_debut,
              tresorerie_fin: weekData.resume.tresorerie_fin,
              encaissements: weekData.resume.total_encaissements.total,
              decaissements: weekData.resume.total_decaissements.total,
              balance: weekData.resume.balance_nette,
              variation:
                weekData.resume.tresorerie_fin.total -
                weekData.resume.tresorerie_debut.total,
            });
          }
        }
      }
    }

    // Calculer les statistiques globales
    const stats = {
      tresorerie_initiale: evolution[0]?.tresorerie_debut.total || 0,
      tresorerie_finale:
        evolution[evolution.length - 1]?.tresorerie_fin.total || 0,
      variation_totale: 0,
      total_encaissements: evolution.reduce(
        (sum, e) => sum + e.encaissements,
        0
      ),
      total_decaissements: evolution.reduce(
        (sum, e) => sum + e.decaissements,
        0
      ),
      tresorerie_moyenne: 0,
      tresorerie_min: 0,
      tresorerie_max: 0,
    };

    stats.variation_totale =
      stats.tresorerie_finale - stats.tresorerie_initiale;

    const tresoreries = evolution.map((e) => e.tresorerie_fin.total);
    stats.tresorerie_moyenne =
      tresoreries.reduce((a, b) => a + b, 0) / tresoreries.length;
    stats.tresorerie_min = Math.min(...tresoreries);
    stats.tresorerie_max = Math.max(...tresoreries);

    return {
      dateDebut,
      dateFin,
      evolution,
      statistiques: stats,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Calcule les produits les plus vendus
   */
  static async calculerTopProduits(dateDebut, dateFin, limit = 10) {
    const transactions = await TransactionService.getTransactionsByPeriod(
      dateDebut,
      dateFin
    );

    const produitsAgreg = {};

    transactions.forEach((t) => {
      if (t.type === "entree") {
        const compte = validators.findCompteByCode(t.compte_lsd);
        if (compte && compte.type === "produit") {
          if (!produitsAgreg[t.compte_lsd]) {
            produitsAgreg[t.compte_lsd] = {
              code_lsd: t.compte_lsd,
              denomination: t.compte_denomination,
              code_ohada: t.compte_ohada,
              nombre_ventes: 0,
              montant_total: 0,
              montant_moyen: 0,
            };
          }
          produitsAgreg[t.compte_lsd].nombre_ventes++;
          produitsAgreg[t.compte_lsd].montant_total += t.montant;
        }
      }
    });

    // Calculer le montant moyen
    Object.values(produitsAgreg).forEach((p) => {
      p.montant_moyen = p.montant_total / p.nombre_ventes;
    });

    const topProduits = Object.values(produitsAgreg)
      .sort((a, b) => b.montant_total - a.montant_total)
      .slice(0, limit);

    const total = topProduits.reduce((sum, p) => sum + p.montant_total, 0);

    return {
      dateDebut,
      dateFin,
      produits: topProduits.map((p) => ({
        ...p,
        pourcentage_ca: total > 0 ? (p.montant_total / total) * 100 : 0,
      })),
      total_montant: total,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Calcule les charges les plus importantes
   */
  static async calculerTopCharges(dateDebut, dateFin, limit = 10) {
    const transactions = await TransactionService.getTransactionsByPeriod(
      dateDebut,
      dateFin
    );

    const chargesAgreg = {};

    transactions.forEach((t) => {
      if (t.type === "sortie") {
        const compte = validators.findCompteByCode(t.compte_lsd);
        if (
          compte &&
          (compte.type === "charge" || compte.code_ohada.startsWith("6"))
        ) {
          if (!chargesAgreg[t.compte_lsd]) {
            chargesAgreg[t.compte_lsd] = {
              code_lsd: t.compte_lsd,
              denomination: t.compte_denomination,
              code_ohada: t.compte_ohada,
              est_fixe: validators.isChargeFixe(compte),
              nombre_depenses: 0,
              montant_total: 0,
              montant_moyen: 0,
            };
          }
          chargesAgreg[t.compte_lsd].nombre_depenses++;
          chargesAgreg[t.compte_lsd].montant_total += t.montant;
        }
      }
    });

    // Calculer le montant moyen
    Object.values(chargesAgreg).forEach((c) => {
      c.montant_moyen = c.montant_total / c.nombre_depenses;
    });

    const topCharges = Object.values(chargesAgreg)
      .sort((a, b) => b.montant_total - a.montant_total)
      .slice(0, limit);

    const total = topCharges.reduce((sum, c) => sum + c.montant_total, 0);

    return {
      dateDebut,
      dateFin,
      charges: topCharges.map((c) => ({
        ...c,
        pourcentage_total: total > 0 ? (c.montant_total / total) * 100 : 0,
      })),
      total_montant: total,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Calcule les statistiques rapides (dashboard)
   */
  static async calculerQuickStats(periode = 7) {
    const currentDate = dateUtils.getCurrentDate();
    const dateFin = currentDate;
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - (periode - 1));
    const dateDebutStr = dateUtils.formatISO(dateDebut);

    const transactions = await TransactionService.getTransactionsByPeriod(
      dateDebutStr,
      dateFin
    );

    const stats = {
      periode,
      dateDebut: dateDebutStr,
      dateFin,
      chiffre_affaires: 0,
      encaissements: 0,
      decaissements: 0,
      charges: 0,
      balance: 0,
      resultat: 0,
      nombre_transactions: transactions.length,
      tresorerie_actuelle: { caisse: 0, mobile_money: 0, banque: 0, total: 0 },
    };

    transactions.forEach((t) => {
      const compte = validators.findCompteByCode(t.compte_lsd);

      if (t.type === "entree") {
        stats.encaissements += t.montant;
        if (compte?.type === "produit") {
          stats.chiffre_affaires += t.montant;
        }
      } else {
        stats.decaissements += t.montant;
        if (compte?.type === "charge" || compte?.code_ohada.startsWith("6")) {
          stats.charges += t.montant;
        }
      }
    });

    stats.balance = stats.encaissements - stats.decaissements;
    stats.resultat = stats.chiffre_affaires - stats.charges;

    // Récupérer la trésorerie actuelle (dernière semaine)
    const year = dateUtils.getCurrentYear();
    const currentWeek = SemaineModel.getWeekFromDate(currentDate, year);
    if (currentWeek) {
      const weekData = await FirestoreService.getWeekDocument(
        year,
        currentWeek.weekId
      );
      if (weekData) {
        stats.tresorerie_actuelle = { ...weekData.resume.tresorerie_fin };
      }
    }

    return stats;
  }

  /**
   * Analyse la répartition des modes de paiement
   */
  static async analyserModesPaiement(dateDebut, dateFin) {
    const transactions = await TransactionService.getTransactionsByPeriod(
      dateDebut,
      dateFin
    );

    const repartition = {
      caisse: { entrees: 0, sorties: 0, total: 0, nombre: 0 },
      mobile_money: { entrees: 0, sorties: 0, total: 0, nombre: 0 },
      banque: { entrees: 0, sorties: 0, total: 0, nombre: 0 },
    };

    transactions.forEach((t) => {
      const mode = t.mode_paiement;
      repartition[mode].nombre++;

      if (t.type === "entree") {
        repartition[mode].entrees += t.montant;
      } else {
        repartition[mode].sorties += t.montant;
      }

      repartition[mode].total += t.montant;
    });

    const totalGlobal = Object.values(repartition).reduce(
      (sum, r) => sum + r.total,
      0
    );

    return {
      dateDebut,
      dateFin,
      repartition: Object.entries(repartition).map(([mode, data]) => ({
        mode,
        ...data,
        pourcentage: totalGlobal > 0 ? (data.total / totalGlobal) * 100 : 0,
      })),
      total: totalGlobal,
      generated_at: new Date().toISOString(),
    };
  }
}
