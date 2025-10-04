import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import { badgeVariants } from "@/lib/animations";
import { useComptaStore } from "@/stores/comptaStore";

/**
 * 📶 Badge "Mode hors-ligne"
 * S'affiche uniquement quand isOffline === true
 */
export const OfflineBadge = ({ className = "" }) => {
  const { isOffline } = useComptaStore();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          variants={badgeVariants}
          initial="initial"
          animate="animate"
          exit={{ opacity: 0, scale: 0.8 }}
          className={`
            fixed top-4 right-4 z-50
            flex items-center gap-2 px-4 py-2 rounded-full
            bg-red-500 text-white
            shadow-lg
            ${className}
          `}>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Mode hors-ligne</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 📶 Banner version (pleine largeur en haut)
 */
export const OfflineBanner = ({ className = "" }) => {
  const { isOffline } = useComptaStore();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`
            w-full bg-red-500 text-white py-3 px-4
            flex items-center justify-center gap-2
            ${className}
          `}>
          <WifiOff className="w-5 h-5" />
          <span className="text-sm font-medium">
            Vous êtes hors ligne. Les modifications seront synchronisées à la
            reconnexion.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
