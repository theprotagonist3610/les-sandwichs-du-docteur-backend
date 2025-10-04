import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { errorShakeVariants } from "@/lib/animations";

/**
 * ⚠️ Composant d'affichage d'erreur avec retry
 */
export const ErrorState = ({
  message = "Une erreur est survenue",
  onRetry,
  className = "",
}) => {
  return (
    <motion.div
      variants={errorShakeVariants}
      initial="initial"
      animate="animate"
      className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 text-center max-w-md">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      )}
    </motion.div>
  );
};

/**
 * 📭 État vide (pas de données)
 */
export const EmptyState = ({
  title = "Aucune donnée",
  description = "Aucune transaction trouvée",
  icon: Icon,
  action,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">
        {description}
      </p>

      {action}
    </motion.div>
  );
};
