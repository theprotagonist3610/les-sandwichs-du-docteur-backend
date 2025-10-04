import GenericCards from "@/components/GenericCards";
import { Plus, WalletCards, Play } from "lucide-react";
const liste = [
  {
    nom: "Tableau de bord",
    description: "Résumé intuitif des flux financiers de votre activité",
    to: "/admin/compta/init/",
    icon: <Play />,
  },
  // {
  //   nom: "Ajouter",
  //   description: "Créer un nouveau compte pour étendre votre activité",
  //   to: "/admin/compta/ajouter/",
  //   icon: <Plus />,
  // },
  {
    nom: "Gérer",
    description: "Gérer les comptes disponibles",
    to: "/admin/compta/dashboard/",
    icon: <WalletCards />,
  },
];
const index = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Comptabilité</h1>
      <GenericCards liste={liste} />
    </div>
  );
};

export default index;
