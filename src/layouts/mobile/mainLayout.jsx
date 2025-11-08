import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import { useComptabiliteSystem } from "@/hooks/useComptabiliteSystem";

const MainLayout = () => {
  // Initialiser le système de comptabilité (notifications, nettoyage, etc.)
  useComptabiliteSystem();

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
