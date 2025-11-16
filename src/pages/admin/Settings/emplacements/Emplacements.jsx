import GenericCards from "@/components/global/GenericCards";
import { MapPinHouse, MapPinned } from "lucide-react";

const Emplacements = () => {
  const liste = [
    {
      nom: "Créer",
      description: "Créer un nouvel emplacement",
      to: `/admin/settings/emplacements/create`,
      icon: MapPinHouse,
    },
    {
      nom: "Gérer",
      description: "Gérer les emplacements existants",
      to: `/admin/settings/emplacements/gerer`,
      icon: MapPinned,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des emplacements
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les emplacements de votre structure
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Emplacements;
