/**
 * useCurrentUser.js
 * Hook pour récupérer l'utilisateur connecté actuel
 * Encapsule la logique de récupération de l'utilisateur via le système existant
 */

import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { getUser } from "@/toolkits/admin/userToolkit";

/**
 * Hook pour récupérer automatiquement l'utilisateur connecté
 * @returns {Object} { user, loading, isAdmin }
 */
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Récupérer l'utilisateur via le système existant
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          // Charger les données complètes depuis Firestore
          const userData = await getUser(currentUser.uid);
          setUser(userData);
          setIsAdmin(userData?.role === "admin");
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("❌ Erreur chargement utilisateur:", error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return {
    user,
    loading,
    isAdmin,
  };
}
