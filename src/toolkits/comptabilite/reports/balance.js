// ==========================================
// 📄 toolkits/comptabilite/reports/balance.js
// ==========================================

import { GrandLivreService } from "./grandLivre";

export class BalanceService {
  /**
   * Calcule la balance des comptes sur une période
   */
  static async calculer(dateDebut, dateFin) {
    const grandLivre = await GrandLivreService.generer(dateDebut, dateFin);

    // Transformer le grand livre en balance
    const comptes = grandLivre.comptes.map((compte) => ({
      code_lsd: compte.code_lsd,
      denomination: compte.denomination,
      code_ohada: compte.code_ohada,
      type: compte.type,
      debit: compte.solde_debiteur,
      credit: compte.solde_crediteur,
      solde: compte.solde_net,
      nombre_mouvements: compte.transactions.length,
    }));

    const totaux = {
      total_debit: comptes.reduce((sum, c) => sum + c.debit, 0),
      total_credit: comptes.reduce((sum, c) => sum + c.credit, 0),
      solde_net: 0,
    };
    totaux.solde_net = totaux.total_credit - totaux.total_debit;

    // Vérifier l'équilibre (tolérance de 0.01 pour les arrondis)
    const equilibre = Math.abs(totaux.total_debit - totaux.total_credit) < 0.01;

    return {
      dateDebut,
      dateFin,
      comptes,
      totaux,
      equilibre,
      ecart: equilibre ? 0 : totaux.total_credit - totaux.total_debit,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Calcule la balance par classe OHADA
   */
  static async calculerParClasse(dateDebut, dateFin) {
    const balance = await this.calculer(dateDebut, dateFin);

    const classes = {};

    balance.comptes.forEach((compte) => {
      const classe = compte.code_ohada.charAt(0);

      if (!classes[classe]) {
        classes[classe] = {
          classe,
          denomination: this.getDenominationClasse(classe),
          comptes: [],
          totaux: {
            debit: 0,
            credit: 0,
            solde: 0,
          },
        };
      }

      classes[classe].comptes.push(compte);
      classes[classe].totaux.debit += compte.debit;
      classes[classe].totaux.credit += compte.credit;
      classes[classe].totaux.solde += compte.solde;
    });

    return {
      dateDebut,
      dateFin,
      classes: Object.values(classes),
      totaux: balance.totaux,
      equilibre: balance.equilibre,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Obtient la dénomination d'une classe OHADA
   */
  static getDenominationClasse(classe) {
    const denominations = {
      1: "Comptes de ressources durables",
      2: "Comptes d'actif immobilisé",
      3: "Comptes de stocks",
      4: "Comptes de tiers",
      5: "Comptes de trésorerie",
      6: "Comptes de charges",
      7: "Comptes de produits",
      8: "Comptes des autres charges et produits",
    };
    return denominations[classe] || `Classe ${classe}`;
  }

  /**
   * Calcule la balance âgée (analyse de l'ancienneté)
   */
  static async calculerBalanceAgee(dateReference) {
    const date = new Date(dateReference);
    const periodes = [
      {
        label: "0-30 jours",
        debut: new Date(date),
        fin: new Date(date.getFullYear(), date.getMonth(), date.getDate() - 30),
      },
      {
        label: "31-60 jours",
        debut: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - 30
        ),
        fin: new Date(date.getFullYear(), date.getMonth(), date.getDate() - 60),
      },
      {
        label: "61-90 jours",
        debut: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - 60
        ),
        fin: new Date(date.getFullYear(), date.getMonth(), date.getDate() - 90),
      },
      {
        label: "90+ jours",
        debut: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - 90
        ),
        fin: new Date(1970, 0, 1),
      },
    ];

    const balancesParPeriode = [];

    for (const periode of periodes) {
      const balance = await this.calculer(
        periode.fin.toISOString().split("T")[0],
        periode.debut.toISOString().split("T")[0]
      );

      balancesParPeriode.push({
        ...periode,
        ...balance,
      });
    }

    return {
      dateReference,
      periodes: balancesParPeriode,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Exporte la balance au format CSV
   */
  static async exporterCSV(dateDebut, dateFin) {
    const balance = await this.calculer(dateDebut, dateFin);

    let csv =
      "Code LSD;Dénomination;Code OHADA;Type;Débit;Crédit;Solde;Nb Mouvements\n";

    balance.comptes.forEach((c) => {
      csv += `${c.code_lsd};${c.denomination};${c.code_ohada};${c.type};`;
      csv += `${c.debit};${c.credit};${c.solde};${c.nombre_mouvements}\n`;
    });

    csv += `\nTOTAUX;;;`;
    csv += `${balance.totaux.total_debit};${balance.totaux.total_credit};${balance.totaux.solde_net}\n`;
    csv += `\nÉquilibre: ${balance.equilibre ? "OUI" : "NON"}\n`;

    return csv;
  }
}
