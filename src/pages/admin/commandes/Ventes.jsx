import GenericCards from "@/components/global/GenericCards";
import { HandCoins, ListCheck } from "lucide-react";

const Ventes = () => {
  const liste = [
    {
      nom: "Panneau de vente",
      description: "Enregistrer les commandes",
      to: "/admin/commandes/ventes/panneau_de_ventes",
      icon: HandCoins,
    },
    {
      nom: "Ventes",
      description: "Superviser les ventes",
      to: "/admin/commandes/ventes/ventes",
      icon: ListCheck,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des commandes
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les commandes
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Ventes;
