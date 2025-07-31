import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

export function useCurrentUser() {
  const [user, setUser] = useState(undefined); // ⚠️ undefined = loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setUser(snapshot.data());
        } else {
          setUser(false); // pas trouvé en base
        }
      } else {
        setUser(false); // non connecté
      }
    });

    return () => unsubscribe();
  }, []);

  return user;
}
