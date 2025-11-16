/**
 * Page Settings - Paramètres Admin
 * Affiche les différentes sections de paramétrage
 */
import GenericCards from "@/components/global/GenericCards";
import commandeSubRoutes from "./commandesRoutes";

/**
 * Construire la liste avec les liens complets
 */
const liste = commandeSubRoutes.map((route) => ({
  nom: route.nom,
  description: route.description,
  url: route.url,
  to: `/admin/commandes/${route.path}`,
}));

const Commandes = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des ventes
        </h1>
        <p className="text-muted-foreground">Gérez les commandes</p>
      </div>

      {/* Cartes de navigation */}
      <GenericCards liste={liste} className="mt-8" />
    </div>
  );
};

export default Commandes;
