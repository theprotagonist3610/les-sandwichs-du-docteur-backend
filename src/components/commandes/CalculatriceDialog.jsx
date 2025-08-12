import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function CalculatriceDialog({
  open,
  onClose,
  onConfirm,
  produit,
}) {
  const [value, setValue] = useState("");

  // Réinitialise la valeur à chaque ouverture
  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  // Désactive le clavier physique
  useEffect(() => {
    const preventKeyDown = (e) => {
      if (open) e.preventDefault();
    };
    window.addEventListener("keydown", preventKeyDown);
    return () => window.removeEventListener("keydown", preventKeyDown);
  }, [open]);

  const handleKey = (k) => {
    if (k === "C") setValue("");
    else if (k === "OK") {
      if (Number(value) > 0) onConfirm(Number(value));
    } else if (/^[0-9]$/.test(k)) setValue((v) => (v === "0" ? k : v + k));
    else if (k === "Del") setValue((v) => v.slice(0, -1));
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "Del"],
    ["OK"],
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modale */}
          <motion.div
            className="fixed z-50 top-1/2 left-1/2 w-[90vw] max-w-xs -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-4 shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <div className="text-sm font-semibold mb-2 text-center">
              Quantité – {produit?.denomination}
            </div>

            {/* Affichage de la quantité */}
            <div className="flex justify-center my-2">
              <div className="text-3xl font-mono border-b-2 px-4 pb-1 min-w-[60px] text-center">
                {value || "0"}
              </div>
            </div>

            {/* Pavé numérique */}
            <div className="grid grid-cols-3 gap-2">
              {keys.flat().map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant={
                    k === "C"
                      ? "outline"
                      : k === "Del"
                      ? "outline"
                      : k === "OK"
                      ? "default"
                      : "secondary"
                  }
                  onClick={() => handleKey(k)}
                  disabled={k === "OK" && Number(value) <= 0}>
                  {k === "Del" ? (
                    <X className="w-4 h-4" />
                  ) : k === "OK" ? (
                    <Check />
                  ) : (
                    k
                  )}
                </Button>
              ))}
            </div>

            {/* Bouton de confirmation en bas */}
            <div className="mt-4">
              <Button
                className="w-full"
                disabled={Number(value) <= 0}
                onClick={() => {
                  if (Number(value) > 0) onConfirm(Number(value));
                }}>
                Confirmer
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
