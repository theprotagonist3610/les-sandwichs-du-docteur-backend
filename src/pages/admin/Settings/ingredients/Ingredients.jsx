import GenericCards from "@/components/global/GenericCards";
import { Plus, Play, Carrot } from "lucide-react";

const Ingredients = () => {
  const liste = [
    {
      nom: "Initialiser",
      description: "Initialiser les ingrédients",
      to: "/admin/settings/ingredients/init",
      icon: Play,
    },
    {
      nom: "Creer",
      description: "Creer un nouvel ingrédient",
      to: "/admin/settings/ingredients/create",
      icon: Plus,
    },
    {
      nom: "Gerer",
      description: "Gerer les ingrédients",
      to: "/admin/settings/ingredients/gerer",
      icon: Carrot,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des ingrédients
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les ingrédients de votre application
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Ingredients;
