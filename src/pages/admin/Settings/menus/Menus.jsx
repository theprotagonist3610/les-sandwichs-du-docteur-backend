/*
 */
import GenericCards from "@/components/global/GenericCards";
import { Plus, Play, Hamburger } from "lucide-react";
const Menus = () => {
  const liste = [
    {
      nom: "Initialiser",
      description: "Initialiser les menus",
      to: "/admin/settings/menus/init",
      icon: Play,
    },
    {
      nom: "Creer",
      description: "Creer un nouveau menu",
      to: "/admin/settings/menus/create",
      icon: Plus,
    },
    {
      nom: "Gerer",
      description: "Gerer les menus",
      to: "/admin/settings/menus/gerer",
      icon: Hamburger,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des menus
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les menus de votre application
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Menus;
