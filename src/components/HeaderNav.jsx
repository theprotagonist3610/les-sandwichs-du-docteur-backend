import { useNavigate, useLocation } from "react-router-dom";
import {
  User2,
  Menu,
  LogOut,
  Home,
  UtensilsCrossed,
  ClipboardList,
  BarChart2,
  Boxes,
  BadgeDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import AppToolbar from "@/components/AppToolbar";
import { logout } from "@/components/userToolkit";
import { useCurrentUser } from "@/components/useCurrentUser";

const badgeColors = {
  superviseur: "bg-violet-500 text-white",
  cuisinier: "bg-yellow-500 text-white",
  vendeur: "bg-blue-500 text-white",
  vendeuse: "bg-blue-500 text-white",
  livreur: "bg-green-500 text-white",
  default: "bg-gray-400 text-white",
};

export default function HeaderNav({ onRefresh }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const handleRefresh = () => {
    onRefresh();
    console.log("Refresh fait");
  };

  const handleLogout = async () => {
    await logout(); // déconnexion Firebase + nettoyage
    navigate("/login");
  };

  const locationTitle = (l = location.pathname) => {
    const first_loc = l.split("/")[1];
    if (first_loc !== "") {
      return first_loc.charAt(0).toUpperCase() + first_loc.slice(1);
    } else {
      return "Dashboard";
    }
  };

  const linkClass = (path) =>
    `justify-start text-lg gap-2 w-full ${
      location.pathname === path
        ? "bg-orange-100 text-orange-700 font-semibold"
        : ""
    }`;

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm w-full">
      {/* Conteneur principal en deux lignes */}
      <div className="flex flex-col w-full">
        {/* Ligne 1 : Logo (gauche) + Menu burger (droite) */}
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <div className="shrink-0">
            <img
              src="/logo_petit.PNG"
              alt="Logo"
              className="ml-4 h-16 w-auto"
            />
          </div>

          {/* Menu Burger (Sheet) */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="m-2">
                <Menu size={24} />
              </Button>
            </SheetTrigger>

            <AnimatePresence>
              {open && (
                <SheetContent side="left" className="w-64 pt-8 overflow-hidden">
                  <motion.nav
                    className="flex flex-col gap-4"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}>
                    <Button
                      variant="ghost"
                      className={linkClass("/")}
                      onClick={() => navigate("/")}>
                      <Home size={18} /> Tableau de bord
                    </Button>
                    <Button
                      variant="ghost"
                      className={linkClass("/commande-rapide/")}
                      onClick={() => navigate("/commande-rapide/")}>
                      <BadgeDollarSign size={18} /> Panneau de vente
                    </Button>
                    <Button
                      variant="ghost"
                      className={linkClass("/menu/")}
                      onClick={() => navigate("/menu/")}>
                      <UtensilsCrossed size={18} /> Menu
                    </Button>
                    <Button
                      variant="ghost"
                      className={linkClass("/stocks/")}
                      onClick={() => navigate("/stocks/")}>
                      <Boxes size={18} /> Stock
                    </Button>
                    <Button
                      variant="ghost"
                      className={linkClass("/commandes/")}
                      onClick={() => navigate("/commandes/")}>
                      <ClipboardList size={18} /> Commandes
                    </Button>
                    <Button
                      variant="ghost"
                      className={linkClass("/statistiques/")}
                      onClick={() => navigate("/statistiques/")}>
                      <BarChart2 size={18} /> Statistiques
                    </Button>
                    <Button
                      variant="ghost"
                      className={linkClass("/admin/")}
                      onClick={() => navigate("/admin/")}>
                      <User2 size={18} /> Admin
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-lg gap-2 w-full text-red-600"
                      onClick={handleLogout}>
                      <LogOut size={18} /> Déconnexion
                    </Button>
                  </motion.nav>
                </SheetContent>
              )}
            </AnimatePresence>
          </Sheet>
        </div>

        {/* Ligne 2 : Titre (gauche) + Utilisateur (droite) */}
        <div className="flex justify-between">
          <div className="ml-2">
            <span className="text-base font-semibold">{locationTitle()}</span>
          </div>
          {user && (
            <>
              {user?.prenom && (
                <div className="text-sm text-gray-500">Mr. {user.prenom}</div>
              )}
              {user?.fonction && (
                <div
                  className={`mr-2 inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                    badgeColors[user.fonction] || badgeColors.default
                  }`}>
                  {user?.fonction?.charAt(0).toUpperCase() +
                    user?.fonction?.slice(1)}
                </div>
              )}
            </>
          )}
        </div>

        {/* AppToolbar (desktop) — inchangé */}
        <div className="hidden md:flex">
          <AppToolbar onRefresh={handleRefresh} />
        </div>

        {/* AppToolbar (mobile) — inchangé */}
        <div className="md:hidden mt-2">
          <AppToolbar onRefresh={handleRefresh} />
        </div>
      </div>
    </header>
  );
}
