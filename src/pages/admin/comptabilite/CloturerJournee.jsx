/**
 * CloturerJournee.jsx
 * Composant wrapper responsive pour la clôture journalière
 */

import React from "react";
import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopCloture from "./desktop/DesktopCloture";
import MobileCloture from "./mobile/MobileCloture";

const CloturerJournee = () => {
  const { isMobile } = useBreakpoint();

  return isMobile ? <MobileCloture /> : <DesktopCloture />;
};

export default CloturerJournee;
