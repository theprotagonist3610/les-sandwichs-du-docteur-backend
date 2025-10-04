import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { badgeVariants } from "@/lib/animations";
import { formatDateDisplay } from "@/lib/compta-utils";

/**
 * 🔒 Badge "Clôturé" pour les périodes fermées
 *
 * @param {Object} props
 * @param {boolean} props.isClosed - Si la période est clôturée
 * @param {string} props.date - Date de clôture optionnelle
 * @param {string} props.size - Taille ('sm' | 'md' | 'lg')
 * @param {string} props.className - Classes CSS additionnelles
 */
export const ClotureBadge = ({
  isClosed,
  date,
  size = "sm",
  className = "",
}) => {
  if (!isClosed) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <motion.div
      variants={badgeVariants}
      initial="initial"
      animate="animate"
      className={`
        inline-flex items-center gap-1.5 rounded-full
        bg-amber-100 dark:bg-amber-900/30
        text-amber-800 dark:text-amber-300
        font-medium
        ${sizeClasses[size]}
        ${className}
      `}>
      <Lock className="w-3 h-3" />
      <span>Clôturé</span>
      {date && (
        <span className="text-xs opacity-75">
          • {formatDateDisplay(date, "dd/MM/yy")}
        </span>
      )}
    </motion.div>
  );
};

/**
 * 🔓 Badge "Non clôturé" (variant)
 */
export const OpenBadge = ({ size = "sm", className = "" }) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <motion.div
      variants={badgeVariants}
      initial="initial"
      animate="animate"
      className={`
        inline-flex items-center gap-1.5 rounded-full
        bg-green-100 dark:bg-green-900/30
        text-green-800 dark:text-green-300
        font-medium
        ${sizeClasses[size]}
        ${className}
      `}>
      <span>Ouvert</span>
    </motion.div>
  );
};
