// src/components/useCurrentUser.jsx
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

export function useCurrentUser() {
  // état initial = chargement
  const [user, setUser] = useState({ loading: true });

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      // Pas connecté
      if (!firebaseUser) {
        setUser({ loading: false, uid: null });
        return;
      }

      // Connecté → récupérer le profil Firestore
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const profile = snap.exists() ? snap.data() : {};

        // On renvoie uid + profil à plat (fonction, prenom, etc.)
        if (active)
          setUser({ loading: false, uid: firebaseUser.uid, ...profile });
      } catch (e) {
        // En cas d'erreur Firestore, on expose au moins l'uid
        if (active) setUser({ loading: false, uid: firebaseUser.uid });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return user; // { loading:boolean, uid:string|null, ...profil }
}
