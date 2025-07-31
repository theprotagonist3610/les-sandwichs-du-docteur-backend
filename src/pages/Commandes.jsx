import { useEffect, useState, useMemo } from "react";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/firebase";
import CommandeCardMobile from "@/components/CommandeCardMobile";
import ModifierCommandeDialog from "@/components/ModifierCommandeDialog";
import HeaderCommandes from "@/components/HeaderCommandes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const commandesParPage = 100;

export default function CommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState({
    statut: "",
    paiement: "",
    livreur: "",
    coutMin: "",
    coutMax: "",
    dateRange: undefined, // {from: Date, to: Date}
  });
  const [commandeAModifier, setCommandeAModifier] = useState(null);
  const [page, setPage] = useState(0);

  // Récupération en temps réel des commandes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "commandes"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCommandes(data);
    });
    return () => unsub();
  }, []);

  // Filtrage (tous critères)
  const filtered = useMemo(() => {
    return commandes.filter((cmd) => {
      // Recherche textuelle sur client ou code
      const matchSearch =
        (cmd.prenom_client?.toLowerCase() ?? "").includes(
          search.toLowerCase()
        ) ||
        (cmd.code_commande?.toLowerCase() ?? "").includes(search.toLowerCase());

      // Statut
      const matchStatut = !filtre.statut || cmd.statut === filtre.statut;
      // Paiement
      const matchPaiement =
        !filtre.paiement || cmd.paiement === filtre.paiement;
      // Livreur
      const matchLivreur = !filtre.livreur || cmd.livreur === filtre.livreur;

      // Coût min/max
      const coutNum = Number(cmd.cout ?? 0);
      const matchCoutMin = !filtre.coutMin || coutNum >= Number(filtre.coutMin);
      const matchCoutMax = !filtre.coutMax || coutNum <= Number(filtre.coutMax);

      // Plage de dates (attention à l'inclusion du dernier jour)
      let matchDate = true;
      if (filtre.dateRange?.from) {
        const dateLiv = cmd.date_livraison
          ? new Date(cmd.date_livraison)
          : null;
        if (!dateLiv) return false;
        const from = new Date(filtre.dateRange.from.setHours(0, 0, 0, 0));
        let to = filtre.dateRange.to
          ? new Date(filtre.dateRange.to.setHours(23, 59, 59, 999))
          : new Date(from.setHours(23, 59, 59, 999));
        matchDate = dateLiv >= from && dateLiv <= to;
      }

      return (
        matchSearch &&
        matchStatut &&
        matchPaiement &&
        matchLivreur &&
        matchCoutMin &&
        matchCoutMax &&
        matchDate
      );
    });
  }, [commandes, search, filtre]);

  // Pagination
  const paginated = filtered.slice(
    page * commandesParPage,
    (page + 1) * commandesParPage
  );

  return (
    <div className="space-y-4">
      <HeaderCommandes
        filtre={filtre}
        setFiltre={setFiltre}
        search={search}
        setSearch={setSearch}
        commandes={commandes} // Pour le calendrier "commandes par jour"
      />

      {/* Cartes commandes */}
      <div className="space-y-2 p-2">
        {paginated.length > 0 ? (
          paginated.map((commande) => (
            <CommandeCardMobile
              key={commande.id}
              commande={commande}
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
        <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Précédent
        </Button>
        <span>Page {page + 1}</span>
        <Button
          disabled={(page + 1) * commandesParPage >= filtered.length}
          onClick={() => setPage((p) => p + 1)}>
          Suivant
        </Button>
      </div>

      {/* Bouton flottant de création */}
      <Button
        onClick={() => setOpenCreer(true)}
        className="fixed bottom-4 right-4 rounded-full h-12 w-12 p-0 z-50"
        aria-label="Créer une commande">
        <Plus className="h-6 w-6" />
      </Button>

      {/* Dialogs */}
      {commandeAModifier && (
        <ModifierCommandeDialog
          commande={commandeAModifier}
          onClose={() => setCommandeAModifier(null)}
        />
      )}
    </div>
  );
}
