// ==========================================
// 📄 toolkits/comptabilite/reports/grandLivre.js
// ==========================================

import { TransactionService } from "../services/transactions";
import { SemaineModel } from "../models/semaine";
import { validators } from "../utils/validators";

export class GrandLivreService {
  /**
   * Génère le grand livre sur une période
   */
  static async generer(dateDebut, dateFin) {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    // Récupérer toutes les transactions de la période
    const transactions = await TransactionService.getTransactionsByPeriod(
      dateDebut,
      dateFin
    );

    // Grouper par compte
    const parCompte = {};

    transactions.forEach((transaction) => {
      const code = transaction.compte_lsd;

      if (!parCompte[code]) {
        parCompte[code] = {
          code_lsd: code,
          denomination: transaction.compte_denomination,
          code_ohada: transaction.compte_ohada,
          type: transaction.compte_type,
          transactions: [],
          solde_debiteur: 0,
          solde_crediteur: 0,
          solde_net: 0,
        };
      }

      parCompte[code].transactions.push(transaction);

      // Calculer les soldes (débit/crédit OHADA)
      if (transaction.type === "entree") {
        parCompte[code].solde_crediteur += transaction.montant;
      } else {
        parCompte[code].solde_debiteur += transaction.montant;
      }
    });

    // Calculer le solde net pour chaque compte
    Object.values(parCompte).forEach((compte) => {
      compte.solde_net = compte.solde_crediteur - compte.solde_debiteur;

      // Trier les transactions par date
      compte.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    // Trier les comptes par code OHADA
    const comptes = Object.values(parCompte).sort((a, b) =>
      a.code_ohada.localeCompare(b.code_ohada)
    );

    // Calculer les totaux généraux
    const totaux = {
      total_debiteur: comptes.reduce((sum, c) => sum + c.solde_debiteur, 0),
      total_crediteur: comptes.reduce((sum, c) => sum + c.solde_crediteur, 0),
      solde_general: 0,
    };
    totaux.solde_general = totaux.total_crediteur - totaux.total_debiteur;

    return {
      dateDebut,
      dateFin,
      comptes,
      totaux,
      nombreComptes: comptes.length,
      nombreTransactions: transactions.length,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Génère le grand livre pour un compte spécifique
   */
  static async genererParCompte(codeLsd, dateDebut, dateFin) {
    const grandLivre = await this.generer(dateDebut, dateFin);
    const compte = grandLivre.comptes.find((c) => c.code_lsd === codeLsd);

    if (!compte) {
      throw new Error(`Compte ${codeLsd} non trouvé dans la période`);
    }

    return {
      ...compte,
      dateDebut,
      dateFin,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Génère le grand livre par classe de comptes OHADA
   */
  static async genererParClasse(classe, dateDebut, dateFin) {
    const grandLivre = await this.generer(dateDebut, dateFin);

    const comptes = grandLivre.comptes.filter((c) =>
      c.code_ohada.startsWith(classe.toString())
    );

    const totaux = {
      total_debiteur: comptes.reduce((sum, c) => sum + c.solde_debiteur, 0),
      total_crediteur: comptes.reduce((sum, c) => sum + c.solde_crediteur, 0),
      solde_net: 0,
    };
    totaux.solde_net = totaux.total_crediteur - totaux.total_debiteur;

    return {
      classe,
      dateDebut,
      dateFin,
      comptes,
      totaux,
      nombreComptes: comptes.length,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Exporte le grand livre au format CSV
   */
  static async exporterCSV(dateDebut, dateFin) {
    const grandLivre = await this.generer(dateDebut, dateFin);

    let csv =
      "Code LSD;Dénomination;Code OHADA;Date;Type;Montant;Mode Paiement;Description;Référence\n";

    grandLivre.comptes.forEach((compte) => {
      compte.transactions.forEach((t) => {
        csv += `${compte.code_lsd};${compte.denomination};${compte.code_ohada};`;
        csv += `${t.date};${t.type};${t.montant};${t.mode_paiement};`;
        csv += `${t.description || ""};${t.reference || ""}\n`;
      });
    });

    return csv;
  }
}
