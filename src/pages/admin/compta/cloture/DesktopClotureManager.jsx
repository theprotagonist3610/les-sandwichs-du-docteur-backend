import { motion } from "framer-motion";
import { cardStaggerContainer } from "@/lib/animations";
import WeeksClotureList from "./components/WeeksClotureList";
import YearClotureCard from "./components/YearClotureCard";
import ClotureStats from "./components/ClotureStats";

/**
 * 🖥️ Vue desktop du gestionnaire de clôtures
 */
const DesktopClotureManager = ({ year }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche: Stats + Année */}
      <motion.div
        variants={cardStaggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6">
        {/* Statistiques */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📊 Statistiques
          </h2>
          <ClotureStats year={year} />
        </section>

        {/* Clôture annuelle */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🗓️ Clôture Annuelle
          </h2>
          <YearClotureCard year={year} />
        </section>
      </motion.div>

      {/* Colonne droite: Liste des semaines */}
      <div className="lg:col-span-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📋 Clôtures Hebdomadaires
        </h2>
        <WeeksClotureList year={year} />
      </div>
    </div>
  );
};

export default DesktopClotureManager;
