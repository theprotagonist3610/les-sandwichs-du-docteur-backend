import GenericCards from "@/components/GenericCards";
import { Plus, Milk, Play } from "lucide-react";
const liste = [
  {
    nom: "Initialiser",
    description: "Initialiser les boissons",
    to: "/admin/boissons/init/",
    icon: <Play />,
  },
  {
    nom: "Ajouter",
    description: "Ajouter une nouvelle boisson pour étendre votre activité",
    to: "/admin/boissons/ajouter/",
    icon: <Plus />,
  },
  {
    nom: "Gérer",
    description: "Gérer les boissons disponibles",
    to: "/admin/boissons/boissons/",
    icon: <Milk />,
  },
];
const index = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Boissons</h1>
      <GenericCards liste={liste} />
    </div>
  );
};

export default index;
