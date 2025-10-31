/**
 * Page Settings - Paramètres Admin
 * Affiche les différentes sections de paramétrage
 */
import GenericCards from "@/components/global/GenericCards";
import userSubRoutes from "./usersRoutes";

/**
 * Construire la liste avec les liens complets
 */
const liste = userSubRoutes.map((route) => ({
  nom: route.nom,
  description: route.description,
  url: route.url,
  to: `/admin/users/${route.path}`,
}));

const Users = () => {
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
