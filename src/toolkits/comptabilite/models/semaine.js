// ==========================================
// 📄 toolkits/comptabilite/models/semaine.js
// ==========================================

import { dateUtils } from "../utils/dates";
import { calculs } from "../utils/calculs";

export class SemaineModel {
  /**
   * Génère toutes les semaines d'une année (lundi à dimanche)
   */
  static genererSemainesAnnee(annee) {
    const semaines = [];
    let currentDate = new Date(annee, 0, 1);

    // Ajuster au premier lundi de l'année
    const premierJour = currentDate.getDay();
    if (premierJour !== 1) {
      const joursAAvancer = premierJour === 0 ? 1 : 8 - premierJour;
      currentDate.setDate(currentDate.getDate() + joursAAvancer);
    }

    let weekNumber = 1;

    // Créer une semaine partielle si le 1er janvier n'est pas un lundi
    if (currentDate.getDate() > 1) {
      const dateDebut = new Date(annee, 0, 1);
      const dateFin = new Date(currentDate);
      dateFin.setDate(dateFin.getDate() - 1);

      semaines.push(this.creerSemaine(dateDebut, dateFin, annee, weekNumber));
      weekNumber++;
    }

    // Générer les semaines complètes
    while (currentDate.getFullYear() === annee) {
      const dateDebut = new Date(currentDate);
      const dateFin = new Date(currentDate);
      dateFin.setDate(dateFin.getDate() + 6);

      if (dateFin.getFullYear() > annee) {
        dateFin.setFullYear(annee, 11, 31);
      }

      semaines.push(this.creerSemaine(dateDebut, dateFin, annee, weekNumber));

      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;

      if (currentDate.getFullYear() > annee) break;
    }

    return semaines;
  }

  /**
   * Crée un objet semaine avec toutes ses propriétés
   */
  static creerSemaine(dateDebut, dateFin, annee, numeroSemaine) {
    const nombreJours =
      Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24)) + 1;
    const weekId = `S${numeroSemaine.toString().padStart(2, "0")}`;

    return {
      weekId,
      label: `S${numeroSemaine} [${dateUtils.formatDate(
        dateDebut
      )} - ${dateUtils.formatDate(dateFin)}]`,
      dateDebut: dateUtils.formatISO(dateDebut),
      dateFin: dateUtils.formatISO(dateFin),
      annee,
      numeroSemaine,
      nombreJours,
    };
  }

  /**
   * Trouve la semaine correspondant à une date donnée
   */
  static getWeekFromDate(date, annee) {
    const semaines = this.genererSemainesAnnee(annee);
    const targetDate = new Date(date);

    return semaines.find((semaine) => {
      const debut = new Date(semaine.dateDebut);
      const fin = new Date(semaine.dateFin);
      return targetDate >= debut && targetDate <= fin;
    });
  }

  /**
   * Récupère toutes les semaines d'un mois spécifique
   */
  static getWeeksInMonth(annee, mois) {
    const semaines = this.genererSemainesAnnee(annee);
    return semaines.filter((semaine) => {
      const debut = new Date(semaine.dateDebut);
      const fin = new Date(semaine.dateFin);
      return debut.getMonth() + 1 === mois || fin.getMonth() + 1 === mois;
    });
  }

  /**
   * Obtient la semaine précédente
   */
  static getPreviousWeek(annee, weekId) {
    const semaines = this.genererSemainesAnnee(annee);
    const index = semaines.findIndex((s) => s.weekId === weekId);

    if (index > 0) {
      return semaines[index - 1];
    }

    // Retourner la dernière semaine de l'année précédente
    const prevYearWeeks = this.genererSemainesAnnee(annee - 1);
    return prevYearWeeks[prevYearWeeks.length - 1];
  }

  /**
   * Obtient la semaine suivante
   */
  static getNextWeek(annee, weekId) {
    const semaines = this.genererSemainesAnnee(annee);
    const index = semaines.findIndex((s) => s.weekId === weekId);

    if (index < semaines.length - 1) {
      return semaines[index + 1];
    }

    // Retourner la première semaine de l'année suivante
    const nextYearWeeks = this.genererSemainesAnnee(annee + 1);
    return nextYearWeeks[0];
  }

  /**
   * Vérifie si une semaine est clôturée automatiquement
   */
  static shouldAutoClose(dateFin, delayDays) {
    const dateFinSemaine = new Date(dateFin);
    const now = new Date();
    const diffJours = (now - dateFinSemaine) / (1000 * 60 * 60 * 24);

    return diffJours >= delayDays;
  }
}
