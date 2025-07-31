import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase"; // ou adapte le chemin vers ton instance Firestore

function useItemsByType(type) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "menus"));
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const filtered = items.filter((m) => m.type === type && m.disponible);
        setData(filtered);
      } catch (error) {
        console.error("Erreur lors du chargement des menus :", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [type]);
  return { data, loading };
}

export function useMenus() {
  return useItemsByType("menu");
}

export function useBoissons() {
  return useItemsByType("boisson");
}

export function useTodayCommand() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const commandes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(commandes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { data, loading };
}

function surPlaceCommand(data) {
  console.log(data);
}
function aLivrerCommand(data) {
  console.log(data);
}
export function createCommand(data, type) {
  const newCommand =
    type === "sur place" ? surPlaceCommand(data) : aLivrerCommand(data);

  //console.log(newCommand);
}
