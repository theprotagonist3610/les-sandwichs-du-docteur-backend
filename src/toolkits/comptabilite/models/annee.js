// ==========================================
// 📄 toolkits/comptabilite/models/annee.js
// ==========================================

import { FirestoreService } from "../services/firestore";
import { LocalStorageService } from "../services/localStorage";
import { SemaineModel } from "./semaine";
import { ResumeModel } from "./resume";
import { COMPTA_CONFIG } from "../constants";

export class AnneeModel {
  /**
   * Charge une année complète (résumé + toutes les semaines)
   */
  static async loadComplete(year) {
    // Essayer localStorage d'abord
    const localData = LocalStorageService.load(year);
    if (localData && localData.weeks) {
      return localData;
    }

    // Sinon, charger depuis Firestore
    const yearDoc = await FirestoreService.getOrCreateYearDocument(year);
    const semaines = SemaineModel.genererSemainesAnnee(year);
    const weeks = {};

    for (const semaineInfo of semaines) {
      const weekData = await FirestoreService.getWeekDocument(
        year,
        semaineInfo.weekId
      );
      if (weekData) {
        // Charger les transactions avec annexes
        weekData.transactions = await this.getWeekTransactions(
          year,
          semaineInfo.weekId
        );
        weeks[semaineInfo.weekId] = weekData;
      }
    }

    const completeData = {
      ...yearDoc,
      weeks,
      lastSync: new Date().toISOString(),
    };

    LocalStorageService.save(completeData);
    return completeData;
  }

  /**
   * Charge les semaines par paquets (lazy loading)
   */
  static async loadWeeksBatch(
    year,
    startWeekIndex,
    batchSize = COMPTA_CONFIG.WEEK_BATCH_SIZE
  ) {
    const semaines = SemaineModel.genererSemainesAnnee(year);
    const batch = semaines.slice(startWeekIndex, startWeekIndex + batchSize);
    const weeks = {};

    for (const semaineInfo of batch) {
      const weekData = await FirestoreService.getWeekDocument(
        year,
        semaineInfo.weekId
      );
      if (weekData) {
        weekData.transactions = await this.getWeekTransactions(
          year,
          semaineInfo.weekId
        );
        weeks[semaineInfo.weekId] = weekData;
      }
    }

    return weeks;
  }

  /**
   * Récupère les transactions d'une semaine (incluant annexes)
   */
  static async getWeekTransactions(year, weekId) {
    const mainWeek = await FirestoreService.getWeekDocument(year, weekId);
    if (!mainWeek) return [];

    let transactions = [...mainWeek.transactions];

    // Vérifier s'il y a une annexe
    if (mainWeek.hasAnnexe) {
      const annexeData = await FirestoreService.getAnnexeDocument(year, weekId);
      if (annexeData) {
        transactions.push(...annexeData.transactions);
      }
    }

    return transactions;
  }

  /**
   * Calcule la trésorerie de début d'une semaine
   */
  static async calculerTresorerieDebut(year, weekId) {
    const tresorerie = { caisse: 0, mobile_money: 0, banque: 0, total: 0 };

    // Récupérer toutes les semaines précédentes
    const semaines = SemaineModel.genererSemainesAnnee(year);
    const index = semaines.findIndex((s) => s.weekId === weekId);

    if (index === 0) {
      // Première semaine de l'année, vérifier l'année précédente
      const yearPrec = year - 1;
      try {
        const yearPrecDoc = await FirestoreService.getOrCreateYearDocument(
          yearPrec
        );
        return { ...yearPrecDoc.resume.tresorerie_fin };
      } catch (error) {
        console.log("Pas d'année précédente, trésorerie initiale à 0");
        return tresorerie;
      }
    }

    // Prendre la trésorerie de fin de la semaine précédente
    const weekPrecedente = semaines[index - 1];
    const weekData = await FirestoreService.getWeekDocument(
      year,
      weekPrecedente.weekId
    );

    if (weekData && weekData.resume) {
      return { ...weekData.resume.tresorerie_fin };
    }

    return tresorerie;
  }

  /**
   * Crée ou récupère un document semaine complet
   */
  static async getOrCreateWeek(year, weekId) {
    const weekData = await FirestoreService.getWeekDocument(year, weekId);

    if (weekData) {
      return weekData;
    }

    // Générer les infos de la semaine
    const semaines = SemaineModel.genererSemainesAnnee(year);
    const semaineInfo = semaines.find((s) => s.weekId === weekId);

    if (!semaineInfo) {
      throw new Error(`Semaine ${weekId} non trouvée pour l'année ${year}`);
    }

    // Calculer la trésorerie de début
    const tresorerieDebut = await this.calculerTresorerieDebut(year, weekId);

    const newWeek = {
      ...semaineInfo,
      transactions: [],
      resume: ResumeModel.calculerHebdomadaire(
        [],
        tresorerieDebut,
        semaineInfo.nombreJours
      ),
      cloture: false,
      hasAnnexe: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await FirestoreService.setWeekDocument(year, weekId, newWeek);
    return newWeek;
  }

  /**
   * Met à jour le résumé d'une semaine
   */
  static async updateWeekResume(year, weekId) {
    const transactions = await this.getWeekTransactions(year, weekId);
    const weekData = await FirestoreService.getWeekDocument(year, weekId);

    if (!weekData) {
      throw new Error(`Semaine ${weekId} non trouvée`);
    }

    const tresorerieDebut = weekData.resume.tresorerie_debut;
    const resume = ResumeModel.calculerHebdomadaire(
      transactions,
      tresorerieDebut,
      weekData.nombreJours
    );

    await FirestoreService.updateWeekDocument(year, weekId, { resume });

    return resume;
  }

  /**
   * Met à jour le résumé annuel
   */
  static async updateYearResume(year) {
    const semaines = SemaineModel.genererSemainesAnnee(year);
    const weeksData = [];

    // Charger toutes les semaines
    for (const semaine of semaines) {
      const weekData = await FirestoreService.getWeekDocument(
        year,
        semaine.weekId
      );
      if (weekData) {
        weeksData.push(weekData);
      }
    }

    const resume = ResumeModel.calculerAnnuel(weeksData);

    // Calculer la trésorerie mensuelle
    const tresorerieMensuelle = {};
    for (let mois = 1; mois <= 12; mois++) {
      const weeksInMonth = SemaineModel.getWeeksInMonth(year, mois);
      const monthWeeksData = weeksData.filter((w) =>
        weeksInMonth.some((wim) => wim.weekId === w.weekId)
      );

      if (monthWeeksData.length > 0) {
        tresorerieMensuelle[mois] = ResumeModel.calculerMensuel(
          monthWeeksData,
          year,
          mois
        );
      }
    }

    resume.tresorerie_mensuelle = tresorerieMensuelle;

    await FirestoreService.updateYearDocument(year, { resume });

    return resume;
  }
}
