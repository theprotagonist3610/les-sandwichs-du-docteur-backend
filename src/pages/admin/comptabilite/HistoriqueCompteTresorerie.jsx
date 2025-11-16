/**
 * HistoriqueCompteTresorerie.jsx
 * Composant wrapper responsive pour l'historique d'un compte de trésorerie
 */

import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopHistoriqueCompteTresorerie from "./desktop/DesktopHistoriqueCompteTresorerie";
import MobileHistoriqueCompteTresorerie from "./mobile/MobileHistoriqueCompteTresorerie";

const HistoriqueCompteTresorerie = () => {
  const { isMobile } = useBreakpoint();

  return isMobile ? <MobileHistoriqueCompteTresorerie /> : <DesktopHistoriqueCompteTresorerie />;
};

export default HistoriqueCompteTresorerie;
