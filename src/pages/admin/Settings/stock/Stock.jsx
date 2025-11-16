/*
 */
import GenericCards from "@/components/global/GenericCards";
import { Play, Building2, Plus } from "lucide-react";
const Stock = () => {
  const empl_liste = [
    {
      nom: "Initialiser",
      description: "Initialiser le stock",
      to: "/admin/settings/stock/init",
      icon: Play,
    },
    {
      nom: "Creer",
      description: "Creer un nouvel element de stock",
      to: "/admin/settings/stock/create",
      icon: Plus,
    },
    {
      nom: "Gerer",
      description: "Gerer le stock",
      to: "/admin/settings/stock/gerer",
      icon: Building2,
    },
  ];
  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestion du stock
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez votre stock
          </p>
        </div>

        {/* Cards */}
        <GenericCards liste={empl_liste} />
      </div>
    </>
  );
};

export default Stock;
