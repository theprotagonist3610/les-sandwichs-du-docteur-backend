// toolkits/menuToolkit.js - Version adaptée
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { menuSchema } from "@/toolkits/schema";

// ===========================================
// CONSTANTES
// ===========================================
const MENUS_KEY = "lsd_menus";
const COLLECTION = "menus";
const DOCUMENT = "liste";

// ===========================================
// FONCTIONS CRUD
// ===========================================

/**
 * Récupère tous les menus
 */
export const getAllMenus = async () => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: true, data: [], count: 0 };
    }

    const menus = docSnap.data().menus || [];

    // Mettre en cache
    localStorage.setItem(MENUS_KEY, JSON.stringify(menus));

    return { success: true, data: menus, count: menus.length };
  } catch (error) {
    console.error("❌ Erreur getAllMenus:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Vérifie si un menu existe déjà (par dénomination ET récipient)
 */
const menuExists = (menus, denomination, recipient) => {
  return menus.some(
    (m) =>
      m.denomination.toLowerCase().trim() ===
        denomination.toLowerCase().trim() &&
      m.recipient.toLowerCase().trim() === recipient.toLowerCase().trim()
  );
};

/**
 * Crée un nouveau menu avec vérification des doublons
 */
export const createMenu = async (menuData) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let menus = [];
    if (docSnap.exists()) {
      menus = docSnap.data().menus || [];
    }

    // Vérifier les doublons
    if (menuExists(menus, menuData.denomination, menuData.recipient)) {
      toast.error(
        `${menuData.denomination} (${menuData.recipient}) existe déjà`
      );
      return {
        success: false,
        error: "Doublon détecté",
        isDuplicate: true,
      };
    }

    // Créer le menu avec validation
    const nouveauMenu = {
      id: nanoid(10),
      denomination: menuData.denomination,
      groupe: menuData.groupe,
      recipient: menuData.recipient,
      description: menuData.description || "",
      prix: menuData.prix || 0,
      imgURL: menuData.imgURL || menuData.img || "",
      ingredients: menuData.ingredients || menuData.ingredient || [],
      calories: menuData.calories || 0,
      createdAt: Timestamp.now(),
      actif: true,
    };

    // Valider avec le schema
    const validation = menuSchema(nouveauMenu);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Ajouter à la liste
    menus.push(nouveauMenu);

    // Sauvegarder
    await setDoc(docRef, { menus, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MENUS_KEY, JSON.stringify(menus));

    toast.success(`${menuData.denomination} créé avec succès`);
    return { success: true, data: nouveauMenu };
  } catch (error) {
    console.error("❌ Erreur createMenu:", error);
    toast.error("Erreur lors de la création");
    return { success: false, error: error.message };
  }
};

/**
 * Crée plusieurs menus en batch
 */
export const createMenusBatch = async (menusArray) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let menus = [];
    if (docSnap.exists()) {
      menus = docSnap.data().menus || [];
    }

    const nouveaux = [];
    const doublons = [];
    const erreurs = [];

    for (const menuData of menusArray) {
      // Vérifier les doublons
      if (menuExists(menus, menuData.denomination, menuData.recipient)) {
        doublons.push(`${menuData.denomination} (${menuData.recipient})`);
        continue;
      }

      // Créer le menu
      const nouveauMenu = {
        id: nanoid(10),
        denomination: menuData.denomination,
        groupe: menuData.groupe,
        recipient: menuData.recipient,
        description: menuData.description || "",
        prix: menuData.prix || 0,
        imgURL: menuData.imgURL || menuData.img || "",
        ingredients: menuData.ingredients || menuData.ingredient || [],
        calories: menuData.calories || 0,
        createdAt: Timestamp.now(),
        actif: true,
      };

      // Valider
      const validation = menuSchema(nouveauMenu);
      if (!validation.success) {
        erreurs.push({
          menu: menuData.denomination,
          errors: validation.errors,
        });
        continue;
      }

      nouveaux.push(nouveauMenu);
    }

    if (nouveaux.length > 0) {
      // Ajouter tous les nouveaux menus
      menus = [...menus, ...nouveaux];

      // Sauvegarder
      await setDoc(docRef, { menus, updated_at: Timestamp.now() });

      // Mettre à jour le cache
      localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
    }

    // Notifications
    if (nouveaux.length > 0) {
      toast.success(`${nouveaux.length} menus créés avec succès`);
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
    console.error("❌ Erreur createMenusBatch:", error);
    toast.error("Erreur lors de la création en batch");
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour un menu existant
 */
export const updateMenu = async (menuId, updatedData) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let menus = docSnap.data().menus || [];
    const index = menus.findIndex((m) => m.id === menuId);

    if (index === -1) {
      return { success: false, error: "Menu introuvable" };
    }

    // Vérifier doublon si dénomination ou récipient changé
    if (
      (updatedData.denomination &&
        updatedData.denomination !== menus[index].denomination) ||
      (updatedData.recipient &&
        updatedData.recipient !== menus[index].recipient)
    ) {
      const newDenom = updatedData.denomination || menus[index].denomination;
      const newRecipient = updatedData.recipient || menus[index].recipient;

      if (menuExists(menus, newDenom, newRecipient)) {
        toast.error("Un menu avec cette combinaison existe déjà");
        return {
          success: false,
          error: "Doublon détecté",
          isDuplicate: true,
        };
      }
    }

    // Mettre à jour
    menus[index] = {
      ...menus[index],
      ...updatedData,
      id: menuId, // Préserver l'ID
      createdAt: menus[index].createdAt, // Préserver la date de création
    };

    // Valider
    const validation = menuSchema(menus[index]);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Sauvegarder
    await setDoc(docRef, { menus, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MENUS_KEY, JSON.stringify(menus));

    toast.success("Menu mis à jour");
    return { success: true, data: menus[index] };
  } catch (error) {
    console.error("❌ Erreur updateMenu:", error);
    toast.error("Erreur lors de la mise à jour");
    return { success: false, error: error.message };
  }
};

/**
 * Désactive un menu (soft delete)
 */
export const desactiverMenu = async (menuId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let menus = docSnap.data().menus || [];
    const index = menus.findIndex((m) => m.id === menuId);

    if (index === -1) {
      return { success: false, error: "Menu introuvable" };
    }

    // Désactiver
    menus[index].actif = false;

    // Sauvegarder
    await setDoc(docRef, { menus, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MENUS_KEY, JSON.stringify(menus));

    toast.success("Menu désactivé");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur desactiverMenu:", error);
    toast.error("Erreur lors de la désactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Réactive un menu
 */
export const reactiverMenu = async (menuId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let menus = docSnap.data().menus || [];
    const index = menus.findIndex((m) => m.id === menuId);

    if (index === -1) {
      return { success: false, error: "Menu introuvable" };
    }

    // Réactiver
    menus[index].actif = true;

    // Sauvegarder
    await setDoc(docRef, { menus, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MENUS_KEY, JSON.stringify(menus));

    toast.success("Menu réactivé");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur reactiverMenu:", error);
    toast.error("Erreur lors de la réactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Supprime définitivement un menu
 */
export const deleteMenu = async (menuId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let menus = docSnap.data().menus || [];
    menus = menus.filter((m) => m.id !== menuId);

    // Sauvegarder
    await setDoc(docRef, { menus, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MENUS_KEY, JSON.stringify(menus));

    toast.success("Menu supprimé définitivement");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur deleteMenu:", error);
    toast.error("Erreur lors de la suppression");
    return { success: false, error: error.message };
  }
};

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook pour récupérer tous les menus avec synchronisation temps réel
 */
export const useMenus = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger depuis le cache
        const cached = localStorage.getItem(MENUS_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.length > 0) {
            setMenus(parsedCache);
          }
        }

        // Synchronisation temps réel
        const docRef = doc(db, COLLECTION, DOCUMENT);

        unsubscribeRef.current = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data().menus || [];
              setMenus(data);
              setLoading(false);

              // Mettre à jour le cache
              localStorage.setItem(MENUS_KEY, JSON.stringify(data));
            } else {
              setMenus([]);
              setLoading(false);
            }
          },
          (error) => {
            console.error("❌ Erreur snapshot menus:", error);
            setError(error.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("❌ Erreur loadMenus:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadMenus();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Fonctions utilitaires
  const menusActifs = menus.filter((m) => m.actif !== false);
  const menusInactifs = menus.filter((m) => m.actif === false);

  // Grouper par catégorie
  const menusByGroupe = menusActifs.reduce((acc, menu) => {
    const groupe = menu.groupe || "Non classé";
    if (!acc[groupe]) {
      acc[groupe] = [];
    }
    acc[groupe].push(menu);
    return acc;
  }, {});

  return {
    menus,
    menusActifs,
    menusInactifs,
    menusByGroupe,
    loading,
    error,
    totalCount: menus.length,
    activeCount: menusActifs.length,
    inactiveCount: menusInactifs.length,
  };
};

// ===========================================
// EXPORTS
// ===========================================

export default {
  // CRUD
  getAllMenus,
  createMenu,
  createMenusBatch, // Nouveau: création en batch
  updateMenu,
  desactiverMenu,
  reactiverMenu,
  deleteMenu,

  // Hook
  useMenus,
};
