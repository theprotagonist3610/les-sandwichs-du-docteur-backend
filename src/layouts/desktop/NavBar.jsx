/*
C'est le composant de navigation desktop
- le logo logo_petit.PNG a gauche et bien visible [attention sa largeur fait le double de sa hauteur], redigrige vers "./"
- utiliser le hook dynamique useUser de golobal/userToolkit pour detecter le role
- apres le logo, les principales routes en fonction des roles
- ajoute une animation au survol de chaque link
- ajoute ensuite le userResume [a creer consulter la description dans ./UserResume.jsx]
- ajoute pour finir le composant ThemeSwicther [a creer consulter la description dans ./ThemeSwitcher]
*/
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/toolkits/global/userToolkit";
import { logoutUser } from "@/toolkits/admin/userToolkit";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "./ThemeSwitcher";
import UserResume from "./UserResume";

const routesByRoles = {
  admin: [
    { name: "Dashboard", path: "dashboard" },
    { name: "Utilisateurs", path: "users" },
    { name: "Statistiques", path: "statistiques" },
    { name: "Comptabilité", path: "comptabilite" },
    { name: "Stock", path: "stock" },
    { name: "Production", path: "production" },
    { name: "Commandes", path: "commandes" },
    { name: "Paramètres", path: "settings" },
  ],
  cuisinier: [
    { name: "Dashboard", path: "dashboard" },
    { name: "Commandes", path: "commandes" },
  ],
  vendeur: [
    { name: "Dashboard", path: "dashboard" },
    { name: "Ventes", path: "ventes" },
    { name: "Commandes", path: "commandes" },
  ],
  livreur: [
    { name: "Dashboard", path: "dashboard" },
    { name: "Livraisons", path: "livraisons" },
  ],
  superviseur: [
    { name: "Dashboard", path: "dashboard" },
    { name: "Ventes", path: "ventes" },
    { name: "Commandes", path: "commandes" },
  ],
};

const NavBar = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser(navigate, "/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Construire les routes avec le préfixe du rôle
  const routes = user?.role
    ? (routesByRoles[user.role] || []).map((route) => ({
        ...route,
        link: `/${user.role}/${route.path}`,
      }))
    : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src="/logo_petit.PNG"
              alt="Les Sandwichs du Docteur"
              className="h-10 w-20"
            />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 flex-1 mx-2">
            {routes.map((route) => {
              // Vérifier si la route actuelle correspond ou commence par le lien
              const isActive =
                location.pathname === route.link ||
                location.pathname.startsWith(route.link + "/");
              return (
                <Link
                  key={route.link}
                  to={route.link}
                  className={`
                    relative px-4 py-2 rounded-md text-sm font-medium transition-all
                    hover:bg-accent hover:text-accent-foreground
                    ${isActive ? "text-primary" : "text-muted-foreground"}
                    group
                  `}>
                  {route.name}
                  {/* Underline animation */}
                  <span
                    className={`
                      absolute bottom-0 left-0 right-0 h-0.5 bg-primary
                      transition-transform origin-left
                      ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }
                    `}
                  />
                </Link>
              );
            })}
          </div>

          {/* User Resume, Logout & Theme Switcher */}
          <div className="flex items-center gap-2">
            <UserResume />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Déconnexion"
              className="hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
