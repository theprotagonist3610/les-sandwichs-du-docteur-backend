import { motion } from "framer-motion";
import { cardStaggerContainer } from "@/lib/animations";
import MonthMovementsChart from "./components/MonthMovementsChart";
import MonthTransactionsTables from "./components/MonthTransactionsTables";

/**
 * 📱 Vue mobile du mois
 * Disposition verticale: Chart mouvements + Tableaux transactions
 */
const MobileMonthView = ({ monthData, monthId }) => {
  return (
    <motion.div
      variants={cardStaggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6">
      {/* Section Mouvements */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📊 Mouvements du mois
        </h2>
        <MonthMovementsChart monthData={monthData} monthId={monthId} />
      </section>

      {/* Section Transactions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📋 Transactions
        </h2>
        <MonthTransactionsTables monthData={monthData} monthId={monthId} />
      </section>
    </motion.div>
  );
};

export default MobileMonthView;
