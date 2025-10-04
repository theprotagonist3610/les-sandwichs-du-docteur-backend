// layouts/MainLayout.jsx
import React, { useState } from "react";
import useBreakpoint from "@/hooks/useBreakpoint";
import { useHeaderCollapse } from "@/components/navigation/HeaderMobile";
import Header from "@/components/navigation/Header";
import Sidebar from "@/components/navigation/Sidebar";

/**
 * Layout principal responsive pour les utilisateurs connectés
 * Header gère en interne mobile/desktop
 * Sidebar uniquement sur mobile avec overlay
 */
const MainLayout = ({ children }) => {
  const { isMobile } = useBreakpoint();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Écouter l'état de collapse du header mobile
  const isHeaderCollapsed = useHeaderCollapse();

  // Fonction pour ouvrir le sidebar (passée au Header)
  const toggleSidebar = () => {
    setIsSidebarOpen(true);
  };

  // Fonction pour fermer le sidebar
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header universel qui gère mobile/desktop en interne */}
      <Header toggleSidebar={toggleSidebar} />

      {/* Sidebar avec overlay (uniquement mobile) */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Contenu principal avec padding adaptatif */}
      <main
        className={`
        ${isMobile ? (isHeaderCollapsed ? "pt-8" : "pt-32") : "pt-16"} 
        transition-all duration-300
      `}>
        <div
          className={`
          ${isMobile ? "px-4 py-6" : "container mx-auto px-8 py-8"}
        `}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
