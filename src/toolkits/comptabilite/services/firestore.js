// ==========================================
// 🔧 FICHIER 1 : services/firestore.js
// Version Finale Compatible
// ==========================================

import { db } from "@/firebase";
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { COMPTA_CONFIG } from "../constants";
import { ResumeModel } from "../models/resume";

export class FirestoreService {
  /**
   * Récupère ou crée un document année
   */
  static async getOrCreateYearDocument(year) {
    const docRef = doc(db, COMPTA_CONFIG.COLLECTION, year.toString());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      const newDoc = {
        year,
        resume: ResumeModel.initVide(),
        cloture: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await setDoc(docRef, newDoc);
      return newDoc;
    }
  }

  /**
   * Récupère un document semaine
   */
  static async getWeekDocument(year, weekId) {
    const weekRef = doc(
      db,
      COMPTA_CONFIG.COLLECTION,
      year.toString(),
      "weeks",
      weekId
    );
    const weekSnap = await getDoc(weekRef);

    if (weekSnap.exists()) {
      return { id: weekSnap.id, ...weekSnap.data() };
    }
    return null;
  }

  /**
   * Crée un document semaine
   */
  static async setWeekDocument(year, weekId, data) {
    const weekRef = doc(
      db,
      COMPTA_CONFIG.COLLECTION,
      year.toString(),
      "weeks",
      weekId
    );
    await setDoc(weekRef, data);
    return data;
  }

  /**
   * ✅ Met à jour un document semaine (avec setDoc + merge)
   * UTILISÉ POUR : mises à jour simples hors transaction
   */
  static async updateWeekDocument(year, weekId, data) {
    const weekRef = doc(
      db,
      COMPTA_CONFIG.COLLECTION,
      year.toString(),
      "weeks",
      weekId
    );

    await setDoc(
      weekRef,
      {
        ...data,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  /**
   * ✅ Met à jour un document année (avec setDoc + merge)
   */
  static async updateYearDocument(year, data) {
    const yearRef = doc(db, COMPTA_CONFIG.COLLECTION, year.toString());

    await setDoc(
      yearRef,
      {
        ...data,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  /**
   * Récupère un document annexe
   */
  static async getAnnexeDocument(year, weekId) {
    const annexeRef = doc(
      db,
      COMPTA_CONFIG.COLLECTION,
      year.toString(),
      "weeks",
      `${weekId}-annexe`
    );
    const annexeSnap = await getDoc(annexeRef);

    if (annexeSnap.exists()) {
      return annexeSnap.data();
    }
    return null;
  }

  /**
   * Crée un document annexe
   */
  static async setAnnexeDocument(year, weekId, data) {
    const annexeRef = doc(
      db,
      COMPTA_CONFIG.COLLECTION,
      year.toString(),
      "weeks",
      `${weekId}-annexe`
    );
    await setDoc(annexeRef, data);
  }

  /**
   * ✅ Met à jour un document annexe (avec setDoc + merge)
   */
  static async updateAnnexeDocument(year, weekId, data) {
    const annexeRef = doc(
      db,
      COMPTA_CONFIG.COLLECTION,
      year.toString(),
      "weeks",
      `${weekId}-annexe`
    );

    await setDoc(
      annexeRef,
      {
        ...data,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  /**
   * ✅ Mise à jour batch des semaines
   */
  static async batchUpdateWeeks(year, updates) {
    const batch = writeBatch(db);

    for (const { weekId, data } of updates) {
      const weekRef = doc(
        db,
        COMPTA_CONFIG.COLLECTION,
        year.toString(),
        "weeks",
        weekId
      );
      batch.set(weekRef, data, { merge: true });
    }

    await batch.commit();
  }
}
