import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, CheckCircle, Clock } from "lucide-react";
import { SemaineModel } from "@/toolkits/comptabilite";
import { FirestoreService } from "@/toolkits/comptabilite/services/firestore";
import { cardStaggerItem } from "@/lib/animations";
import { LoadingState } from "../../shared/LoadingState";

/**
 * 📊 Statistiques des clôtures
 */
const ClotureStats = ({ year }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const semaines = SemaineModel.genererSemainesAnnee(year);

        let closed = 0;
        let open = 0;
        let canBeClosed = 0;

        for (const semaine of semaines) {
          const weekData = await FirestoreService.getWeekDocument(
            year,
            semaine.weekId
          );

          if (weekData?.cloture) {
            closed++;
          } else {
            open++;
            const isComplete = new Date(semaine.dateFin) < new Date();
            if (isComplete) canBeClosed++;
          }
        }

        setStats({
          total: semaines.length,
          closed,
          open,
          canBeClosed,
          percentClosed: ((closed / semaines.length) * 100).toFixed(1),
        });
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [year]);

  if (loading) {
    return <LoadingState />;
  }

  if (!stats) return null;

  const statsData = [
    {
      label: "Clôturées",
      value: stats.closed,
      icon: Lock,
      color: "amber",
    },
    {
      label: "Ouvertes",
      value: stats.open,
      icon: Unlock,
      color: "blue",
    },
    {
      label: "À clôturer",
      value: stats.canBeClosed,
      icon: Clock,
      color: "orange",
    },
  ];

  return (
    <motion.div
      variants={cardStaggerItem}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Statistiques {year}
      </h3>

      <div className="space-y-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/20 rounded-lg`}>
                  <Icon
                    className={`w-4 h-4 text-${stat.color}-600 dark:text-${stat.color}-400`}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stat.value}
              </span>
            </div>
          );
        })}

        {/* Barre de progression */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Progression
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {stats.percentClosed}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.percentClosed}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClotureStats;
