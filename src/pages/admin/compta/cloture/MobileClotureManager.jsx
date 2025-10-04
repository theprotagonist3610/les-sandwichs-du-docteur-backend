import { motion } from "framer-motion";
import { cardStaggerContainer } from "@/lib/animations";
import WeeksClotureList from "./components/WeeksClotureList";
import YearClotureCard from "./components/YearClotureCard";

/**
 * 📱 Vue mobile du gestionnaire de clôtures
 */
const MobileClotureManager = ({ year }) => {
  return (
    <motion.div
      variants={cardStaggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6">
      {/* Clôture annuelle */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🗓️ Clôture Annuelle
        </h2>
        <YearClotureCard year={year} />
      </section>

      {/* Clôtures hebdomadaires */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📋 Clôtures Hebdomadaires
        </h2>
        <WeeksClotureList year={year} />
      </section>
    </motion.div>
  );
};

export default MobileClotureManager;
