import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

const MainLayout = () => {
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
