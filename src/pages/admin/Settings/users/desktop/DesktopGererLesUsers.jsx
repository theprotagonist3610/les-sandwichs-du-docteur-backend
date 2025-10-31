/**
 * DesktopGererLesUsers - Liste tous les utilisateurs (desktop)
 *
 * Récupère tous les utilisateurs via getAllUsers() et les affiche avec GenericCards
 * Chaque carte redirige vers la page de détails de l'utilisateur
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "@/toolkits/admin/userToolkit";
import { getPreUsersList } from "@/toolkits/global/userToolkit";
import GenericCards from "@/components/global/GenericCards";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Shield, Users, Truck, ShoppingCart, ChefHat, UserPlus } from "lucide-react";
import SmallLoader from "@/components/global/SmallLoader";
import { toast } from "sonner";

// Icônes par rôle
const roleIcons = {
  admin: Shield,
  superviseur: Users,
  livreur: Truck,
  vendeur: ShoppingCart,
  cuisinier: ChefHat,
  "": User, // Rôle vide par défaut
};

const DesktopGererLesUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [preusers, setPreusers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer les utilisateurs et pré-utilisateurs en parallèle
        const [fetchedUsers, fetchedPreusers] = await Promise.all([
          getAllUsers(),
          getPreUsersList(),
        ]);

        setUsers(fetchedUsers);

        // Filtrer les pré-utilisateurs qui n'ont pas encore de compte
        const registeredEmails = new Set(fetchedUsers.map((u) => u.email));
        const pendingPreusers = fetchedPreusers.filter(
          (preuser) => !registeredEmails.has(preuser.email)
        );
        setPreusers(pendingPreusers);
      } catch (err) {
        const errorMessage = err.message || "Erreur lors de la récupération des données";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Transformer les users en format pour GenericCards
  const usersList = users.map((user) => ({
    nom: `${user.nom} ${user.prenoms?.join(" ") || ""}`,
    description: user.role
      ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} - ${user.email}`
      : user.email,
    to: `/admin/settings/users/gerer/${user.id}`,
    icon: roleIcons[user.role] || User,
  }));

  // Transformer les preusers en format pour GenericCards
  const preusersList = preusers.map((preuser) => ({
    nom: preuser.email,
    description: `Pré-utilisateur ${preuser.role.charAt(0).toUpperCase()}${preuser.role.slice(1)} - En attente d'inscription`,
    to: "#", // Pas de page de détails pour les preusers
    icon: UserPlus,
  }));

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/settings/users")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gérer les utilisateurs</h1>
            <p className="text-muted-foreground mt-1">
              Liste de tous les utilisateurs de l'application
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <SmallLoader text="Chargement des utilisateurs..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/settings/users")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gérer les utilisateurs</h1>
            <p className="text-muted-foreground mt-1">
              Liste de tous les utilisateurs de l'application
            </p>
          </div>
        </div>

        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>

        <div className="flex justify-center">
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/settings/users")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gérer les utilisateurs</h1>
            <p className="text-muted-foreground mt-1">
              {users.length} utilisateur{users.length > 1 ? "s" : ""} • {preusers.length} en attente
            </p>
          </div>
        </div>

        <Button onClick={() => navigate("/admin/settings/users/create")}>
          Créer un pré-utilisateur
        </Button>
      </div>

      {/* Section Pré-utilisateurs en attente */}
      {preusers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">
              Pré-utilisateurs en attente d'inscription
            </h2>
          </div>
          <GenericCards liste={preusersList} />
        </div>
      )}

      {/* Section Utilisateurs inscrits */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">
            Utilisateurs inscrits
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <User className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Aucun utilisateur inscrit</p>
              <Button onClick={() => navigate("/admin/settings/users/create")}>
                Créer un pré-utilisateur
              </Button>
            </div>
          </div>
        ) : (
          <GenericCards liste={usersList} />
        )}
      </div>
    </div>
  );
};

export default DesktopGererLesUsers;