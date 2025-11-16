import GenericCards from "@/components/global/GenericCards";
import { Plus, Play, Locate } from "lucide-react";

const Adresses = () => {
  const liste = [
    {
      nom: "Initialiser",
      description: "Initialiser les adresses",
      to: "/admin/settings/adresses/init",
      icon: Play,
    },
    {
      nom: "Creer",
      description: "Creer une nouvelle adresse",
      to: "/admin/settings/adresses/create",
      icon: Plus,
    },
    {
      nom: "Gerer",
      description: "Gerer les adresses",
      to: "/admin/settings/adresses/gerer",
      icon: Locate,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des adresses
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les adresses
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Adresses;
