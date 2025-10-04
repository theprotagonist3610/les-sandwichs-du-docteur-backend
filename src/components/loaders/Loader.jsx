// components/Loader.jsx
import React from "react";
import useBreakpoint from "@/hooks/useBreakpoint";
/**
 * Composant Spinner réutilisable
 */
const Spinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        border-4 border-primary/30 border-t-primary 
        rounded-full animate-spin
        ${className}
      `}
      role="status"
      aria-label="Chargement en cours"
    />
  );
};

/**
 * Composant Loader principal avec versions mobile/desktop
 */
const Loader = ({
  isVisible = true,
  text = "Patientez...",
  className = "",
  onClose = null, // Fonction optionnelle pour fermer le loader
}) => {
  const { isMobile, isDesktop } = useBreakpoint();

  // Empêcher le scroll du body quand le loader est visible
  React.useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  // Gérer la fermeture par Escape (optionnel)
  React.useEffect(() => {
    if (!onClose) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Ne pas rendre si non visible (APRÈS tous les hooks)
  if (!isVisible) return null;

  return (
    <>
      {/* Version Mobile - Plein écran */}
      {isMobile && (
        <div
          className={`
            fixed inset-0 z-[9999] 
            bg-background/80 backdrop-blur-sm
            flex items-center justify-center p-4
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="loader-title">
          {/* Carte centrale mobile */}
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto">
            <div className="flex flex-col items-center space-y-6">
              {/* Logo */}
              <img
                src="/logo_petit.PNG"
                alt="Logo"
                className="h-24 w-48 object-contain"
              />

              {/* Spinner */}
              <Spinner size="lg" />

              {/* Texte */}
              <p
                id="loader-title"
                className="text-lg font-medium text-foreground text-center">
                {text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Version Desktop - Centré mais pas plein écran */}
      {isDesktop && (
        <div
          className={`
            fixed inset-0 z-[9999] 
            bg-background/60 backdrop-blur-sm
            flex items-center justify-center p-8
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="loader-title">
          {/* Carte centrale desktop */}
          <div className="bg-card border border-border rounded-3xl shadow-2xl p-12 max-w-md mx-auto transform transition-all duration-300 hover:scale-[1.02]">
            <div className="flex flex-col items-center space-y-8">
              {/* Logo */}
              <img
                src="/logo_petit.PNG"
                alt="Logo"
                className="h-24 w-48 object-contain"
              />

              {/* Spinner */}
              <Spinner size="xl" />

              {/* Texte */}
              <p
                id="loader-title"
                className="text-xl font-semibold text-foreground text-center">
                {text}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Loader;
