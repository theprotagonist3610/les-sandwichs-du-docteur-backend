import GenericCards from "@/components/GenericCards";
import { Plus, Beef, Play } from "lucide-react";
const liste = [
  {
    nom: "Initialiser",
    description: "Initialiser les menus",
    to: "/admin/menus/init/",
    icon: <Play />,
  },
  {
    nom: "Ajouter",
    description: "Ajouter un nouveau menu pour étendre votre activité",
    to: "/admin/menus/ajouter/",
    icon: <Plus />,
  },
  {
    nom: "Gérer",
    description: "Gérer les menus disponibles",
    to: "/admin/menus/menus/",
    icon: <Beef />,
  },
];
const index = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Menus</h1>
      <GenericCards liste={liste} />
    </div>
  );
};

export default index;
