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
    <header className="sticky top-0 z-30 bg-white shadow-sm flex flex-col w-full">
      <div className="flex justify-between items-center p-2 w-full">
        {/* Logo + menu burger */}
        <div className="flex items-center justify-between w-full gap-4">
          {/* Colonne 1 : logo */}
          <div className="shrink-0">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-14 h-14 rounded-full"
            />
          </div>

          {/* Colonne 2 : titre de page (stretchable) */}
          <div className="flex-1">
            <span className="text-base font-semibold">{locationTitle()}</span>
          </div>

          {/* Colonne 3 : bonjour + badge */}
          {user && (
            <div className="flex flex-col items-center text-right shrink-0">
              <span className="text-sm text-gray-500">
                Bonjour, {user.prenom} 👋
              </span>
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                  badgeColors[user.fonction] || badgeColors.default
                }`}>
                {user.fonction.charAt(0).toUpperCase() + user.fonction.slice(1)}
              </span>
            </div>
          )}
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
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                  <Button
                    variant="ghost"
                    className={linkClass("/")}
                    onClick={() => navigate("/")}>
                    <Home size={18} /> Tableau de bord
                  </Button>
                  <Button
                    variant="ghost"
                    className={linkClass("/commande-rapide")}
                    onClick={() => navigate("/commande-rapide")}>
                    <BadgeDollarSign size={18} /> Panneau de vente
                  </Button>
                  <Button
                    variant="ghost"
                    className={linkClass("/menu")}
                    onClick={() => navigate("/menu")}>
                    <UtensilsCrossed size={18} /> Menu
                  </Button>
                  <Button
                    variant="ghost"
                    className={linkClass("/stocks")}
                    onClick={() => navigate("/stocks")}>
                    <Boxes size={18} /> Stock
                  </Button>
                  <Button
                    variant="ghost"
                    className={linkClass("/commandes")}
                    onClick={() => navigate("/commandes")}>
                    <ClipboardList size={18} /> Commandes
                  </Button>
                  <Button
                    variant="ghost"
                    className={linkClass("/statistiques")}
                    onClick={() => navigate("/statistiques")}>
                    <BarChart2 size={18} /> Statistiques
                  </Button>
                  <Button
                    variant="ghost"
                    className={linkClass("/admin")}
                    onClick={() => navigate("/admin")}>
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

        {/* AppToolbar (desktop) */}
        <div className="hidden md:flex">
          <AppToolbar onRefresh={handleRefresh} />
        </div>
      </div>

      {/* AppToolbar (mobile) */}
      <div className="md:hidden mt-2">
        <AppToolbar onRefresh={handleRefresh} />
      </div>
    </header>
  );
}
