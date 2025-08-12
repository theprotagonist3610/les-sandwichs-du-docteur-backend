// CommandeToolkit.js
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  Timestamp,
} from "firebase/firestore";

import { useEffect, useState } from "react";

// --- HOOKS ---

function useItemsByType(type) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const snapshot = await getDocs(collection(db, "menus"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItems(data.filter((m) => m.type === type && m.disponible));
    };
    fetch();
  }, [type]);

  return items;
}

export function useMenus() {
  return useItemsByType("menu");
}

export function useBoissons() {
  return useItemsByType("boisson");
}

export function useLivreurs() {
  const [livreurs, setLivreurs] = useState([]);

  useEffect(() => {
    const fetchLivreurs = async () => {
      const snapshot = await getDocs(collection(db, "utils/livreurs/options"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLivreurs(data);
    };
    fetchLivreurs();
  }, []);

  return livreurs;
}

export function useAdressesLivraison() {
  const [adresses, setAdresses] = useState([]);

  useEffect(() => {
    const fetchAdresses = async () => {
      const snapshot = await getDocs(collection(db, "utils/adresses/options"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAdresses(data);
    };
    fetchAdresses();
  }, []);

  return adresses;
}

export function useMoyensPaiement() {
  const [moyens, setMoyens] = useState([]);

  useEffect(() => {
    const fetchMoyens = async () => {
      const snapshot = await getDocs(collection(db, "utils/moyens/options"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMoyens(data);
    };
    fetchMoyens();
  }, []);

  return moyens;
}

export function useTodayCommand() {
  const [commandes, setCommandes] = useState([]);

  useEffect(() => {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    const commandesQuery = query(
      collection(db, "commandes"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(commandesQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCommandes(data);
    });

    return () => unsubscribe();
  }, []);

  return commandes;
}

export function usePointDeVente() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "utils", "points_vente", "options")
        );
        const points = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(points);
      } catch (error) {
        console.error("Erreur chargement des points de vente :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, []);

  return { data, loading };
}
// --- FONCTIONS DE COMMUNICATION ---
export function sendMessageToLivreur() {}
// --- LOGIQUE ---
export async function getNextOrderNumber({ annee, mois, sexe, typeCommande }) {
  const docRef = doc(db, "counter_commande", annee.toString());
  const moisKey = mois.toString().padStart(2, "0"); // toujours sur 2 chiffres
  let nextNum = 1;

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    let data = {};

    if (!docSnap.exists()) {
      // Nouveau document pour cette année
      data = { [moisKey]: { [sexe]: 1 } };
      transaction.set(docRef, data);
      nextNum = 1;
    } else {
      data = docSnap.data();

      // Si le mois n’existe pas encore
      if (!data[moisKey]) {
        data[moisKey] = { [sexe]: 1 };
        nextNum = 1;
      }
      // Si le sexe n’existe pas encore pour ce mois
      else if (!data[moisKey][sexe]) {
        data[moisKey][sexe] = 1;
        nextNum = 1;
      } else {
        nextNum = data[moisKey][sexe] + 1;
        data[moisKey][sexe] = nextNum;
      }

      transaction.set(docRef, data, { merge: true });
    }
  });

  const numero = nextNum.toString().padStart(5, "0");
  const code = `${annee}${moisKey}${sexe}${numero}-${typeCommande}`;
  return code;
}

export async function generateCodeCommande({ annee, sexe, type_commande }) {
  const month = new Date().getMonth() + 1;
  const numero = await getNextOrderNumber({
    annee,
    mois: month,
    sexe,
    typeCommande: type_commande,
  });
  return numero;
}

export async function fetchTarifsLivraison() {
  const snapshot = await getDocs(collection(db, "utils/adresses/options"));
  const data = snapshot.docs.map((doc) => doc.data());

  const tarifs = {};
  data.forEach((addr) => {
    if (addr.quartier && Array.isArray(addr.tarifs) && addr.tarifs.length > 0) {
      const total = addr.tarifs.reduce((sum, t) => sum + (t.tarif || 0), 0);
      tarifs[addr.quartier] = Math.round(total / addr.tarifs.length);
    }
  });
  return tarifs;
}

export function validateCommande(data, mode = "sur place") {
  const errors = {};
  const cleanData = { ...data };

  // --- 1. Convertir les montants en Number ---
  const montantFields = ["cout_total", "prix_livraison"];
  montantFields.forEach((field) => {
    if (field in cleanData) {
      const value = cleanData[field];
      const num = Number(value);
      if (isNaN(num)) {
        errors[field] = "Doit être un nombre";
      } else {
        cleanData[field] = num;
      }
    }
  });

  // --- 2. Convertir les dates en Timestamp Firestore ---
  const dateFields = ["createdAt", "date_livraison"];
  dateFields.forEach((field) => {
    const value = cleanData[field];
    if (value && !(value instanceof Timestamp)) {
      try {
        const dateObj = value instanceof Date ? value : new Date(value);
        cleanData[field] = Timestamp.fromDate(dateObj);
      } catch {
        errors[field] = "Date invalide";
      }
    }
  });

  // --- 3. Champs obligatoires communs ---
  const commonFields = [
    "code_commande",
    "cout_total",
    "details_commande",
    "paiement",
    "client",
    "point_de_vente",
    "createdAt",
    "vendeur",
    "paiement_statut",
  ];
  commonFields.forEach((field) => {
    if (
      cleanData[field] === undefined ||
      cleanData[field] === null ||
      cleanData[field].toString().trim() === ""
    ) {
      errors[field] = "Champ requis";
    }
  });

  // --- 4. Statut (sur place uniquement) ---
  if (mode === "sur place") {
    if (!["servi", "non servi"].includes(cleanData.statut)) {
      errors.statut = "Statut invalide (attendu : 'servi' ou 'non servi')";
    }
  }

  // --- 5. Champs spécifiques à la livraison ---
  if (mode === "a livrer") {
    const deliveryFields = ["adresse", "numero_a_livrer", "prenom_a_livrer"];
    deliveryFields.forEach((field) => {
      if (
        cleanData[field] === undefined ||
        cleanData[field] === null ||
        cleanData[field].toString().trim() === ""
      ) {
        errors[field] = "Champ requis pour la livraison";
      }
    });
  }

  // --- 6. Vérification de details_commande ---
  try {
    if (!Array.isArray(JSON.parse(cleanData.details_commande))) {
      throw new Error("details_commande n'est pas un tableau");
    }

    JSON.parse(cleanData.details_commande)?.forEach((item, index) => {
      if (typeof item !== "object" || item === null) {
        errors[`details_commande[${index}]`] =
          "Chaque élément doit être un objet";
      }
    });
  } catch (err) {
    errors.details_commande =
      "details_commande doit être un tableau JSON valide";
  }

  // --- 7. Vérification de paiement ---
  const paiementObj = JSON.parse(cleanData.paiement);
  if (typeof paiementObj !== "object" || paiementObj === null) {
    errors.paiement = "paiement doit être un objet JSON";
  } else {
    const requiredFields = [
      "total",
      "montant_recu",
      "montant_recu_especes",
      "montant_recu_momo",
      "reliquat_rendu",
      "reste_a_devoir",
      "dette",
    ];
    requiredFields.forEach((field) => {
      const val = paiementObj[field];
      if (val === undefined || val === null || isNaN(Number(val))) {
        errors[`paiement.${field}`] = "Ce champ doit être un nombre";
      } else {
        paiementObj[field] = Number(val);
      }
    });
  }

  // --- 8. Vérification du paiement_statut ---
  const statutValide = ["paye", "non paye", "partiel"];
  if (!statutValide.includes(cleanData.paiement_statut)) {
    errors.paiement_statut = "Statut invalide (paye, non paye ou partiel)";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: cleanData,
  };
}

export async function saveCommande(rawCommande, typeCommande) {
  const validation = validateCommande(rawCommande, typeCommande);
  let commande = {},
    error = null;
  try {
    if (validation.valid) {
      commande = {
        typeCommande,
        ...rawCommande,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
    }
    const commandeRef = doc(db, "commandes", rawCommande.code_commande);
    await setDoc(commandeRef, commande);
  } catch (e) {
    if (e) error = e;
  }
  return error ? false : rawCommande.code_commande;
}
export async function updateCommande() {}

//
async function surPlaceCommand(data) {
  const command = {
    code_commande: await generateCodeCommande({
      annee: `${new Date().getFullYear()}`,
      sexe: data.sexe,
      type_commande: data.typeCommande,
    }),
    cout_total: data.actualCommand.reduce(
      (sum, item) => sum + item.quantite * item.prix,
      0
    ),
    details_commande: JSON.stringify(data.actualCommand),
    paiement: JSON.stringify(data.paiement.infos),
    client: data.nom,
    telephone_client: data.numero,
    type_appel: data.type_appel,
    point_de_vente: data.point_de_vente,
    createdAt: Date.now(),
    vendeur: data.vendeur,
    paiement_statut: data.paiement.statut,
    statut: "non servi",
  };
  return command;
}
async function aLivrerCommand(data) {
  const command = {
    adresse: data.adresse,
    code_commande: await generateCodeCommande({
      annee: `${new Date().getFullYear()}`,
      sexe: data.sexe,
      type_commande: data.typeCommande,
    }),
    cout_total: data.actualCommand.reduce(
      (sum, item) => sum + item.quantite * item.prix,
      0
    ),
    date_livraison: data.dateLivraison,
    heure_livraison: data.heureLivraison,
    indication_adresse: data.indication,
    livreur: "",
    details_commande: JSON.stringify(data.actualCommand),
    paiement: JSON.stringify(data.paiement.infos),
    client: data.nom,
    telephone_client: data.numero,
    numero_a_livrer: data.numeroLivraison,
    prenom_a_livrer: data.prenomLivraison,
    type_appel: data.typeAppel,
    prix_livraison: data.paiement.infos.prix_livraison,
    statut_livraison: "non livree",
    incident_livraison: "",
    point_de_vente: data.point_de_vente,
    createdAt: Date.now(),
    vendeur: data.vendeur,
    paiement_statut: data.paiement.statut,
  };
  return command;
}
export async function createCommand(data, type) {
  const newCommand =
    type === "sur place"
      ? await saveCommande(await surPlaceCommand(data), "sur place")
      : await saveCommande(await aLivrerCommand(data), "a livrer");
  return newCommand;
}
