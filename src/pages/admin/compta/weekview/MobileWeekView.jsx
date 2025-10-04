import { motion } from "framer-motion";
import { cardStaggerContainer } from "@/lib/animations";
import WeekMovementsChart from "./components/WeekMovementsChart";
import WeekTransactionsTables from "./components/WeekTransactionsTables";

/**
 * 📱 Vue mobile de la semaine
 * Disposition verticale: Chart mouvements + Tableaux transactions
 */
const MobileWeekView = ({ weekId, weekInfo }) => {
  return (
    <motion.div
      variants={cardStaggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6">
      {/* Section Mouvements */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📊 Mouvements de la semaine
        </h2>
        <WeekMovementsChart weekId={weekId} weekInfo={weekInfo} />
      </section>

      {/* Section Transactions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📋 Transactions
        </h2>
        <WeekTransactionsTables weekId={weekId} weekInfo={weekInfo} />
      </section>
    </motion.div>
  );
};

export default MobileWeekView;
