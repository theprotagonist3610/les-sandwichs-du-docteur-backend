import GenericCards from "@/components/global/GenericCards";
import { LayoutDashboard, Plus, ListCheck } from "lucide-react";

const Production = () => {
  const liste = [
    {
      nom: "Tableau de bord",
      description: "Surveillez la production",
      to: "/admin/production/dashboard",
      icon: LayoutDashboard,
    },
    {
      nom: "Créer une production",
      description: "Initier les recettes",
      to: "/admin/production/create",
      icon: Plus,
    },
    {
      nom: "Gerer les productions",
      description: "Superviser les productions",
      to: "/admin/production/gerer",
      icon: ListCheck,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion de la production
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez la production
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Production;
