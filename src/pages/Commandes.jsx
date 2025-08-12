import { useEffect, useState, useMemo } from "react";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/firebase";
import CommandeCardMobile from "@/components/CommandeCardMobile";
import HeaderNav from "@/components/HeaderNav";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMenus,
  useBoissons,
  useAdressesLivraison,
  usePointDeVente,
} from "../components/commandeToolkit";

const commandesParPage = 100;

export default function CommandesPage() {
  const menus = useMenus();
  const boissons = useBoissons();
  const adresses = useAdressesLivraison();
  const pointDeVentes = usePointDeVente();
  const [commandes, setCommandes] = useState([]);

  // Récupération en temps réel des commandes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "commandes"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCommandes(data);
    });
    return () => unsub();
  }, []);

  return (
    // ⬇️ Container plein écran en colonne
    <div className="min-h-screen flex flex-col">
      <HeaderNav />

      {/* Zone qui prend tout l'espace restant */}
      <div className="flex-1 px-2">
        {/* Systeme de filtres */}
        <div className="flex justify-between items-center pt-4">
          {/* ... */}
        </div>
        {/* ⬇️ Le ScrollArea s'étire sur toute la hauteur disponible */}
        <ScrollArea className="h-full pr-2">
          <div className="space-y-2 py-2">
            {commandes?.length > 0 ? (
              commandes.map((commande) => (
                <CommandeCardMobile
                  key={commande.id}
                  commande={commande}
                  menus={menus}
                  boissons={boissons}
                  adresses={adresses}
                  pointDeVentes={pointDeVentes?.data}
                  onModifier={() => setCommandeAModifier(commande)}
                />
              ))
            ) : (
              <div className="text-gray-500 text-center p-4">
                Aucune commande ne correspond à ces critères.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center pt-4">
            {/* ... */}
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs (portals) */}
    </div>
  );
}
