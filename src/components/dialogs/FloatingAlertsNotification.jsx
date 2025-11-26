/**
 * FloatingAlertsNotification.jsx
 * Notification flottante pour les alertes en attente (todos + notifications)
 * - Desktop: en haut à gauche
 * - Mobile: en bas à gauche
 * - Animation framer-motion
 * - Auto-dismiss après 5s
 * - Fermeture manuelle avec croix
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Composant de notification flottante
 * @param {Object} props
 * @param {boolean} props.show - Afficher ou non
 * @param {number} props.pendingTodos - Nombre de todos non terminés
 * @param {number} props.pendingNotifications - Nombre de notifications non lues
 * @param {Function} props.onDismiss - Callback de fermeture
 * @param {boolean} props.isMobile - Mode mobile (position en bas)
 */
const FloatingAlertsNotification = ({
  show,
  pendingTodos = 0,
  pendingNotifications = 0,
  onDismiss,
  isMobile = false,
}) => {
  // Variants d'animation selon la position
  const variants = {
    initial: {
      opacity: 0,
      x: -100,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      x: -100,
      scale: 0.8,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Position selon desktop/mobile
  const positionClasses = isMobile
    ? "fixed bottom-20 left-4 z-50" // En bas à gauche (au-dessus de la navbar mobile)
    : "fixed top-20 left-4 z-50"; // En haut à gauche (en dessous de la navbar desktop)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={positionClasses}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
            {/* Header avec bouton fermer */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary animate-pulse" />
                Rappel
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Contenu */}
            <div className="space-y-2">
              {pendingTodos > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10">
                    <ListTodo className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {pendingTodos}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {pendingTodos === 1 ? "tâche non terminée" : "tâches non terminées"}
                    </span>
                  </div>
                </div>
              )}

              {pendingNotifications > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10">
                    <Bell className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {pendingNotifications}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {pendingNotifications === 1
                        ? "notification non lue"
                        : "notifications non lues"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Barre de progression pour auto-dismiss */}
            <motion.div
              className="mt-3 h-1 bg-primary/20 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingAlertsNotification;
