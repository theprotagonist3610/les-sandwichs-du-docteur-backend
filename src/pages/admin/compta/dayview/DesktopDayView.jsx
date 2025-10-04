import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cardStaggerContainer } from "@/lib/animations";
import DayMovementsChart from "./components/DayMovementsChart";
import DayComparisonChart from "./components/DayComparisonChart";
import DayTransactionsTables from "./components/DayTransactionsTables";

/**
 * 🖥️ Vue desktop du jour
 * Double side: Graphiques à gauche + Tableaux à droite (switch entrées/sorties)
 */
const DesktopDayView = ({ date, dateId }) => {
  const [activeTable, setActiveTable] = useState("entrees"); // 'entrees' | 'sorties'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Colonne gauche: Graphiques */}
      <motion.div
        variants={cardStaggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6">
        {/* Graphique mouvements */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📊 Mouvements du jour
          </h2>
          <DayMovementsChart date={date} dateId={dateId} />
        </section>

        {/* Graphique comparaison */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📈 Comparaison avec la moyenne
          </h2>
          <DayComparisonChart date={date} dateId={dateId} />
        </section>
      </motion.div>

      {/* Colonne droite: Tableaux avec switch */}
      <div className="space-y-6">
        {/* Toggle entrées/sorties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 inline-flex">
          <button
            onClick={() => setActiveTable("entrees")}
            className={`
              relative flex items-center gap-2 px-6 py-2.5 rounded-md font-medium transition-all
              ${
                activeTable === "entrees"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }
            `}>
            {activeTable === "entrees" && (
              <motion.div
                layoutId="activeTableTab"
                className="absolute inset-0 bg-green-600 rounded-md"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <TrendingUp className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Entrées</span>
          </button>

          <button
            onClick={() => setActiveTable("sorties")}
            className={`
              relative flex items-center gap-2 px-6 py-2.5 rounded-md font-medium transition-all
              ${
                activeTable === "sorties"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }
            `}>
            {activeTable === "sorties" && (
              <motion.div
                layoutId="activeTableTab"
                className="absolute inset-0 bg-red-600 rounded-md"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <TrendingDown className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Sorties</span>
          </button>
        </div>

        {/* Tableaux */}
        <motion.div
          key={activeTable}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}>
          <DayTransactionsTables
            date={date}
            dateId={dateId}
            activeTable={activeTable}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default DesktopDayView;
