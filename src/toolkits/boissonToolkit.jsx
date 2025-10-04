// // toolkits/boissonToolkit.js
// import { useState, useEffect, useRef } from "react";
// import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
// import { db } from "@/firebase";
// import { toast } from "sonner";
// import { nanoid } from "nanoid";
// import { boissonSchema } from "@/toolkits/schema";

// // ===========================================
// // CONSTANTES
// // ===========================================
// const BOISSONS_KEY = "lsd_boissons";
// const COLLECTION = "boissons";
// const DOCUMENT = "liste";

// // ===========================================
// // FONCTIONS CRUD
// // ===========================================

// /**
//  * Récupère toutes les boissons
//  */
// export const getAllBoissons = async () => {
//   try {
//     const docRef = doc(db, COLLECTION, DOCUMENT);
//     const docSnap = await getDoc(docRef);

//     if (!docSnap.exists()) {
//       return { success: true, data: [], count: 0 };
//     }

//     const boissons = docSnap.data().boissons || [];

//     // Mettre en cache
//     localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

//     return { success: true, data: boissons, count: boissons.length };
//   } catch (error) {
//     console.error("❌ Erreur getAllBoissons:", error);
//     return { success: false, error: error.message, data: [] };
//   }
// };

// /**
//  * Vérifie si une boisson existe déjà (par dénomination)
//  */
// const boissonExists = (boissons, denomination) => {
//   return boissons.some(
//     (b) =>
//       b.denomination.toLowerCase().trim() === denomination.toLowerCase().trim()
//   );
// };

// /**
//  * Crée une nouvelle boisson avec vérification des doublons
//  */
// export const createBoisson = async (boissonData) => {
//   try {
//     const docRef = doc(db, COLLECTION, DOCUMENT);
//     const docSnap = await getDoc(docRef);

//     let boissons = [];
//     if (docSnap.exists()) {
//       boissons = docSnap.data().boissons || [];
//     }

//     // Vérifier les doublons
//     if (boissonExists(boissons, boissonData.denomination)) {
//       toast.error("Une boisson avec cette dénomination existe déjà");
//       return {
//         success: false,
//         error: "Doublon détecté",
//         isDuplicate: true,
//       };
//     }

//     // Créer la boisson avec validation
//     const nouvelleBoisson = {
//       id: nanoid(10),
//       denomination: boissonData.denomination,
//       prix: boissonData.prix || 0,
//       volume: boissonData.volume || 0,
//       img: boissonData.img || "",
//       ingredient: boissonData.ingredient || [],
//       createdAt: Timestamp.now(),
//       actif: true,
//     };

//     // Valider avec le schema
//     const validation = boissonSchema(nouvelleBoisson);
//     if (!validation.success) {
//       toast.error("Données invalides");
//       return {
//         success: false,
//         error: "Validation échouée",
//         errors: validation.errors,
//       };
//     }

//     // Ajouter à la liste
//     boissons.push(nouvelleBoisson);

//     // Sauvegarder
//     await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

//     // Mettre à jour le cache
//     localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

//     toast.success("Boisson créée avec succès");
//     return { success: true, data: nouvelleBoisson };
//   } catch (error) {
//     console.error("❌ Erreur createBoisson:", error);
//     toast.error("Erreur lors de la création");
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Met à jour une boisson existante
//  */
// export const updateBoisson = async (boissonId, updatedData) => {
//   try {
//     const docRef = doc(db, COLLECTION, DOCUMENT);
//     const docSnap = await getDoc(docRef);

//     if (!docSnap.exists()) {
//       return { success: false, error: "Document introuvable" };
//     }

//     let boissons = docSnap.data().boissons || [];
//     const index = boissons.findIndex((b) => b.id === boissonId);

//     if (index === -1) {
//       return { success: false, error: "Boisson introuvable" };
//     }

//     // Vérifier doublon si dénomination changée
//     if (
//       updatedData.denomination &&
//       updatedData.denomination !== boissons[index].denomination
//     ) {
//       if (boissonExists(boissons, updatedData.denomination)) {
//         toast.error("Une boisson avec cette dénomination existe déjà");
//         return {
//           success: false,
//           error: "Doublon détecté",
//           isDuplicate: true,
//         };
//       }
//     }

//     // Mettre à jour
//     boissons[index] = {
//       ...boissons[index],
//       ...updatedData,
//       id: boissonId, // Préserver l'ID
//       createdAt: boissons[index].createdAt, // Préserver la date de création
//     };

//     // Valider
//     const validation = boissonSchema(boissons[index]);
//     if (!validation.success) {
//       toast.error("Données invalides");
//       return {
//         success: false,
//         error: "Validation échouée",
//         errors: validation.errors,
//       };
//     }

//     // Sauvegarder
//     await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

//     // Mettre à jour le cache
//     localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

//     toast.success("Boisson mise à jour");
//     return { success: true, data: boissons[index] };
//   } catch (error) {
//     console.error("❌ Erreur updateBoisson:", error);
//     toast.error("Erreur lors de la mise à jour");
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Désactive une boisson (soft delete)
//  */
// export const desactiverBoisson = async (boissonId) => {
//   try {
//     const docRef = doc(db, COLLECTION, DOCUMENT);
//     const docSnap = await getDoc(docRef);

//     if (!docSnap.exists()) {
//       return { success: false, error: "Document introuvable" };
//     }

//     let boissons = docSnap.data().boissons || [];
//     const index = boissons.findIndex((b) => b.id === boissonId);

//     if (index === -1) {
//       return { success: false, error: "Boisson introuvable" };
//     }

//     // Désactiver
//     boissons[index].actif = false;

//     // Sauvegarder
//     await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

//     // Mettre à jour le cache
//     localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

//     toast.success("Boisson désactivée");
//     return { success: true };
//   } catch (error) {
//     console.error("❌ Erreur desactiverBoisson:", error);
//     toast.error("Erreur lors de la désactivation");
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Réactive une boisson
//  */
// export const reactiverBoisson = async (boissonId) => {
//   try {
//     const docRef = doc(db, COLLECTION, DOCUMENT);
//     const docSnap = await getDoc(docRef);

//     if (!docSnap.exists()) {
//       return { success: false, error: "Document introuvable" };
//     }

//     let boissons = docSnap.data().boissons || [];
//     const index = boissons.findIndex((b) => b.id === boissonId);

//     if (index === -1) {
//       return { success: false, error: "Boisson introuvable" };
//     }

//     // Réactiver
//     boissons[index].actif = true;

//     // Sauvegarder
//     await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

//     // Mettre à jour le cache
//     localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

//     toast.success("Boisson réactivée");
//     return { success: true };
//   } catch (error) {
//     console.error("❌ Erreur reactiverBoisson:", error);
//     toast.error("Erreur lors de la réactivation");
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Supprime définitivement une boisson
//  */
// export const deleteBoisson = async (boissonId) => {
//   try {
//     const docRef = doc(db, COLLECTION, DOCUMENT);
//     const docSnap = await getDoc(docRef);

//     if (!docSnap.exists()) {
//       return { success: false, error: "Document introuvable" };
//     }

//     let boissons = docSnap.data().boissons || [];
//     boissons = boissons.filter((b) => b.id !== boissonId);

//     // Sauvegarder
//     await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

//     // Mettre à jour le cache
//     localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

//     toast.success("Boisson supprimée définitivement");
//     return { success: true };
//   } catch (error) {
//     console.error("❌ Erreur deleteBoisson:", error);
//     toast.error("Erreur lors de la suppression");
//     return { success: false, error: error.message };
//   }
// };

// // ===========================================
// // HOOKS
// // ===========================================

// /**
//  * Hook pour récupérer toutes les boissons avec synchronisation temps réel
//  */
// export const useBoissons = () => {
//   const [boissons, setBoissons] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const unsubscribeRef = useRef(null);

//   useEffect(() => {
//     const loadBoissons = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         // Charger depuis le cache
//         const cached = localStorage.getItem(BOISSONS_KEY);
//         if (cached) {
//           const parsedCache = JSON.parse(cached);
//           if (parsedCache.length > 0) {
//             setBoissons(parsedCache);
//           }
//         }

//         // Synchronisation temps réel
//         const docRef = doc(db, COLLECTION, DOCUMENT);

//         unsubscribeRef.current = onSnapshot(
//           docRef,
//           (snapshot) => {
//             if (snapshot.exists()) {
//               const data = snapshot.data().boissons || [];
//               setBoissons(data);
//               setLoading(false);

//               // Mettre à jour le cache
//               localStorage.setItem(BOISSONS_KEY, JSON.stringify(data));
//             } else {
//               setBoissons([]);
//               setLoading(false);
//             }
//           },
//           (error) => {
//             console.error("❌ Erreur snapshot boissons:", error);
//             setError(error.message);
//             setLoading(false);
//           }
//         );
//       } catch (err) {
//         console.error("❌ Erreur loadBoissons:", err);
//         setError(err.message);
//         setLoading(false);
//       }
//     };

//     loadBoissons();

//     // Cleanup
//     return () => {
//       if (unsubscribeRef.current) {
//         unsubscribeRef.current();
//       }
//     };
//   }, []);

//   // Fonctions utilitaires
//   const boissonsActives = boissons.filter((b) => b.actif !== false);
//   const boissonsInactives = boissons.filter((b) => b.actif === false);

//   return {
//     boissons,
//     boissonsActives,
//     boissonsInactives,
//     loading,
//     error,
//     totalCount: boissons.length,
//     activeCount: boissonsActives.length,
//     inactiveCount: boissonsInactives.length,
//   };
// };

// // ===========================================
// // EXPORTS
// // ===========================================

// export default {
//   // CRUD
//   getAllBoissons,
//   createBoisson,
//   updateBoisson,
//   desactiverBoisson,
//   reactiverBoisson,
//   deleteBoisson,

//   // Hook
//   useBoissons,
// };
// toolkits/boissonToolkit.js - Version adaptée
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { boissonSchema } from "@/toolkits/schema";

// ===========================================
// CONSTANTES
// ===========================================
const BOISSONS_KEY = "lsd_boissons";
const COLLECTION = "boissons";
const DOCUMENT = "liste";

// ===========================================
// FONCTIONS CRUD
// ===========================================

/**
 * Récupère toutes les boissons
 */
export const getAllBoissons = async () => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: true, data: [], count: 0 };
    }

    const boissons = docSnap.data().boissons || [];

    // Mettre en cache
    localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

    return { success: true, data: boissons, count: boissons.length };
  } catch (error) {
    console.error("❌ Erreur getAllBoissons:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Vérifie si une boisson existe déjà (par dénomination ET récipient)
 */
const boissonExists = (boissons, denomination, recipient) => {
  return boissons.some(
    (b) =>
      b.denomination.toLowerCase().trim() ===
        denomination.toLowerCase().trim() &&
      b.recipient.toLowerCase().trim() === recipient.toLowerCase().trim()
  );
};

/**
 * Crée une nouvelle boisson avec vérification des doublons
 */
export const createBoisson = async (boissonData) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let boissons = [];
    if (docSnap.exists()) {
      boissons = docSnap.data().boissons || [];
    }

    // Vérifier les doublons (dénomination + récipient)
    if (
      boissonExists(boissons, boissonData.denomination, boissonData.recipient)
    ) {
      toast.error(
        `${boissonData.denomination} (${boissonData.recipient}) existe déjà`
      );
      return {
        success: false,
        error: "Doublon détecté",
        isDuplicate: true,
      };
    }

    // Créer la boisson avec validation
    const nouvelleBoisson = {
      id: nanoid(10),
      denomination: boissonData.denomination,
      groupe: boissonData.groupe,
      recipient: boissonData.recipient,
      prix: boissonData.prix || 0,
      volume: boissonData.volume || 0,
      unite: boissonData.unite || { nom: "mililitres", symbole: "ml" },
      imgURL: boissonData.imgURL || boissonData.img || "",
      ingredients: boissonData.ingredients || boissonData.ingredient || [],
      calories: boissonData.calories || 0,
      createdAt: Timestamp.now(),
      actif: true,
    };

    // Valider avec le schema
    const validation = boissonSchema(nouvelleBoisson);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Ajouter à la liste
    boissons.push(nouvelleBoisson);

    // Sauvegarder
    await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

    toast.success(`${boissonData.denomination} créée avec succès`);
    return { success: true, data: nouvelleBoisson };
  } catch (error) {
    console.error("❌ Erreur createBoisson:", error);
    toast.error("Erreur lors de la création");
    return { success: false, error: error.message };
  }
};

/**
 * Crée plusieurs boissons en batch
 */
export const createBoissonsBatch = async (boissonsArray) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let boissons = [];
    if (docSnap.exists()) {
      boissons = docSnap.data().boissons || [];
    }

    const nouvelles = [];
    const doublons = [];
    const erreurs = [];

    for (const boissonData of boissonsArray) {
      // Vérifier les doublons
      if (
        boissonExists(boissons, boissonData.denomination, boissonData.recipient)
      ) {
        doublons.push(`${boissonData.denomination} (${boissonData.recipient})`);
        continue;
      }

      // Créer la boisson
      const nouvelleBoisson = {
        id: nanoid(10),
        denomination: boissonData.denomination,
        groupe: boissonData.groupe,
        recipient: boissonData.recipient,
        prix: boissonData.prix || 0,
        volume: boissonData.volume || 0,
        unite: boissonData.unite || { nom: "mililitres", symbole: "ml" },
        imgURL: boissonData.imgURL || boissonData.img || "",
        ingredients: boissonData.ingredients || boissonData.ingredient || [],
        calories: boissonData.calories || 0,
        createdAt: Timestamp.now(),
        actif: true,
      };

      // Valider
      const validation = boissonSchema(nouvelleBoisson);
      if (!validation.success) {
        erreurs.push({
          boisson: boissonData.denomination,
          errors: validation.errors,
        });
        continue;
      }

      nouvelles.push(nouvelleBoisson);
    }

    if (nouvelles.length > 0) {
      // Ajouter toutes les nouvelles boissons
      boissons = [...boissons, ...nouvelles];

      // Sauvegarder
      await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

      // Mettre à jour le cache
      localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));
    }

    // Notifications
    if (nouvelles.length > 0) {
      toast.success(`${nouvelles.length} boissons créées avec succès`);
    }
    if (doublons.length > 0) {
      toast.warning(`${doublons.length} doublons ignorés`);
    }
    if (erreurs.length > 0) {
      toast.error(`${erreurs.length} erreurs de validation`);
    }
    return {
      success: nouvelles.length > 0,
      created: nouvelles.length,
      duplicates: doublons,
      errors: erreurs,
      data: nouvelles,
    };
  } catch (error) {
    console.error("❌ Erreur createBoissonsBatch:", error);
    toast.error("Erreur lors de la création en batch");
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour une boisson existante
 */
export const updateBoisson = async (boissonId, updatedData) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let boissons = docSnap.data().boissons || [];
    const index = boissons.findIndex((b) => b.id === boissonId);

    if (index === -1) {
      return { success: false, error: "Boisson introuvable" };
    }

    // Vérifier doublon si dénomination ou récipient changé
    if (
      (updatedData.denomination &&
        updatedData.denomination !== boissons[index].denomination) ||
      (updatedData.recipient &&
        updatedData.recipient !== boissons[index].recipient)
    ) {
      const newDenom = updatedData.denomination || boissons[index].denomination;
      const newRecipient = updatedData.recipient || boissons[index].recipient;

      if (boissonExists(boissons, newDenom, newRecipient)) {
        toast.error("Une boisson avec cette combinaison existe déjà");
        return {
          success: false,
          error: "Doublon détecté",
          isDuplicate: true,
        };
      }
    }

    // Mettre à jour
    boissons[index] = {
      ...boissons[index],
      ...updatedData,
      id: boissonId, // Préserver l'ID
      createdAt: boissons[index].createdAt, // Préserver la date de création
    };

    // Valider
    const validation = boissonSchema(boissons[index]);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Sauvegarder
    await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

    toast.success("Boisson mise à jour");
    return { success: true, data: boissons[index] };
  } catch (error) {
    console.error("❌ Erreur updateBoisson:", error);
    toast.error("Erreur lors de la mise à jour");
    return { success: false, error: error.message };
  }
};

/**
 * Désactive une boisson (soft delete)
 */
export const desactiverBoisson = async (boissonId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let boissons = docSnap.data().boissons || [];
    const index = boissons.findIndex((b) => b.id === boissonId);

    if (index === -1) {
      return { success: false, error: "Boisson introuvable" };
    }

    // Désactiver
    boissons[index].actif = false;

    // Sauvegarder
    await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

    toast.success("Boisson désactivée");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur desactiverBoisson:", error);
    toast.error("Erreur lors de la désactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Réactive une boisson
 */
export const reactiverBoisson = async (boissonId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let boissons = docSnap.data().boissons || [];
    const index = boissons.findIndex((b) => b.id === boissonId);

    if (index === -1) {
      return { success: false, error: "Boisson introuvable" };
    }

    // Réactiver
    boissons[index].actif = true;

    // Sauvegarder
    await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

    toast.success("Boisson réactivée");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur reactiverBoisson:", error);
    toast.error("Erreur lors de la réactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Supprime définitivement une boisson
 */
export const deleteBoisson = async (boissonId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let boissons = docSnap.data().boissons || [];
    boissons = boissons.filter((b) => b.id !== boissonId);

    // Sauvegarder
    await setDoc(docRef, { boissons, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(BOISSONS_KEY, JSON.stringify(boissons));

    toast.success("Boisson supprimée définitivement");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur deleteBoisson:", error);
    toast.error("Erreur lors de la suppression");
    return { success: false, error: error.message };
  }
};

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook pour récupérer toutes les boissons avec synchronisation temps réel
 */
export const useBoissons = () => {
  const [boissons, setBoissons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const loadBoissons = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger depuis le cache
        const cached = localStorage.getItem(BOISSONS_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.length > 0) {
            setBoissons(parsedCache);
          }
        }

        // Synchronisation temps réel
        const docRef = doc(db, COLLECTION, DOCUMENT);

        unsubscribeRef.current = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data().boissons || [];
              setBoissons(data);
              setLoading(false);

              // Mettre à jour le cache
              localStorage.setItem(BOISSONS_KEY, JSON.stringify(data));
            } else {
              setBoissons([]);
              setLoading(false);
            }
          },
          (error) => {
            console.error("❌ Erreur snapshot boissons:", error);
            setError(error.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("❌ Erreur loadBoissons:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadBoissons();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Fonctions utilitaires
  const boissonsActives = boissons.filter((b) => b.actif !== false);
  const boissonsInactives = boissons.filter((b) => b.actif === false);

  // Grouper par catégorie
  const boissonsByGroupe = boissonsActives.reduce((acc, boisson) => {
    const groupe = boisson.groupe || "Non classé";
    if (!acc[groupe]) {
      acc[groupe] = [];
    }
    acc[groupe].push(boisson);
    return acc;
  }, {});

  return {
    boissons,
    boissonsActives,
    boissonsInactives,
    boissonsByGroupe,
    loading,
    error,
    totalCount: boissons.length,
    activeCount: boissonsActives.length,
    inactiveCount: boissonsInactives.length,
  };
};

// ===========================================
// EXPORTS
// ===========================================

export default {
  // CRUD
  getAllBoissons,
  createBoisson,
  createBoissonsBatch, // Nouveau: création en batch
  updateBoisson,
  desactiverBoisson,
  reactiverBoisson,
  deleteBoisson,

  // Hook
  useBoissons,
};
