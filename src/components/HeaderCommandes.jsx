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
  Filter,
  Search,
  ListChecks,
  Wallet,
  Bike,
  Coins,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  BadgeDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo } from "react";
import AppToolbar from "@/components/AppToolbar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";

// Composant calendrier avec nombre de commandes sous chaque jour
function Calendar21({ commandesByDate, selected, onChange }) {
  const getKey = (date) => date.toISOString().split("T")[0];
  return (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={onChange}
      numberOfMonths={1}
      captionLayout="dropdown"
      // Astuce Tailwind : applique bg-gray-100 à .rdp, .rdp table, .rdp td, .rdp th
      className="
        rounded-lg border shadow-sm
        bg-gray-100
        [&_.rdp]:bg-gray-100
        [&_.rdp-table]:bg-gray-100
        [&_.rdp-cell]:bg-gray-100
        [&_.rdp-head]:bg-gray-100
        [&_td]:bg-gray-100
        [&_th]:bg-gray-100
      "
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "long" }),
      }}
      components={{
        DayButton: ({ children, modifiers, day, ...props }) => {
          const dateKey = getKey(day.date);
          const nbCommandes = commandesByDate?.[dateKey] ?? 0;
          return (
            <CalendarDayButton
              day={day}
              modifiers={modifiers}
              {...props}
              className="flex flex-col items-center">
              <span>{children}</span>
              {!modifiers.outside && (
                <span
                  className={`text-xs mt-0.5 ${
                    nbCommandes > 0
                      ? "text-orange-600 font-semibold"
                      : "text-gray-400"
                  }`}>
                  {nbCommandes > 0 ? `(${nbCommandes})` : "(0)"}
                </span>
              )}
            </CalendarDayButton>
          );
        },
      }}
    />
  );
}

const statuts = ["En attente", "En cours", "Livrée", "Annulée"];
const paiements = ["Cash", "Mobile Money", "Carte", "Compte"];
const livreurs = ["Sophie", "Jean", "Alex", "Brice"];

export default function HeaderCommandes({
  filtre,
  setFiltre,
  search,
  setSearch,
  commandes = [],
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Collapsible toolbar state
  const [collapsed, setCollapsed] = useState(false);

  // Calcule commandesByDate à partir du tableau commandes
  const commandesByDate = useMemo(() => {
    const counts = {};
    commandes.forEach((cmd) => {
      if (cmd.date_livraison) {
        const d = new Date(cmd.date_livraison);
        if (!isNaN(d)) {
          const key = d.toISOString().split("T")[0];
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    });
    return counts;
  }, [commandes]);

  const locationTitle = (l = location.pathname) => {
    const first_loc = l.split("/")[1];
    return first_loc
      ? first_loc.charAt(0).toUpperCase() + first_loc.slice(1)
      : "Dashboard";
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const linkClass = (path) =>
    `justify-start text-lg gap-2 w-full ${
      location.pathname === path
        ? "bg-orange-100 text-orange-700 font-semibold"
        : ""
    }`;

  // ---- Toolbar collapsible ----
  function Toolbar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <div className="bg-white p-4 w-full max-w-full mx-auto">
        {/* Titre stylisé + bouton collapse */}
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-1 text-orange-600" />
            <h2 className="text-lg font-bold text-orange-700">
              Filtrer les commandes
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={
              collapsed ? "Déplier les filtres" : "Replier les filtres"
            }>
            {collapsed ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            )}
          </Button>
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden">
              <div className="flex flex-col gap-1 mt-1 w-full">
                {/* Recherche */}
                <div className="flex items-center gap-1 w-full">
                  <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <label className="text-xs font-medium text-gray-500 w-16 min-w-fit">
                    Recherche
                  </label>
                  <Input
                    placeholder="Client ou code"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 h-8 text-xs px-2 min-w-0"
                  />
                </div>
                {/* Statut */}
                <div className="flex items-center gap-1 w-full">
                  <ListChecks className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <label className="text-xs font-medium text-gray-500 w-16 min-w-fit">
                    Statut
                  </label>
                  <Select
                    value={filtre.statut}
                    onValueChange={(v) =>
                      setFiltre((f) => ({ ...f, statut: v }))
                    }>
                    <SelectTrigger className="flex-1 h-8 text-xs px-2 min-w-0">
                      {filtre.statut || "Tous"}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Tous</SelectItem>
                      {/* {statuts.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))} */}
                    </SelectContent>
                  </Select>
                </div>
                {/* Paiement */}
                <div className="flex items-center gap-1 w-full">
                  <Wallet className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <label className="text-xs font-medium text-gray-500 w-16 min-w-fit">
                    Paiement
                  </label>
                  <Select
                    value={filtre.paiement}
                    onValueChange={(v) =>
                      setFiltre((f) => ({ ...f, paiement: v }))
                    }>
                    <SelectTrigger className="flex-1 h-8 text-xs px-2 min-w-0">
                      {filtre.paiement || "Tous"}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Tous</SelectItem>
                      {/* {paiements.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))} */}
                    </SelectContent>
                  </Select>
                </div>
                {/* Livreur */}
                <div className="flex items-center gap-1 w-full">
                  <Bike className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <label className="text-xs font-medium text-gray-500 w-16 min-w-fit">
                    Livreur
                  </label>
                  <Select
                    value={filtre.livreur}
                    onValueChange={(v) =>
                      setFiltre((f) => ({ ...f, livreur: v }))
                    }>
                    <SelectTrigger className="flex-1 h-8 text-xs px-2 min-w-0">
                      {filtre.livreur || "Tous"}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Tous</SelectItem>
                      {/* {livreurs.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))} */}
                    </SelectContent>
                  </Select>
                </div>
                {/* Coût */}
                <div className="flex items-center gap-1 w-full">
                  <Coins className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <label className="text-xs font-medium text-gray-500 w-16 min-w-fit">
                    Coût
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Min"
                    className="w-14 h-8 text-xs px-2"
                    value={filtre.coutMin || ""}
                    onChange={(e) =>
                      setFiltre((f) => ({
                        ...f,
                        coutMin: e.target.value ? Number(e.target.value) : "",
                      }))
                    }
                  />
                  <span className="text-gray-500 mx-1">-</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Max"
                    className="w-14 h-8 text-xs px-2"
                    value={filtre.coutMax || ""}
                    onChange={(e) =>
                      setFiltre((f) => ({
                        ...f,
                        coutMax: e.target.value ? Number(e.target.value) : "",
                      }))
                    }
                  />
                </div>
                {/* Calendar */}
                <div className="flex items-center gap-1 w-full">
                  <CalendarDays className="w-4 h-4 text-pink-600 flex-shrink-0" />
                  <label className="text-xs font-medium text-gray-500 w-16 min-w-fit">
                    Dates
                  </label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 px-2 text-xs justify-start">
                        <CalendarDays className="w-3 h-3 mr-1" />
                        {filtre.dateRange && filtre.dateRange.from
                          ? `${format(filtre.dateRange.from, "P")}${
                              filtre.dateRange.to
                                ? " → " + format(filtre.dateRange.to, "P")
                                : ""
                            }`
                          : "Dates"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0">
                      <Calendar21
                        commandesByDate={commandesByDate}
                        selected={filtre.dateRange}
                        onChange={(range) => {
                          setFiltre((f) => ({ ...f, dateRange: range }));
                          setCalendarOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ------- Le Header -------
  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm flex flex-col w-full">
      <div className="flex justify-between items-center p-2 w-full">
        {/* Logo + menu burger */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-14 h-14 rounded-full" />
          <span className="text-base font-semibold">{locationTitle()}</span>
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
        {/* AppToolbar à droite sur desktop, en dessous sur mobile */}
        <div className="hidden md:flex">
          <AppToolbar />
        </div>
      </div>
      {/* AppToolbar visible en bas du header sur mobile */}
      <div className="md:hidden mt-2">
        <AppToolbar />
      </div>
      {/* Toolbar de filtres spécifique commandes */}
      <Toolbar />
    </header>
  );
}
