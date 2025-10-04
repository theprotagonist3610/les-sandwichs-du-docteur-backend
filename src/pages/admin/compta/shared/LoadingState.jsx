import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { skeletonVariants } from "@/lib/animations";

/**
 * 🔄 Composant de chargement avec skeleton
 * Utilisé pendant les appels asynchrones
 */
export const LoadingState = ({
  variant = "default",
  message = "Chargement...",
  className = "",
}) => {
  if (variant === "skeleton") {
    return <LoadingSkeleton className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </motion.div>
  );
};

/**
 * 📊 Skeleton pour les cards
 */
export const LoadingSkeleton = ({ className = "", rows = 3 }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
          className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24 w-full"
        />
      ))}
    </div>
  );
};

/**
 * 📋 Skeleton pour les tableaux
 */
export const TableLoadingSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
          className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="bg-gray-200 dark:bg-gray-700 rounded h-10 flex-1"
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
};

/**
 * 📈 Skeleton pour les graphiques
 */
export const ChartLoadingSkeleton = () => {
  return (
    <motion.div
      variants={skeletonVariants}
      initial="initial"
      animate="animate"
      className="bg-gray-200 dark:bg-gray-700 rounded-lg w-full h-64 flex items-end justify-around p-4 gap-2">
      {[60, 80, 40, 90, 70, 50, 85].map((height, i) => (
        <div
          key={i}
          className="bg-gray-300 dark:bg-gray-600 rounded-t w-full"
          style={{ height: `${height}%` }}
        />
      ))}
    </motion.div>
  );
};
