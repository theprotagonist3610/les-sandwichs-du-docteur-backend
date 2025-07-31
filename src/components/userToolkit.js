// userToolkit.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getDocs, collection, doc, setDoc, getDoc } from "firebase/firestore";

import { auth, db } from "@/firebase";

const ROLE_COLLECTIONS = [
  "utils/cuisiniers/options",
  "utils/livreurs/options",
  "utils/superviseurs/options",
  "utils/vendeuses/options",
];

// 🔎 Vérifie si l'utilisateur est présent dans une des collections de référence
export const findUserInOptions = async (email, nom, prenom) => {
  for (const path of ROLE_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, path));
    const match = snapshot.docs.find((doc) => {
      const data = doc.data();
      return (
        data.email === email &&
        data.nom === nom &&
        data.prenom === prenom &&
        data.statut === true
      );
    });
    if (match) {
      return {
        id: match.id,
        data: match.data(),
        collectionPath: path,
      };
    }
  }
  return null;
};

/**
 * 🔐 Enregistrement utilisateur avec promotion admin conditionnelle
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @param {string} telephone - Téléphone saisi par l'utilisateur
 * @param {string} nom - Nom
 * @param {string} prenom - Prénom
 * @param {string} adminCode - Code admin optionnel
 */
export const registerUser = async (
  email,
  password,
  telephone,
  nom,
  prenom,
  adminCode = ""
) => {
  const found = await findUserInOptions(email, nom, prenom);
  if (!found) throw new Error("Utilisateur non autorisé ou inactif.");

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const firebaseUser = userCredential.user;

  const role =
    adminCode === import.meta.env.VITE_ADMINROLEGRANT ? "admin" : "user";

  const userData = {
    email,
    numero: telephone || "", // ✅ utilise le numéro saisi
    nom,
    prenom,
    role,
    fonction: found.data.fonction || "",
    app_id: found.id,
  };

  await setDoc(doc(db, "users", firebaseUser.uid), userData);
  await updateProfile(firebaseUser, { displayName: `${prenom} ${nom}` });

  return userData;
};

// 🔐 Connexion avec email + récupération des données utilisateur
export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  const docRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) throw new Error("Profil utilisateur introuvable.");
  return snapshot.data();
};

// 🔓 Déconnexion complète : auth + localStorage + cache
export const logout = async () => {
  await signOut(auth);
  localStorage.clear();
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
};
