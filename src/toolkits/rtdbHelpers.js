// rtdb/rtdbHelpers.js
import {
  ref,
  set,
  get,
  onValue,
  off,
  serverTimestamp,
} from "firebase/database";
import { rtdb } from "@/firebase";

/**
 * Fonction sécurisée pour définir la présence d'un utilisateur
 * @param {string} uid - UID de l'utilisateur
 * @param {Object} userData - Données utilisateur (role, nom, prenoms)
 * @param {boolean} online - État en ligne
 */
export const setUserPresence = async (uid, userData, online = true) => {
  try {
    const presenceRef = ref(rtdb, `presence/${uid}`);
    const presenceData = {
      online,
      lastSeen: serverTimestamp(),
      role: userData.role || "user",
      nom: userData.nom || "",
      prenoms: userData.prenoms || "",
      level: userData.level || "user",
    };
    await set(presenceRef, presenceData);
    console.log("✅ Présence mise à jour:", uid, online);
  } catch (error) {
    console.error("❌ Erreur mise à jour présence:", error);
    throw error;
  }
};

/**
 * Fonction pour nettoyer/supprimer la présence d'un utilisateur
 * @param {string} uid - UID de l'utilisateur
 */
export const cleanupUserPresence = async (uid) => {
  try {
    const presenceRef = ref(rtdb, `presence/${uid}`);
    await set(presenceRef, null); // Supprimer complètement la présence
    console.log("✅ Présence nettoyée:", uid);
  } catch (error) {
    console.error("❌ Erreur nettoyage présence:", error);
    throw error;
  }
};

/**
 * Fonction pour écouter les utilisateurs en ligne
 * @param {Function} callback - Fonction callback avec la liste des utilisateurs
 * @returns {Function} - Fonction de désabonnement
 */
export const listenToOnlineUsers = (callback) => {
  const presenceRef = ref(rtdb, "presence");

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      const onlineUsers = [];

      if (snapshot.exists()) {
        const presenceData = snapshot.val();

        Object.entries(presenceData).forEach(([uid, userData]) => {
          if (userData.online) {
            onlineUsers.push({
              uid,
              ...userData,
              lastSeen: new Date(userData.lastSeen),
            });
          }
        });
      }

      callback(onlineUsers);
    },
    (error) => {
      console.error("❌ Erreur écoute présence:", error);
      callback([]);
    }
  );

  return () => off(presenceRef, "value", unsubscribe);
};

/**
 * Fonction sécurisée pour vérifier si un utilisateur est admin
 * @param {string} uid - UID à vérifier
 * @returns {Promise<boolean>} - True si admin
 */
export const isUserAdmin = async (uid) => {
  try {
    const adminRef = ref(rtdb, `admins/${uid}`);
    const snapshot = await get(adminRef);
    return snapshot.exists() && snapshot.val() === true;
  } catch (error) {
    console.error("❌ Erreur vérification admin:", error);
    return false;
  }
};

/**
 * Fonction pour promouvoir un utilisateur en admin (admin seulement)
 * @param {string} currentAdminUid - UID de l'admin actuel
 * @param {string} targetUid - UID à promouvoir
 */
export const promoteToAdmin = async (currentAdminUid, targetUid) => {
  try {
    // Vérifier que l'utilisateur actuel est admin
    const isAdmin = await isUserAdmin(currentAdminUid);
    if (!isAdmin) {
      throw new Error("Permissions insuffisantes");
    }

    // Promouvoir le nouvel admin
    const adminRef = ref(rtdb, `admins/${targetUid}`);
    await set(adminRef, true);

    // Logger l'action
    await logAdminAction(currentAdminUid, "PROMOTE_ADMIN", targetUid);

    console.log("✅ Utilisateur promu admin:", targetUid);
  } catch (error) {
    console.error("❌ Erreur promotion admin:", error);
    throw error;
  }
};

/**
 * Fonction pour logger les actions administratives
 * @param {string} adminUid - UID de l'admin
 * @param {string} action - Type d'action
 * @param {string} targetUid - UID cible
 */
export const logAdminAction = async (adminUid, action, targetUid = null) => {
  try {
    const logRef = ref(rtdb, `admin_logs/${Date.now()}_${adminUid}`);
    const logData = {
      timestamp: serverTimestamp(),
      admin_uid: adminUid,
      action,
      target_uid: targetUid,
    };

    await set(logRef, logData);
  } catch (error) {
    console.error("❌ Erreur log admin:", error);
    // Ne pas faire échouer l'action principale pour un problème de log
  }
};

/**
 * Fonction pour envoyer une notification à un utilisateur
 * @param {string} targetUid - UID du destinataire
 * @param {string} message - Message de notification
 * @param {string} type - Type de notification (info, warning, error, success)
 */
export const sendNotification = async (targetUid, message, type = "info") => {
  try {
    const notificationRef = ref(
      rtdb,
      `notifications/${targetUid}/${Date.now()}`
    );
    const notificationData = {
      message,
      timestamp: serverTimestamp(),
      type,
      read: false,
    };

    await set(notificationRef, notificationData);
    console.log("✅ Notification envoyée:", targetUid);
  } catch (error) {
    console.error("❌ Erreur envoi notification:", error);
    throw error;
  }
};

/**
 * Hook React pour écouter les notifications d'un utilisateur
 * @param {string} uid - UID de l'utilisateur
 * @returns {Array} - Tableau des notifications
 */
export const useUserNotifications = (uid) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const notificationsRef = ref(rtdb, `notifications/${uid}`);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const notificationsList = [];

      if (snapshot.exists()) {
        const notificationsData = snapshot.val();

        Object.entries(notificationsData).forEach(([id, notification]) => {
          notificationsList.push({
            id,
            ...notification,
            timestamp: new Date(notification.timestamp),
          });
        });

        // Trier par timestamp décroissant
        notificationsList.sort((a, b) => b.timestamp - a.timestamp);
      }

      setNotifications(notificationsList);
    });

    return () => off(notificationsRef, "value", unsubscribe);
  }, [uid]);

  return notifications;
};

/**
 * Fonction pour envoyer une commande à un utilisateur (admin seulement)
 * @param {string} targetUid - UID du destinataire
 * @param {Object} commandeData - Données de la commande
 */
export const createCommande = async (targetUid, commandeData) => {
  try {
    const commandeRef = ref(rtdb, `commandes/${targetUid}/${Date.now()}`);
    const commande = {
      ...commandeData,
      timestamp: serverTimestamp(),
      status: commandeData.status || "pending",
    };

    await set(commandeRef, commande);
    console.log("✅ Commande créée:", targetUid);
  } catch (error) {
    console.error("❌ Erreur création commande:", error);
    throw error;
  }
};

/**
 * Fonction pour créer une production (admin seulement)
 * @param {string} targetUid - UID de l'utilisateur responsable
 * @param {Object} productionData - Données de production
 */
export const createProduction = async (targetUid, productionData) => {
  try {
    const productionRef = ref(rtdb, `productions/${targetUid}/${Date.now()}`);
    const production = {
      ...productionData,
      timestamp: serverTimestamp(),
      status: productionData.status || "planned",
    };

    await set(productionRef, production);
    console.log("✅ Production créée:", targetUid);
  } catch (error) {
    console.error("❌ Erreur création production:", error);
    throw error;
  }
};

/**
 * Fonction pour envoyer un ping à un utilisateur (admin seulement)
 * @param {string} targetUid - UID du destinataire
 */
export const sendPing = async (targetUid) => {
  try {
    const pingRef = ref(rtdb, `ping/${targetUid}`);
    const pingData = {
      timestamp: serverTimestamp(),
    };

    await set(pingRef, pingData);
    console.log("✅ Ping envoyé:", targetUid);
  } catch (error) {
    console.error("❌ Erreur envoi ping:", error);
    throw error;
  }
};

/**
 * Hook pour écouter les commandes d'un utilisateur
 * @param {string} uid - UID de l'utilisateur
 * @returns {Array} - Tableau des commandes
 */
export const useUserCommandes = (uid) => {
  const [commandes, setCommandes] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const commandesRef = ref(rtdb, `commandes/${uid}`);

    const unsubscribe = onValue(commandesRef, (snapshot) => {
      const commandesList = [];

      if (snapshot.exists()) {
        const commandesData = snapshot.val();

        Object.entries(commandesData).forEach(([id, commande]) => {
          commandesList.push({
            id,
            ...commande,
            timestamp: new Date(commande.timestamp),
          });
        });

        // Trier par timestamp décroissant
        commandesList.sort((a, b) => b.timestamp - a.timestamp);
      }

      setCommandes(commandesList);
    });

    return () => off(commandesRef, "value", unsubscribe);
  }, [uid]);

  return commandes;
};

/**
 * Hook pour écouter les productions d'un utilisateur
 * @param {string} uid - UID de l'utilisateur
 * @returns {Array} - Tableau des productions
 */
export const useUserProductions = (uid) => {
  const [productions, setProductions] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const productionsRef = ref(rtdb, `productions/${uid}`);

    const unsubscribe = onValue(productionsRef, (snapshot) => {
      const productionsList = [];

      if (snapshot.exists()) {
        const productionsData = snapshot.val();

        Object.entries(productionsData).forEach(([id, production]) => {
          productionsList.push({
            id,
            ...production,
            timestamp: new Date(production.timestamp),
          });
        });

        // Trier par timestamp décroissant
        productionsList.sort((a, b) => b.timestamp - a.timestamp);
      }

      setProductions(productionsList);
    });

    return () => off(productionsRef, "value", unsubscribe);
  }, [uid]);

  return productions;
};

/**
 * Hook pour écouter les pings d'un utilisateur
 * @param {string} uid - UID de l'utilisateur
 * @returns {Object} - Dernier ping reçu
 */
export const useUserPing = (uid) => {
  const [ping, setPing] = useState(null);

  useEffect(() => {
    if (!uid) return;

    const pingRef = ref(rtdb, `ping/${uid}`);

    const unsubscribe = onValue(pingRef, (snapshot) => {
      if (snapshot.exists()) {
        const pingData = snapshot.val();
        setPing({
          ...pingData,
          timestamp: new Date(pingData.timestamp),
        });
      } else {
        setPing(null);
      }
    });

    return () => off(pingRef, "value", unsubscribe);
  }, [uid]);
};
// FONCTION BOOTSTRAP POUR LE PREMIER ADMIN
/**
 * À exécuter UNE SEULE FOIS pour créer le premier admin
 * @param {string} uid - UID du premier admin
 */
export const bootstrapFirstAdmin = async (uid) => {
  try {
    console.log("🚀 Bootstrap premier admin:", uid);

    const adminRef = ref(rtdb, `admins/${uid}`);
    await set(adminRef, true);

    await logAdminAction(uid, "BOOTSTRAP_FIRST_ADMIN", uid);

    console.log("✅ Premier admin initialisé");
  } catch (error) {
    console.error("❌ Erreur bootstrap admin:", error);
    throw error;
  }
};
