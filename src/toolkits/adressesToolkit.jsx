import { useState, useEffect, useCallback, useRef } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { nanoid } from "nanoid";

// ===========================================
// CONSTANTES
// ===========================================
const ADRESSES_KEY = "lsd_adresses";

// ===========================================
// FONCTIONS UTILITAIRES
// ===========================================

/**
 * Initialise les adresses pour un département spécifique
 */
export const initialiserDepartement = async (departement, listeAdresses) => {
  try {
    // Vérifier si déjà initialisé
    const deptRef = doc(db, "adresses", departement);
    const deptSnap = await getDoc(deptRef);

    if (deptSnap.exists()) {
      const existingData = deptSnap.data();
      if (existingData.adresses?.length > 0) {
        return {
          success: false,
          error: `${departement} déjà initialisé (${existingData.adresses.length} adresses)`,
          alreadyExists: true,
        };
      }
    }

    // Formater les adresses
    const adressesFormatees = listeAdresses.map((addr) => ({
      id: nanoid(10),
      departement: addr.departement || departement,
      commune: addr.commune || "",
      arrondissement: addr.arrondissement || "",
      quartier: addr.quartier || "",
      loc: addr.loc || [],
    }));

    // Créer le document département
    await setDoc(doc(db, "adresses", departement), {
      adresses: adressesFormatees,
      count: adressesFormatees.length,
      updated_at: new Date().toISOString(),
    });

    // Mettre à jour le total
    await updateTotalAdresses();

    toast.success(
      `${adressesFormatees.length} adresses créées pour ${departement}`
    );
    return {
      success: true,
      data: adressesFormatees,
      count: adressesFormatees.length,
    };
  } catch (error) {
    console.error(`❌ Erreur initialisation ${departement}:`, error);
    toast.error(`Erreur lors de l'initialisation de ${departement}`);
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour le document total avec les compteurs
 */
export const updateTotalAdresses = async () => {
  try {
    const adressesRef = collection(db, "adresses");
    const snapshot = await getDocs(adressesRef);

    const totaux = [];
    let grandTotal = 0;

    snapshot.forEach((doc) => {
      if (doc.id !== "total") {
        const data = doc.data();
        const count = data.count || 0;
        totaux.push({
          departement: doc.id,
          total: count,
        });
        grandTotal += count;
      }
    });

    await setDoc(doc(db, "adresses", "total"), {
      totaux,
      grand_total: grandTotal,
      updated_at: new Date().toISOString(),
    });

    return { success: true, totaux, grand_total: grandTotal };
  } catch (error) {
    console.error("❌ Erreur mise à jour total:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Récupère les adresses d'un département spécifique
 */
export const getAdressesByDepartement = async (departement) => {
  try {
    const docRef = doc(db, "adresses", departement);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Département introuvable", data: [] };
    }

    const data = docSnap.data();
    return { success: true, data: data.adresses || [], count: data.count || 0 };
  } catch (error) {
    console.error(`❌ Erreur récupération ${departement}:`, error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Récupère toutes les adresses de tous les départements
 */
export const getAllAdresses = async () => {
  try {
    const adressesRef = collection(db, "adresses");
    const snapshot = await getDocs(adressesRef);

    const toutesAdresses = [];

    snapshot.forEach((doc) => {
      if (doc.id !== "total") {
        const data = doc.data();
        if (data.adresses) {
          toutesAdresses.push(...data.adresses);
        }
      }
    });

    // Mettre en cache
    localStorage.setItem(ADRESSES_KEY, JSON.stringify(toutesAdresses));

    return {
      success: true,
      data: toutesAdresses,
      count: toutesAdresses.length,
    };
  } catch (error) {
    console.error("❌ Erreur récupération toutes adresses:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Crée une nouvelle adresse dans un département
 */
export const createAdresse = async (departement, adresseData) => {
  try {
    const deptRef = doc(db, "adresses", departement);
    const deptSnap = await getDoc(deptRef);

    const nouvelleAdresse = {
      id: nanoid(10),
      departement: adresseData.departement || departement,
      commune: adresseData.commune || "",
      arrondissement: adresseData.arrondissement || "",
      quartier: adresseData.quartier || "",
      loc: adresseData.loc || [],
    };

    if (deptSnap.exists()) {
      // Le département existe, ajouter l'adresse
      await updateDoc(deptRef, {
        adresses: arrayUnion(nouvelleAdresse),
        count: deptSnap.data().count + 1,
        updated_at: new Date().toISOString(),
      });
    } else {
      // Le département n'existe pas, le créer
      await setDoc(deptRef, {
        adresses: [nouvelleAdresse],
        count: 1,
        updated_at: new Date().toISOString(),
      });
    }

    // Mettre à jour le total
    await updateTotalAdresses();

    toast.success("Adresse créée avec succès");
    return { success: true, data: nouvelleAdresse };
  } catch (error) {
    console.error("❌ Erreur création adresse:", error);
    toast.error("Erreur lors de la création de l'adresse");
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour une adresse existante
 */
export const updateAdresse = async (departement, adresseId, updatedData) => {
  try {
    const deptRef = doc(db, "adresses", departement);
    const deptSnap = await getDoc(deptRef);

    if (!deptSnap.exists()) {
      return { success: false, error: "Département introuvable" };
    }

    const data = deptSnap.data();
    const adresses = data.adresses || [];

    const adresseIndex = adresses.findIndex((a) => a.id === adresseId);

    if (adresseIndex === -1) {
      return { success: false, error: "Adresse introuvable" };
    }

    // Mettre à jour l'adresse
    adresses[adresseIndex] = {
      ...adresses[adresseIndex],
      ...updatedData,
      id: adresseId, // Préserver l'ID
    };

    await updateDoc(deptRef, {
      adresses,
      updated_at: new Date().toISOString(),
    });

    toast.success("Adresse mise à jour avec succès");
    return { success: true, data: adresses[adresseIndex] };
  } catch (error) {
    console.error("❌ Erreur mise à jour adresse:", error);
    toast.error("Erreur lors de la mise à jour de l'adresse");
    return { success: false, error: error.message };
  }
};

/**
 * Supprime une adresse
 */
export const deleteAdresse = async (departement, adresseId) => {
  try {
    const deptRef = doc(db, "adresses", departement);
    const deptSnap = await getDoc(deptRef);

    if (!deptSnap.exists()) {
      return { success: false, error: "Département introuvable" };
    }

    const data = deptSnap.data();
    const adresses = data.adresses || [];

    const adresseToDelete = adresses.find((a) => a.id === adresseId);

    if (!adresseToDelete) {
      return { success: false, error: "Adresse introuvable" };
    }

    // Supprimer l'adresse
    const newAdresses = adresses.filter((a) => a.id !== adresseId);

    if (newAdresses.length === 0) {
      // Si c'était la dernière adresse, supprimer le document département
      await deleteDoc(deptRef);
    } else {
      // Sinon mettre à jour
      await updateDoc(deptRef, {
        adresses: newAdresses,
        count: newAdresses.length,
        updated_at: new Date().toISOString(),
      });
    }

    // Mettre à jour le total
    await updateTotalAdresses();

    toast.success("Adresse supprimée avec succès");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur suppression adresse:", error);
    toast.error("Erreur lors de la suppression de l'adresse");
    return { success: false, error: error.message };
  }
};

/**
 * Récupère les statistiques générales
 */
export const getAdressesStats = async () => {
  try {
    const totalRef = doc(db, "adresses", "total");
    const totalSnap = await getDoc(totalRef);

    if (!totalSnap.exists()) {
      return {
        success: false,
        error: "Statistiques non disponibles",
        data: null,
      };
    }

    return { success: true, data: totalSnap.data() };
  } catch (error) {
    console.error("❌ Erreur récupération stats:", error);
    return { success: false, error: error.message, data: null };
  }
};

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook pour récupérer et synchroniser toutes les adresses
 */
export const useAdresses = () => {
  const [adresses, setAdresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const loadAdresses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger depuis le cache d'abord
        const cached = localStorage.getItem(ADRESSES_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.length > 0) {
            setAdresses(parsedCache);
          }
        }

        // Récupérer depuis Firestore et établir la synchronisation
        const adressesRef = collection(db, "adresses");

        unsubscribeRef.current = onSnapshot(
          adressesRef,
          (snapshot) => {
            const toutesAdresses = [];

            snapshot.forEach((doc) => {
              if (doc.id !== "total") {
                const data = doc.data();
                if (data.adresses) {
                  toutesAdresses.push(...data.adresses);
                }
              }
            });

            setAdresses(toutesAdresses);
            setLoading(false);

            // Mettre à jour le cache
            localStorage.setItem(ADRESSES_KEY, JSON.stringify(toutesAdresses));
          },
          (error) => {
            console.error("❌ Erreur snapshot adresses:", error);
            setError(error.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("❌ Erreur chargement adresses:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadAdresses();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getAllAdresses();
    if (result.success) {
      setAdresses(result.data);
    }
    setLoading(false);
  }, []);

  // Fonctions utilitaires
  const getByDepartement = useCallback(
    (departement) => {
      return adresses.filter((a) => a.departement === departement);
    },
    [adresses]
  );

  const getByCommune = useCallback(
    (commune) => {
      return adresses.filter((a) => a.commune === commune);
    },
    [adresses]
  );

  const searchAdresses = useCallback(
    (searchTerm) => {
      const term = searchTerm.toLowerCase();
      return adresses.filter(
        (a) =>
          a.departement?.toLowerCase().includes(term) ||
          a.commune?.toLowerCase().includes(term) ||
          a.arrondissement?.toLowerCase().includes(term) ||
          a.quartier?.toLowerCase().includes(term)
      );
    },
    [adresses]
  );

  return {
    adresses,
    loading,
    error,
    refresh,
    getByDepartement,
    getByCommune,
    searchAdresses,
    totalCount: adresses.length,
  };
};

/**
 * Hook pour récupérer les adresses d'un département spécifique
 */
export const useAdressesDepartement = (departement) => {
  const [adresses, setAdresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!departement) {
      setLoading(false);
      return;
    }

    const loadAdressesDepartement = async () => {
      try {
        setLoading(true);
        setError(null);

        const docRef = doc(db, "adresses", departement);

        unsubscribeRef.current = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              setAdresses(data.adresses || []);
            } else {
              setAdresses([]);
            }
            setLoading(false);
          },
          (error) => {
            console.error(`❌ Erreur snapshot ${departement}:`, error);
            setError(error.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error(`❌ Erreur chargement ${departement}:`, err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadAdressesDepartement();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [departement]);

  const refresh = useCallback(async () => {
    if (!departement) return;
    setLoading(true);
    const result = await getAdressesByDepartement(departement);
    if (result.success) {
      setAdresses(result.data);
    }
    setLoading(false);
  }, [departement]);

  return {
    adresses,
    loading,
    error,
    refresh,
    count: adresses.length,
  };
};

// ===========================================
// EXPORTS
// ===========================================

export default {
  // Fonctions CRUD
  initialiserDepartement,
  createAdresse,
  updateAdresse,
  deleteAdresse,

  // Fonctions de récupération
  getAdressesByDepartement,
  getAllAdresses,
  getAdressesStats,
  updateTotalAdresses,

  // Hooks
  useAdresses,
  useAdressesDepartement,
};
