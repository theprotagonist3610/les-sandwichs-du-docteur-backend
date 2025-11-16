/*
livreur/userToolkit.jsx
Gestion des accès Firestore et RTDB pour un utilisateur livreur

Redirection par défaut : /livraisons
*/

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
// SCHEMAS ZOD
// ============================================================================

const BENIN_PHONE_REGEX = /^22901\d{8}$/;

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

export const userSchemaComplet = userSchemaMinimal.extend({
  id: z.string().min(1, "L'ID est requis"),
  role: z.literal("livreur"),
  createdAt: z.number().positive().optional(),
  updatedAt: z.number().positive().optional(),
});

export const presenceSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  prenoms: z.array(z.string().min(1)).min(1, "Au moins un prénom est requis"),
  role: z.literal("livreur"),
  connectedAt: z.number().positive("Date de connexion invalide"),
  disconnectedAt: z
    .number()
    .positive("Date de déconnexion invalide")
    .optional(),
});

export function userSchema(type = "minimal") {
  const schemas = {
    minimal: userSchemaMinimal,
    complet: userSchemaComplet,
    presence: presenceSchema,
  };
  return schemas[type] || schemas.minimal;
}

// ============================================================================
// FONCTIONS CRUD
// ============================================================================

export async function createUser(userData, options = { autoLogin: true }) {
  try {
    const validatedData = userSchemaMinimal.parse({
      nom: userData.nom,
      prenoms: userData.prenoms,
      email: userData.email,
      contact: userData.contact,
      sexe: userData.sexe,
      date_naissance: userData.date_naissance,
    });

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const userId = userCredential.user.uid;

    if (!options.autoLogin) {
      await firebaseSignOut(auth);
    }

    const now = Date.now();
    const userDocData = {
      id: userId,
      ...validatedData,
      role: "livreur",
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "users", userId), userDocData);

    const presenceData = {
      id: userId,
      nom: validatedData.nom,
      prenoms: validatedData.prenoms,
      role: "livreur",
      connectedAt: now,
    };

    await set(ref(rtdb, `presence/${userId}`), presenceData);

    if (options.autoLogin) {
      await signInWithEmailAndPassword(auth, userData.email, userData.password);
    }

    return {
      success: true,
      user: userDocData,
      message: "Livreur créé avec succès",
    };
  } catch (error) {
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

export async function updateUser(userId, updateData) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error(`L'utilisateur ${userId} n'existe pas`);
    }

    const { id, createdAt, email, role, ...allowedUpdates } = updateData;

    const dataToUpdate = {
      ...allowedUpdates,
      updatedAt: Date.now(),
    };

    if (dataToUpdate.contact) {
      if (!BENIN_PHONE_REGEX.test(dataToUpdate.contact)) {
        throw new Error("Contact invalide (format: 22901XXXXXXXX)");
      }
    }

    if (dataToUpdate.sexe && !["f", "m"].includes(dataToUpdate.sexe)) {
      throw new Error("Le sexe doit être 'f' ou 'm'");
    }

    await updateDoc(userRef, dataToUpdate);

    const updatedUserSnap = await getDoc(userRef);
    const updatedUser = updatedUserSnap.data();

    return {
      success: true,
      user: updatedUser,
      message: "Livreur mis à jour avec succès",
    };
  } catch (error) {
    throw error;
  }
}

export async function getUser(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return userSnap.data();
  } catch (error) {
    throw error;
  }
}

export async function setUserPresence(userId, presenceData = {}) {
  try {
    const presenceRef = ref(rtdb, `presence/${userId}`);
    const snapshot = await get(presenceRef);
    const existingData = snapshot.exists() ? snapshot.val() : {};

    const updateData = {
      ...existingData,
      ...presenceData,
      id: userId,
      role: "livreur",
    };

    if (
      presenceData.connectedAt === undefined &&
      !presenceData.disconnectedAt
    ) {
      updateData.connectedAt = Date.now();
    }

    const validatedData = presenceSchema.parse(updateData);
    await update(presenceRef, validatedData);

    return {
      success: true,
      presence: validatedData,
      message: "Présence mise à jour avec succès",
    };
  } catch (error) {
    throw error;
  }
}

export async function getUserPresence(userId) {
  try {
    const presenceRef = ref(rtdb, `presence/${userId}`);
    const snapshot = await get(presenceRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val();
  } catch (error) {
    throw error;
  }
}

export async function loginUser(
  email,
  password,
  navigate,
  redirectPath = "/livraisons"
) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userId = userCredential.user.uid;

    const userData = await getUser(userId);

    if (!userData) {
      throw new Error("Données utilisateur introuvables");
    }

    if (userData.role !== "livreur") {
      await firebaseSignOut(auth);
      throw new Error(
        "Accès refusé : ce compte n'est pas un compte livreur"
      );
    }

    await setUserPresence(userId, {
      nom: userData.nom,
      prenoms: userData.prenoms,
      role: "livreur",
      connectedAt: Date.now(),
    });

    if (navigate) {
      navigate(redirectPath);
    }

    return {
      success: true,
      user: userData,
      message: "Connexion livreur réussie",
    };
  } catch (error) {
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

export async function logoutUser(navigate, redirectPath = "/login") {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté" };
    }

    const userId = currentUser.uid;

    await setUserPresence(userId, {
      disconnectedAt: Date.now(),
    });

    await firebaseSignOut(auth);

    if (navigate) {
      navigate(redirectPath);
    }

    return {
      success: true,
      message: "Déconnexion livreur réussie",
    };
  } catch (error) {
    throw error;
  }
}

export default {
  userSchema,
  userSchemaMinimal,
  userSchemaComplet,
  presenceSchema,
  createUser,
  updateUser,
  getUser,
  setUserPresence,
  getUserPresence,
  loginUser,
  logoutUser,
};
