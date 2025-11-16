/*
un hook useBreakpoint qui check quel est la largeur de l'ecran de l'utilisateur
il renvoie mobile:true et desktop:true en fonction de ce que l'ecran est plus grand que 1024px
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
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < BREAKPOINT);
      setIsDesktop(width >= BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { mobile: isMobile, desktop: isDesktop };
}

export default useBreakpoint;
