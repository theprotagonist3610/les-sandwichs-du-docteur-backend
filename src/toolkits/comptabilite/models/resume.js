// ==========================================
// 📄 toolkits/comptabilite/models/resume.js
// ==========================================

import { validators } from "../utils/validators";

export class ResumeModel {
  /**
   * Initialise un résumé vide selon la structure OHADA
   */
  static initVide() {
    return {
      tresorerie_debut: { caisse: 0, mobile_money: 0, banque: 0, total: 0 },
      tresorerie_fin: { caisse: 0, mobile_money: 0, banque: 0, total: 0 },
      total_encaissements: { caisse: 0, mobile_money: 0, banque: 0, total: 0 },
      total_decaissements: { caisse: 0, mobile_money: 0, banque: 0, total: 0 },
      chiffre_affaires: 0,
      produits_par_compte: {},
      charges_par_compte: {},
      charges_fixes: 0,
      charges_variables: 0,
      balance_nette: 0,
      excedent_insuffisance: 0,
      capacite_autofinancement: 0,
      repartition_paiements: {
        especes_pct: 0,
        mobile_money_pct: 0,
        banque_pct: 0,
      },
      nombre_transactions: 0,
      tresorerie_moyenne_journaliere: 0,
      delai_moyen_caisse: 0,
    };
  }

  /**
   * Calcule le résumé hebdomadaire à partir des transactions (Caisse OHADA)
   */
  static calculerHebdomadaire(transactions, tresorerieDebut, nombreJours) {
    const resume = this.initVide();
    resume.tresorerie_debut = { ...tresorerieDebut };
    resume.tresorerie_fin = { ...tresorerieDebut };
    resume.nombre_transactions = transactions.length;

    let totalEncaissements = 0;
    let totalDecaissements = 0;

    transactions.forEach((transaction) => {
      const compte = validators.findCompteByCode(transaction.compte_lsd);
      if (!compte) return;

      const montant = transaction.montant;
      const modePaiement = transaction.mode_paiement;

      if (transaction.type === "entree") {
        // Encaissements
        resume.total_encaissements[modePaiement] += montant;
        resume.total_encaissements.total += montant;
        resume.tresorerie_fin[modePaiement] += montant;
        totalEncaissements += montant;

        // Si c'est un produit (compte classe 7 OHADA)
        if (compte.type === "produit") {
          resume.chiffre_affaires += montant;
          resume.produits_par_compte[transaction.compte_lsd] =
            (resume.produits_par_compte[transaction.compte_lsd] || 0) + montant;
        }
      } else if (transaction.type === "sortie") {
        // Décaissements
        resume.total_decaissements[modePaiement] += montant;
        resume.total_decaissements.total += montant;
        resume.tresorerie_fin[modePaiement] -= montant;
        totalDecaissements += montant;

        // Si c'est une charge (compte classe 6 OHADA)
        if (compte.type === "charge" || compte.code_ohada.startsWith("6")) {
          resume.charges_par_compte[transaction.compte_lsd] =
            (resume.charges_par_compte[transaction.compte_lsd] || 0) + montant;

          // Distinguer charges fixes et variables
          if (validators.isChargeFixe(compte)) {
            resume.charges_fixes += montant;
          } else {
            resume.charges_variables += montant;
          }
        }
      }
    });

    // Calcul trésorerie finale totale
    resume.tresorerie_fin.total =
      resume.tresorerie_fin.caisse +
      resume.tresorerie_fin.mobile_money +
      resume.tresorerie_fin.banque;

    // Indicateurs OHADA
    resume.balance_nette = totalEncaissements - totalDecaissements;
    resume.excedent_insuffisance =
      resume.tresorerie_fin.total - resume.tresorerie_debut.total;

    const totalCharges = resume.charges_fixes + resume.charges_variables;
    resume.capacite_autofinancement = resume.chiffre_affaires - totalCharges;

    // Répartition des paiements (en pourcentage)
    if (totalEncaissements > 0) {
      resume.repartition_paiements.especes_pct =
        (resume.total_encaissements.caisse / totalEncaissements) * 100;
      resume.repartition_paiements.mobile_money_pct =
        (resume.total_encaissements.mobile_money / totalEncaissements) * 100;
      resume.repartition_paiements.banque_pct =
        (resume.total_encaissements.banque / totalEncaissements) * 100;
    }

    // Trésorerie moyenne journalière
    resume.tresorerie_moyenne_journaliere =
      nombreJours > 0
        ? (resume.tresorerie_debut.total + resume.tresorerie_fin.total) /
          (2 * nombreJours)
        : 0;

    // Délai moyen de caisse (nombre de jours de couverture)
    const decaissementsParJour =
      nombreJours > 0 ? totalDecaissements / nombreJours : 0;
    resume.delai_moyen_caisse =
      decaissementsParJour > 0
        ? resume.tresorerie_moyenne_journaliere / decaissementsParJour
        : 0;

    return resume;
  }

  /**
   * Calcule le résumé annuel à partir des semaines
   */
  static calculerAnnuel(semaines) {
    const resume = this.initVide();

    if (semaines.length === 0) return resume;

    // Trésorerie début = trésorerie début de la première semaine
    resume.tresorerie_debut = { ...semaines[0].resume.tresorerie_debut };

    // Trésorerie fin = trésorerie fin de la dernière semaine
    const derniereSemaine = semaines[semaines.length - 1];
    resume.tresorerie_fin = { ...derniereSemaine.resume.tresorerie_fin };

    // Agrégation des semaines
    semaines.forEach((semaine) => {
      const r = semaine.resume;

      // Encaissements et décaissements
      resume.total_encaissements.caisse += r.total_encaissements.caisse;
      resume.total_encaissements.mobile_money +=
        r.total_encaissements.mobile_money;
      resume.total_encaissements.banque += r.total_encaissements.banque;
      resume.total_encaissements.total += r.total_encaissements.total;

      resume.total_decaissements.caisse += r.total_decaissements.caisse;
      resume.total_decaissements.mobile_money +=
        r.total_decaissements.mobile_money;
      resume.total_decaissements.banque += r.total_decaissements.banque;
      resume.total_decaissements.total += r.total_decaissements.total;

      // Chiffre d'affaires et charges
      resume.chiffre_affaires += r.chiffre_affaires;
      resume.charges_fixes += r.charges_fixes;
      resume.charges_variables += r.charges_variables;

      // Produits et charges par compte
      Object.entries(r.produits_par_compte).forEach(([compte, montant]) => {
        resume.produits_par_compte[compte] =
          (resume.produits_par_compte[compte] || 0) + montant;
      });

      Object.entries(r.charges_par_compte).forEach(([compte, montant]) => {
        resume.charges_par_compte[compte] =
          (resume.charges_par_compte[compte] || 0) + montant;
      });

      resume.nombre_transactions_total += r.nombre_transactions;
    });

    // Indicateurs annuels
    resume.balance_nette =
      resume.total_encaissements.total - resume.total_decaissements.total;
    resume.excedent_insuffisance =
      resume.tresorerie_fin.total - resume.tresorerie_debut.total;

    const totalCharges = resume.charges_fixes + resume.charges_variables;
    resume.capacite_autofinancement = resume.chiffre_affaires - totalCharges;

    // Répartition paiements
    if (resume.total_encaissements.total > 0) {
      resume.repartition_paiements.especes_pct =
        (resume.total_encaissements.caisse / resume.total_encaissements.total) *
        100;
      resume.repartition_paiements.mobile_money_pct =
        (resume.total_encaissements.mobile_money /
          resume.total_encaissements.total) *
        100;
      resume.repartition_paiements.banque_pct =
        (resume.total_encaissements.banque / resume.total_encaissements.total) *
        100;
    }

    // Trésorerie moyenne (moyenne de toutes les semaines)
    const sommeTreeMoyennes = semaines.reduce(
      (sum, s) => sum + s.resume.tresorerie_moyenne_journaliere,
      0
    );
    resume.tresorerie_moyenne_journaliere =
      semaines.length > 0 ? sommeTreeMoyennes / semaines.length : 0;

    return resume;
  }

  /**
   * Calcule le résumé mensuel à partir des semaines du mois
   */
  static calculerMensuel(semaines, annee, mois) {
    const nomsMois = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];

    const resumeAgrege = this.calculerAnnuel(semaines);

    return {
      mois,
      annee,
      nom_mois: nomsMois[mois - 1],
      resume: resumeAgrege,
    };
  }
}
