import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cardStaggerContainer, cardStaggerItem } from "@/lib/animations";
import { useTransactions } from "@/toolkits/comptabilite";
import { validators } from "@/toolkits/comptabilite/utils/validators";
import { dateUtils } from "@/toolkits/comptabilite/utils/dates";
import { formatDateForUrl } from "@/lib/compta-utils";
import comptes from "@/toolkits/comptabilite/liste";
import DatePickerField from "./components/DatePickerField";
import AccountSelector from "./components/AccountSelector";
import AmountInput from "./components/AmountInput";
import PaymentModeSelector from "./components/PaymentModeSelector";
import DescriptionField from "./components/DescriptionField";
import DeleteConfirmDialog from "./components/DeleteConfirmDialog";

/**
 * 📝 Formulaire de transaction
 * Gère la création et l'édition des transactions
 */
const TransactionForm = ({ transaction, isEditMode, isMobile }) => {
  const navigate = useNavigate();
  const { ajouter, modifier, supprimer, loading } = useTransactions();

  // États du formulaire
  const [formData, setFormData] = useState({
    date: transaction?.date || dateUtils.getCurrentDate(),
    compte_lsd: transaction?.compte_lsd || "",
    montant: transaction?.montant || "",
    mode_paiement: transaction?.mode_paiement || "caisse",
    description: transaction?.description || "",
  });

  const [errors, setErrors] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Détecter automatiquement le type selon le compte sélectionné
  const selectedCompte = useMemo(() => {
    if (!formData.compte_lsd) return null;
    return validators.findCompteByCode(formData.compte_lsd);
  }, [formData.compte_lsd]);

  const transactionType = useMemo(() => {
    if (!selectedCompte) return null;
    return selectedCompte.type === "produit" ? "entree" : "sortie";
  }, [selectedCompte]);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    // Date
    if (!formData.date) {
      newErrors.date = "La date est requise";
    } else if (dateUtils.isFutureDate(formData.date)) {
      newErrors.date = "La date ne peut pas être dans le futur";
    }

    // Compte
    if (!formData.compte_lsd) {
      newErrors.compte_lsd = "Le compte est requis";
    }

    // Montant
    if (!formData.montant) {
      newErrors.montant = "Le montant est requis";
    } else if (parseFloat(formData.montant) <= 0) {
      newErrors.montant = "Le montant doit être supérieur à 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        date: formData.date,
        compte_lsd: formData.compte_lsd,
        montant: parseFloat(formData.montant),
        mode_paiement: formData.mode_paiement,
        description: formData.description || undefined,
      };

      if (isEditMode) {
        // Modification
        await modifier(transaction.id, dataToSubmit);
        toast.success("Transaction modifiée avec succès");
        navigate(`/admin/compta/handleTransactions/${transaction.id}`);
      } else {
        // Création
        const newTransaction = await ajouter(dataToSubmit);
        toast.success("Transaction créée avec succès");
        navigate(`/admin/compta/handleTransactions/${newTransaction.id}`);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion de la suppression
  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      await supprimer(transaction.id);
      toast.success("Transaction supprimée avec succès");

      // Rediriger vers le DayView de la date concernée
      const dayId = formatDateForUrl(new Date(transaction.date), "day");
      navigate(`/admin/compta/dayview/${dayId}`);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  // Gestion des changements de champs
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Supprimer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Layout responsive
  const formClassName = isMobile ? "space-y-6" : "grid grid-cols-2 gap-6";

  return (
    <>
      <motion.form
        variants={cardStaggerContainer}
        initial="initial"
        animate="animate"
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Indicateur de type de transaction */}
        {transactionType && (
          <motion.div
            variants={cardStaggerItem}
            className={`
              mb-6 p-4 rounded-lg border-2
              ${
                transactionType === "entree"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }
            `}>
            <div className="flex items-center gap-2">
              <AlertCircle
                className={`
                w-5 h-5
                ${
                  transactionType === "entree"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              `}
              />
              <span
                className={`
                text-sm font-medium
                ${
                  transactionType === "entree"
                    ? "text-green-900 dark:text-green-100"
                    : "text-red-900 dark:text-red-100"
                }
              `}>
                Type de transaction détecté :{" "}
                {transactionType === "entree"
                  ? "Entrée (Produit)"
                  : "Sortie (Charge)"}
              </span>
            </div>
          </motion.div>
        )}

        {/* Champs du formulaire */}
        <div className={formClassName}>
          {/* Date */}
          <motion.div variants={cardStaggerItem}>
            <DatePickerField
              value={formData.date}
              onChange={(value) => handleFieldChange("date", value)}
              error={errors.date}
              disabled={isEditMode} // Ne pas permettre de changer la date en édition
            />
          </motion.div>

          {/* Compte */}
          <motion.div
            variants={cardStaggerItem}
            className={isMobile ? "" : "col-span-2"}>
            <AccountSelector
              value={formData.compte_lsd}
              onChange={(value) => handleFieldChange("compte_lsd", value)}
              error={errors.compte_lsd}
            />
          </motion.div>

          {/* Montant */}
          <motion.div variants={cardStaggerItem}>
            <AmountInput
              value={formData.montant}
              onChange={(value) => handleFieldChange("montant", value)}
              error={errors.montant}
              transactionType={transactionType}
            />
          </motion.div>

          {/* Mode de paiement */}
          <motion.div variants={cardStaggerItem}>
            <PaymentModeSelector
              value={formData.mode_paiement}
              onChange={(value) => handleFieldChange("mode_paiement", value)}
            />
          </motion.div>

          {/* Description */}
          <motion.div
            variants={cardStaggerItem}
            className={isMobile ? "" : "col-span-2"}>
            <DescriptionField
              value={formData.description}
              onChange={(value) => handleFieldChange("description", value)}
            />
          </motion.div>
        </div>

        {/* Référence (lecture seule en édition) */}
        {isEditMode && transaction?.reference && (
          <motion.div variants={cardStaggerItem} className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Référence
            </label>
            <input
              type="text"
              value={transaction.reference}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          variants={cardStaggerItem}
          className={`mt-8 flex ${
            isMobile ? "flex-col" : "flex-row justify-between items-center"
          } gap-4`}>
          {/* Bouton supprimer (mode édition uniquement) */}
          {isEditMode && (
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed">
              <Trash2 className="w-5 h-5" />
              <span>Supprimer</span>
            </button>
          )}

          {/* Bouton soumettre */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              flex items-center justify-center gap-2 px-6 py-3 
              bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
              text-white rounded-lg font-medium transition-colors 
              disabled:cursor-not-allowed
              ${isMobile || !isEditMode ? "w-full" : "ml-auto"}
            `}>
            <Save className="w-5 h-5" />
            <span>
              {isSubmitting
                ? "Enregistrement..."
                : isEditMode
                ? "Enregistrer les modifications"
                : "Créer la transaction"}
            </span>
          </button>
        </motion.div>
      </motion.form>

      {/* Dialog de confirmation de suppression */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        transaction={transaction}
        isDeleting={isSubmitting}
      />
    </>
  );
};

export default TransactionForm;
