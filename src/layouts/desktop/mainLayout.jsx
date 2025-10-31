/*
 - layout simple avec un navbar et une zone de travail ou tous les enfants sont rendus
 */
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
