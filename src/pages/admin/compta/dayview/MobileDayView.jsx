import { motion } from "framer-motion";
import { cardStaggerContainer } from "@/lib/animations";
import DayMovementsChart from "./components/DayMovementsChart";
import DayTransactionsTables from "./components/DayTransactionsTables";

/**
 * 📱 Vue mobile du jour
 * Disposition verticale: Chart mouvements + Tableaux transactions
 */
const MobileDayView = ({ date, dateId }) => {
  return (
    <motion.div
      variants={cardStaggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6">
      {/* Section Mouvements */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📊 Mouvements du jour
        </h2>
        <DayMovementsChart date={date} dateId={dateId} />
      </section>

      {/* Section Transactions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📋 Transactions
        </h2>
        <DayTransactionsTables date={date} dateId={dateId} />
      </section>
    </motion.div>
  );
};

export default MobileDayView;
