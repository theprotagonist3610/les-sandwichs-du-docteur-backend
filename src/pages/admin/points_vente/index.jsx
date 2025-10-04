import GenericCards from "@/components/GenericCards";
import { Plus, Waypoints } from "lucide-react";
const liste = [
  {
    nom: "Ajouter",
    description: "Créer un nouveau point de vente pour étendre votre activité",
    to: "/admin/points_vente/ajouter/",
    icon: <Plus />,
  },
  {
    nom: "Gérer",
    description: "Gérer les points de vente disponibles",
    to: "/admin/points_vente/points_vente/",
    icon: <Waypoints />,
  },
];
const index = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Emplacements (Points de vente)
      </h1>
      <GenericCards liste={liste} />
    </div>
  );
};

export default index;
