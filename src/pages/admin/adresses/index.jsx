import GenericCards from "@/components/GenericCards";
import { Plus, MapPinned, Play } from "lucide-react";
const liste = [
  {
    nom: "Initialiser les adresses",
    description: "Initialiser les adresses pour étendre votre activité",
    to: "/admin/adresses/init/",
    icon: <Play />,
  },
  {
    nom: "Ajouter",
    description: "Créer une nouvelle adresse pour étendre votre activité",
    to: "/admin/adresses/ajouter/",
    icon: <Plus />,
  },
  {
    nom: "Gérer",
    description: "Gérer les adresses existantes",
    to: "/admin/adresses/adresses/",
    icon: <MapPinned />,
  },
];
const index = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des adresses</h1>
      <GenericCards liste={liste} />
    </div>
  );
};

export default index;
