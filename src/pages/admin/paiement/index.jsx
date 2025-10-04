import GenericCards from "@/components/GenericCards";
import { Plus, WalletCards, Play } from "lucide-react";
const liste = [
  {
    nom: "Initialiser",
    description:
      "Initialiser les moyens de paiement pour étendre votre activité",
    to: "/admin/paiement/init/",
    icon: <Play />,
  },
  {
    nom: "Ajouter",
    description:
      "Créer un nouveau moyen de paiement pour étendre votre activité",
    to: "/admin/paiement/ajouter/",
    icon: <Plus />,
  },
  {
    nom: "Gérer",
    description: "Gérer les moyens de paiement disponibles",
    to: "/admin/paiement/paiement/",
    icon: <WalletCards />,
  },
];
const index = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Moyens de Paiements</h1>
      <GenericCards liste={liste} />
    </div>
  );
};

export default index;
