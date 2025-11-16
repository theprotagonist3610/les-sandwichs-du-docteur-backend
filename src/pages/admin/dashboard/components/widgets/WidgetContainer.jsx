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
  // Map des couleurs
  const COLORS = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
    purple: "text-purple-600 bg-purple-50",
    yellow: "text-yellow-600 bg-yellow-50",
    indigo: "text-indigo-600 bg-indigo-50",
    red: "text-red-600 bg-red-50",
  };

  const colorClass = COLORS[color] || COLORS.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* Titre avec icône */}
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{titre}</h3>
          </div>

          {/* Actions header */}
          <div className="flex items-center gap-2">
            {headerAction}
            {onViewMore && (
              <button
                onClick={onViewMore}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
