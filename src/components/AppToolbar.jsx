import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Bell, ListTodo, RefreshCcw, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AppToolbar({ className = "", onRefresh }) {
  const navigate = useNavigate();

  // Les handlers utilisent onRefresh si défini
  const ICONS = [
    {
      label: "Retour",
      icon: ArrowLeft,
      onClick: () => navigate(-1),
    },
    {
      label: "Actualiser",
      icon: RefreshCcw,
      onClick: () => {
        if (onRefresh) {
          onRefresh();
        } else {
          // Tu peux mettre un toast ici si tu as une librairie (ex: sonner, react-toastify, etc)
          // Sinon, on fait rien
          // alert("Aucune fonction de refresh n'est définie.");
        }
      },
    },
    {
      label: "Mon compte",
      icon: User,
      onClick: () => navigate("/account"),
    },
    {
      label: "Notifications",
      icon: Bell,
      onClick: () => navigate("/notifications"),
    },
    {
      label: "Todo",
      icon: ListTodo,
      onClick: () => navigate("/todos"),
    },
  ];

  return (
    <nav
      className={
        "bottom-0 left-0 right-0 md:top-0 md:bottom-auto z-30 flex justify-between items-center bg-white/90 backdrop-blur border-t md:border-t-0 md:border-b px-2 py-1 md:px-4 md:py-2 shadow md:rounded-b-lg transition " +
        className
      }
      role="navigation">
      <div className="w-full flex justify-between md:justify-end gap-1 md:gap-3 max-w-2xl mx-auto">
        {ICONS.map(({ label, icon: Icon, onClick }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05, type: "spring", stiffness: 300 }}
            className="flex-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label={label}
              onClick={onClick}
              className={
                "mx-auto w-12 h-12 md:w-10 md:h-10 flex items-center justify-center transition " +
                "active:scale-90 active:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/70"
              }>
              <Icon className="w-7 h-7 md:w-6 md:h-6" />
              <span className="sr-only">{label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </nav>
  );
}
