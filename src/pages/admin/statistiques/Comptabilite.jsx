import GenericCards from "@/components/global/GenericCards";
import {
  LayoutDashboard,
  Wallet,
  TrendingUpDown,
  ArrowLeftRight,
  Diff,
  Lightbulb,
} from "lucide-react";

const Comptabilite = () => {
  const liste = [
    {
      nom: "Tableau de bord",
      description: "Analyses statistiques",
      to: "/admin/statistiques/comptabilite/dashboard",
      icon: LayoutDashboard,
    },
    {
      nom: "Budget",
      description: "Analyses statistiques des ventes",
      to: "/admin/statistiques/comptabilite/budget",
      icon: Wallet,
    },
    {
      nom: "Prévisions",
      description: "Analyses statistiques des vendeurs",
      to: "/admin/statistiques/comptabilite/previsions",
      icon: TrendingUpDown,
    },
    {
      nom: "Flux financier",
      description: "Analyses statistiques du stock",
      to: "/admin/statistiques/comptabilite/analyse-flux",
      icon: ArrowLeftRight,
    },
    {
      nom: "Comparaisons",
      description: "Analyses statistiques du flux financier",
      to: "/admin/statistiques/comptabilite/comparaisons",
      icon: Diff,
    },
    {
      nom: "Insights",
      description: "Analyses statistiques du flux des livraisons",
      to: "/admin/statistiques/comptabilite/insights",
      icon: Lightbulb,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Analyses statistiques du flux comptable
        </h1>
        <p className="text-muted-foreground mt-1">
          Consultez les analyses statistiques du flux financier comptable, pour
          les prévisions budgétaires.
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Comptabilite;
