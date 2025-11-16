/**
 * Page Settings - Paramètres Admin
 * Affiche les différentes sections de paramétrage
 */
import GenericCards from "@/components/global/GenericCards";
import { LayoutDashboard, UserRoundCheck, UserRoundPen } from "lucide-react";

/**
 * Construire la liste avec les liens complets
 */
const Users = () => {
  const liste = [
    {
      nom: "Tableau de bord",
      description: "Surveillez les utilisateurs",
      to: "/admin/users/dashboard",
      icon: LayoutDashboard,
    },
    {
      nom: "Presence",
      description: "Surveillez les utilisateurs",
      to: "/admin/users/presence",
      icon: UserRoundCheck,
    },
    {
      nom: "Profiles",
      description: "Surveillez les utilisateurs",
      to: "/admin/users/profiles",
      icon: UserRoundPen,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Le Personnel</h1>
        <p className="text-muted-foreground">Gérez le le personnel</p>
      </div>

      {/* Cartes de navigation */}
      <GenericCards liste={liste} className="mt-8" />
    </div>
  );
};

export default Users;
