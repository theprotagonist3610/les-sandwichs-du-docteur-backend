import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { SemaineModel } from "@/toolkits/comptabilite";
import { useCloture } from "@/toolkits/comptabilite";
import { FirestoreService } from "@/toolkits/comptabilite/services/firestore";
import { formatDateDisplay, formatMontant } from "@/lib/compta-utils";
import { cardStaggerItem } from "@/lib/animations";
import { LoadingState } from "../../shared/LoadingState";
import ClotureConfirmDialog from "./ClotureConfirmDialog";

/**
 * 📋 Liste des semaines avec actions de clôture
 */
const WeeksClotureList = ({ year }) => {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState(null); // 'close' | 'open'

  const {
    cloturerSemaine,
    decloturerSemaine,
    loading: actionLoading,
  } = useCloture();

  // Charger les semaines
  useEffect(() => {
    const loadWeeks = async () => {
      try {
        setLoading(true);
        const semaines = SemaineModel.genererSemainesAnnee(year);

        const weeksData = await Promise.all(
          semaines.map(async (semaine) => {
            const weekData = await FirestoreService.getWeekDocument(
              year,
              semaine.weekId
            );
            return {
              ...semaine,
              cloture: weekData?.cloture || false,
              resume: weekData?.resume || null,
            };
          })
        );

        setWeeks(weeksData);
      } catch (error) {
        console.error("Erreur chargement semaines:", error);
        toast.error("Erreur lors du chargement des semaines");
      } finally {
        setLoading(false);
      }
    };

    loadWeeks();
  }, [year]);

  // Ouvrir le dialog de confirmation
  const handleOpenDialog = (week, action) => {
    setSelectedWeek(week);
    setActionType(action);
    setShowDialog(true);
  };

  // Confirmer l'action
  const handleConfirm = async () => {
    if (!selectedWeek) return;

    try {
      if (actionType === "close") {
        await cloturerSemaine(year, selectedWeek.weekId);
        toast.success(`Semaine ${selectedWeek.weekId} clôturée avec succès`);
      } else {
        await decloturerSemaine(year, selectedWeek.weekId);
        toast.success(`Semaine ${selectedWeek.weekId} déclôturée avec succès`);
      }

      // Recharger les semaines
      const updatedWeeks = weeks.map((w) =>
        w.weekId === selectedWeek.weekId
          ? { ...w, cloture: actionType === "close" }
          : w
      );
      setWeeks(updatedWeeks);

      setShowDialog(false);
    } catch (error) {
      console.error("Erreur action clôture:", error);
      toast.error(error.message || "Une erreur est survenue");
    }
  };

  if (loading) {
    return <LoadingState message="Chargement des semaines..." />;
  }

  return (
    <>
      <div className="space-y-3">
        {weeks.map((week, index) => {
          const isComplete = new Date(week.dateFin) < new Date();
          const canClose = isComplete && !week.cloture;

          return (
            <motion.div
              key={week.weekId}
              custom={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                bg-white dark:bg-gray-800 rounded-lg border p-4
                ${
                  week.cloture
                    ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10"
                    : "border-gray-200 dark:border-gray-700"
                }
              `}>
              <div className="flex items-start justify-between gap-4">
                {/* Info semaine */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {week.label}
                    </h3>
                    {week.cloture && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-full">
                        <Lock className="w-3 h-3" />
                        Clôturé
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateDisplay(week.dateDebut, "dd MMM")} -{" "}
                      {formatDateDisplay(week.dateFin, "dd MMM")}
                    </span>
                    {week.resume && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        CA: {formatMontant(week.resume.chiffre_affaires)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {week.cloture ? (
                    <button
                      onClick={() => handleOpenDialog(week, "open")}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition-colors"
                      title="Déclôturer (Admin)">
                      <Unlock className="w-4 h-4" />
                      Déclôturer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenDialog(week, "close")}
                      disabled={!canClose || actionLoading}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                      title={
                        !isComplete
                          ? "Semaine non terminée"
                          : "Clôturer la semaine"
                      }>
                      <Lock className="w-4 h-4" />
                      Clôturer
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog de confirmation */}
      <ClotureConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleConfirm}
        week={selectedWeek}
        actionType={actionType}
        isProcessing={actionLoading}
      />
    </>
  );
};

export default WeeksClotureList;
