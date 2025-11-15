/**
 * Livraisons.jsx
 * Wrapper responsive pour le module de livraisons
 * Charge Desktop ou Mobile selon la taille de l'écran
 */

import React, { useState, useEffect } from "react";
import DesktopLivraisons from "./desktop/DesktopLivraisons";
import MobileLivraisons from "./mobile/MobileLivraisons";

const Livraisons = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Vérifier la taille initiale
    handleResize();

    // Écouter les changements de taille
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? <MobileLivraisons /> : <DesktopLivraisons />;
};

export default Livraisons;
