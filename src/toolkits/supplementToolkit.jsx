// toolkits/supplementToolkit.js - Version corrigée
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { supplementSchema } from "@/toolkits/schema";

// ===========================================
// CONSTANTES
// ===========================================
const SUPPLEMENTS_KEY = "lsd_supplements";
const COLLECTION = "supplements";
const DOCUMENT = "liste";

// ===========================================
// FONCTIONS CRUD
// ===========================================

/**
 * Récupère tous les suppléments
 */
export const getAllSupplements = async () => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: true, data: [], count: 0 };
    }

    const supplements = docSnap.data().supplements || [];

    // Mettre en cache
    localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(supplements));

    return { success: true, data: supplements, count: supplements.length };
  } catch (error) {
    console.error("❌ Erreur getAllSupplements:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Vérifie si un supplément existe déjà (par dénomination ET groupe)
 */
const supplementExists = (supplements, denomination, groupe) => {
  return supplements.some(
    (s) =>
      s.denomination.toLowerCase().trim() ===
        denomination.toLowerCase().trim() &&
      s.groupe.toLowerCase().trim() === groupe.toLowerCase().trim()
  );
};

/**
 * Crée un nouveau supplément avec vérification des doublons
 */
export const createSupplement = async (supplementData) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let supplements = [];
    if (docSnap.exists()) {
      supplements = docSnap.data().supplements || [];
    }

    // Vérifier les doublons
    if (
      supplementExists(
        supplements,
        supplementData.denomination,
        supplementData.groupe
      )
    ) {
      toast.error(
        `${supplementData.denomination} existe déjà dans ${supplementData.groupe}`
      );
      return {
        success: false,
        error: "Doublon détecté",
        isDuplicate: true,
      };
    }

    // Créer le supplément avec validation
    const nouveauSupplement = {
      id: nanoid(10),
      denomination: supplementData.denomination,
      groupe: supplementData.groupe,
      description: supplementData.description || "",
      prix: supplementData.prix || 0,
      imgURL: supplementData.imgURL || supplementData.img || "",
      createdAt: Timestamp.now(),
      actif: true,
    };

    // Valider avec le schema
    const validation = supplementSchema(nouveauSupplement);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Ajouter à la liste
    supplements.push(nouveauSupplement);

    // Sauvegarder
    await setDoc(docRef, { supplements, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(supplements));

    toast.success(`${supplementData.denomination} créé avec succès`);
    return { success: true, data: nouveauSupplement };
  } catch (error) {
    console.error("❌ Erreur createSupplement:", error);
    toast.error("Erreur lors de la création");
    return { success: false, error: error.message };
  }
};

/**
 * Crée plusieurs suppléments en batch
 */
export const createSupplementsBatch = async (supplementsArray) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let supplements = [];
    if (docSnap.exists()) {
      supplements = docSnap.data().supplements || [];
    }

    const nouveaux = [];
    const doublons = [];
    const erreurs = [];

    for (const supplementData of supplementsArray) {
      // Vérifier les doublons
      if (
        supplementExists(
          supplements,
          supplementData.denomination,
          supplementData.groupe
        )
      ) {
        doublons.push(
          `${supplementData.denomination} (${supplementData.groupe})`
        );
        continue;
      }

      // Traiter le prix (peut être "gratuit")
      let prix = supplementData.prix;
      if (typeof prix === "string" && prix.toLowerCase() === "gratuit") {
        prix = "gratuit";
      } else if (typeof prix === "string") {
        prix = parseFloat(prix) || 0;
      }

      // Créer le supplément
      const nouveauSupplement = {
        id: nanoid(10),
        denomination: supplementData.denomination,
        groupe: supplementData.groupe,
        description: supplementData.description || "",
        prix: prix,
        imgURL: supplementData.imgURL || supplementData.img || "",
        createdAt: Timestamp.now(),
        actif: true,
      };

      // Valider
      const validation = supplementSchema(nouveauSupplement);
      if (!validation.success) {
        erreurs.push({
          supplement: supplementData.denomination,
          errors: validation.errors,
        });
        continue;
      }

      nouveaux.push(nouveauSupplement);
    }

    if (nouveaux.length > 0) {
      // Ajouter tous les nouveaux suppléments
      supplements = [...supplements, ...nouveaux];

      // Sauvegarder
      await setDoc(docRef, { supplements, updated_at: Timestamp.now() });

      // Mettre à jour le cache
      localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(supplements));
    }

    // Notifications
    if (nouveaux.length > 0) {
      toast.success(`${nouveaux.length} suppléments créés avec succès`);
    }
    if (doublons.length > 0) {
      toast.warning(`${doublons.length} doublons ignorés`);
    }
    if (erreurs.length > 0) {
      toast.error(`${erreurs.length} erreurs de validation`);
    }

    return {
      success: nouveaux.length > 0,
      created: nouveaux.length,
      duplicates: doublons,
      errors: erreurs,
      data: nouveaux,
    };
  } catch (error) {
    console.error("❌ Erreur createSupplementsBatch:", error);
    toast.error("Erreur lors de la création en batch");
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour un supplément existant
 */
export const updateSupplement = async (supplementId, updatedData) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let supplements = docSnap.data().supplements || [];
    const index = supplements.findIndex((s) => s.id === supplementId);

    if (index === -1) {
      return { success: false, error: "Supplément introuvable" };
    }

    // Vérifier doublon si dénomination ou groupe changé
    if (
      (updatedData.denomination &&
        updatedData.denomination !== supplements[index].denomination) ||
      (updatedData.groupe && updatedData.groupe !== supplements[index].groupe)
    ) {
      const newDenom =
        updatedData.denomination || supplements[index].denomination;
      const newGroupe = updatedData.groupe || supplements[index].groupe;

      if (supplementExists(supplements, newDenom, newGroupe)) {
        toast.error("Un supplément avec cette combinaison existe déjà");
        return {
          success: false,
          error: "Doublon détecté",
          isDuplicate: true,
        };
      }
    }

    // Mettre à jour
    supplements[index] = {
      ...supplements[index],
      ...updatedData,
      id: supplementId, // Préserver l'ID
      createdAt: supplements[index].createdAt, // Préserver la date de création
    };

    // Valider
    const validation = supplementSchema(supplements[index]);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Sauvegarder
    await setDoc(docRef, { supplements, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(supplements));

    toast.success("Supplément mis à jour");
    return { success: true, data: supplements[index] };
  } catch (error) {
    console.error("❌ Erreur updateSupplement:", error);
    toast.error("Erreur lors de la mise à jour");
    return { success: false, error: error.message };
  }
};

/**
 * Désactive un supplément (soft delete)
 */
export const desactiverSupplement = async (supplementId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let supplements = docSnap.data().supplements || [];
    const index = supplements.findIndex((s) => s.id === supplementId);

    if (index === -1) {
      return { success: false, error: "Supplément introuvable" };
    }

    // Désactiver
    supplements[index].actif = false;

    // Sauvegarder
    await setDoc(docRef, { supplements, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(supplements));

    toast.success("Supplément désactivé");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur desactiverSupplement:", error);
    toast.error("Erreur lors de la désactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Réactive un supplément
 */
export const reactiverSupplement = async (supplementId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let supplements = docSnap.data().supplements || [];
    const index = supplements.findIndex((s) => s.id === supplementId);

    if (index === -1) {
      return { success: false, error: "Supplément introuvable" };
    }

    // Réactiver
    supplements[index].actif = true;

    // Sauvegarder
    await setDoc(docRef, { supplements, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(supplements));

    toast.success("Supplément réactivé");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur reactiverSupplement:", error);
    toast.error("Erreur lors de la réactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Supprime définitivement un supplément
 */
export const deleteSupplement = async (supplementId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let supplements = docSnap.data().supplements || [];
    supplements = supplements.filter((s) => s.id !== supplementId);

    // Sauvegarder
    await setDoc(docRef, { supplements, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(supplements));

    toast.success("Supplément supprimé définitivement");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur deleteSupplement:", error);
    toast.error("Erreur lors de la suppression");
    return { success: false, error: error.message };
  }
};

/**
 * Récupère un supplément par son ID
 */
export const getSupplementById = async (supplementId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable", data: null };
    }

    const supplements = docSnap.data().supplements || [];
    const supplement = supplements.find((s) => s.id === supplementId);

    if (!supplement) {
      return { success: false, error: "Supplément introuvable", data: null };
    }

    return { success: true, data: supplement };
  } catch (error) {
    console.error("❌ Erreur getSupplementById:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Calcule le prix total d'une liste de suppléments
 */
export const calculateSupplementsTotal = (supplementIds, supplements) => {
  if (!supplementIds || !supplements || supplementIds.length === 0) {
    return 0;
  }

  return supplementIds.reduce((total, id) => {
    const supplement = supplements.find((s) => s.id === id);
    const prix = supplement?.prix;

    // Si le prix est "gratuit", ne pas l'ajouter au total
    if (typeof prix === "string" && prix.toLowerCase() === "gratuit") {
      return total;
    }

    return total + (typeof prix === "number" ? prix : 0);
  }, 0);
};

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook pour récupérer tous les suppléments avec synchronisation temps réel
 */
export const useSupplements = () => {
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const loadSupplements = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger depuis le cache
        const cached = localStorage.getItem(SUPPLEMENTS_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.length > 0) {
            setSupplements(parsedCache);
          }
        }

        // Synchronisation temps réel
        const docRef = doc(db, COLLECTION, DOCUMENT);

        unsubscribeRef.current = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data().supplements || [];
              setSupplements(data);
              setLoading(false);

              // Mettre à jour le cache
              localStorage.setItem(SUPPLEMENTS_KEY, JSON.stringify(data));
            } else {
              setSupplements([]);
              setLoading(false);
            }
          },
          (error) => {
            console.error("❌ Erreur snapshot suppléments:", error);
            setError(error.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("❌ Erreur loadSupplements:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadSupplements();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Fonctions utilitaires
  const supplementsActifs = supplements.filter((s) => s.actif !== false);
  const supplementsInactifs = supplements.filter((s) => s.actif === false);

  // Grouper par catégorie
  const supplementsByGroupe = supplementsActifs.reduce((acc, supplement) => {
    const groupe = supplement.groupe || "Non classé";
    if (!acc[groupe]) {
      acc[groupe] = [];
    }
    acc[groupe].push(supplement);
    return acc;
  }, {});

  // Fonction pour obtenir un supplément par ID
  const getSupplementById = (id) => {
    return supplements.find((s) => s.id === id);
  };

  // Fonction pour calculer le prix total d'une liste de suppléments
  const calculateTotal = (supplementIds) => {
    return calculateSupplementsTotal(supplementIds, supplements);
  };

  return {
    supplements,
    supplementsActifs,
    supplementsInactifs,
    supplementsByGroupe,
    loading,
    error,
    totalCount: supplements.length,
    activeCount: supplementsActifs.length,
    inactiveCount: supplementsInactifs.length,
    getSupplementById,
    calculateTotal,
  };
};

// ===========================================
// EXPORTS
// ===========================================

export default {
  // CRUD
  getAllSupplements,
  createSupplement,
  createSupplementsBatch, // Nouveau: création en batch
  updateSupplement,
  desactiverSupplement,
  reactiverSupplement,
  deleteSupplement,

  // Fonctions utilitaires
  getSupplementById,
  calculateSupplementsTotal,

  // Hook
  useSupplements,
};
