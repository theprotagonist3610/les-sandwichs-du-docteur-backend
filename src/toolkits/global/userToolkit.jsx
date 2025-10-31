/*
global/userToolkit.jsx
Gestion globale des utilisateurs, pré-inscription et mode offline

Fonctionnalités :
1. Gestion des pré-utilisateurs (preusers) - Vérification email/role avant inscription
2. Import dynamique du bon userToolkit selon le role
3. Système de cache LocalStorage intelligent pour mode offline
4. Cache admin pour stocker tous les utilisateurs
*/

import { z } from "zod";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase.js";

// ============================================================================
// CONSTANTES
// ============================================================================

const LOCAL_USER_KEY = "local_lsd_user";
const LOCAL_ALL_USERS_KEY = "local_all_lsd_users";
const PREUSERS_DOC_PATH = "preusers/liste";

// Cache TTL (Time To Live) - 5 minutes en millisecondes
const CACHE_TTL = 5 * 60 * 1000;

// ============================================================================
// 1. GESTION DES PRÉ-UTILISATEURS
// ============================================================================

/**
 * Schema Zod pour un pré-utilisateur
 */
export const preuserSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["admin", "superviseur", "livreur", "vendeur", "cuisinier"]),
});

/**
 * Schema pour la liste des pré-utilisateurs
 */
export const preusersListSchema = z.object({
  users: z.array(preuserSchema),
});

/**
 * Ajoute un email dans la liste des pré-utilisateurs autorisés
 * @param {string} email - Email à autoriser
 * @param {string} role - Role à attribuer (admin, superviseur, livreur, vendeur, cuisinier)
 * @returns {Promise<Object>} Résultat de l'ajout
 * @throws {Error} Si la validation échoue
 */
export async function addPreUser(email, role) {
  try {
    // Validation
    const validatedPreuser = preuserSchema.parse({ email, role });

    // Récupérer la liste actuelle
    const preusersList = await getPreUsersList();

    // Vérifier si l'email existe déjà
    const existingUser = preusersList.find((u) => u.email === email);
    if (existingUser) {
      throw new Error("Cet email est déjà dans la liste des pré-utilisateurs");
    }

    // Ajouter le nouvel utilisateur
    const updatedList = [...preusersList, validatedPreuser];

    // Sauvegarder dans Firestore
    const preusersRef = doc(db, PREUSERS_DOC_PATH);
    await setDoc(preusersRef, { users: updatedList });

    console.log("✅ Pré-utilisateur ajouté:", email, "=>", role);

    return {
      success: true,
      preuser: validatedPreuser,
      message: "Pré-utilisateur ajouté avec succès",
    };
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du pré-utilisateur:", error);
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation échouée: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
}

/**
 * Récupère la liste des pré-utilisateurs
 * @returns {Promise<Array>} Liste des pré-utilisateurs
 */
export async function getPreUsersList() {
  try {
    const preusersRef = doc(db, PREUSERS_DOC_PATH);
    const preusersSnap = await getDoc(preusersRef);

    if (!preusersSnap.exists()) {
      console.log("ℹ️ Aucune liste de pré-utilisateurs trouvée");
      return [];
    }

    const data = preusersSnap.data();
    return data.users || [];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des pré-utilisateurs:",
      error
    );
    throw error;
  }
}

/**
 * Vérifie si un email est autorisé à créer un compte et retourne son role
 * @param {string} email - Email à vérifier
 * @returns {Promise<Object|null>} {email, role} si autorisé, null sinon
 */
export async function checkPreUser(email) {
  try {
    const preusersList = await getPreUsersList();
    const preuser = preusersList.find((u) => u.email === email);

    if (!preuser) {
      console.log("⚠️ Email non autorisé:", email);
      return null;
    }

    console.log("✅ Email autorisé:", email, "=>", preuser.role);
    return preuser;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la vérification du pré-utilisateur:",
      error
    );
    throw error;
  }
}

/**
 * Supprime un email de la liste des pré-utilisateurs
 * @param {string} email - Email à supprimer
 * @returns {Promise<Object>} Résultat de la suppression
 */
export async function removePreUser(email) {
  try {
    const preusersList = await getPreUsersList();
    const filteredList = preusersList.filter((u) => u.email !== email);

    if (filteredList.length === preusersList.length) {
      throw new Error("Email non trouvé dans la liste des pré-utilisateurs");
    }

    const preusersRef = doc(db, PREUSERS_DOC_PATH);
    await setDoc(preusersRef, { users: filteredList });

    console.log("✅ Pré-utilisateur supprimé:", email);

    return {
      success: true,
      message: "Pré-utilisateur supprimé avec succès",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error);
    throw error;
  }
}

// ============================================================================
// 2. IMPORT DYNAMIQUE DU BON USERTOOLKIT SELON LE ROLE
// ============================================================================

/**
 * Importe dynamiquement le userToolkit approprié selon le role
 * @param {string} role - Role (admin, superviseur, livreur, vendeur, cuisinier)
 * @returns {Promise<Object>} Module userToolkit correspondant
 */
export async function getUserToolkitForRole(role) {
  try {
    let toolkit;

    switch (role) {
      case "admin":
        toolkit = await import("../admin/userToolkit.jsx");
        break;
      case "superviseur":
        toolkit = await import("../superviseur/userToolkit.jsx");
        break;
      case "livreur":
        toolkit = await import("../livreur/userToolkit.jsx");
        break;
      case "vendeur":
        toolkit = await import("../vendeur/userToolkit.jsx");
        break;
      case "cuisinier":
        toolkit = await import("../cuisinier/userToolkit.jsx");
        break;
      default:
        throw new Error(`Role inconnu: ${role}`);
    }

    console.log("✅ UserToolkit chargé pour le role:", role);
    return toolkit;
  } catch (error) {
    console.error("❌ Erreur lors du chargement du userToolkit:", error);
    throw error;
  }
}

/**
 * Crée un utilisateur avec le bon toolkit selon son email pré-autorisé
 * @param {Object} userData - Données de l'utilisateur
 * @param {string} userData.email - Email (doit être dans preusers)
 * @param {string} userData.password - Mot de passe
 * @param {string} userData.nom - Nom
 * @param {string[]} userData.prenoms - Prénoms
 * @param {number} userData.date_naissance - Date de naissance (timestamp)
 * @param {string} userData.sexe - Sexe (f/m)
 * @param {string} userData.contact - Contact
 * @returns {Promise<Object>} Résultat de la création
 */
export async function createUserWithPrecheck(userData) {
  try {
    // Vérifier si l'email est autorisé
    const preuser = await checkPreUser(userData.email);

    if (!preuser) {
      throw new Error(
        "Email non autorisé. Contactez un administrateur pour obtenir une invitation."
      );
    }

    // Charger le bon userToolkit selon le role
    const userToolkit = await getUserToolkitForRole(preuser.role);

    // Créer l'utilisateur avec le toolkit approprié
    const result = await userToolkit.createUser(userData);

    // Supprimer de la liste des pré-utilisateurs après création réussie
    await removePreUser(userData.email);

    console.log("✅ Utilisateur créé avec role:", preuser.role);

    return {
      ...result,
      role: preuser.role,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la création avec precheck:", error);
    throw error;
  }
}

/**
 * Connecte un utilisateur en détectant automatiquement son role
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Les données de l'utilisateur connecté
 */
export async function loginUser(email, password) {
  try {
    // Étape 1: Vérifier le role de l'utilisateur dans preusers
    const preuser = await checkPreUser(email);

    if (!preuser) {
      throw new Error(
        "Email non autorisé. Contactez un administrateur pour obtenir une invitation."
      );
    }

    console.log("✅ Role détecté pour", email, "=>", preuser.role);

    // Étape 2: Charger le bon userToolkit selon le role
    const userToolkit = await getUserToolkitForRole(preuser.role);

    // Étape 3: Utiliser la fonction loginUser du toolkit approprié (sans navigation)
    // On ne passe pas navigate car on gère ça depuis le composant
    const result = await userToolkit.loginUser(email, password, null);

    // Étape 4: Sauvegarder l'utilisateur en localStorage
    if (result.user) {
      saveUserToLocalStorage(result.user);
    }

    console.log("✅ Connexion réussie avec role:", preuser.role);

    return {
      ...result,
      role: preuser.role,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la connexion avec precheck:", error);

    // Relancer l'erreur avec un message approprié
    if (error.message.includes("Email non autorisé")) {
      throw error;
    }

    throw error;
  }
}

// ============================================================================
// 3. SYSTÈME DE CACHE LOCALSTORAGE - UTILISATEUR SIMPLE
// ============================================================================

/**
 * Sauvegarde les données de l'utilisateur dans le LocalStorage
 * @param {Object} userData - Données utilisateur
 * @returns {boolean} true si succès
 */
export function saveUserToLocalStorage(userData) {
  try {
    if (!userData || !userData.id) {
      throw new Error("Données utilisateur invalides");
    }

    const dataToStore = {
      ...userData,
      lastSync: Date.now(),
    };

    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(dataToStore));
    console.log("✅ Utilisateur sauvegardé en local:", userData.id);

    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde en local:", error);
    return false;
  }
}

/**
 * Récupère les données de l'utilisateur depuis le LocalStorage
 * @returns {Object|null} Données utilisateur ou null
 */
export function getUserFromLocalStorage() {
  try {
    const data = localStorage.getItem(LOCAL_USER_KEY);

    if (!data) {
      console.log("ℹ️ Aucune donnée utilisateur en local");
      return null;
    }

    const userData = JSON.parse(data);

    // Vérifier si le cache est encore valide
    if (userData.lastSync) {
      const cacheAge = Date.now() - userData.lastSync;
      if (cacheAge > CACHE_TTL) {
        console.log("⚠️ Cache expiré (> 5 min)");
        return { ...userData, cacheExpired: true };
      }
    }

    console.log("✅ Utilisateur récupéré du cache local:", userData.id);
    return userData;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération en local:", error);
    return null;
  }
}

/**
 * Supprime les données de l'utilisateur du LocalStorage
 * @returns {boolean} true si succès
 */
export function clearUserFromLocalStorage() {
  try {
    localStorage.removeItem(LOCAL_USER_KEY);
    console.log("✅ Données utilisateur supprimées du local");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error);
    return false;
  }
}

/**
 * Synchronise l'utilisateur local avec Firestore
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userToolkit - Module userToolkit approprié
 * @returns {Promise<Object>} Données à jour
 */
export async function syncUserFromFirestore(userId, userToolkit) {
  try {
    const userData = await userToolkit.getUser(userId);

    if (!userData) {
      throw new Error("Utilisateur non trouvé dans Firestore");
    }

    // Sauvegarder en local
    saveUserToLocalStorage(userData);

    console.log("✅ Utilisateur synchronisé:", userId);

    return userData;
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation:", error);

    // En cas d'erreur, retourner les données locales si disponibles
    const localUser = getUserFromLocalStorage();
    if (localUser) {
      console.log("⚠️ Utilisation des données locales (mode offline)");
      return localUser;
    }

    throw error;
  }
}

// ============================================================================
// 4. SYSTÈME DE CACHE ADMIN - TOUS LES UTILISATEURS
// ============================================================================

/**
 * [ADMIN] Sauvegarde tous les utilisateurs dans le LocalStorage
 * @param {Array} users - Liste de tous les utilisateurs
 * @returns {boolean} true si succès
 */
export function saveAllUsersToLocalStorage(users) {
  try {
    if (!Array.isArray(users)) {
      throw new Error("La liste des utilisateurs doit être un tableau");
    }

    const dataToStore = {
      users: users,
      lastSync: Date.now(),
    };

    localStorage.setItem(LOCAL_ALL_USERS_KEY, JSON.stringify(dataToStore));
    console.log("✅ Tous les utilisateurs sauvegardés en local:", users.length);

    return true;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la sauvegarde de tous les utilisateurs:",
      error
    );
    return false;
  }
}

/**
 * [ADMIN] Récupère tous les utilisateurs depuis le LocalStorage
 * @returns {Array} Liste des utilisateurs
 */
export function getAllUsersFromLocalStorage() {
  try {
    const data = localStorage.getItem(LOCAL_ALL_USERS_KEY);

    if (!data) {
      console.log("ℹ️ Aucune donnée en local");
      return [];
    }

    const parsedData = JSON.parse(data);
    console.log("✅ Utilisateurs récupérés du local:", parsedData.users.length);

    return parsedData.users || [];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de tous les utilisateurs:",
      error
    );
    return [];
  }
}

/**
 * [ADMIN] Supprime tous les utilisateurs du LocalStorage
 * @returns {boolean} true si succès
 */
export function clearAllUsersFromLocalStorage() {
  try {
    localStorage.removeItem(LOCAL_ALL_USERS_KEY);
    console.log("✅ Tous les utilisateurs supprimés du local");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error);
    return false;
  }
}

/**
 * [ADMIN] Synchronise tous les utilisateurs avec Firestore
 * @param {Object} adminToolkit - Module admin/userToolkit
 * @returns {Promise<Array>} Liste des utilisateurs
 */
export async function syncAllUsersFromFirestore(adminToolkit) {
  try {
    const users = await adminToolkit.getAllUsers();

    // Récupérer les présences pour chaque utilisateur
    const usersWithPresence = await Promise.all(
      users.map(async (user) => {
        try {
          const presence = await adminToolkit.getUserPresence(user.id);
          return {
            ...user,
            presence: presence || null,
          };
        } catch (error) {
          console.warn(`⚠️ Impossible de récupérer la présence de ${user.id}`);
          return {
            ...user,
            presence: null,
          };
        }
      })
    );

    // Sauvegarder en local
    saveAllUsersToLocalStorage(usersWithPresence);

    console.log("✅ Tous les utilisateurs synchronisés:", users.length);

    return usersWithPresence;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la synchronisation de tous les utilisateurs:",
      error
    );

    // En cas d'erreur, retourner les données locales si disponibles
    const localUsers = getAllUsersFromLocalStorage();
    if (localUsers.length > 0) {
      console.log("⚠️ Utilisation des données locales (mode offline)");
      return localUsers;
    }

    throw error;
  }
}

/**
 * Vérifie si les données locales sont récentes (moins de X minutes)
 * @param {number} maxAgeMinutes - Âge maximum en minutes (défaut: 30)
 * @returns {boolean} true si les données sont récentes
 */
export function isLocalDataFresh(maxAgeMinutes = 30) {
  try {
    const userData = getUserFromLocalStorage();

    if (!userData || !userData.lastSync) {
      return false;
    }

    const ageMs = Date.now() - userData.lastSync;
    const ageMinutes = ageMs / (1000 * 60);

    return ageMinutes < maxAgeMinutes;
  } catch (error) {
    return false;
  }
}

/**
 * Détecte si l'application est en mode offline
 * @returns {boolean} true si offline
 */
export function isOffline() {
  return !navigator.onLine;
}

// ============================================================================
// 5. HOOKS REACT
// ============================================================================

import { useState, useEffect } from "react";
import { auth } from "../../firebase.js";

/**
 * Hook React pour gérer l'utilisateur actuel avec loading state
 * @param {boolean} autoSync - Synchroniser automatiquement avec Firestore (défaut: true)
 * @returns {Object} { user, loading, error, refresh, isOnline }
 *
 * @example
 * const { user, loading, error, refresh } = useUser();
 *
 * if (loading) return <div>Chargement...</div>;
 * if (error) return <div>Erreur: {error.message}</div>;
 * if (!user) return <div>Non connecté</div>;
 *
 * return <div>Bienvenue {user.nom}</div>;
 */
export function useUser(autoSync = true) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(!isOffline());

  /**
   * Charge les données utilisateur
   */
  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Pas d'utilisateur connecté
        setUser(null);
        setLoading(false);
        return;
      }

      const userId = currentUser.uid;

      // Essayer de charger depuis le cache local d'abord
      const cachedUser = getUserFromLocalStorage();

      if (cachedUser && cachedUser.id === userId) {
        // Retirer le flag cacheExpired avant de setter
        const { cacheExpired, ...cleanUser } = cachedUser;
        setUser(cleanUser);

        // Si le cache est valide (pas expiré), on s'arrête là
        if (!cacheExpired && !isOffline()) {
          console.log("✅ Utilisation du cache valide (< 5 min), pas de lecture Firestore");
          setLoading(false);
          return;
        }

        // Si pas de sync auto ou offline, on s'arrête là
        if (!autoSync || isOffline()) {
          setLoading(false);
          return;
        }
      }

      // Synchroniser avec Firestore si en ligne et autoSync activé
      // OU si le cache est expiré
      if (autoSync && !isOffline() && cachedUser?.cacheExpired) {
        try {
          // Récupérer le role depuis le cache
          const userRole = cachedUser?.role;

          // Charger le toolkit approprié
          const toolkit = await getUserToolkitForRole(userRole);

          // Synchroniser
          console.log("🔄 Cache expiré, synchronisation avec Firestore...");
          const freshUser = await syncUserFromFirestore(userId, toolkit);
          setUser(freshUser);
        } catch (syncError) {
          console.warn(
            "⚠️ Erreur de synchronisation, utilisation du cache:",
            syncError
          );
          // Utiliser le cache en cas d'erreur
          if (cachedUser) {
            const { cacheExpired, ...cleanUser } = cachedUser;
            setUser(cleanUser);
          } else {
            throw syncError;
          }
        }
      } else if (cachedUser) {
        const { cacheExpired, ...cleanUser } = cachedUser;
        setUser(cleanUser);
      }

      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur dans useUser:", err);
      setError(err);
      setLoading(false);
    }
  };

  /**
   * Rafraîchir manuellement les données
   */
  const refresh = () => {
    loadUser();
  };

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      loadUser();
    });

    return () => unsubscribe();
  }, [autoSync]);

  // Écouter les changements de connexion internet
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        loadUser(); // Resynchroniser quand la connexion revient
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [autoSync]);

  return {
    user,
    loading,
    error,
    refresh,
    isOnline,
  };
}

/**
 * Hook React pour gérer tous les utilisateurs (ADMIN uniquement)
 * @param {boolean} autoSync - Synchroniser automatiquement avec Firestore (défaut: true)
 * @param {number} refreshInterval - Intervalle de rafraîchissement en ms (0 = désactivé)
 * @returns {Object} { users, loading, error, refresh, isOnline, lastSync }
 *
 * @example
 * const { users, loading, error, refresh } = useAllUsers();
 *
 * if (loading) return <div>Chargement...</div>;
 * if (error) return <div>Erreur: {error.message}</div>;
 *
 * return (
 *   <div>
 *     <button onClick={refresh}>Rafraîchir</button>
 *     {users.map(user => (
 *       <UserCard key={user.id} user={user} />
 *     ))}
 *   </div>
 * );
 */
export function useAllUsers(autoSync = true, refreshInterval = 0) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(!isOffline());
  const [lastSync, setLastSync] = useState(null);

  /**
   * Charge tous les utilisateurs
   */
  const loadAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "Vous devez être connecté pour accéder à cette ressource"
        );
      }

      // Charger depuis le cache local d'abord
      const cachedUsers = getAllUsersFromLocalStorage();

      if (cachedUsers.length > 0) {
        setUsers(cachedUsers);

        // Si pas de sync auto ou offline, on s'arrête là
        if (!autoSync || isOffline()) {
          setLoading(false);
          setLastSync(Date.now());
          return;
        }
      }

      // Synchroniser avec Firestore si en ligne et autoSync activé
      if (autoSync && !isOffline()) {
        try {
          // Charger le toolkit admin
          const adminToolkit = await import("../admin/userToolkit.jsx");

          // Synchroniser tous les utilisateurs
          const freshUsers = await syncAllUsersFromFirestore(adminToolkit);
          setUsers(freshUsers);
          setLastSync(Date.now());
        } catch (syncError) {
          console.warn(
            "⚠️ Erreur de synchronisation, utilisation du cache:",
            syncError
          );
          // Utiliser le cache en cas d'erreur
          if (cachedUsers.length > 0) {
            setUsers(cachedUsers);
          } else {
            throw syncError;
          }
        }
      } else if (cachedUsers.length > 0) {
        setUsers(cachedUsers);
      }

      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur dans useAllUsers:", err);
      setError(err);
      setLoading(false);
    }
  };

  /**
   * Rafraîchir manuellement les données
   */
  const refresh = () => {
    loadAllUsers();
  };

  // Charger au montage du composant
  useEffect(() => {
    loadAllUsers();
  }, [autoSync]);

  // Rafraîchissement automatique (si activé)
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        if (!isOffline() && autoSync) {
          loadAllUsers();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, autoSync]);

  // Écouter les changements de connexion internet
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        loadAllUsers(); // Resynchroniser quand la connexion revient
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [autoSync]);

  return {
    users,
    loading,
    error,
    refresh,
    isOnline,
    lastSync,
  };
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  // Pré-utilisateurs
  addPreUser,
  getPreUsersList,
  checkPreUser,
  removePreUser,

  // Import dynamique
  getUserToolkitForRole,
  createUserWithPrecheck,
  loginUser,

  // Cache utilisateur simple
  saveUserToLocalStorage,
  getUserFromLocalStorage,
  clearUserFromLocalStorage,
  syncUserFromFirestore,

  // Cache admin
  saveAllUsersToLocalStorage,
  getAllUsersFromLocalStorage,
  clearAllUsersFromLocalStorage,
  syncAllUsersFromFirestore,

  // Hooks React
  useUser,
  useAllUsers,

  // Utilitaires
  isLocalDataFresh,
  isOffline,
};
