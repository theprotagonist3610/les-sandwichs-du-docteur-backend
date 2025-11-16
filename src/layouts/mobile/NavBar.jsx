/*
- Navbar mobile avec logo, sidebar et theme switcher
- Toolbar de navigation rapide en dessous
 */
import { Link } from "react-router-dom";
import SideBar from "./SideBar";
import ThemeSwitcher from "./ThemeSwitcher";
import NavToolbar from "./NavToolbar";

const NavBar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background">
      {/* Barre principale */}
      <div className="flex items-center justify-between h-14 px-4 border-b">
        {/* Menu Hamburger (Sidebar) */}
        <SideBar />

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src="/logo_petit.PNG"
            alt="Les Sandwichs du Docteur"
            className="h-8 w-auto"
          />
        </Link>

        {/* Theme Switcher */}
        <ThemeSwitcher inNavBar />
      </div>

      {/* Toolbar de navigation rapide */}
      <NavToolbar />
    </nav>
  );
};

export default NavBar;
