// hooks/useBreakpoint.js
import { useState, useEffect } from "react";

/**
 * Hook pour détecter les breakpoints d'écran
 * Par défaut détecte si l'écran est >= 1024px (lg en Tailwind)
 * Mobile/Tablette < 1024px, Desktop >= 1024px
 *
 * @param {number} breakpoint - Le breakpoint en pixels (défaut: 1024)
 * @returns {Object} État des breakpoints
 */
const useBreakpoint = (breakpoint = 1024) => {
  // État pour savoir si on est au-dessus du breakpoint
  const [isAbove, setIsAbove] = useState(() => {
    // Vérification côté client uniquement
    if (typeof window === "undefined") return false;
    return window.innerWidth >= breakpoint;
  });

  // État pour savoir si on est en dessous du breakpoint
  const [isBelow, setIsBelow] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth < breakpoint;
  });

  // État pour la largeur actuelle (optionnel, utile pour debug)
  const [currentWidth, setCurrentWidth] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerWidth;
  });

  useEffect(() => {
    // Fonction pour mettre à jour les états
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const above = width >= breakpoint;

      setCurrentWidth(width);
      setIsAbove(above);
      setIsBelow(!above);
    };

    // Utiliser matchMedia pour des performances optimales
    const mediaQuery = window.matchMedia(`(min-width: ${breakpoint}px)`);

    // Handler pour matchMedia
    const handleMediaChange = (e) => {
      setIsAbove(e.matches);
      setIsBelow(!e.matches);
      setCurrentWidth(window.innerWidth);
    };

    // Écouter les changements avec matchMedia (plus performant)
    mediaQuery.addEventListener("change", handleMediaChange);

    // Mettre à jour l'état initial
    updateBreakpoint();

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [breakpoint]);

  return {
    // États principaux
    isAbove, // true si >= breakpoint
    isBelow, // true si < breakpoint

    // Aliases plus sémantiques pour 1024px
    isMobile: isBelow, // < 1024px (mobile + tablette)
    isDesktop: isAbove, // >= 1024px

    // Infos supplémentaires
    currentWidth,
    breakpoint,

    // Helpers pour d'autres breakpoints courants
    isSmall: currentWidth < 640, // < sm (mobile uniquement)
    isMedium: currentWidth >= 640 && currentWidth < 1024, // sm à lg (tablette)
    isLarge: currentWidth >= 1024 && currentWidth < 1280, // lg
    isXLarge: currentWidth >= 1280, // xl+
  };
};

/**
 * Hook spécialisé pour mobile+tablette/desktop (1024px)
 * Mobile+Tablette < 1024px, Desktop >= 1024px
 * Version simplifiée du hook principal
 */
export const useMobileBreakpoint = () => {
  const { isMobile, isDesktop, currentWidth } = useBreakpoint(1024);

  return {
    isMobile, // < 1024px (inclut mobile + tablette)
    isDesktop, // >= 1024px
    currentWidth,
  };
};

/**
 * Hook pour plusieurs breakpoints à la fois
 * Utile pour des layouts complexes
 */
export const useMultipleBreakpoints = () => {
  const [breakpoints, setBreakpoints] = useState({
    sm: false, // >= 640px
    md: false, // >= 768px
    lg: false, // >= 1024px
    xl: false, // >= 1280px
    "2xl": false, // >= 1536px
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;

      setBreakpoints({
        sm: width >= 640,
        md: width >= 768,
        lg: width >= 1024,
        xl: width >= 1280,
        "2xl": width >= 1536,
      });
    };

    // Utiliser resize observer pour de meilleures performances
    const resizeObserver = new ResizeObserver(() => {
      updateBreakpoints();
    });

    // Observer le body
    resizeObserver.observe(document.body);

    // Mise à jour initiale
    updateBreakpoints();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return breakpoints;
};

export default useBreakpoint;

// Exemple d'utilisation :
/*
// Utilisation de base - Mobile+Tablette vs Desktop
const MyComponent = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  
  return (
    <div>
      {isMobile ? (
        <MobileTabletLayout />  // < 1024px
      ) : (
        <DesktopLayout />       // >= 1024px
      )}
    </div>
  );
};

// Utilisation avec breakpoint personnalisé
const MyComponent2 = () => {
  const { isAbove, isBelow } = useBreakpoint(768); // breakpoint à 768px
  
  return (
    <div className={isAbove ? 'large-screen' : 'small-screen'}>
      Contenu adaptatif
    </div>
  );
};

// Utilisation du hook mobile spécialisé (inclut tablettes)
const MyComponent3 = () => {
  const { isMobile, isDesktop, currentWidth } = useMobileBreakpoint();
  
  return (
    <div>
      <p>Largeur actuelle: {currentWidth}px</p>
      <p>Mode: {isMobile ? 'Mobile/Tablette' : 'Desktop'}</p>
    </div>
  );
};

// Utilisation pour une distinction fine
const MyComponent4 = () => {
  const { isSmall, isMedium, isLarge, isXLarge } = useBreakpoint();
  
  return (
    <div>
      {isSmall && <p>📱 Mobile (< 640px)</p>}
      {isMedium && <p>📱 Tablette (640px - 1024px)</p>}
      {isLarge && <p>💻 Desktop (1024px - 1280px)</p>}
      {isXLarge && <p>🖥️ Large Desktop (>= 1280px)</p>}
    </div>
  );
};

// Utilisation de tous les breakpoints
const MyComponent5 = () => {
  const breakpoints = useMultipleBreakpoints();
  
  return (
    <div>
      <p>SM: {breakpoints.sm ? '✅' : '❌'}</p>
      <p>MD: {breakpoints.md ? '✅' : '❌'}</p>
      <p>LG: {breakpoints.lg ? '✅' : '❌'}</p>
    </div>
  );
};
*/
