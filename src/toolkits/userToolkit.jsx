import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
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
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import {
  setUserPresence,
  cleanupUserPresence,
  listenToOnlineUsers,
  isUserAdmin,
  promoteToAdmin,
  logAdminAction,
  sendNotification,
  useUserNotifications,
  bootstrapFirstAdmin,
} from "@/toolkits/rtdbHelpers";
import { userSchema } from "@/toolkits/schema";
import { toast } from "sonner";

// ===========================================
// FONCTIONS UTILITAIRES
// ===========================================

const STORAGE_KEY = "lsd_user";
const ALL_USERS_KEY = "lsd_all_users";

const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem(STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Erreur lecture localStorage:", error);
    return null;
  }
};

const setCurrentUser = (userData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error("Erreur sauvegarde localStorage:", error);
  }
};

const clearCurrentUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Erreur suppression localStorage:", error);
  }
};

const getAllUsers = () => {
  try {
    const usersData = localStorage.getItem(ALL_USERS_KEY);
    return usersData ? JSON.parse(usersData) : null;
  } catch (error) {
    console.error("Erreur lecture all users localStorage:", error);
    return null;
  }
};

const setAllUsers = (usersData) => {
  try {
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(usersData));
  } catch (error) {
    console.error("Erreur sauvegarde all users localStorage:", error);
  }
};

const clearAllUsers = () => {
  try {
    localStorage.removeItem(ALL_USERS_KEY);
  } catch (error) {
    console.error("Erreur suppression all users localStorage:", error);
  }
};

// Fonction pour charger tous les users (admins seulement)
const loadAllUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("status", "==", true));
    const querySnapshot = await getDocs(q);

    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        nom: userData.nom,
        prenoms: userData.prenoms,
        role: userData.role,
        level: userData.level,
        email: userData.email,
        telephone: userData.telephone,
        sexe: userData.sexe,
        uid: userData.uid,
        createdAt: userData.createdAt,
      });
    });

    return users;
  } catch (error) {
    console.error("Erreur chargement users:", error);
    throw error;
  }
};

// ===========================================
// FONCTIONS PRINCIPALES
// ===========================================
/**
 * Fonction pour pré-créer un compte utilisateur (Admin uniquement)
 * @param {Object} userData - Données utilisateur
 * @param {string} userData.email - Email de l'utilisateur
 * @param {string} userData.telephone - Numéro de téléphone (sera utilisé comme ID)
 * @param {string} userData.sexe - Sexe ("F" ou "H")
 * @param {string} userData.fonction - Fonction/rôle de l'utilisateur
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export const addUser = async (userData) => {
  try {
    console.log("=== DÉBUT ADD USER ===");
    console.log("Données reçues:", userData);

    // 1. Vérifier les permissions
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.level !== "admin") {
      throw new Error(
        "Seuls les administrateurs peuvent créer des utilisateurs"
      );
    }

    // 2. Validation des données obligatoires
    const { email, telephone, sexe, fonction } = userData;

    if (!email || !telephone || !sexe || !fonction) {
      throw new Error(
        "Tous les champs sont obligatoires (email, telephone, sexe, fonction)"
      );
    }

    // 3. Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Format d'email invalide");
    }

    // 4. Validation du sexe
    if (!["F", "H"].includes(sexe)) {
      throw new Error("Le sexe doit être 'F' ou 'H'");
    }

    // 5. Validation de la fonction
    const fonctionsValides = [
      "superviseur",
      "vendeuse",
      "cuisiniere",
      "livreur",
    ];
    if (!fonctionsValides.includes(fonction.toLowerCase())) {
      throw new Error(
        `La fonction doit être l'une de : ${fonctionsValides.join(", ")}`
      );
    }

    // 6. Nettoyer le numéro de téléphone
    const cleanTelephone = telephone.replace(/[\s\-\+]/g, "");
    if (cleanTelephone.length < 13) {
      throw new Error("Numéro de téléphone invalide");
    }

    // 7. Construire l'ID du document
    const userId = `user_${cleanTelephone}`;
    console.log("User ID:", userId);

    // 8. Vérifier si l'utilisateur existe déjà
    const userDocRef = doc(db, "users", userId);
    const existingUser = await getDoc(userDocRef);

    if (existingUser.exists()) {
      throw new Error("Un utilisateur avec ce numéro de téléphone existe déjà");
    }

    // 9. Vérifier si l'email est déjà utilisé
    // Note: Cette vérification nécessiterait une query, mais pour des raisons de performance
    // on peut la faire côté client ou ajouter une index sur l'email si nécessaire

    // 10. Préparer les données du document
    const userDocument = {
      email: email.toLowerCase().trim(),
      telephone: cleanTelephone,
      sexe: sexe.toUpperCase(),
      role: fonction.toLowerCase(),
      level: "user", // Par défaut, seuls les admins peuvent changer cela
      status: false, // Compte inactif jusqu'à l'inscription
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
      // Champs qui seront remplis lors de l'inscription
      nom: null,
      prenoms: null,
      uid: null, // UID Firebase Auth ajouté lors de l'inscription
      old_roles: [],
      lastLoginAt: null,
      updatedAt: null,
    };

    console.log("Document à créer:", userDocument);

    // 11. Créer le document dans Firestore
    await setDoc(userDocRef, userDocument);

    // 12. Logger l'action admin dans RTDB
    try {
      await logAdminAction(currentUser.uid, "CREATE_USER", userId);
    } catch (logError) {
      console.warn("⚠️ Erreur log admin:", logError);
      // Ne pas faire échouer l'opération pour un problème de log
    }

    // 13. Mettre à jour le cache admin si nécessaire
    if (currentUser.level === "admin") {
      try {
        const updatedUsers = await loadAllUsers();
        setAllUsers(updatedUsers);
      } catch (cacheError) {
        console.warn("⚠️ Erreur mise à jour cache:", cacheError);
      }
    }

    console.log("✅ Utilisateur créé avec succès");
    toast.success(`Utilisateur ${email} créé avec succès`);

    return {
      success: true,
      userId,
      message:
        "Utilisateur pré-créé. Il peut maintenant s'inscrire avec son email et téléphone.",
    };
  } catch (error) {
    console.error("=== ERREUR ADD USER ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    toast.error(`Erreur création utilisateur: ${error.message}`);

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Fonction pour créer plusieurs utilisateurs en lot (Admin uniquement)
 * @param {Array} usersData - Tableau d'objets utilisateur
 * @returns {Promise<Object>} - Résultat de l'opération avec détails
 */
export const addMultipleUsers = async (usersData) => {
  try {
    // Vérifier les permissions
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.level !== "admin") {
      throw new Error(
        "Seuls les administrateurs peuvent créer des utilisateurs"
      );
    }

    if (!Array.isArray(usersData) || usersData.length === 0) {
      throw new Error("Aucune donnée utilisateur fournie");
    }

    console.log(`=== CRÉATION EN LOT DE ${usersData.length} UTILISATEURS ===`);

    const results = {
      success: [],
      errors: [],
      total: usersData.length,
    };

    // Créer chaque utilisateur individuellement
    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      console.log(
        `Création utilisateur ${i + 1}/${usersData.length}:`,
        userData.email
      );

      const result = await addUser(userData);

      if (result.success) {
        results.success.push({
          email: userData.email,
          telephone: userData.telephone,
          userId: result.userId,
        });
      } else {
        results.errors.push({
          email: userData.email,
          telephone: userData.telephone,
          error: result.error,
        });
      }

      // Petite pause pour éviter de surcharger Firestore
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("=== CRÉATION EN LOT TERMINÉE ===");
    console.log("Succès:", results.success.length);
    console.log("Erreurs:", results.errors.length);

    // Toast de résumé
    if (results.errors.length === 0) {
      toast.success(`${results.success.length} utilisateurs créés avec succès`);
    } else {
      toast.warning(
        `${results.success.length} créés, ${results.errors.length} erreurs`
      );
    }

    return results;
  } catch (error) {
    console.error("Erreur création en lot:", error);
    toast.error(`Erreur création en lot: ${error.message}`);

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Fonction utilitaire pour valider les données utilisateur avant création
 * @param {Object} userData - Données à valider
 * @returns {Object} - Résultat de la validation
 */
export const validateUserData = (userData) => {
  const errors = [];
  const { email, telephone, sexe, fonction } = userData;

  // Email
  if (!email) {
    errors.push("Email manquant");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Format d'email invalide");
  }

  // Téléphone
  if (!telephone) {
    errors.push("Téléphone manquant");
  } else if (telephone.replace(/[\s\-\+]/g, "").length < 8) {
    errors.push("Numéro de téléphone trop court");
  }

  // Sexe
  if (!sexe) {
    errors.push("Sexe manquant");
  } else if (!["F", "H"].includes(sexe.toUpperCase())) {
    errors.push("Sexe doit être 'F' ou 'H'");
  }

  // Fonction
  const fonctionsValides = ["superviseur", "vendeuse", "cuisiniere", "livreur"];
  if (!fonction) {
    errors.push("Fonction manquante");
  } else if (!fonctionsValides.includes(fonction.toLowerCase())) {
    errors.push(
      `Fonction invalide. Valeurs acceptées: ${fonctionsValides.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
export const registerUser = async (data) => {
  let userCredential = null;

  try {
    // 1. Valider les données avec userSchema
    const validation = userSchema(data);
    if (!validation.success) {
      console.log(validation);
      throw new Error(
        `Données invalides: ${validation.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }

    const validData = validation.data;
    const userId = `user_${validData.telephone}`;

    // 2. CRÉER LE COMPTE FIREBASE AUTH
    userCredential = await createUserWithEmailAndPassword(
      auth,
      validData.email,
      data.password
    );

    // 3. CONNEXION EXPLICITE
    await signInWithEmailAndPassword(auth, validData.email, data.password);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 4. Vérifier le document pré-enregistré
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("Aucun compte pré-enregistré trouvé pour ce numéro");
    }

    const existingData = userDoc.data();

    // 5. Vérifications sécurisées
    if (existingData.email !== validData.email) {
      throw new Error("Email ne correspond pas au compte pré-enregistré");
    }

    if (existingData.status === true) {
      throw new Error("Ce compte a déjà été activé");
    }

    // 6. Activer le compte
    const updateData = {
      ...validData,
      uid: userCredential.user.uid,
      createdAt: serverTimestamp(),
      status: true,
      old_roles: [],
    };

    await updateDoc(userDocRef, updateData);

    // 7. NOUVELLE ÉTAPE : Initialiser la présence RTDB
    try {
      await setUserPresence(userCredential.user.uid, updateData, true);
      console.log("✅ Présence RTDB initialisée lors de l'inscription");
    } catch (presenceError) {
      console.warn("⚠️ Erreur initialisation présence:", presenceError);
      // Ne pas faire échouer l'inscription pour un problème de présence
    }

    toast.success("Compte créé avec succès !");
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Erreur registerUser:", error);

    // Nettoyer le compte Firebase Auth en cas d'erreur
    if (userCredential && userCredential.user) {
      try {
        await userCredential.user.delete();
        console.log("Compte Firebase Auth supprimé après échec d'inscription");
      } catch (deleteError) {
        console.error("Erreur suppression compte Firebase Auth:", deleteError);
      }
    }

    toast.error(`Erreur inscription: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const loginUser = async (data) => {
  try {
    const { email, telephone, password } = data;
    console.log("=== DÉBUT LOGIN ===");

    if (!telephone) {
      throw new Error("Numéro de téléphone requis pour la connexion");
    }

    // 1. Authentification Firebase Auth
    console.log("--- ÉTAPE 1: Authentification Firebase Auth ---");
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const uid = userCredential.user.uid;
    console.log("✅ Auth réussie, UID:", uid);

    // 2. Récupération document Firestore
    console.log("--- ÉTAPE 2: Recherche document Firestore ---");
    const userId = `user_${telephone.replace(/\+/, "")}`;
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error("❌ Aucun document trouvé pour téléphone:", telephone);
      throw new Error("Compte utilisateur introuvable dans la base de données");
    }

    const userData = userDoc.data();
    console.log("✅ Document trouvé:", userId);

    // 3. Vérifications sécurisées
    if (userData.uid && userData.uid !== uid) {
      throw new Error("Informations de connexion incohérentes");
    }

    if (userData.email !== email) {
      throw new Error("Les informations de connexion ne correspondent pas");
    }

    if (!userData.status) {
      throw new Error("Compte désactivé. Contactez l'administrateur");
    }

    // 4. Stocker dans localStorage
    const userDataWithId = { ...userData, id: userId, uid };
    setCurrentUser(userDataWithId);

    // 5. NOUVELLE ÉTAPE : Initialiser la présence RTDB sécurisée
    try {
      await setUserPresence(uid, userData, true);
      console.log("✅ Présence RTDB initialisée");
    } catch (presenceError) {
      console.warn("⚠️ Erreur présence RTDB:", presenceError);
    }

    // 6. NOUVELLE ÉTAPE : Vérifier et gérer les droits admin
    try {
      const isAdmin = await isUserAdmin(uid);
      if (userData.level === "admin" && !isAdmin) {
        // Synchroniser : l'utilisateur est admin dans Firestore mais pas dans RTDB
        await promoteToAdmin(uid, uid); // Auto-promotion sécurisée
        console.log("✅ Droits admin synchronisés dans RTDB");
      }
    } catch (adminError) {
      console.warn("⚠️ Erreur vérification admin RTDB:", adminError);
    }

    // 7. Chargement des données admin si nécessaire
    if (userData.level === "admin") {
      try {
        const allUsers = await loadAllUsers();
        setAllUsers(allUsers);
        await logAdminAction(uid, "LOGIN_ADMIN", uid);
      } catch (error) {
        console.warn("⚠️ Erreur chargement données admin:", error.message);
      }
    }

    // 8. Mise à jour lastLoginAt
    try {
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
      });
      console.log("✅ lastLoginAt mis à jour");
    } catch (updateError) {
      console.error("❌ Erreur mise à jour lastLoginAt:", updateError);
    }

    toast.success("Connexion réussie !");
    console.log("=== LOGIN TERMINÉ AVEC SUCCÈS ===");

    return { success: true, user: userDataWithId };
  } catch (error) {
    console.error("=== ERREUR LOGIN ===", error);

    // Messages d'erreur spécifiques
    if (error.code === "auth/user-not-found") {
      toast.error("Aucun compte trouvé avec cet email");
    } else if (error.code === "auth/wrong-password") {
      toast.error("Mot de passe incorrect");
    } else if (error.code === "auth/invalid-email") {
      toast.error("Format d'email invalide");
    } else if (error.code === "permission-denied") {
      toast.error("Accès refusé - Vérifiez vos permissions");
    } else {
      toast.error(`Erreur connexion: ${error.message}`);
    }

    return { success: false, error: error.message };
  }
};

export const logOutUser = async () => {
  try {
    console.log("=== DÉBUT LOGOUT ===");

    // 1. Nettoyer la présence RTDB de manière sécurisée
    const currentUser = getCurrentUser();
    if (currentUser?.uid) {
      try {
        await cleanupUserPresence(currentUser.uid);
        console.log("✅ Présence RTDB nettoyée");
      } catch (presenceError) {
        console.warn("⚠️ Erreur nettoyage présence:", presenceError);
      }
    }

    // 2. Logger l'action de déconnexion pour les admins
    if (currentUser?.level === "admin" && currentUser?.uid) {
      try {
        await logAdminAction(currentUser.uid, "LOGOUT_ADMIN", currentUser.uid);
      } catch (logError) {
        console.warn("⚠️ Erreur log déconnexion admin:", logError);
      }
    }

    // 3. Déconnexion Firebase Auth
    await signOut(auth);

    // 4. Nettoyer localStorage
    clearCurrentUser();
    clearAllUsers();

    toast.success("Déconnexion réussie");
    console.log("=== LOGOUT TERMINÉ ===");

    return { success: true };
  } catch (error) {
    console.error("Erreur logOutUser:", error);
    toast.error(`Erreur déconnexion: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const deleteUser = async (id) => {
  try {
    // Vérifier les permissions locales
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.level !== "admin") {
      throw new Error("Permissions insuffisantes");
    }

    // NOUVELLE ÉTAPE : Vérifier les permissions RTDB
    const isAdminRTDB = await isUserAdmin(currentUser.uid);
    if (!isAdminRTDB) {
      throw new Error("Permissions admin non confirmées");
    }

    // Récupérer les données de l'utilisateur cible
    const userDocRef = doc(db, "users", id);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("Utilisateur introuvable");
    }

    const targetUserData = userDoc.data();

    // Désactiver l'utilisateur
    await updateDoc(userDocRef, {
      status: false,
      updatedAt: serverTimestamp(),
    });

    // NOUVELLE ÉTAPE : Nettoyer la présence RTDB de l'utilisateur désactivé
    if (targetUserData.uid) {
      try {
        await cleanupUserPresence(targetUserData.uid);
        console.log("✅ Présence utilisateur désactivé nettoyée");
      } catch (presenceError) {
        console.warn(
          "⚠️ Erreur nettoyage présence utilisateur désactivé:",
          presenceError
        );
      }
    }

    // NOUVELLE ÉTAPE : Logger l'action admin
    await logAdminAction(
      currentUser.uid,
      "DELETE_USER",
      targetUserData.uid || id
    );

    // NOUVELLE ÉTAPE : Envoyer une notification à l'utilisateur désactivé
    if (targetUserData.uid) {
      try {
        await sendNotification(
          targetUserData.uid,
          "Votre compte a été désactivé par un administrateur",
          "warning"
        );
      } catch (notifError) {
        console.warn("⚠️ Erreur envoi notification:", notifError);
      }
    }

    // Mettre à jour le cache local
    if (currentUser.level === "admin") {
      try {
        const updatedUsers = await loadAllUsers();
        setAllUsers(updatedUsers);
      } catch (error) {
        console.warn("Erreur refresh cache users après delete:", error.message);
      }
    }

    toast.success("Utilisateur désactivé avec succès");
    return { success: true };
  } catch (error) {
    console.error("Erreur deleteUser:", error);
    toast.error(`Erreur suppression: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const upgradeUser = async (userId, newRole) => {
  try {
    // Vérifications de permissions
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.level !== "admin") {
      throw new Error("Seuls les administrateurs peuvent modifier les rôles");
    }

    const isAdminRTDB = await isUserAdmin(currentUser.uid);
    if (!isAdminRTDB) {
      throw new Error("Permissions admin non confirmées");
    }

    // Récupérer les données actuelles
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("Utilisateur introuvable");
    }

    const userData = userDoc.data();
    const oldRole = userData.role;

    if (oldRole === newRole) {
      throw new Error("L'utilisateur a déjà ce rôle");
    }

    // Mettre à jour Firestore
    const now = serverTimestamp();
    const newOldRoles = [
      ...userData.old_roles,
      {
        role: oldRole,
        createdAt: userData.createdAt,
        updatedAt: now,
      },
    ];

    await updateDoc(userDocRef, {
      role: newRole,
      old_roles: newOldRoles,
      updatedAt: now,
    });

    // NOUVELLE ÉTAPE : Mettre à jour la présence RTDB si l'utilisateur est connecté
    if (userData.uid) {
      try {
        await setUserPresence(
          userData.uid,
          { ...userData, role: newRole },
          true
        );
        console.log("✅ Présence RTDB mise à jour avec nouveau rôle");
      } catch (presenceError) {
        console.warn("⚠️ Erreur mise à jour présence:", presenceError);
      }
    }

    // NOUVELLE ÉTAPE : Logger l'action
    await logAdminAction(
      currentUser.uid,
      "UPGRADE_USER_ROLE",
      userData.uid || userId
    );

    // NOUVELLE ÉTAPE : Envoyer notification à l'utilisateur
    if (userData.uid) {
      try {
        await sendNotification(
          userData.uid,
          `Votre rôle a été modifié: ${oldRole} → ${newRole}`,
          "info"
        );
      } catch (notifError) {
        console.warn("⚠️ Erreur envoi notification:", notifError);
      }
    }

    // Mettre à jour le cache local
    if (currentUser.level === "admin") {
      try {
        const updatedUsers = await loadAllUsers();
        setAllUsers(updatedUsers);
      } catch (error) {
        console.warn(
          "Erreur refresh cache users après upgrade:",
          error.message
        );
      }
    }

    toast.success(`Rôle mis à jour: ${oldRole} → ${newRole}`);
    return { success: true };
  } catch (error) {
    console.error("Erreur upgradeUser:", error);
    toast.error(`Erreur mise à jour rôle: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// NOUVELLE FONCTION : Promouvoir un utilisateur en admin
export const promoteUserToAdmin = async (userId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.level !== "admin") {
      throw new Error(
        "Seuls les administrateurs peuvent promouvoir d'autres admins"
      );
    }

    const isAdminRTDB = await isUserAdmin(currentUser.uid);
    if (!isAdminRTDB) {
      throw new Error("Permissions admin non confirmées");
    }

    // Récupérer l'utilisateur cible
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("Utilisateur introuvable");
    }

    const userData = userDoc.data();

    if (userData.level === "admin") {
      throw new Error("L'utilisateur est déjà administrateur");
    }

    // Mettre à jour Firestore
    await updateDoc(userDocRef, {
      level: "admin",
      updatedAt: serverTimestamp(),
    });

    // Promouvoir dans RTDB
    await promoteToAdmin(currentUser.uid, userData.uid);

    // Envoyer notification
    if (userData.uid) {
      try {
        await sendNotification(
          userData.uid,
          "Félicitations ! Vous avez été promu administrateur",
          "success"
        );
      } catch (notifError) {
        console.warn("⚠️ Erreur envoi notification promotion:", notifError);
      }
    }

    // Refresh cache
    if (currentUser.level === "admin") {
      try {
        const updatedUsers = await loadAllUsers();
        setAllUsers(updatedUsers);
      } catch (error) {
        console.warn("Erreur refresh cache après promotion:", error.message);
      }
    }

    toast.success(`${userData.nom} ${userData.prenoms} promu administrateur`);
    return { success: true };
  } catch (error) {
    console.error("Erreur promoteUserToAdmin:", error);
    toast.error(`Erreur promotion admin: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ===========================================
// HOOKS AMÉLIORÉS
// ===========================================

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const presenceCleanupRef = useRef(null);

  // Fonction pour setup la présence RTDB sécurisée
  const setupPresence = useCallback(async (userData) => {
    if (!userData?.uid) return;

    try {
      // Nettoyer l'ancienne présence si elle existe
      if (presenceCleanupRef.current) {
        presenceCleanupRef.current();
      }

      // Configurer la nouvelle présence
      await setUserPresence(userData.uid, userData, true);

      // Le nettoyage sera géré automatiquement par les règles RTDB et onDisconnect
      console.log("✅ Présence RTDB configurée pour:", userData.uid);
    } catch (error) {
      console.error("❌ Erreur setup présence:", error);
    }
  }, []);

  // Fonction pour nettoyer la présence
  const cleanupPresence = useCallback(async (uid) => {
    if (!uid) return;

    try {
      await cleanupUserPresence(uid);
      if (presenceCleanupRef.current) {
        presenceCleanupRef.current();
        presenceCleanupRef.current = null;
      }
      console.log("✅ Présence nettoyée pour:", uid);
    } catch (error) {
      console.error("❌ Erreur nettoyage présence:", error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Vérifier localStorage d'abord
    const localUser = getCurrentUser();
    if (localUser && mounted) {
      setUser(localUser);
      setupPresence(localUser);
    }

    // 2. Écouter les changements d'auth
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (!mounted) return;

      if (authUser) {
        // Utilisateur connecté
        const storedUser = getCurrentUser();
        if (storedUser?.id) {
          const userDocRef = doc(db, "users", storedUser.id);

          // Écouter les changements Firestore
          unsubscribeRef.current = onSnapshot(
            userDocRef,
            async (docSnapshot) => {
              if (!mounted) return;

              if (docSnapshot.exists()) {
                const userData = docSnapshot.data();

                // Vérifier si le compte est toujours actif
                if (!userData.status) {
                  toast.error("Votre compte a été désactivé");
                  await logOutUser();
                  return;
                }

                const updatedUser = {
                  ...userData,
                  id: storedUser.id,
                  uid: authUser.uid,
                };

                // Vérifier les changements de droits admin
                if (
                  storedUser.level === "admin" &&
                  userData.level !== "admin"
                ) {
                  clearAllUsers();
                  toast.info("Vos droits administrateur ont été révoqués");
                }

                if (mounted) {
                  setUser(updatedUser);
                  setCurrentUser(updatedUser);
                  setupPresence(updatedUser);
                  setLoading(false);
                  setError(null);
                }
              } else {
                toast.error("Compte utilisateur introuvable");
                await logOutUser();
              }
            },
            (error) => {
              if (mounted) {
                console.error("Erreur onSnapshot user:", error);
                setError(error.message);
                setLoading(false);
              }
            }
          );
        }
      } else {
        // Utilisateur déconnecté
        const currentUid = user?.uid;
        if (currentUid) {
          await cleanupPresence(currentUid);
        }

        if (mounted) {
          clearCurrentUser();
          setUser(null);
          setLoading(false);
        }
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      unsubscribeAuth();

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      if (user?.uid) {
        cleanupPresence(user.uid);
      }
    };
  }, []); // Pas de dépendances pour éviter les boucles

  return { user, loading, error };
};

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useUser();

  // Fonction pour refresh les users
  const refreshUsers = useCallback(async () => {
    try {
      const allUsers = await loadAllUsers();
      setUsers(allUsers);
      setAllUsers(allUsers);
      setError(null);
    } catch (err) {
      console.error("Erreur refresh users:", err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    // Vérifier si l'utilisateur est admin
    if (!currentUser || currentUser.level !== "admin") {
      setUsers([]);
      setLoading(false);
      return;
    }

    // Charger depuis le cache d'abord
    const cachedUsers = getAllUsers();
    if (cachedUsers) {
      setUsers(cachedUsers);
    }

    // Charger les données fraîches
    refreshUsers().finally(() => setLoading(false));
  }, [currentUser, refreshUsers]);

  return { users, loading, error, refreshUsers };
};

export const useConnectedUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { users } = useUsers();
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Utiliser la fonction RTDB helper sécurisée
    unsubscribeRef.current = listenToOnlineUsers((connectedUsers) => {
      try {
        // Enrichir les données de présence avec les informations complètes des users
        const enrichedUsers = connectedUsers.map((connectedUser) => {
          // Trouver l'utilisateur complet correspondant
          const fullUser = users.find(
            (user) =>
              user.uid === connectedUser.uid ||
              (user.nom === connectedUser.nom &&
                JSON.stringify(user.prenoms) ===
                  JSON.stringify(connectedUser.prenoms))
          );

          return {
            ...connectedUser,
            ...(fullUser || {}), // Fusionner avec les données complètes
            isConnected: true,
            lastSeen: connectedUser.lastSeen || new Date(),
          };
        });

        setOnlineUsers(enrichedUsers);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Erreur traitement utilisateurs connectés:", err);
        setError(err.message);
        setLoading(false);
      }
    });

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [users]);

  // Combiner tous les utilisateurs avec leur statut de connexion
  const allUsers = useMemo(() => {
    return users.map((user) => {
      const connectedUser = onlineUsers.find(
        (online) =>
          online.uid === user.uid ||
          (online.nom === user.nom &&
            JSON.stringify(online.prenoms) === JSON.stringify(user.prenoms))
      );

      return {
        ...user,
        isConnected: !!connectedUser,
        lastSeen: connectedUser?.lastSeen || null,
        onlineData: connectedUser || null,
      };
    });
  }, [users, onlineUsers]);

  const connectedCount = onlineUsers.length;

  return {
    allUsers,
    onlineUsers,
    connectedCount,
    loading,
    error,
  };
};

// ===========================================
// FONCTIONS DE DEBUG
// ===========================================

// FONCTION UTILITAIRE DE DEBUG POUR VÉRIFIER UN DOCUMENT
export const debugUserDocument = async (telephone) => {
  try {
    console.log("=== DEBUG DOCUMENT USER ===");
    const userId = `user_${telephone.replace(/\+/, "")}`;
    console.log("User ID:", userId);

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    console.log("Document existe:", userDoc.exists());
    if (userDoc.exists()) {
      console.log("Document data:", userDoc.data());
      console.log("Métadonnées:", {
        fromCache: userDoc.metadata.fromCache,
        hasPendingWrites: userDoc.metadata.hasPendingWrites,
      });
    }

    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Erreur debug document:", error);
    return null;
  }
};

// FONCTION UTILITAIRE POUR DÉBUGGER LES RÈGLES FIRESTORE
export const debugFirestoreRules = async (userId) => {
  console.log("=== DEBUG RÈGLES FIRESTORE ===");

  try {
    const userDocRef = doc(db, "users", userId);

    // Test de lecture
    console.log("Test lecture document:", userDocRef.path);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      console.log("✅ Lecture autorisée");
      console.log("Document data:", docSnap.data());
    } else {
      console.log("❌ Document n'existe pas ou lecture refusée");
    }

    // Test de mise à jour (lastLoginAt)
    console.log("Test mise à jour lastLoginAt...");
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
    });
    console.log("✅ Mise à jour autorisée");
  } catch (error) {
    console.error("❌ Erreur règles Firestore:", {
      code: error.code,
      message: error.message,
      details: error,
    });
  }
};

// FONCTION DE TEST POUR VÉRIFIER L'AUTHENTIFICATION
export const testAuthState = () => {
  console.log("=== TEST ÉTAT AUTHENTIFICATION ===");

  const user = auth.currentUser;
  if (user) {
    console.log("✅ Utilisateur connecté:", {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      accessToken: user.accessToken ? "Présent" : "Absent",
      refreshToken: user.refreshToken ? "Présent" : "Absent",
    });

    // Test du token
    user
      .getIdToken(true)
      .then((token) => {
        console.log("Token ID récupéré:", token ? "Présent" : "Absent");
        if (token) {
          // Décoder le token pour voir les claims
          const payload = JSON.parse(atob(token.split(".")[1]));
          console.log("Claims du token:", {
            email: payload.email,
            email_verified: payload.email_verified,
            exp: new Date(payload.exp * 1000),
            iat: new Date(payload.iat * 1000),
          });
        }
      })
      .catch((error) => {
        console.error("❌ Erreur récupération token:", error);
      });
  } else {
    console.log("❌ Aucun utilisateur connecté");
  }

  return user;
};

// NOUVEAU HOOK : Notifications utilisateur
export { useUserNotifications };

// ===========================================
// FONCTIONS UTILITAIRES EXPORTÉES
// ===========================================

export {
  // Fonctions RTDB réexportées pour faciliter l'utilisation
  isUserAdmin,
  promoteToAdmin,
  logAdminAction,
  sendNotification,
  bootstrapFirstAdmin,
};
