import GenericCards from "@/components/global/GenericCards";
import {
  LayoutDashboard,
  Building2,
  Hamburger,
  Users2,
  Layers3,
  Factory,
  HandCoins,
  Bike,
  Wallet,
} from "lucide-react";

const Statistiques = () => {
  const liste = [
    {
      nom: "Tableau de bord",
      description: "Analyses statistiques",
      to: "/admin/statistiques/dashboard",
      icon: LayoutDashboard,
    },
    {
      nom: "Ventes",
      description: "Analyses statistiques des ventes",
      to: "/admin/statistiques/ventes",
      icon: Hamburger,
    },
    {
      nom: "Vendeurs",
      description: "Analyses statistiques des vendeurs",
      to: "/admin/statistiques/vendeurs",
      icon: Users2,
    },
    {
      nom: "Stock",
      description: "Analyses statistiques du stock",
      to: "/admin/statistiques/stock",
      icon: Layers3,
    },
    {
      nom: "Production",
      description: "Analyses statistiques de la production",
      to: "/admin/statistiques/production",
      icon: Factory,
    },
    {
      nom: "Paiement",
      description: "Analyses statistiques du flux financier",
      to: "/admin/statistiques/paiement",
      icon: HandCoins,
    },
    {
      nom: "Livraisons",
      description: "Analyses statistiques du flux des livraisons",
      to: "/admin/statistiques/livraisons",
      icon: Bike,
    },
    {
      nom: "Emplacements",
      description: "Analyses statistiques du flux commercial des emplacements",
      to: "/admin/statistiques/emplacements",
      icon: Building2,
    },
    {
      nom: "Comptabilité",
      description: "Analyses statistiques du flux comptable",
      to: "/admin/statistiques/comptabilite",
      icon: Wallet,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Analyses statistiques
        </h1>
        <p className="text-muted-foreground mt-1">
          Consultez les analyses statistiques pour prendre de meilleures
          décisions
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Statistiques;
