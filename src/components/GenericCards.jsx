// components/GenericCards.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import useBreakpoint from "@/hooks/useBreakpoint";
/**
 * Composant carte générique
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
          {Icon && typeof Icon === "function" ? (
            <Icon
              className={`
              text-primary group-hover:scale-110 transition-transform duration-200
              ${isMobile ? "h-8 w-8" : "h-10 w-10"}
            `}
            />
          ) : Icon && React.isValidElement(Icon) ? (
            React.cloneElement(Icon, {
              className: `
                text-primary group-hover:scale-110 transition-transform duration-200
                ${isMobile ? "h-8 w-8" : "h-10 w-10"}
              `,
            })
          ) : url ? (
            <img
              src={url}
              alt={nom}
              className={`
                object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200
                ${isMobile ? "h-8 w-8" : "h-10 w-10"}
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
 * Composant principal GenericCards
 */
const GenericCards = ({ liste = [], className = "", cardClassName = "" }) => {
  const { isMobile, isDesktop } = useBreakpoint(1024);

  // Vérifier si la liste est vide
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
      {/* Version Mobile - Colonne verticale */}
      {isMobile && (
        <div className="flex flex-col space-y-4">
          {liste.map((item, index) => (
            <GenericCard
              key={item.to || index}
              nom={item.nom}
              description={item.description}
              url={item.url}
              icon={item.icon}
              to={item.to}
              isMobile={true}
              className={cardClassName}
            />
          ))}
        </div>
      )}

      {/* Version Desktop - Flex horizontal avec grandes cartes */}
      {isDesktop && (
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
