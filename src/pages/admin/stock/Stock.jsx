import GenericCards from "@/components/global/GenericCards";
import { LayoutDashboard, Building2, Layers } from "lucide-react";

const Stock = () => {
  const liste = [
    {
      nom: "Tableau de bord",
      description: "Surveillez la production",
      to: "/admin/stock/dashboard",
      icon: LayoutDashboard,
    },
    {
      nom: "Emplacements",
      description: "Surveillez les emplacements",
      to: "/admin/stock/emplacements",
      icon: Building2,
    },
    {
      nom: "Stock",
      description: "Surveillez le stock",
      to: "/admin/stock/elements",
      icon: Layers,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion de le stock
        </h1>
        <p className="text-muted-foreground mt-1">Créez et gérez le stock</p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Stock;
