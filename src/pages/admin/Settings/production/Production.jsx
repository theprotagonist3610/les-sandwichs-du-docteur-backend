/*
 */
import GenericCards from "@/components/global/GenericCards";
import { Plus, Factory } from "lucide-react";
const Production = () => {
  const liste = [
    {
      nom: "Creer",
      description: "Creer un nouveau menu",
      to: "/admin/settings/production/create",
      icon: Plus,
    },
    {
      nom: "Gerer",
      description: "Gerer les menus",
      to: "/admin/settings/production/gerer",
      icon: Factory,
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
          Créez et gérez les recettes de production
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Production;
