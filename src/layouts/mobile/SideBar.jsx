/*
- utilser le sheet de shadcn
- animation slide right d'entree et slide left de sortie
- logo en haut puis
- les liens puis
- le themeswicther
- le userResume
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/toolkits/global/userToolkit";
import { logoutUser } from "@/toolkits/admin/userToolkit";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, LogOut } from "lucide-react";
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

const SideBar = () => {
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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          {/* Header avec logo */}
          <SheetHeader className="p-4 pb-3">
            <SheetTitle className="text-left">
              <Link to="/" className="flex items-center">
                <img
                  src="/logo_petit.PNG"
                  alt="Les Sandwichs du Docteur"
                  className="h-8 w-auto"
                />
              </Link>
            </SheetTitle>
          </SheetHeader>

          <Separator />

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
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
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 text-muted-foreground"
                    }
                  `}>
                  {route.name}
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* Footer avec ThemeSwitcher, Logout et UserResume */}
          <div className="p-4 space-y-2">
            <ThemeSwitcher />
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
            <UserResume />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SideBar;
