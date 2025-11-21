/**
 * Comptes.jsx
 * Composant wrapper responsive pour les comptes comptables
 */

import useBreakpoint from "../../../hooks/useBreakpoint";
import DesktopComptes from "./desktop/DesktopComptes";
import MobileComptes from "./mobile/MobileComptes";

const Comptes = () => {
  const { mobile } = useBreakpoint();

  return mobile ? <MobileComptes /> : <DesktopComptes />;
};

export default Comptes;
