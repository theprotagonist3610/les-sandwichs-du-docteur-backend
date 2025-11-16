/**
 * Comptes.jsx
 * Composant wrapper responsive pour les comptes comptables
 */

import React from "react";
import useBreakpoint from "../../../hooks/useBreakpoint";
import DesktopComptes from "./desktop/DesktopComptes";
import MobileComptes from "./mobile/MobileComptes";

const Comptes = () => {
  const { isMobile } = useBreakpoint();

  return isMobile ? <MobileComptes /> : <DesktopComptes />;
};

export default Comptes;
