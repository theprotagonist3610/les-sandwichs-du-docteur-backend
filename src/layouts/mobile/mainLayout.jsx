import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import { useComptabiliteSystem } from "@/hooks/useComptabiliteSystem";
import { usePresenceManager } from "@/toolkits/admin/userToolkit";

const MainLayout = () => {
  // Initialiser le système de comptabilité (notifications, nettoyage, etc.)
  useComptabiliteSystem();

  // Initialiser le système de présence avec heartbeat automatique
  // Ce hook gère automatiquement :
  // - setupPresenceSystem() au montage
  // - startHeartbeat() avec intervalle de 30s
  // - setupBeforeUnload() pour la fermeture de page
  // - stopHeartbeat() au démontage
  usePresenceManager({
    enabled: true,
    heartbeatInterval: 30000 // 30 secondes
  });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="pt-26">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
