// components/AdminUtilities.jsx
import { NavLink } from "react-router-dom";
import useBreakpoint from "@/hooks/useBreakpoint";
/**
 * Composant carte utilitaire
 */
const UtilityCard = ({ nom, description, imgUrl, to, isMobile = false }) => {
  return (
    <NavLink
      to={to}
      className={`
        group block bg-card border border-border rounded-lg shadow-sm
        hover:shadow-md hover:border-primary/20 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${isMobile ? "p-3" : "p-6"}
      `}>
      <div className={`flex flex-col space-y-3 h-full`}>
        {/* Titre */}
        <h3
          className={`
          font-semibold text-foreground group-hover:text-primary transition-colors duration-200
          ${isMobile ? "text-sm" : "text-base"}
        `}>
          {nom}
        </h3>

        {/* Image */}
        <div
          className={`
          flex justify-center items-center bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors duration-200
          ${isMobile ? "h-24" : "h-48"}
        `}>
          <img
            src={imgUrl}
            alt={nom}
            className={`
              object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200
              ${isMobile ? "h-16 w-16" : "h-32 w-32"}
            `}
          />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200 flex-1">
          {description}
        </p>

        {/* Indicateur visuel */}
        <div className="flex justify-center">
          <div className="w-0 h-0.5 bg-primary group-hover:w-8 transition-all duration-300"></div>
        </div>
      </div>
    </NavLink>
  );
};

/**
 * Composant principal AdminUtilities
 */
const AdminUtilities = ({
  title = "Utilitaires Admin",
  subtitle = "Outils et fonctionnalités d'administration",
}) => {
  const { isMobile, isDesktop } = useBreakpoint(1024);

  // Tableau des utilitaires - À personnaliser selon tes besoins
  const utils = [
    {
      nom: "Gestion Utilisateurs",
      description: "Créer, modifier et supprimer des comptes utilisateurs",
      imgUrl: "/user.svg",
      to: "/admin/users/",
    },
    {
      nom: "Emplacements",
      description: "Créer, modifier et supprimer des points de ventes",
      imgUrl: "/place.svg",
      to: "/admin/points_vente/",
    },
    {
      nom: "Adresses",
      description: "Créer, modifier et supprimer des adresses de livraison",
      imgUrl: "/lieux.svg",
      to: "/admin/adresses/",
    },
    {
      nom: "Paiement",
      description: "Configurer les moyens de paiement",
      imgUrl: "/paiements.svg",
      to: "/admin/paiement/",
    },
    {
      nom: "Statistiques",
      description: "Tableau de bord avec métriques et analyses",
      imgUrl: "/math.svg",
      to: "/admin/stats/",
    },
    {
      nom: "Ingredients",
      description: "Gérer les ingredients utilises",
      imgUrl: "/ingredients.svg",
      to: "/admin/ingredients/",
    },
    {
      nom: "Boissons",
      description: "Gérer les boissons disponibles",
      imgUrl: "/boissons.svg",
      to: "/admin/boissons/",
    },
    {
      nom: "Menu",
      description: "Gérer le menu",
      imgUrl: "/menu.svg",
      to: "/admin/menus/",
    },
    {
      nom: "Suppléments",
      description: "Gérer les autres services",
      imgUrl: "/supplement.svg",
      to: "/admin/supplements/",
    },
    {
      nom: "Comptabilité",
      description: "Gérer les indicateurs de comptabilité",
      imgUrl: "/compta.svg",
      to: "/admin/compta/",
    },
    {
      nom: "Données",
      description: "Gérer les données",
      imgUrl: "/vault.svg",
      to: "/admin/donnees/",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Version Mobile - Grid 2 colonnes */}
      {isMobile && (
        <div className="grid grid-cols-2 gap-4">
          {utils.map((util, index) => (
            <UtilityCard
              key={index}
              nom={util.nom}
              description={util.description}
              imgUrl={util.imgUrl}
              to={util.to}
              isMobile={true}
            />
          ))}
        </div>
      )}

      {/* Version Desktop - Flex avec cartes plus grandes */}
      {isDesktop && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {utils.map((util, index) => (
            <UtilityCard
              key={index}
              nom={util.nom}
              description={util.description}
              imgUrl={util.imgUrl}
              to={util.to}
              isMobile={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUtilities;

// Version alternative avec props pour le tableau utils
export const AdminUtilitiesCustom = ({
  utils = [],
  title = "Utilitaires Admin",
  subtitle = "Outils et fonctionnalités d'administration",
  className = "",
}) => {
  const { isMobile, isDesktop } = useBreakpoint(1024);

  if (!utils || utils.length === 0) {
    return (
      <div className={`container mx-auto px-4 py-8 ${className}`}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun utilitaire configuré</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${className}`}>
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Layout responsive */}
      <div
        className={`
        ${
          isMobile
            ? "grid grid-cols-2 gap-4"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        }
      `}>
        {utils.map((util, index) => (
          <UtilityCard
            key={util.to || index}
            nom={util.nom}
            description={util.description}
            imgUrl={util.imgUrl}
            to={util.to}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="mt-8 pt-4 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          {utils.length} utilitaire{utils.length > 1 ? "s" : ""} disponible
          {utils.length > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};
