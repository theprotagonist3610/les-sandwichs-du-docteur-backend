/**
 * MobileGererLesUsers - Liste tous les utilisateurs (mobile)
 *
 * Récupère tous les utilisateurs via getAllUsers() et les affiche avec GenericCards
 * Filtre les pré-utilisateurs en attente d'inscription
 * UI compacte mobile avec Card + Separator
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "@/toolkits/admin/userToolkit";
import { getPreUsersList } from "@/toolkits/global/userToolkit";
import GenericCards from "@/components/global/GenericCards";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Shield,
  Users,
  Truck,
  ShoppingCart,
  ChefHat,
  UserPlus,
} from "lucide-react";
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

const MobileGererLesUsers = () => {
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

        const [fetchedUsers, fetchedPreusers] = await Promise.all([
          getAllUsers(),
          getPreUsersList(),
        ]);

        setUsers(fetchedUsers);

        // Filtrer les pré-utilisateurs pas encore inscrits
        const registeredEmails = new Set(fetchedUsers.map((u) => u.email));
        const pendingPreusers = fetchedPreusers.filter(
          (preuser) => !registeredEmails.has(preuser.email)
        );
        setPreusers(pendingPreusers);
      } catch (err) {
        const errorMessage =
          err.message || "Erreur lors de la récupération des données";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Adapter les données pour GenericCards
  const usersList = users.map((user) => ({
    nom: `${user.nom} ${user.prenoms?.join(" ") || ""}`,
    description: user.role
      ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} - ${
          user.email
        }`
      : user.email,
    to: `/admin/settings/users/gerer/${user.id}`,
    icon: roleIcons[user.role] || User,
  }));

  const preusersList = preusers.map((preuser) => ({
    nom: preuser.email,
    description: `Pré-utilisateur ${preuser.role
      .charAt(0)
      .toUpperCase()}${preuser.role.slice(1)} - En attente d'inscription`,
    to: "#",
    icon: UserPlus,
  }));

  if (isLoading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/settings/users")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-lg">
                  Gérer les utilisateurs
                </CardTitle>
                <CardDescription className="text-sm">
                  Liste de tous les utilisateurs de l'application
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="my-2" />
          <CardContent className="py-10">
            <div className="flex items-center justify-center">
              <SmallLoader text="Chargement des utilisateurs..." />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/settings/users")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-lg">
                  Gérer les utilisateurs
                </CardTitle>
                <CardDescription className="text-sm">
                  Liste de tous les utilisateurs de l'application
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="my-2" />
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
              {error}
            </div>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* En-tête + actions */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/settings/users")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-lg">Gérer les utilisateurs</CardTitle>
              <CardDescription className="text-sm">
                {users.length} utilisateur{users.length > 1 ? "s" : ""} •{" "}
                {preusers.length} en attente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className="my-2" />
        <CardContent>
          <Button
            className="w-full"
            onClick={() => navigate("/admin/settings/users/create")}>
            Créer un pré-utilisateur
          </Button>
        </CardContent>
      </Card>

      {/* Pré-utilisateurs en attente */}
      {preusers.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">
                Pré-utilisateurs en attente
              </CardTitle>
            </div>
          </CardHeader>
          <Separator className="my-2" />
          <CardContent>
            <GenericCards liste={preusersList} cols={1} />
          </CardContent>
        </Card>
      )}

      {/* Utilisateurs inscrits */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Utilisateurs inscrits</CardTitle>
          </div>
        </CardHeader>
        <Separator className="my-2" />
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center space-y-4 py-8">
              <User className="h-14 w-14 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucun utilisateur inscrit
              </p>
              <Button
                className="w-full"
                onClick={() => navigate("/admin/settings/users/create")}>
                Créer un pré-utilisateur
              </Button>
            </div>
          ) : (
            <GenericCards liste={usersList} cols={1} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileGererLesUsers;
