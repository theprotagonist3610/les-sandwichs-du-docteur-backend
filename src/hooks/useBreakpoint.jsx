/*
un hook useBreakpoint qui check quel est la largeur de l'ecran de l'utilisateur
il renvoie mobile:true et desktop:true en fonction de ce que l'ecran est plus grand que 1024px

Version améliorée utilisant window.matchMedia pour :
- Meilleure performance (API native pour media queries)
- Détection automatique de tous les changements (orientation, zoom, etc.)
- Synchronisation avec les CSS media queries
*/

import { useState, useEffect } from "react";

const BREAKPOINT = 1024;

export function useBreakpoint() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < BREAKPOINT
  );
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= BREAKPOINT
  );

  useEffect(() => {
    // Créer une media query pour détecter les écrans >= BREAKPOINT
    const mediaQuery = window.matchMedia(`(min-width: ${BREAKPOINT}px)`);

    // Handler appelé quand la media query change
    const handleChange = (e) => {
      setIsDesktop(e.matches);
      setIsMobile(!e.matches);
    };

    // Écouter les changements de media query
    // addEventListener est la méthode moderne (supportée par tous les navigateurs récents)
    // addListener est l'ancienne méthode (fallback pour compatibilité)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback pour les vieux navigateurs (Safari < 14, etc.)
      mediaQuery.addListener(handleChange);
    }

    // Cleanup : retirer l'écouteur d'événements
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return { mobile: isMobile, desktop: isDesktop };
}

export default useBreakpoint;
