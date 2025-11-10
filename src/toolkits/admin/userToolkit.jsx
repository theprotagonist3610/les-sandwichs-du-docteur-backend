/*
Gestion des acces firestore et rtdb pour un user simple
user ={id: autogenere par firebase auth, role:[vide par defaut], nom :string, prenoms : [array de string], date_naissance :[timestamp], sexe :[f ou m], contact :[string numerique de 13 caracteres commencent par 22901], email:[string valide par une regex] }
presence ={userId, status:[online|offline|away], updatedAt:[timestamp], userName:[string optionnel]}
1. un userSchema () (2 schemas user et presence) fonction zod pour creer un schema minimal et ou complet pour un nouvel utiliateur
2. un createUser() fonction qui englobe 3 fonctionnalites (register un nouveau user avec firebase auth email+password, si succes, login user, si succes creer un document "users/{uid}" avec les champs valides par le userSchema)
3. un updateUser() fonction qui permet de mettre a jour via un updateDoc() le document "users/{uid}"
4. un getUser() fonction qui permet de recuperer uniquement "users/{uid}"
5. un setUserPresence() fonction qui permet de update rtdb/presence/{uid} (compatible avec database.rules.json)
6. un getUserPresence() fonction qui permet de recuperer uniquement rtdb/presence/{uid}
7. un loginUser() fonction qui permet de login un user, redirige le user vers une page grace a useNavigate et getUser
8. un logoutUser() fonction qui logOut un user
*/
/*
Gestion des acces firestore et rtdb pour un user admin
1. un getAllUsers() fonction qui permet de recuperer tous les documents de users/
2. un getAllUsersPresences() fonction qui permet de recuperer tous les documents de presence/
*/
/*
Test unitaires pour tester chacune des fonctions
*/
// ============================================================================
// admin/userToolkit.jsx - Collection d'outils pour la gestion des utilisateurs
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
} from "firebase/firestore";
import { ref, set, get, update } from "firebase/database";
import { auth, db, rtdb } from "../../firebase.js";

// ============================================================================
// 1. SCHEMAS ZOD - userSchema()
// ============================================================================

/**
 * Regex pour validation du contact béninois
 * Format: 22901XXXXXXXX (13 caractères commençant par 22901)
 */
const BENIN_PHONE_REGEX = /^22901\d{8}$/;

/**
 * Schema Zod minimal pour un utilisateur
 */
export const userSchemaMinimal = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenoms: z.array(z.string().min(1)).min(1, "Au moins un prénom est requis"),
  email: z.string().email("Email invalide"),
  contact: z
    .string()
    .regex(BENIN_PHONE_REGEX, "Contact invalide (format: 22901XXXXXXXX)"),
  sexe: z.enum(["f", "m"], {
    errorMap: () => ({ message: "Le sexe doit être 'f' ou 'm'" }),
  }),
  date_naissance: z.number().positive("Date de naissance invalide"),
});

/**
 * Schema Zod complet pour un utilisateur (avec id et role)
 */
export const userSchemaComplet = userSchemaMinimal.extend({
  id: z.string().min(1, "L'ID est requis"),
  role: z.enum(["admin", "user", ""]).default(""),
  createdAt: z.number().positive().optional(),
  updatedAt: z.number().positive().optional(),
});

/**
 * Schema Zod pour la présence (compatible avec database.rules.json)
 */
export const presenceSchema = z.object({
  userId: z.string().min(1, "L'ID utilisateur est requis"),
  status: z.enum(["online", "offline", "away"], {
    errorMap: () => ({
      message: "Le statut doit être 'online', 'offline' ou 'away'",
    }),
  }),
  updatedAt: z.number().positive("Date de mise à jour invalide"),
  userName: z.string().optional(),
});

/**
 * Fonction factory pour créer des schémas
 * @param {('minimal'|'complet'|'presence')} type - Type de schéma à retourner
 * @returns {z.ZodObject} Le schéma Zod correspondant
 */
export function userSchema(type = "minimal") {
  const schemas = {
    minimal: userSchemaMinimal,
    complet: userSchemaComplet,
    presence: presenceSchema,
  };

  return schemas[type] || schemas.minimal;
}

// ============================================================================
// 2. createUser() - Création complète d'un utilisateur
// ============================================================================

/**
 * Crée un nouvel utilisateur (Auth + Firestore + Présence RTDB)
 * @param {Object} userData - Données de l'utilisateur
 * @param {string} userData.email - Email de l'utilisateur
 * @param {string} userData.password - Mot de passe
 * @param {string} userData.nom - Nom de famille
 * @param {string[]} userData.prenoms - Liste des prénoms
 * @param {number} userData.date_naissance - Timestamp de naissance
 * @param {('f'|'m')} userData.sexe - Sexe
 * @param {string} userData.contact - Contact (format: 22901XXXXXXXX)
 * @param {Object} options - Options supplémentaires
 * @param {boolean} options.autoLogin - Se connecter automatiquement après création (défaut: true)
 * @returns {Promise<Object>} L'utilisateur créé avec son ID
 * @throws {Error} Si la validation échoue ou si la création échoue
 */
export async function createUser(userData, options = { autoLogin: true }) {
  try {
    // Étape 1: Validation des données avec Zod
    const validatedData = userSchemaMinimal.parse({
      nom: userData.nom,
      prenoms: userData.prenoms,
      email: userData.email,
      contact: userData.contact,
      sexe: userData.sexe,
      date_naissance: userData.date_naissance,
    });

    // Étape 2: Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const firebaseUser = userCredential.user;
    const userId = firebaseUser.uid;

    console.log("✅ Utilisateur créé dans Firebase Auth:", userId);

    // Étape 3: Si autoLogin est false, se déconnecter temporairement
    if (!options.autoLogin) {
      await firebaseSignOut(auth);
    }

    // Étape 4: Créer le document Firestore users/{uid}
    const now = Date.now();
    const userDocData = {
      id: userId,
      ...validatedData,
      role: "admin", // Vide par défaut
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "users", userId), userDocData);
    console.log("✅ Document Firestore créé:", userId);

    // Étape 5: Créer la présence initiale dans RTDB
    const presenceData = {
      userId: userId,
      status: "online",
      updatedAt: now,
      userName: `${validatedData.nom} ${validatedData.prenoms.join(" ")}`,
    };

    await set(ref(rtdb, `presence/${userId}`), presenceData);
    console.log("✅ Présence RTDB créée:", userId);

    // Étape 6: Si autoLogin, connecter l'utilisateur
    if (options.autoLogin) {
      await signInWithEmailAndPassword(auth, userData.email, userData.password);
      console.log("✅ Utilisateur connecté automatiquement");
    }

    return {
      success: true,
      user: userDocData,
      message: "Utilisateur créé avec succès",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur:", error);

    // Gestion des erreurs spécifiques
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation échouée: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }

    if (error.code === "auth/email-already-in-use") {
      throw new Error("Cet email est déjà utilisé");
    }

    if (error.code === "auth/weak-password") {
      throw new Error("Le mot de passe est trop faible (minimum 6 caractères)");
    }

    throw error;
  }
}

// ============================================================================
// 3. updateUser() - Mise à jour d'un utilisateur
// ============================================================================

/**
 * Met à jour les données d'un utilisateur dans Firestore
 * @param {string} userId - ID de l'utilisateur à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} Résultat de la mise à jour
 * @throws {Error} Si l'utilisateur n'existe pas ou si la mise à jour échoue
 */
export async function updateUser(userId, updateData) {
  try {
    // Vérifier que l'utilisateur existe
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error(`L'utilisateur ${userId} n'existe pas`);
    }

    // Ne pas permettre la modification de certains champs
    const { id, createdAt, email, ...allowedUpdates } = updateData;

    // Ajouter le timestamp de mise à jour
    const dataToUpdate = {
      ...allowedUpdates,
      updatedAt: Date.now(),
    };

    // Validation partielle (seulement les champs fournis)
    if (dataToUpdate.contact) {
      if (!BENIN_PHONE_REGEX.test(dataToUpdate.contact)) {
        throw new Error("Contact invalide (format: 22901XXXXXXXX)");
      }
    }

    if (dataToUpdate.sexe && !["f", "m"].includes(dataToUpdate.sexe)) {
      throw new Error("Le sexe doit être 'f' ou 'm'");
    }

    // Mise à jour dans Firestore
    await updateDoc(userRef, dataToUpdate);
    console.log("✅ Utilisateur mis à jour:", userId);

    // Récupérer l'utilisateur mis à jour
    const updatedUserSnap = await getDoc(userRef);
    const updatedUser = updatedUserSnap.data();

    return {
      success: true,
      user: updatedUser,
      message: "Utilisateur mis à jour avec succès",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    throw error;
  }
}

// ============================================================================
// 4. getUser() - Récupération d'un utilisateur
// ============================================================================

/**
 * Récupère les données d'un utilisateur depuis Firestore
 * @param {string} userId - ID de l'utilisateur à récupérer
 * @returns {Promise<Object|null>} Les données de l'utilisateur ou null
 */
export async function getUser(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`⚠️ Utilisateur ${userId} non trouvé`);
      return null;
    }

    const userData = userSnap.data();
    console.log("✅ Utilisateur récupéré:", userId);

    return userData;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'utilisateur:", error);
    throw error;
  }
}

// ============================================================================
// 5. setUserPresence() - Mise à jour de la présence
// ============================================================================

/**
 * Met à jour la présence d'un utilisateur dans RTDB
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} presenceData - Données de présence à mettre à jour
 * @param {('online'|'offline'|'away')} [presenceData.status] - Statut de présence
 * @param {string} [presenceData.userName] - Nom complet de l'utilisateur
 * @returns {Promise<Object>} Résultat de la mise à jour
 */
export async function setUserPresence(userId, presenceData = {}) {
  try {
    const presenceRef = ref(rtdb, `presence/${userId}`);

    // Préparer les données à mettre à jour (compatible avec database.rules.json)
    const updateData = {
      userId: userId,
      status: presenceData.status || "online",
      updatedAt: Date.now(),
    };

    // Ajouter userName si fourni
    if (presenceData.userName) {
      updateData.userName = presenceData.userName;
    }

    // Validation avec Zod
    const validatedData = presenceSchema.parse(updateData);

    // Mise à jour dans RTDB
    await update(presenceRef, validatedData);
    console.log("✅ Présence mise à jour:", userId);

    return {
      success: true,
      presence: validatedData,
      message: "Présence mise à jour avec succès",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la présence:", error);
    throw error;
  }
}

// ============================================================================
// 6. getUserPresence() - Récupération de la présence
// ============================================================================

/**
 * Récupère la présence d'un utilisateur depuis RTDB
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} Les données de présence ou null
 */
export async function getUserPresence(userId) {
  try {
    const presenceRef = ref(rtdb, `presence/${userId}`);
    const snapshot = await get(presenceRef);

    if (!snapshot.exists()) {
      console.warn(`⚠️ Présence ${userId} non trouvée`);
      return null;
    }

    const presenceData = snapshot.val();
    console.log("✅ Présence récupérée:", userId);

    return presenceData;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la présence:", error);
    throw error;
  }
}

// ============================================================================
// 7. loginUser() - Connexion et redirection
// ============================================================================

/**
 * Connecte un utilisateur et le redirige
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @param {Function} navigate - Fonction useNavigate de react-router-dom
 * @param {string} [redirectPath='/dashboard'] - Chemin de redirection
 * @returns {Promise<Object>} Les données de l'utilisateur connecté
 */
export async function loginUser(
  email,
  password,
  navigate,
  redirectPath = "/dashboard"
) {
  try {
    // Étape 1: Connexion avec Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;
    const userId = firebaseUser.uid;

    console.log("✅ Connexion réussie:", userId);

    // Étape 2: Récupérer les données utilisateur depuis Firestore
    const userData = await getUser(userId);

    if (!userData) {
      throw new Error("Données utilisateur introuvables");
    }

    // Étape 3: Mettre à jour la présence (connexion)
    await setUserPresence(userId, {
      status: "online",
      userName: `${userData.nom} ${userData.prenoms.join(" ")}`,
    });

    // Étape 4: Redirection
    if (navigate) {
      navigate(redirectPath);
      console.log("✅ Redirection vers:", redirectPath);
    }

    return {
      success: true,
      user: userData,
      message: "Connexion réussie",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la connexion:", error);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/user-not-found"
    ) {
      throw new Error("Email ou mot de passe incorrect");
    }

    if (error.code === "auth/too-many-requests") {
      throw new Error("Trop de tentatives. Veuillez réessayer plus tard");
    }

    throw error;
  }
}

// ============================================================================
// 8. logoutUser() - Déconnexion
// ============================================================================

/**
 * Déconnecte l'utilisateur actuel
 * @param {Function} [navigate] - Fonction useNavigate de react-router-dom
 * @param {string} [redirectPath='/login'] - Chemin de redirection après déconnexion
 * @returns {Promise<Object>} Résultat de la déconnexion
 */
export async function logoutUser(navigate, redirectPath = "/login") {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.warn("⚠️ Aucun utilisateur connecté");
      return { success: false, message: "Aucun utilisateur connecté" };
    }

    const userId = currentUser.uid;

    // Étape 1: Mettre à jour la présence (déconnexion)
    await setUserPresence(userId, {
      status: "offline",
    });

    // Étape 2: Déconnexion Firebase Auth
    await firebaseSignOut(auth);
    console.log("✅ Déconnexion réussie:", userId);

    // Étape 3: Redirection
    if (navigate) {
      navigate(redirectPath);
      console.log("✅ Redirection vers:", redirectPath);
    }

    return {
      success: true,
      message: "Déconnexion réussie",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la déconnexion:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS ADMIN
// ============================================================================

/**
 * [ADMIN] Récupère tous les utilisateurs depuis Firestore
 * @returns {Promise<Array>} Liste de tous les utilisateurs
 * @throws {Error} Si l'utilisateur n'est pas admin
 */
export async function getAllUsers() {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error(
        "Vous devez être connecté pour accéder à cette ressource"
      );
    }

    // Vérifier que l'utilisateur actuel est admin
    const currentUserData = await getUser(currentUser.uid);
    if (currentUserData?.role !== "admin") {
      throw new Error("Accès refusé : privilèges administrateur requis");
    }

    // Récupérer tous les utilisateurs
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);

    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push(doc.data());
    });

    console.log(`✅ ${users.length} utilisateurs récupérés`);

    return users;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
    throw error;
  }
}

/**
 * [ADMIN] Récupère toutes les présences depuis RTDB
 * @returns {Promise<Array>} Liste de toutes les présences
 * @throws {Error} Si l'utilisateur n'est pas admin
 */
export async function getAllUsersPresences() {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error(
        "Vous devez être connecté pour accéder à cette ressource"
      );
    }

    // Vérifier que l'utilisateur actuel est admin
    const currentUserData = await getUser(currentUser.uid);
    if (currentUserData?.role !== "admin") {
      throw new Error("Accès refusé : privilèges administrateur requis");
    }

    // Récupérer toutes les présences
    const presencesRef = ref(rtdb, "presence");
    const snapshot = await get(presencesRef);

    if (!snapshot.exists()) {
      console.warn("⚠️ Aucune présence trouvée");
      return [];
    }

    const presencesData = snapshot.val();
    const presences = Object.values(presencesData);

    console.log(`✅ ${presences.length} présences récupérées`);

    return presences;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des présences:", error);
    throw error;
  }
}

// ============================================================================
// HOOKS REACT
// ============================================================================

/**
 * Hook pour récupérer tous les utilisateurs
 * @param {Object} options - Options du hook
 * @param {boolean} options.autoFetch - Charger automatiquement au montage (défaut: true)
 * @param {string} options.filterRole - Filtrer par rôle (optionnel)
 * @returns {Object} { users, loading, error, refetch }
 */
export function useUsers(options = {}) {
  const { autoFetch = true, filterRole } = options;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await getAllUsers();

      // Filtrer par rôle si spécifié
      const filteredUsers = filterRole
        ? allUsers.filter((user) => user.role === filterRole)
        : allUsers;

      setUsers(filteredUsers);
    } catch (err) {
      console.error("❌ Erreur useUsers:", err);
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filterRole]);

  useEffect(() => {
    if (autoFetch) {
      fetchUsers();
    }
  }, [autoFetch, fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
}

/**
 * Hook pour récupérer un utilisateur spécifique
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} { user, loading, error, refetch }
 */
export function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userData = await getUser(userId);
      setUser(userData);
    } catch (err) {
      console.error("❌ Erreur useUser:", err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
}

/**
 * Hook pour récupérer toutes les présences en temps réel depuis RTDB
 * Utilise un listener qui se met à jour automatiquement
 * @returns {Object} { presences, loading, error }
 */
export function usePresences() {
  const [presences, setPresences] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const presencesRef = ref(rtdb, "presence");

    const unsubscribe = onValue(
      presencesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPresences(snapshot.val());
        } else {
          setPresences({});
        }
        setLoading(false);
      },
      (err) => {
        console.error("❌ Erreur usePresences:", err);
        setError(err.message);
        setPresences({});
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    presences,
    loading,
    error,
  };
}

/**
 * Hook pour récupérer la présence d'un utilisateur spécifique en temps réel
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} { presence, loading, error }
 */
export function useUserPresence(userId) {
  const [presence, setPresence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setPresence(null);
      setLoading(false);
      return;
    }

    const presenceRef = ref(rtdb, `presence/${userId}`);

    const unsubscribe = onValue(
      presenceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPresence(snapshot.val());
        } else {
          setPresence({
            userId: userId,
            status: "offline",
            updatedAt: 0,
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("❌ Erreur useUserPresence:", err);
        setError(err.message);
        setPresence(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return {
    presence,
    loading,
    error,
  };
}

/**
 * Hook pour récupérer tous les utilisateurs avec leurs présences en temps réel
 * Combine automatiquement les données Firestore et RTDB
 * @param {Object} options - Options pour useUsers
 * @returns {Object} { users, loading, error, refetch }
 */
export function useUsersWithPresence(options = {}) {
  const {
    users,
    loading: loadingUsers,
    error: errorUsers,
    refetch,
  } = useUsers(options);
  const {
    presences,
    loading: loadingPresences,
    error: errorPresences,
  } = usePresences();

  const usersWithPresence = useMemo(() => {
    return users.map((user) => ({
      ...user,
      presence: presences[user.id] || {
        userId: user.id,
        status: "offline",
        updatedAt: 0,
      },
    }));
  }, [users, presences]);

  return {
    users: usersWithPresence,
    loading: loadingUsers || loadingPresences,
    error: errorUsers || errorPresences,
    refetch,
  };
}

/**
 * Hook pour calculer automatiquement les métriques utilisateurs en temps réel
 * @param {Object} options - Options pour useUsersWithPresence
 * @returns {Object} Métriques calculées (total, online, offline, away, admins, male, female, newUsers)
 */
export function useUserMetrics(options = {}) {
  const { users, loading, error } = useUsersWithPresence(options);

  const metrics = useMemo(() => {
    const online = users.filter((u) => u.presence.status === "online").length;
    const offline = users.filter((u) => u.presence.status === "offline").length;
    const away = users.filter((u) => u.presence.status === "away").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const regularUsers = users.filter(
      (u) => u.role === "user" || !u.role
    ).length;
    const male = users.filter((u) => u.sexe === "m").length;
    const female = users.filter((u) => u.sexe === "f").length;

    // Utilisateurs créés dans les 7 derniers jours
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsers = users.filter((u) => u.createdAt >= sevenDaysAgo).length;

    return {
      total: users.length,
      online,
      offline,
      away,
      admins,
      regularUsers,
      male,
      female,
      newUsers,
    };
  }, [users]);

  return {
    metrics,
    users,
    loading,
    error,
  };
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  // Schemas
  userSchema,
  userSchemaMinimal,
  userSchemaComplet,
  presenceSchema,

  // Fonctions utilisateur
  createUser,
  updateUser,
  getUser,
  setUserPresence,
  getUserPresence,
  loginUser,
  logoutUser,

  // Fonctions admin
  getAllUsers,
  getAllUsersPresences,

  // Hooks
  useUsers,
  useUser,
  usePresences,
  useUserPresence,
  useUsersWithPresence,
  useUserMetrics,
};
