/*
 */
import GenericCards from "@/components/global/GenericCards";
import { Plus, Hamburger } from "lucide-react";
const MenusComposes = () => {
  const liste = [
    {
      nom: "Creer",
      description: "Creer un nouveau menu",
      to: "/admin/settings/menuscomposes/create",
      icon: Plus,
    },
    {
      nom: "Gerer",
      description: "Gerer les menus",
      to: "/admin/settings/menuscomposes/gerer",
      icon: Hamburger,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des menus composés
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les menus composés
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default MenusComposes;
