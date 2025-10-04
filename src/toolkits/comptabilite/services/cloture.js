// ==========================================
// 📄 toolkits/comptabilite/services/cloture.js
// ==========================================

import { FirestoreService } from "./firestore";
import { LocalStorageService } from "./localStorage";
import { SemaineModel } from "../models/semaine";
import { AnneeModel } from "../models/annee";
import { dateUtils } from "../utils/dates";
import { COMPTA_CONFIG } from "../constants";

export class ClotureService {
  /**
   * Clôture manuelle d'une semaine
   */
  static async cloturerSemaine(year, weekId) {
    await FirestoreService.updateWeekDocument(year, weekId, {
      cloture: true,
    });

    // Mettre à jour localStorage
    const yearData = await AnneeModel.loadComplete(year);
    LocalStorageService.save(yearData);

    return true;
  }

  /**
   * Déclôture une semaine (fonction admin)
   */
  static async decloturerSemaine(year, weekId) {
    await FirestoreService.updateWeekDocument(year, weekId, {
      cloture: false,
    });

    // Mettre à jour localStorage
    const yearData = await AnneeModel.loadComplete(year);
    LocalStorageService.save(yearData);

    return true;
  }

  /**
   * Clôture une année complète
   */
  static async cloturerAnnee(year) {
    await FirestoreService.updateYearDocument(year, {
      cloture: true,
    });

    // Clôturer toutes les semaines
    const semaines = SemaineModel.genererSemainesAnnee(year);
    const updates = semaines.map((semaine) => ({
      weekId: semaine.weekId,
      data: { cloture: true },
    }));

    await FirestoreService.batchUpdateWeeks(year, updates);

    // Mettre à jour localStorage
    const yearData = await AnneeModel.loadComplete(year);
    LocalStorageService.save(yearData);

    return true;
  }

  /**
   * Vérifie si une semaine doit être clôturée automatiquement
   */
  static async checkAutoClotureWeek(year, weekId) {
    const weekData = await FirestoreService.getWeekDocument(year, weekId);
    if (!weekData || weekData.cloture) return false;

    const shouldClose = SemaineModel.shouldAutoClose(
      weekData.dateFin,
      COMPTA_CONFIG.CLOTURE_DELAY_DAYS
    );

    if (shouldClose) {
      await this.cloturerSemaine(year, weekId);
      return true;
    }

    return false;
  }

  /**
   * Vérifie toutes les semaines d'une année pour clôture automatique
   */
  static async checkAutoClotureYear(year) {
    const semaines = SemaineModel.genererSemainesAnnee(year);
    const clotured = [];

    for (const semaine of semaines) {
      const wasClosed = await this.checkAutoClotureWeek(year, semaine.weekId);
      if (wasClosed) {
        clotured.push(semaine.weekId);
      }
    }

    return clotured;
  }

  /**
   * Obtient le statut de clôture d'une semaine
   */
  static async getStatutCloture(year, weekId) {
    const weekData = await FirestoreService.getWeekDocument(year, weekId);
    if (!weekData) {
      return {
        existe: false,
        cloture: false,
        peut_cloturer: false,
        raison: "Semaine non trouvée",
      };
    }

    if (weekData.cloture) {
      return {
        existe: true,
        cloture: true,
        peut_cloturer: false,
        raison: "Semaine déjà clôturée",
      };
    }

    // Vérifier si la semaine est terminée
    const dateFin = new Date(weekData.dateFin);
    const maintenant = new Date();
    const estTerminee = dateFin < maintenant;

    return {
      existe: true,
      cloture: false,
      peut_cloturer: estTerminee,
      raison: estTerminee
        ? "Semaine terminée, peut être clôturée"
        : "Semaine en cours, ne peut pas être clôturée",
      jours_avant_auto_cloture: estTerminee
        ? Math.max(
            0,
            COMPTA_CONFIG.CLOTURE_DELAY_DAYS -
              dateUtils.getDaysBetween(
                weekData.dateFin,
                dateUtils.getCurrentDate()
              )
          )
        : null,
    };
  }

  /**
   * Obtient toutes les semaines non clôturées d'une année
   */
  static async getSemainesNonCloturees(year) {
    const semaines = SemaineModel.genererSemainesAnnee(year);
    const nonCloturees = [];

    for (const semaine of semaines) {
      const weekData = await FirestoreService.getWeekDocument(
        year,
        semaine.weekId
      );
      if (weekData && !weekData.cloture) {
        nonCloturees.push({
          ...semaine,
          ...weekData,
        });
      }
    }

    return nonCloturees;
  }

  /**
   * Obtient toutes les semaines clôturées d'une année
   */
  static async getSemainesCloturees(year) {
    const semaines = SemaineModel.genererSemainesAnnee(year);
    const cloturees = [];

    for (const semaine of semaines) {
      const weekData = await FirestoreService.getWeekDocument(
        year,
        semaine.weekId
      );
      if (weekData && weekData.cloture) {
        cloturees.push({
          ...semaine,
          ...weekData,
        });
      }
    }

    return cloturees;
  }
}
