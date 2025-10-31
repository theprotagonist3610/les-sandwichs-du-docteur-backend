/**
 * Page Settings - Paramètres Admin
 * Affiche les différentes sections de paramétrage
 */
import GenericCards from "@/components/global/GenericCards";
import settingsSubRoutes from "./settingsRoutes";

/**
 * Construire la liste avec les liens complets
 */
const liste = settingsSubRoutes.map((route) => ({
  nom: route.nom,
  description: route.description,
  url: route.url,
  to: `/admin/settings/${route.path}`,
}));

const Settings = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Configurez et gérez les différents paramètres de l'application
        </p>
      </div>

      {/* Cartes de navigation */}
      <GenericCards liste={liste} className="mt-8" />
    </div>
  );
};

export default Settings;
