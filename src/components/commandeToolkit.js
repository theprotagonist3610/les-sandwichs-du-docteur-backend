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

// --- LOGIQUE ---

export async function getNextOrderNumber({ annee, sexe }) {
  const counterRef = doc(db, "counter_commande", `${annee}${sexe}`);
  let nextNum = 1;
  await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    if (!counterSnap.exists()) {
      transaction.set(counterRef, { lastOrder: 1 });
      nextNum = 1;
    } else {
      const last = counterSnap.data().lastOrder || 0;
      nextNum = last + 1;
      transaction.update(counterRef, { lastOrder: nextNum });
    }
  });
  return nextNum.toString().padStart(5, "0");
}

export async function generateCodeCommande({ annee, sexe, type_commande }) {
  const numero = await getNextOrderNumber({ annee, sexe });
  return `${annee}${sexe}${numero}-${type_commande}`;
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

export function validateCommande(data) {
  const errors = [];
  const isString = (val) => typeof val === "string" && val.trim().length > 0;
  const isPhone = (val) => /^(\+?\d{8,15})$/.test(val);

  if (!isString(data.prenom_client)) errors.push("Prénom client requis.");
  if (!isString(data.telephone) || !isPhone(data.telephone))
    errors.push("Téléphone invalide.");
  if (!["direct", "whatsapp"].includes(data.type_appel))
    errors.push("Type d'appel invalide.");
  if (!isString(data.adresse)) errors.push("Adresse requise.");
  if (!data.date_livraison || !(data.date_livraison instanceof Date))
    errors.push("Date livraison invalide.");
  if (!isString(data.heure_livraison)) errors.push("Heure livraison requise.");
  if (!isString(data.numero_livraison) || !isPhone(data.numero_livraison))
    errors.push("Numéro de livraison invalide.");
  if (!["BB Express", "Smart Transport", ""].includes(data.livreur))
    errors.push("Livreur invalide.");
  if (!isString(data.vendeuse)) errors.push("Vendeuse requise.");

  if (!data.paiement || typeof data.paiement !== "object")
    errors.push("Objet paiement requis.");
  else {
    if (typeof data.paiement.solde !== "boolean")
      errors.push("Statut paiement invalide.");
    if (
      !["momo", "especes", "momo+especes", "plus_tard"].includes(
        data.paiement.type
      )
    )
      errors.push("Type de paiement invalide.");
    if (
      ["momo", "especes", "momo+especes"].includes(data.paiement.type) &&
      typeof data.cout_total !== "number"
    )
      errors.push("Montant total requis et numérique.");
    if (data.paiement.type === "momo+especes") {
      if (
        typeof data.paiement.montant_momo !== "number" ||
        typeof data.paiement.montant_especes !== "number" ||
        data.paiement.montant_momo + data.paiement.montant_especes !==
          data.cout_total
      ) {
        errors.push("Montants MoMo et Espèces invalides ou incohérents.");
      }
    }
    if (
      data.paiement.type === "momo" &&
      data.paiement.montant_momo !== data.cout_total
    ) {
      errors.push("Montant MoMo doit égaler le total.");
    }
    if (
      data.paiement.type === "especes" &&
      typeof data.paiement.montant_especes !== "number"
    ) {
      errors.push("Montant espèces requis.");
    }
    if (
      data.paiement.type === "plus_tard" &&
      data.paiement.reste_a_devoir !== data.cout_total
    ) {
      errors.push("Le reste à devoir doit égaler le montant total.");
    }
  }

  if (!Array.isArray(data.produits) || data.produits.length === 0)
    errors.push("Liste produits requise.");
  else {
    data.produits.forEach((p, i) => {
      if (!isString(p.nom)) errors.push(`Produit ${i + 1}: nom requis.`);
      if (typeof p.quantite !== "number" || p.quantite <= 0)
        errors.push(`Produit ${p.nom}: quantité invalide.`);
      if (typeof p.prix_unitaire !== "number" || p.prix_unitaire < 0)
        errors.push(`Produit ${p.nom}: prix unitaire invalide.`);
    });
  }

  if (!/^20\d{2}[HF]\d{5}-[CPG]$/.test(data.code_commande)) {
    errors.push("Code commande invalide.");
  }

  return errors.length === 0 ? true : errors;
}

export async function saveCommande(rawCommande) {
  const validation = validateCommande(rawCommande);
  if (validation !== true) {
    throw new Error("Validation erreur(s):\n" + validation.join("\n"));
  }

  const commande = {
    ...rawCommande,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const commandeRef = doc(db, "commandes", rawCommande.code_commande);
  // await setDoc(commandeRef, commande);
  console.log(commande);
  return commande;
}

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
    paiement: JSON.stringify(data.paiement),
    client: data.nom,
    telephone_client: data.numero,
    type_appel: data.type_appel,
    point_de_vente: data.point_de_vente,
    createdAt: Date.now(),
    vendeur: data.vendeur,
    paiement: data.statut_paiement,
  };
  console.log(command);
}
function aLivrerCommand(data) {
  console.log(data);
}
export function createCommand(data, type) {
  const newCommand =
    type === "sur place" ? surPlaceCommand(data) : aLivrerCommand(data);

  //console.log(newCommand);
}
