import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  arrayUnion,
  increment,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { emplacementSchema } from "@/toolkits/schema";
import { toast } from "sonner";
import { nanoid } from "nanoid";

// ===========================================
// CONSTANTES & SCHEMAS
// ===========================================
const EMPL_KEY = "lsd_emplacement";
const ALL_EMPL_KEY = "lsd_all_emplacements";
const LAST_MONTH_CHECK_KEY = "lsd_last_month_check";

// Récupération des schemas
const {
  coordonnees_schema,
  periode_schema,
  position_schema,
  vendeuse_schema,
  itemStock_schema,
  stockActuel_schema,
  historiqueStock_schema,
  schema: emplacementFullSchema,
} = emplacementSchema();

// ===========================================
// FONCTIONS UTILITAIRES
// ===========================================

/**
 * Récupère un emplacement depuis le localStorage ou Firestore
 */
const getEmplacement = async (empl_id) => {
  try {
    // D'abord vérifier dans localStorage
    const cached = localStorage.getItem(EMPL_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed[empl_id]) {
        console.log("📦 Emplacement trouvé dans le cache:", empl_id);
        return { success: true, data: parsed[empl_id] };
      }
    }

    // Sinon récupérer depuis Firestore
    const docRef = doc(db, "emplacements", empl_id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Emplacement introuvable" };
    }

    const data = { id: docSnap.id, ...docSnap.data() };

    // Valider avec le schéma
    const validation = emplacementSchema(data);
    if (!validation.success) {
      return {
        success: false,
        error: "Données invalides",
        errors: validation.errors,
      };
    }

    // Mettre en cache
    const newCache = { ...(cached ? JSON.parse(cached) : {}), [empl_id]: data };
    localStorage.setItem(EMPL_KEY, JSON.stringify(newCache));

    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur getEmplacement:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour la vendeuse d'un emplacement
 */
const setVendeuseInEmplacement = async (empl_id, vendeuseData) => {
  try {
    const docRef = doc(db, "emplacements", empl_id);

    // Préparer la nouvelle vendeuse avec période
    const nouvelleVendeuse = {
      ...vendeuseData,
      periode: {
        debut: Timestamp.now(),
        fin: null, // Sera défini quand elle partira
      },
    };

    // Récupérer l'emplacement actuel
    const emplResult = await getEmplacement(empl_id);
    if (!emplResult.success) throw new Error(emplResult.error);

    const currentEmpl = emplResult.data;

    // Mettre à jour l'ancienne vendeuse si elle existe
    let historiqueUpdate = [...(currentEmpl.historique_des_vendeuses || [])];
    if (currentEmpl.vendeuse_actuelle) {
      historiqueUpdate.push({
        ...currentEmpl.vendeuse_actuelle,
        periode: {
          ...currentEmpl.vendeuse_actuelle.periode,
          fin: Timestamp.now(),
        },
      });
    }

    // Mise à jour Firestore
    await updateDoc(docRef, {
      vendeuse_actuelle: nouvelleVendeuse,
      historique_des_vendeuses: historiqueUpdate,
      updated_at: serverTimestamp(),
    });

    // Mise à jour localStorage
    const cached = localStorage.getItem(EMPL_KEY);
    const parsedCache = cached ? JSON.parse(cached) : {};
    parsedCache[empl_id] = {
      ...currentEmpl,
      vendeuse_actuelle: nouvelleVendeuse,
      historique_des_vendeuses: historiqueUpdate,
    };
    localStorage.setItem(EMPL_KEY, JSON.stringify(parsedCache));

    toast.success("Vendeuse mise à jour avec succès");
    return { success: true, data: nouvelleVendeuse };
  } catch (error) {
    console.error("❌ Erreur setVendeuseInEmplacement:", error);
    toast.error("Erreur lors de la mise à jour de la vendeuse");
    return { success: false, error: error.message };
  }
};

/**
 * Relocalise un emplacement
 */
const relocateEmplacement = async (empl_id, nouvellePosition) => {
  try {
    const docRef = doc(db, "emplacements", empl_id);

    // Préparer la nouvelle position avec période
    const positionComplete = {
      ...nouvellePosition,
      periode: {
        debut: Timestamp.now(),
        fin: null,
      },
    };

    // Récupérer l'emplacement actuel
    const emplResult = await getEmplacement(empl_id);
    if (!emplResult.success) throw new Error(emplResult.error);

    const currentEmpl = emplResult.data;

    // Mettre à jour l'historique
    let historiqueUpdate = [...(currentEmpl.historique_des_positions || [])];
    if (currentEmpl.position_actuelle) {
      historiqueUpdate.push({
        ...currentEmpl.position_actuelle,
        periode: {
          ...currentEmpl.position_actuelle.periode,
          fin: Timestamp.now(),
        },
      });
    }

    // Mise à jour Firestore
    await updateDoc(docRef, {
      position_actuelle: positionComplete,
      historique_des_positions: historiqueUpdate,
      updated_at: serverTimestamp(),
    });

    // Mise à jour localStorage
    const cached = localStorage.getItem(EMPL_KEY);
    const parsedCache = cached ? JSON.parse(cached) : {};
    parsedCache[empl_id] = {
      ...currentEmpl,
      position_actuelle: positionComplete,
      historique_des_positions: historiqueUpdate,
    };
    localStorage.setItem(EMPL_KEY, JSON.stringify(parsedCache));

    toast.success("Emplacement relocalisé avec succès");
    return { success: true, data: positionComplete };
  } catch (error) {
    console.error("❌ Erreur relocateEmplacement:", error);
    toast.error("Erreur lors de la relocalisation");
    return { success: false, error: error.message };
  }
};

/**
 * Transfère du stock entre deux emplacements
 */
const makeTransfertBetweenEmplacement = async (
  fromID,
  toID,
  items,
  motif = "transfert"
) => {
  const batch = writeBatch(db);

  try {
    // Récupérer les deux emplacements
    const fromResult = await getEmplacement(fromID);
    const toResult = await getEmplacement(toID);

    if (!fromResult.success || !toResult.success) {
      throw new Error("Un des emplacements est introuvable");
    }

    const fromEmpl = fromResult.data;
    const toEmpl = toResult.data;

    // Créer les opérations
    const operationSortie = {
      id: nanoid(),
      items,
      operation: "sortie",
      motif,
      description: `Transfert vers ${toEmpl.denomination}`,
      date: Timestamp.now(),
    };

    const operationEntree = {
      id: nanoid(),
      items,
      operation: "entree",
      motif,
      description: `Transfert depuis ${fromEmpl.denomination}`,
      date: Timestamp.now(),
    };

    // Mettre à jour les stocks actuels
    const newFromStock = recalculateStockAfterOperation(
      fromEmpl.stock_actuel,
      items,
      "sortie"
    );
    const newToStock = recalculateStockAfterOperation(
      toEmpl.stock_actuel,
      items,
      "entree"
    );

    // Préparer les mises à jour Firestore
    batch.update(doc(db, "emplacements", fromID), {
      stock_actuel: newFromStock,
      historique_du_stock: arrayUnion(operationSortie),
      updated_at: serverTimestamp(),
    });

    batch.update(doc(db, "emplacements", toID), {
      stock_actuel: newToStock,
      historique_du_stock: arrayUnion(operationEntree),
      updated_at: serverTimestamp(),
    });

    // Exécuter le batch
    await batch.commit();

    // Mettre à jour le localStorage
    const cached = localStorage.getItem(ALL_EMPL_KEY);
    const parsedCache = cached ? JSON.parse(cached) : {};

    parsedCache[fromID] = {
      ...fromEmpl,
      stock_actuel: newFromStock,
      historique_du_stock: [...fromEmpl.historique_du_stock, operationSortie],
    };

    parsedCache[toID] = {
      ...toEmpl,
      stock_actuel: newToStock,
      historique_du_stock: [...toEmpl.historique_du_stock, operationEntree],
    };

    localStorage.setItem(ALL_EMPL_KEY, JSON.stringify(parsedCache));

    toast.success("Transfert effectué avec succès");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur makeTransfertBetweenEmplacement:", error);
    toast.error("Erreur lors du transfert");
    return { success: false, error: error.message };
  }
};

/**
 * Crée une opération de stock
 */
const createOperation = async (empl_id, operationData) => {
  try {
    // Vérifier le changement de mois
    const monthChanged = await detectMonthHasChanged();
    if (monthChanged) {
      await resetEmplacementStock(empl_id);
    }

    const docRef = doc(db, "emplacements", empl_id);

    // Récupérer l'emplacement
    const emplResult = await getEmplacement(empl_id);
    if (!emplResult.success) throw new Error(emplResult.error);

    const currentEmpl = emplResult.data;

    // Créer l'opération
    const operation = {
      id: nanoid(),
      ...operationData,
      date: Timestamp.now(),
    };

    // Recalculer le stock
    const newStock = recalculateStockAfterOperation(
      currentEmpl.stock_actuel,
      operationData.items,
      operationData.operation
    );

    // Mise à jour Firestore
    await updateDoc(docRef, {
      stock_actuel: newStock,
      historique_du_stock: arrayUnion(operation),
      updated_at: serverTimestamp(),
    });

    // Mise à jour localStorage
    const cached = localStorage.getItem(EMPL_KEY);
    const parsedCache = cached ? JSON.parse(cached) : {};
    parsedCache[empl_id] = {
      ...currentEmpl,
      stock_actuel: newStock,
      historique_du_stock: [...currentEmpl.historique_du_stock, operation],
    };
    localStorage.setItem(EMPL_KEY, JSON.stringify(parsedCache));

    toast.success("Opération enregistrée avec succès");
    return { success: true, data: operation };
  } catch (error) {
    console.error("❌ Erreur createOperation:", error);
    toast.error("Erreur lors de l'enregistrement de l'opération");
    return { success: false, error: error.message };
  }
};

/**
 * Recalcule le stock après une opération
 */
const recalculateStockAfterOperation = (stockActuel, items, typeOperation) => {
  const newStock = JSON.parse(JSON.stringify(stockActuel)); // Deep clone
  const multiplier = typeOperation === "entree" ? 1 : -1;

  items.forEach((item) => {
    // Déterminer la catégorie
    let categorie = null;
    for (const cat of ["equipements", "consommable", "perissable"]) {
      const found = newStock[cat].find((s) => s.id === item.id);
      if (found) {
        categorie = cat;
        found.quantite += item.quantite * multiplier;
        break;
      }
    }

    // Si l'item n'existe pas et c'est une entrée, l'ajouter
    if (!categorie && typeOperation === "entree") {
      // Par défaut dans consommable (à adapter selon vos besoins)
      newStock.consommable.push({
        id: item.id,
        denomination: item.denomination,
        quantite: item.quantite,
      });
    }
  });

  return newStock;
};

/**
 * Recalcule le stock actuel depuis l'historique
 */
const recalculateStockActuel = async (empl_id) => {
  try {
    const docRef = doc(db, "emplacements", empl_id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Emplacement introuvable");
    }

    const data = docSnap.data();
    const historique = data.historique_du_stock || [];

    // Initialiser le stock vide
    let stock = {
      equipements: [],
      consommable: [],
      perissable: [],
    };

    // Recalculer depuis l'historique
    historique.forEach((op) => {
      stock = recalculateStockAfterOperation(stock, op.items, op.operation);
    });

    // Mise à jour Firestore
    await updateDoc(docRef, {
      stock_actuel: stock,
      updated_at: serverTimestamp(),
    });

    // Mise à jour localStorage
    const cached = localStorage.getItem(EMPL_KEY);
    const parsedCache = cached ? JSON.parse(cached) : {};
    parsedCache[empl_id] = {
      ...data,
      id: empl_id,
      stock_actuel: stock,
    };
    localStorage.setItem(EMPL_KEY, JSON.stringify(parsedCache));

    toast.success("Stock recalculé avec succès");
    return { success: true, data: stock };
  } catch (error) {
    console.error("❌ Erreur recalculateStockActuel:", error);
    toast.error("Erreur lors du recalcul du stock");
    return { success: false, error: error.message };
  }
};

/**
 * Détecte si on a changé de mois
 */
const detectMonthHasChanged = async () => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentKey = `${currentMonth}-${currentYear}`;

  const lastCheck = localStorage.getItem(LAST_MONTH_CHECK_KEY);

  if (lastCheck !== currentKey) {
    localStorage.setItem(LAST_MONTH_CHECK_KEY, currentKey);
    return true;
  }

  return false;
};

/**
 * Archive l'historique du stock du mois précédent
 */
const resetEmplacementStock = async (empl_id) => {
  try {
    const docRef = doc(db, "emplacements", empl_id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Emplacement introuvable");
    }

    const data = docSnap.data();
    const historique = data.historique_du_stock || [];

    if (historique.length === 0) {
      return { success: true, message: "Aucun historique à archiver" };
    }

    // Calculer le mois précédent
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const archiveKey = `${String(lastMonth.getMonth() + 1).padStart(
      2,
      "0"
    )}${lastMonth.getFullYear()}`;

    // Créer le document d'archive
    const archiveRef = doc(db, "emplacements", "options", empl_id, archiveKey);
    await setDoc(archiveRef, {
      historique: historique,
      archived_at: serverTimestamp(),
      month: lastMonth.getMonth() + 1,
      year: lastMonth.getFullYear(),
    });

    // Réinitialiser l'historique
    await updateDoc(docRef, {
      historique_du_stock: [],
      updated_at: serverTimestamp(),
    });

    // Mise à jour localStorage
    const cached = localStorage.getItem(EMPL_KEY);
    const parsedCache = cached ? JSON.parse(cached) : {};
    parsedCache[empl_id] = {
      ...data,
      id: empl_id,
      historique_du_stock: [],
    };
    localStorage.setItem(EMPL_KEY, JSON.stringify(parsedCache));

    console.log(`✅ Historique archivé pour ${archiveKey}`);
    return { success: true, archiveKey };
  } catch (error) {
    console.error("❌ Erreur resetEmplacementStock:", error);
    return { success: false, error: error.message };
  }
};

// ===========================================
// FONCTIONS PRINCIPALES
// ===========================================

/**
 * Crée un nouvel emplacement
 */
async function createEmplacement(emplData) {
  try {
    const empl_id = emplData.id || `empl_${nanoid(10)}`;
    const now = Timestamp.now();

    // Données minimales avec valeurs par défaut
    const defaultData = {
      id: empl_id,
      type: emplData.type || "emplacement fixe",
      denomination: emplData.denomination,
      status: false, // Boolean par défaut
      position_actuelle: {
        nom: emplData.position?.nom || "",
        departement: emplData.position?.departement || "",
        commune: emplData.position?.commune || "",
        arrondissement: emplData.position?.arrondissement || "",
        quartier: emplData.position?.quartier || "",
        indication: emplData.position?.indication || "",
        coordonnees: emplData.position?.coordonnees || {
          longitude: 0,
          latitude: 0,
        },
        periode: { debut: now, fin: null },
      },
      historique_des_positions: [],
      vendeuse_actuelle: emplData.vendeuse || null,
      historique_des_vendeuses: [],
      stock_actuel: {
        equipements: [],
        consommable: [],
        perissable: [],
      },
      historique_du_stock: [],
      created_at: now,
      updated_at: now,
    };

    // Fusionner avec les données fournies
    const finalData = {
      ...defaultData,
      ...emplData,
      id: empl_id,
      status: false,
    };
    console.log(finalData);
    // Créer le document principal
    await setDoc(doc(db, "emplacements", empl_id), finalData);

    // Créer l'opération d'initialisation dans la sous-collection
    const initOperation = {
      id: nanoid(),
      operation: "entree",
      motif: "initialisation",
      items: [],
      quantite: 0,
      description: "Initialisation de l'emplacement",
      date: now,
    };
    console.log(initOperation);
    await setDoc(
      doc(db, "emplacements", "options", empl_id, "init"),
      initOperation
    );

    // Mettre en cache
    const cached = localStorage.getItem(ALL_EMPL_KEY);
    const parsedCache = cached ? JSON.parse(cached) : {};
    parsedCache[empl_id] = finalData;
    localStorage.setItem(ALL_EMPL_KEY, JSON.stringify(parsedCache));

    toast.success("Emplacement créé avec succès");
    return { success: true, data: finalData };
  } catch (error) {
    console.error("❌ Erreur createEmplacement:", error);
    toast.error("Erreur lors de la création de l'emplacement");
    return { success: false, error: error.message };
  }
}

/**
 * Met à jour un emplacement
 */
async function updateEmplacement(empl_id, updates) {
  try {
    // Filtrer les champs non modifiables
    const { id, created_at, ...allowedUpdates } = updates;

    const docRef = doc(db, "emplacements", empl_id);

    // Mise à jour Firestore
    await updateDoc(docRef, {
      ...allowedUpdates,
      updated_at: serverTimestamp(),
    });

    // Récupérer les données mises à jour
    const result = await getEmplacement(empl_id);

    if (result.success) {
      toast.success("Emplacement mis à jour avec succès");
      return result;
    }

    return result;
  } catch (error) {
    console.error("❌ Erreur updateEmplacement:", error);
    toast.error("Erreur lors de la mise à jour");
    return { success: false, error: error.message };
  }
}

/**
 * Désactive un emplacement (soft delete)
 */
async function deleteEmplacement(empl_id) {
  try {
    const docRef = doc(db, "emplacements", empl_id);

    // Désactiver via status
    await updateDoc(docRef, {
      status: false,
      updated_at: serverTimestamp(),
      deactivated_at: serverTimestamp(),
    });

    // Mise à jour localStorage
    const cached = localStorage.getItem(ALL_EMPL_KEY);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if (parsedCache[empl_id]) {
        parsedCache[empl_id].status = false;
        localStorage.setItem(ALL_EMPL_KEY, JSON.stringify(parsedCache));
      }
    }

    toast.success("Emplacement désactivé avec succès");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur deleteEmplacement:", error);
    toast.error("Erreur lors de la désactivation");
    return { success: false, error: error.message };
  }
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook pour récupérer un emplacement avec cache et synchronisation
 */
const useEmplacement = (empl_id) => {
  const [emplacement, setEmplacement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!empl_id) {
      setLoading(false);
      return;
    }

    const loadEmplacement = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger depuis le cache ou Firestore
        const result = await getEmplacement(empl_id);

        if (result.success) {
          setEmplacement(result.data);
        } else {
          setError(result.error);
        }

        // Établir la synchronisation temps réel
        const docRef = doc(db, "emplacements", empl_id);
        unsubscribeRef.current = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = { id: snapshot.id, ...snapshot.data() };
              setEmplacement(data);

              // Mettre à jour le cache
              const cached = localStorage.getItem(EMPL_KEY);
              const parsedCache = cached ? JSON.parse(cached) : {};
              parsedCache[empl_id] = data;
              localStorage.setItem(EMPL_KEY, JSON.stringify(parsedCache));
            }
          },
          (error) => {
            console.error("❌ Erreur snapshot:", error);
            setError(error.message);
          }
        );
      } catch (err) {
        console.error("❌ Erreur loadEmplacement:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEmplacement();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [empl_id]);

  const refresh = useCallback(async () => {
    if (!empl_id) return;

    setLoading(true);
    const result = await getEmplacement(empl_id);
    if (result.success) {
      setEmplacement(result.data);
    }
    setLoading(false);
  }, [empl_id]);

  return {
    emplacement,
    loading,
    error,
    refresh,
  };
};

/**
 * Hook pour récupérer tous les emplacements
 */
const useAllEmplacements = () => {
  const [emplacements, setEmplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const loadAllEmplacements = async () => {
      try {
        setLoading(true);
        setError(null);

        // Vérifier le cache d'abord
        const cached = localStorage.getItem(ALL_EMPL_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          const cachedArray = Object.values(parsedCache);
          if (cachedArray.length > 0) {
            setEmplacements(cachedArray);
            // Ne pas arrêter le loading ici, continuer avec Firestore
          }
        }

        // CORRECTION 1: Récupérer TOUS les emplacements (pas seulement status: true)
        const emplacementsRef = collection(db, "emplacements");
        // Retirer le filtre where("status", "==", true) pour récupérer tous les emplacements

        unsubscribeRef.current = onSnapshot(
          emplacementsRef, // Sans filtre de statut
          (snapshot) => {
            const data = [];
            const cacheUpdate = {};

            snapshot.forEach((doc) => {
              const emplData = { id: doc.id, ...doc.data() };
              data.push(emplData);
              cacheUpdate[doc.id] = emplData;
            });

            setEmplacements(data);

            // CORRECTION 2: Mettre loading à false ICI après avoir reçu les données
            setLoading(false);

            // Mettre à jour le cache
            localStorage.setItem(ALL_EMPL_KEY, JSON.stringify(cacheUpdate));
          },
          (error) => {
            console.error("❌ Erreur snapshot all emplacements:", error);
            setError(error.message);
            setLoading(false); // Arrêter le loading même en cas d'erreur
          }
        );
      } catch (err) {
        console.error("❌ Erreur loadAllEmplacements:", err);
        setError(err.message);
        setLoading(false);
      }
      // CORRECTION 3: Retirer le finally avec setLoading(false)
    };

    loadAllEmplacements();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // CORRECTION 4: Aussi corriger la fonction refresh
      const emplacementsRef = collection(db, "emplacements");
      const snapshot = await getDocs(emplacementsRef); // Sans filtre

      const data = [];
      const cacheUpdate = {};

      snapshot.forEach((doc) => {
        const emplData = { id: doc.id, ...doc.data() };
        data.push(emplData);
        cacheUpdate[doc.id] = emplData;
      });

      setEmplacements(data);
      localStorage.setItem(ALL_EMPL_KEY, JSON.stringify(cacheUpdate));
    } catch (err) {
      console.error("❌ Erreur refresh all emplacements:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // CORRECTION 5: Corriger les fonctions utilitaires pour filtrer côté client
  const getActiveEmplacements = useMemo(() => {
    return emplacements.filter((e) => e.status === true);
  }, [emplacements]);

  const getInactiveEmplacements = useMemo(() => {
    return emplacements.filter((e) => e.status === false);
  }, [emplacements]);

  const getEmplacementsByType = useCallback(
    (type) => {
      return emplacements.filter((e) => e.type === type);
    },
    [emplacements]
  );

  return {
    emplacements, // TOUS les emplacements
    activeEmplacements: getActiveEmplacements, // Filtrés côté client
    inactiveEmplacements: getInactiveEmplacements, // Filtrés côté client
    getEmplacementsByType,
    loading,
    error,
    refresh,
  };
};

// ===========================================
// EXPORTS
// ===========================================

export {
  // Fonctions principales
  createEmplacement,
  updateEmplacement,
  deleteEmplacement,

  // Fonctions utilitaires
  getEmplacement,
  setVendeuseInEmplacement,
  relocateEmplacement,
  makeTransfertBetweenEmplacement,
  createOperation,
  recalculateStockActuel,
  detectMonthHasChanged,
  resetEmplacementStock,

  // Hooks
  useEmplacement,
  useAllEmplacements,
};
