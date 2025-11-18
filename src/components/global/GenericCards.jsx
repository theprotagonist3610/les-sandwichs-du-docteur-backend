/**
 * GenericCards - Composant de cartes génériques avec layout responsive
 *
 * Mobile: Grid dynamique (cols paramétrable, par défaut 2)
 * Desktop: Grid responsive (1-4 colonnes selon la taille d'écran)
 *
 * @param {Array} liste - Liste des items à afficher (nom, description, to, icon/url facultatifs)
 * @param {string} className - Classes CSS pour le conteneur
 * @param {string} cardClassName - Classes CSS pour chaque carte
 * @param {number} cols - Nombre de colonnes pour la version mobile (par défaut: 2)
 */

import { NavLink } from "react-router-dom";
import { useBreakpoint } from "@/hooks/useBreakpoint";

/**
 * GenericCard - Carte individuelle
 */
const GenericCard = ({
  nom,
  description,
  url,
  icon: Icon,
  to,
  isMobile = false,
  className = "",
}) => {
  return (
    <NavLink
      to={to}
      className={`
        group block bg-card border border-border rounded-lg shadow-sm
        hover:shadow-md hover:border-primary/20 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${isMobile ? "p-4" : "p-6"}
        ${className}
      `}>
      <div className="flex flex-col space-y-4 h-full">
        {/* Nom */}
        <h3
          className={`
          font-semibold text-foreground group-hover:text-primary transition-colors duration-200
          ${isMobile ? "text-base" : "text-lg"}
        `}>
          {nom}
        </h3>

        {/* Icône */}
        <div
          className={`
          flex justify-center items-center bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-200
          ${isMobile ? "h-16 w-16 mx-auto" : "h-20 w-20 mx-auto"}
        `}>
          {Icon ? (
            <Icon
              className={`
              text-primary group-hover:scale-110 transition-transform duration-200
              ${isMobile ? "h-8 w-8" : "h-10 w-10"}
            `}
            />
          ) : url ? (
            <img
              src={url}
              alt={nom}
              className={`
                object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200
                ${isMobile ? "h-12 w-12" : "h-16 w-16"}
              `}
            />
          ) : (
            <div
              className={`
              bg-muted rounded-full flex items-center justify-center
              ${isMobile ? "h-8 w-8" : "h-10 w-10"}
            `}>
              <span className="text-muted-foreground text-xs">?</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p
          className={`
          text-muted-foreground group-hover:text-foreground transition-colors duration-200 text-center flex-1
          ${isMobile ? "text-sm" : "text-base"}
        `}>
          {description}
        </p>

        {/* Indicateur visuel */}
        <div className="flex justify-center">
          <div className="w-0 h-0.5 bg-primary group-hover:w-12 transition-all duration-300"></div>
        </div>
      </div>
    </NavLink>
  );
};

/**
 * GenericCardMobile - Carte horizontale pour mobile
 */
const GenericCardMobile = ({
  nom,
  description,
  url,
  icon: Icon,
  to,
  className = "",
}) => {
  return (
    <NavLink
      to={to}
      className={`
        group flex items-center gap-4 bg-card border border-border rounded-lg p-4
        hover:shadow-md hover:border-primary/20 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${className}
      `}>
      {/* Icône à gauche */}
      <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-200">
        {Icon ? (
          <Icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-200" />
        ) : url ? (
          <img
            src={url}
            alt={nom}
            className="h-10 w-10 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200"
          />
        ) : (
          <div className="h-7 w-7 bg-muted rounded-full flex items-center justify-center">
            <span className="text-muted-foreground text-xs">?</span>
          </div>
        )}
      </div>

      {/* Contenu à droite */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-1">
          {nom}
        </h3>
        <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-200 line-clamp-2 mt-0.5">
          {description}
        </p>
      </div>

      {/* Indicateur visuel (chevron) */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </NavLink>
  );
};

/**
 * Composant principal GenericCards
 */
const GenericCards = ({
  liste = [],
  className = "",
  cardClassName = "",
  cols = 2, // Paramètre conservé pour rétro-compatibilité mais non utilisé
}) => {
  const { mobile } = useBreakpoint();

  if (!liste || liste.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <p className="text-muted-foreground text-center">
          Aucun élément à afficher
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Version Mobile - Liste verticale avec layout horizontal */}
      {mobile && (
        <div className="space-y-3">
          {liste.map((item, index) => (
            <GenericCardMobile
              key={item.to || index}
              nom={item.nom}
              description={item.description}
              url={item.url}
              icon={item.icon}
              to={item.to}
              className={cardClassName}
            />
          ))}
        </div>
      )}

      {/* Version Desktop - Grid responsive */}
      {!mobile && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {liste.map((item, index) => (
            <GenericCard
              key={item.to || index}
              nom={item.nom}
              description={item.description}
              url={item.url}
              icon={item.icon}
              to={item.to}
              isMobile={false}
              className={cardClassName}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GenericCards;
