/*
 */
import GenericCards from "@/components/global/GenericCards";
import { Plus, Play, Wallet2 } from "lucide-react";
const Comptabilite = () => {
  const liste = [
    {
      nom: "Initialiser",
      description: "Initialiser les comptes",
      to: "/admin/settings/comptabilite/init",
      icon: Play,
    },
    {
      nom: "Creer",
      description: "Creer un nouveau compte",
      to: "/admin/settings/comptabilite/create",
      icon: Plus,
    },
    {
      nom: "Gerer",
      description: "Gerer les comptes",
      to: "/admin/settings/comptabilite/gerer",
      icon: Wallet2,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion de la comptabilité
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les comptes de comptabilité
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Comptabilite;
