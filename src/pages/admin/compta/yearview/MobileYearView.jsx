import { motion } from "framer-motion";
import { cardStaggerContainer } from "@/lib/animations";
import YearMovementsChart from "./components/YearMovementsChart";
import YearTransactionsTables from "./components/YearTransactionsTables";

/**
 * 📱 Vue mobile de l'année
 * Disposition verticale: Chart mouvements + Tableaux transactions
 */
const MobileYearView = ({ year, yearId }) => {
  return (
    <motion.div
      variants={cardStaggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6">
      {/* Section Mouvements */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📊 Mouvements de l'année
        </h2>
        <YearMovementsChart year={year} yearId={yearId} />
      </section>

      {/* Section Transactions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📋 Transactions
        </h2>
        <YearTransactionsTables year={year} yearId={yearId} />
      </section>
    </motion.div>
  );
};

export default MobileYearView;
