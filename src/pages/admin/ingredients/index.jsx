import GenericCards from "@/components/GenericCards";
import { Plus, Layers2, Play } from "lucide-react";
const liste = [
  {
    nom: "Initialiser",
    description: "Initialiser les ingrédients pour étendre votre activité",
    to: "/admin/ingredients/init/",
    icon: <Plus />,
  },
  {
    nom: "Ajouter",
    description: "Ajouter un nouvel ingrédient pour étendre votre activité",
    to: "/admin/ingredients/ajouter/",
    icon: <Plus />,
  },
  {
    nom: "Gérer",
    description: "Gérer les ingrédients disponibles",
    to: "/admin/ingredients/ingredients/",
    icon: <Layers2 />,
  },
];
const index = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Ingrédients</h1>
      <GenericCards liste={liste} />
    </div>
  );
};

export default index;
