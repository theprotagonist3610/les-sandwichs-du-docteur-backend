import GenericCards from "@/components/global/GenericCards";
import {
  LayoutDashboard,
  FolderLock,
  ChartNoAxesGantt,
  Plus,
  Wallet,
} from "lucide-react";

const Comptabilite = () => {
  const liste = [
    {
      nom: "Tableau de bord",
      description: "Surveillez la comptabilité",
      to: "/admin/comptabilite/dashboard",
      icon: LayoutDashboard,
    },
    {
      nom: "Créer une opération comptable",
      description: "Ajouter des opérations comptables",
      to: "/admin/comptabilite/create",
      icon: Plus,
    },
    {
      nom: "Gérer les opérations comptables",
      description: "Gestion des opérations comptables",
      to: "/admin/comptabilite/gerer",
      icon: ChartNoAxesGantt,
    },
    {
      nom: "Clôture d'une journée",
      description: "Valider les opérations comptables de la journée",
      to: "/admin/comptabilite/cloture",
      icon: FolderLock,
    },
    {
      nom: "Tresorerie",
      description: "Surveillez la trésorerie",
      to: "/admin/comptabilite/tresorerie",
      icon: Wallet,
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
          Créez et gérez les opérations comptables
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Comptabilite;
