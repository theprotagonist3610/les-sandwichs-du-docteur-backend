import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Mask = ({ message = "Chargement...", show = false }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-36 h-36 bg-gray-800/70 rounded-xl flex flex-col items-center justify-center gap-2 text-white text-sm">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
