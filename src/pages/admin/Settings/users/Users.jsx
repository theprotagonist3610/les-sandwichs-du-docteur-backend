/**
 * Page Users - Gestion des utilisateurs
 *
 * Affiche les options disponibles pour la gestion des utilisateurs :
 * - Créer un nouvel utilisateur
 * - Gérer les utilisateurs existants
 */

import GenericCards from "@/components/global/GenericCards";
import { UserPlus, Users as UsersIcon } from "lucide-react";

const Users = () => {
  const liste = [
    {
      nom: "Créer",
      description: "Créer un nouvel utilisateur pour agrandir votre équipe",
      to: `/admin/settings/users/create`,
      icon: UserPlus,
    },
    {
      nom: "Gérer",
      description: "Gérer les utilisateurs existants",
      to: `/admin/settings/users/gerer`,
      icon: UsersIcon,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des utilisateurs
        </h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez les utilisateurs de votre application
        </p>
      </div>

      {/* Cards */}
      <GenericCards liste={liste} />
    </div>
  );
};

export default Users;
