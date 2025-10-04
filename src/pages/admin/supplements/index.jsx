import GenericCards from "@/components/GenericCards";
import { Plus, Layers2, Play } from "lucide-react";
const liste = [
  {
    nom: "Initialiser",
    description: "Initialiser les suppléments pour étendre votre activité",
    to: "/admin/supplements/init/",
    icon: <Plus />,
  },
  {
    nom: "Ajouter",
    description: "Ajouter un nouveau supplément pour étendre votre activité",
    to: "/admin/supplements/ajouter/",
    icon: <Plus />,
  },
  {
    nom: "Gérer",
    description: "Gérer les suppléments disponibles",
    to: "/admin/supplements/supplements/",
    icon: <Layers2 />,
  },
];
const index = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Suppléments</h1>
      <GenericCards liste={liste} />
    </div>
  );
};

export default index;
