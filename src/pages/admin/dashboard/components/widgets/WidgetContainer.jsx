/**
 * WidgetContainer - Conteneur réutilisable pour les widgets
 * Fournit un style cohérent avec header et actions
 */

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * Composant WidgetContainer
 */
const WidgetContainer = ({
  titre,
  icon: Icon,
  color = "blue",
  children,
  onViewMore = null,
  viewMoreLabel = "Voir plus",
  headerAction = null,
}) => {
  // Map des couleurs adaptées au thème
  const COLORS = {
    blue: "text-primary bg-primary/10",
    green: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20",
    orange: "text-accent-foreground bg-accent/20",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20",
    yellow: "text-accent-foreground bg-accent/20",
    indigo: "text-primary bg-primary/10",
    red: "text-destructive bg-destructive/10",
  };

  const colorClass = COLORS[color] || COLORS.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/50">
        <div className="flex items-center justify-between">
          {/* Titre avec icône */}
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-card-foreground">{titre}</h3>
          </div>

          {/* Actions header */}
          <div className="flex items-center gap-2">
            {headerAction}
            {onViewMore && (
              <button
                onClick={onViewMore}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                {viewMoreLabel}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">{children}</div>
    </motion.div>
  );
};

export default WidgetContainer;
