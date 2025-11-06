import GenericCards from "@/components/global/GenericCards";
import { Play, LayoutDashboard, Plus, Wallet } from "lucide-react";

const Comptabilite = () => {
  const liste = [
    {
      nom: "Initialiser",
      description: "Initialiser les comptes",
      to: "/admin/comptabilite/init",
      icon: Play,
    },
    {
      nom: "Tableau de bord",
      description: "Surveillez la comptabilite",
      to: "/admin/comptabilite/dashboard",
      icon: LayoutDashboard,
    },
    {
      nom: "Créer un compte",
      description: "Creer un nouveau compte",
      to: "/admin/comptabilite/create",
      icon: Plus,
    },
    {
      nom: "Gerer les comptes comptables",
      description: "Superviser les comptes",
      to: "/admin/comptabilite/gerer",
      icon: Wallet,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion de la comptabilite
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les comptes comptables
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Comptabilite;
