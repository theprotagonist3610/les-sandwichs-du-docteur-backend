import GenericCards from "@/components/global/GenericCards";
import { Plus, Play, CupSoda } from "lucide-react";

const Boissons = () => {
  const liste = [
    {
      nom: "Initialiser",
      description: "Initialiser les boissons",
      to: "/admin/settings/boissons/init",
      icon: Play,
    },
    {
      nom: "Creer",
      description: "Creer une nouvel boisson",
      to: "/admin/settings/boissons/create",
      icon: Plus,
    },
    {
      nom: "Gerer",
      description: "Gerer les boissons",
      to: "/admin/settings/boissons/gerer",
      icon: CupSoda,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des boissons
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les boissons de votre application
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Boissons;
