// components/MiniLoader.jsx
import React from "react";

/**
 * Composant Spinner simple
 */
const Spinner = ({ size = "sm", className = "" }) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        border-2 border-primary/30 border-t-primary 
        rounded-full animate-spin
        ${className}
      `}
      role="status"
      aria-label="Chargement"
    />
  );
};

/**
 * MiniLoader - Composant loader minimaliste
 * Flex vertical avec spinner et texte en dessous
 */
const MiniLoader = ({
  text = "Chargement...",
  size = "sm",
  className = "",
  textClassName = "",
  spinnerClassName = "",
}) => {
  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Spinner */}
      <Spinner size={size} className={spinnerClassName} />

      {/* Texte */}
      <p
        className={`text-xs text-muted-foreground text-center ${textClassName}`}>
        {text}
      </p>
    </div>
  );
};

export default MiniLoader;
