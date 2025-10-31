/*
superviseur/userToolkit.jsx
Gestion des accès Firestore et RTDB pour un utilisateur superviseur

user = {
  id: autogeneré par Firebase Auth,
  role: "superviseur",
  nom: string,
  prenoms: array de string,
  date_naissance: timestamp,
  sexe: "f" ou "m",
  contact: string numérique de 13 caractères commençant par 22901,
  email: string validé par regex
}

presence = {
  id,
  nom,
  prenoms,
  role,
  connectedAt: timestamp,
  disconnectedAt: timestamp
}

Fonctions disponibles :
1. userSchema() - Schémas Zod pour validation
2. createUser() - Création complète d'un utilisateur superviseur
3. updateUser() - Mise à jour d'un utilisateur
4. getUser() - Récupération d'un utilisateur
5. setUserPresence() - Mise à jour de la présence RTDB
6. getUserPresence() - Récupération de la présence
7. loginUser() - Connexion avec redirection vers /ventes
8. logoutUser() - Déconnexion
*/

// ============================================================================
// IMPORTS
// ============================================================================

import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
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
 * Schema Zod minimal pour un utilisateur superviseur
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
 * Schema Zod complet pour un utilisateur superviseur (avec id et role)
 */
export const userSchemaComplet = userSchemaMinimal.extend({
  id: z.string().min(1, "L'ID est requis"),
  role: z.literal("superviseur"),
  createdAt: z.number().positive().optional(),
  updatedAt: z.number().positive().optional(),
});

/**
 * Schema Zod pour la présence
 */
export const presenceSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  prenoms: z.array(z.string().min(1)).min(1, "Au moins un prénom est requis"),
  role: z.literal("superviseur"),
  connectedAt: z.number().positive("Date de connexion invalide"),
  disconnectedAt: z
    .number()
    .positive("Date de déconnexion invalide")
    .optional(),
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
// 2. createUser() - Création complète d'un utilisateur superviseur
// ============================================================================

/**
 * Crée un nouvel utilisateur superviseur (Auth + Firestore + Présence RTDB)
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

    console.log("✅ Utilisateur superviseur créé dans Firebase Auth:", userId);

    // Étape 3: Si autoLogin est false, se déconnecter temporairement
    if (!options.autoLogin) {
      await firebaseSignOut(auth);
    }

    // Étape 4: Créer le document Firestore users/{uid}
    const now = Date.now();
    const userDocData = {
      id: userId,
      ...validatedData,
      role: "superviseur",
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "users", userId), userDocData);
    console.log("✅ Document Firestore créé:", userId);

    // Étape 5: Créer la présence initiale dans RTDB
    const presenceData = {
      id: userId,
      nom: validatedData.nom,
      prenoms: validatedData.prenoms,
      role: "superviseur",
      connectedAt: now,
    };

    await set(ref(rtdb, `presence/${userId}`), presenceData);
    console.log("✅ Présence RTDB créée:", userId);

    // Étape 6: Si autoLogin, connecter l'utilisateur
    if (options.autoLogin) {
      await signInWithEmailAndPassword(auth, userData.email, userData.password);
      console.log("✅ Utilisateur superviseur connecté automatiquement");
    }

    return {
      success: true,
      user: userDocData,
      message: "Utilisateur superviseur créé avec succès",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la création du superviseur:", error);

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
 * Met à jour les données d'un utilisateur superviseur dans Firestore
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
    const { id, createdAt, email, role, ...allowedUpdates } = updateData;

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
    console.log("✅ Utilisateur superviseur mis à jour:", userId);

    // Récupérer l'utilisateur mis à jour
    const updatedUserSnap = await getDoc(userRef);
    const updatedUser = updatedUserSnap.data();

    return {
      success: true,
      user: updatedUser,
      message: "Utilisateur superviseur mis à jour avec succès",
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
 * Récupère les données d'un utilisateur superviseur depuis Firestore
 * @param {string} userId - ID de l'utilisateur à récupérer
 * @returns {Promise<Object|null>} Les données de l'utilisateur ou null
 */
export async function getUser(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`⚠️ Utilisateur superviseur ${userId} non trouvé`);
      return null;
    }

    const userData = userSnap.data();
    console.log("✅ Utilisateur superviseur récupéré:", userId);

    return userData;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération du superviseur:",
      error
    );
    throw error;
  }
}

// ============================================================================
// 5. setUserPresence() - Mise à jour de la présence
// ============================================================================

/**
 * Met à jour la présence d'un utilisateur superviseur dans RTDB
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} presenceData - Données de présence à mettre à jour
 * @param {number} [presenceData.connectedAt] - Timestamp de connexion
 * @param {number} [presenceData.disconnectedAt] - Timestamp de déconnexion
 * @returns {Promise<Object>} Résultat de la mise à jour
 */
export async function setUserPresence(userId, presenceData = {}) {
  try {
    const presenceRef = ref(rtdb, `presence/${userId}`);

    // Récupérer les données existantes
    const snapshot = await get(presenceRef);
    const existingData = snapshot.exists() ? snapshot.val() : {};

    // Préparer les données à mettre à jour
    const updateData = {
      ...existingData,
      ...presenceData,
      id: userId,
      role: "superviseur",
    };

    // Si on se connecte, mettre à jour connectedAt
    if (
      presenceData.connectedAt === undefined &&
      !presenceData.disconnectedAt
    ) {
      updateData.connectedAt = Date.now();
    }

    // Validation avec Zod
    const validatedData = presenceSchema.parse(updateData);

    // Mise à jour dans RTDB
    await update(presenceRef, validatedData);
    console.log("✅ Présence superviseur mise à jour:", userId);

    return {
      success: true,
      presence: validatedData,
      message: "Présence mise à jour avec succès",
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour de la présence superviseur:",
      error
    );
    throw error;
  }
}

// ============================================================================
// 6. getUserPresence() - Récupération de la présence
// ============================================================================

/**
 * Récupère la présence d'un utilisateur superviseur depuis RTDB
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} Les données de présence ou null
 */
export async function getUserPresence(userId) {
  try {
    const presenceRef = ref(rtdb, `presence/${userId}`);
    const snapshot = await get(presenceRef);

    if (!snapshot.exists()) {
      console.warn(`⚠️ Présence superviseur ${userId} non trouvée`);
      return null;
    }

    const presenceData = snapshot.val();
    console.log("✅ Présence superviseur récupérée:", userId);

    return presenceData;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la présence superviseur:",
      error
    );
    throw error;
  }
}

// ============================================================================
// 7. loginUser() - Connexion et redirection vers /ventes
// ============================================================================

/**
 * Connecte un utilisateur superviseur et le redirige vers /ventes
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @param {Function} navigate - Fonction useNavigate de react-router-dom
 * @param {string} [redirectPath='/ventes'] - Chemin de redirection (défaut: /ventes)
 * @returns {Promise<Object>} Les données de l'utilisateur connecté
 */
export async function loginUser(
  email,
  password,
  navigate,
  redirectPath = "/ventes"
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

    console.log("✅ Connexion superviseur réussie:", userId);

    // Étape 2: Récupérer les données utilisateur depuis Firestore
    const userData = await getUser(userId);

    if (!userData) {
      throw new Error("Données utilisateur introuvables");
    }

    // Vérifier que l'utilisateur est bien un superviseur
    if (userData.role !== "superviseur") {
      await firebaseSignOut(auth);
      throw new Error(
        "Accès refusé : ce compte n'est pas un compte superviseur"
      );
    }

    // Étape 3: Mettre à jour la présence (connexion)
    await setUserPresence(userId, {
      nom: userData.nom,
      prenoms: userData.prenoms,
      role: "superviseur",
      connectedAt: Date.now(),
    });

    // Étape 4: Redirection vers /ventes
    if (navigate) {
      navigate(redirectPath);
      console.log("✅ Redirection superviseur vers:", redirectPath);
    }

    return {
      success: true,
      user: userData,
      message: "Connexion superviseur réussie",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la connexion superviseur:", error);

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
 * Déconnecte l'utilisateur superviseur actuel
 * @param {Function} [navigate] - Fonction useNavigate de react-router-dom
 * @param {string} [redirectPath='/login'] - Chemin de redirection après déconnexion
 * @returns {Promise<Object>} Résultat de la déconnexion
 */
export async function logoutUser(navigate, redirectPath = "/login") {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.warn("⚠️ Aucun utilisateur superviseur connecté");
      return { success: false, message: "Aucun utilisateur connecté" };
    }

    const userId = currentUser.uid;

    // Étape 1: Mettre à jour la présence (déconnexion)
    await setUserPresence(userId, {
      disconnectedAt: Date.now(),
    });

    // Étape 2: Déconnexion Firebase Auth
    await firebaseSignOut(auth);
    console.log("✅ Déconnexion superviseur réussie:", userId);

    // Étape 3: Redirection
    if (navigate) {
      navigate(redirectPath);
      console.log("✅ Redirection vers:", redirectPath);
    }

    return {
      success: true,
      message: "Déconnexion superviseur réussie",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la déconnexion superviseur:", error);
    throw error;
  }
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

  // Fonctions utilisateur superviseur
  createUser,
  updateUser,
  getUser,
  setUserPresence,
  getUserPresence,
  loginUser,
  logoutUser,
};
