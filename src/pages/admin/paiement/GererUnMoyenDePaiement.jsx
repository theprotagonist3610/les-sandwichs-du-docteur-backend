import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import {
  getMoyenPaiementById,
  updateMoyenPaiement,
  TYPES_PAIEMENT,
  GROUPES_MOBILE,
  GROUPES_BANCAIRE,
} from "@/toolkits/moyenPaiementToolkit";
import { toast } from "sonner";
import {
  Wallet,
  Smartphone,
  Building2,
  CreditCard,
  Save,
  X,
  Tag,
  Edit3,
  Check,
  RotateCcw,
  AlertCircle,
  Info,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Hash,
  FileText,
  Power,
  DollarSign,
  Clock,
} from "lucide-react";
import { create } from "zustand";

// Store Zustand pour l'édition
const useEditMoyenPaiementStore = create((set, get) => ({
  originalMoyenPaiement: null,
  editedMoyenPaiement: null,
  isSubmitting: false,

  initializeMoyenPaiement: (moyenPaiement) => {
    set({
      originalMoyenPaiement: JSON.parse(JSON.stringify(moyenPaiement)),
      editedMoyenPaiement: JSON.parse(JSON.stringify(moyenPaiement)),
    });
  },

  updateField: (field, value) => {
    set((state) => ({
      editedMoyenPaiement: {
        ...state.editedMoyenPaiement,
        [field]: value,
      },
    }));
  },

  hasChanges: () => {
    const { originalMoyenPaiement, editedMoyenPaiement } = get();
    if (!originalMoyenPaiement || !editedMoyenPaiement) return false;
    return (
      JSON.stringify(originalMoyenPaiement) !==
      JSON.stringify(editedMoyenPaiement)
    );
  },

  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  resetToOriginal: () => {
    const { originalMoyenPaiement } = get();
    set({
      editedMoyenPaiement: JSON.parse(JSON.stringify(originalMoyenPaiement)),
    });
  },

  cleanup: () => {
    set({
      originalMoyenPaiement: null,
      editedMoyenPaiement: null,
      isSubmitting: false,
    });
  },
}));

const GererUnMoyenDePaiement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    details: true,
    configuration: true,
  });

  const {
    originalMoyenPaiement,
    editedMoyenPaiement,
    isSubmitting,
    initializeMoyenPaiement,
    updateField,
    hasChanges,
    setSubmitting,
    resetToOriginal,
    cleanup,
  } = useEditMoyenPaiementStore();

  const hasUnsavedChanges = hasChanges();

  // Charger le moyen de paiement au montage
  useEffect(() => {
    loadData();
    return () => cleanup();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getMoyenPaiementById(id);

      if (result.success && result.data) {
        initializeMoyenPaiement(result.data);
      } else {
        toast.error("Moyen de paiement introuvable");
        navigate("/admin/moyens-paiement");
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      toast.info("Aucune modification à sauvegarder");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateMoyenPaiement(
        editedMoyenPaiement.id,
        editedMoyenPaiement
      );

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Moyen de paiement mis à jour avec succès</span>
          </div>
        );
        initializeMoyenPaiement(result.data);
      } else if (result.isDuplicate) {
        toast.error(
          "Un moyen de paiement avec ces caractéristiques existe déjà"
        );
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle section mobile
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Obtenir l'icône selon le type
  const getIconForType = (type) => {
    switch (type) {
      case TYPES_PAIEMENT.ESPECES:
        return Wallet;
      case TYPES_PAIEMENT.MOBILE:
        return Smartphone;
      case TYPES_PAIEMENT.BANCAIRE:
        return Building2;
      default:
        return CreditCard;
    }
  };

  // Obtenir la couleur selon le type
  const getColorForType = (type) => {
    switch (type) {
      case TYPES_PAIEMENT.ESPECES:
        return "#22c55e";
      case TYPES_PAIEMENT.MOBILE:
        return "#3b82f6";
      case TYPES_PAIEMENT.BANCAIRE:
        return "#a855f7";
      default:
        return "#6b7280";
    }
  };

  // Animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 },
    },
  };

  // Composant Field réutilisable
  const EditableField = ({
    label,
    value,
    onChange,
    icon: Icon,
    type = "text",
    options = null,
    disabled = false,
  }) => (
    <motion.div variants={itemVariants} className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(
              type === "number"
                ? parseFloat(e.target.value) || 0
                : e.target.value
            )
          }
          disabled={disabled}
          className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      )}
    </motion.div>
  );

  // Section Card Mobile
  const MobileSectionCard = ({ title, icon: Icon, section, children }) => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-card rounded-lg border border-border overflow-hidden">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => toggleSection(section)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        {expandedSections[section] ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </motion.button>

      <AnimatePresence>
        {expandedSections[section] && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Vue Mobile
  const MobileView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-24">
      {/* En-tête fixe */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate("/admin/moyens-paiement")}
            className="p-2 hover:bg-muted rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="font-semibold text-lg">Modifier le moyen</h1>

          {hasUnsavedChanges && (
            <button
              onClick={resetToOriginal}
              className="p-2 hover:bg-muted rounded-md">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {hasUnsavedChanges && (
          <div className="px-4 py-2 bg-accent/10 text-accent text-sm text-center">
            Modifications non sauvegardées
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="p-4 space-y-4">
        {/* Section Type */}
        <MobileSectionCard
          title="Type de paiement"
          icon={Info}
          section="general">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: `${getColorForType(
                    editedMoyenPaiement?.type
                  )}20`,
                }}>
                {React.createElement(
                  getIconForType(editedMoyenPaiement?.type),
                  {
                    className: "h-6 w-6",
                    style: {
                      color: getColorForType(editedMoyenPaiement?.type),
                    },
                  }
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {editedMoyenPaiement?.type === TYPES_PAIEMENT.ESPECES
                    ? "Espèces"
                    : editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                    ? "Paiement Mobile"
                    : "Compte Bancaire"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Type non modifiable
                </p>
              </div>
            </div>
          </div>
        </MobileSectionCard>

        {/* Section Détails - Seulement pour mobile et bancaire */}
        {editedMoyenPaiement?.type !== TYPES_PAIEMENT.ESPECES && (
          <MobileSectionCard title="Détails" icon={FileText} section="details">
            <EditableField
              label={
                editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                  ? "Opérateur mobile"
                  : "Banque"
              }
              value={editedMoyenPaiement?.groupe || ""}
              onChange={(value) => updateField("groupe", value)}
              icon={Building2}
              options={
                editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                  ? Object.entries(GROUPES_MOBILE).map(([key, value]) => ({
                      value,
                      label: value,
                    }))
                  : Object.entries(GROUPES_BANCAIRE).map(([key, value]) => ({
                      value,
                      label: value,
                    }))
              }
            />

            <EditableField
              label={
                editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                  ? "Numéro de téléphone"
                  : "Numéro de compte"
              }
              value={editedMoyenPaiement?.numero || ""}
              onChange={(value) => updateField("numero", value)}
              icon={Hash}
            />

            <EditableField
              label="Dénomination personnalisée"
              value={editedMoyenPaiement?.denomination || ""}
              onChange={(value) => updateField("denomination", value)}
              icon={Tag}
            />
          </MobileSectionCard>
        )}

        {/* Section Configuration */}
        <MobileSectionCard
          title="Configuration"
          icon={DollarSign}
          section="configuration">
          <EditableField
            label="Description (optionnel)"
            value={editedMoyenPaiement?.description || ""}
            onChange={(value) => updateField("description", value)}
            icon={FileText}
          />

          {/* Toggle actif */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">Moyen actif</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => updateField("actif", !editedMoyenPaiement?.actif)}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${
                  editedMoyenPaiement?.actif
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }
              `}>
              <motion.div
                animate={{ x: editedMoyenPaiement?.actif ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full"
              />
            </motion.button>
          </div>
        </MobileSectionCard>
      </div>

      {/* Boutons d'action fixes */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/admin/moyens-paiement")}
            className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-md
                     font-medium flex items-center justify-center gap-2">
            <X className="h-4 w-4" />
            Annuler
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSubmitting}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-md
                     font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Save className="h-4 w-4" />
              </motion.div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  // Vue Desktop
  const DesktopView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/moyens-paiement")}
                className="p-2 hover:bg-muted rounded-md">
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Modifier le moyen de paiement
                </h1>
                <p className="text-muted-foreground">
                  {originalMoyenPaiement?.denomination}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <>
                  <span className="text-sm text-accent flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Modifications non sauvegardées
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetToOriginal}
                    className="px-4 py-2 bg-muted text-foreground rounded-md
                             font-medium flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Réinitialiser
                  </motion.button>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSubmitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md
                         font-medium disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}>
                    <Save className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder les modifications
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Type */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Type de paiement
              </h2>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: `${getColorForType(
                        editedMoyenPaiement?.type
                      )}20`,
                    }}>
                    {React.createElement(
                      getIconForType(editedMoyenPaiement?.type),
                      {
                        className: "h-8 w-8",
                        style: {
                          color: getColorForType(editedMoyenPaiement?.type),
                        },
                      }
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {editedMoyenPaiement?.type === TYPES_PAIEMENT.ESPECES
                        ? "Espèces"
                        : editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                        ? "Paiement Mobile"
                        : "Compte Bancaire"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Le type de paiement ne peut pas être modifié
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section Détails - Seulement pour mobile et bancaire */}
            {editedMoyenPaiement?.type !== TYPES_PAIEMENT.ESPECES && (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Détails du moyen de paiement
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField
                    label={
                      editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                        ? "Opérateur mobile"
                        : "Banque"
                    }
                    value={editedMoyenPaiement?.groupe || ""}
                    onChange={(value) => updateField("groupe", value)}
                    icon={Building2}
                    options={
                      editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                        ? Object.entries(GROUPES_MOBILE).map(
                            ([key, value]) => ({
                              value,
                              label: value,
                            })
                          )
                        : Object.entries(GROUPES_BANCAIRE).map(
                            ([key, value]) => ({
                              value,
                              label: value,
                            })
                          )
                    }
                  />

                  <EditableField
                    label={
                      editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                        ? "Numéro de téléphone"
                        : "Numéro de compte"
                    }
                    value={editedMoyenPaiement?.numero || ""}
                    onChange={(value) => updateField("numero", value)}
                    icon={Hash}
                  />

                  <div className="md:col-span-2">
                    <EditableField
                      label="Dénomination personnalisée"
                      value={editedMoyenPaiement?.denomination || ""}
                      onChange={(value) => updateField("denomination", value)}
                      icon={Tag}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Section Configuration */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuration
              </h2>

              <div className="space-y-4">
                <EditableField
                  label="Description (optionnel)"
                  value={editedMoyenPaiement?.description || ""}
                  onChange={(value) => updateField("description", value)}
                  icon={FileText}
                />

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Moyen de paiement actif</p>
                    <p className="text-sm text-muted-foreground">
                      {editedMoyenPaiement?.actif
                        ? "Ce moyen est disponible pour les paiements"
                        : "Ce moyen est désactivé"}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      updateField("actif", !editedMoyenPaiement?.actif)
                    }
                    className={`
                      relative w-14 h-7 rounded-full transition-colors
                      ${
                        editedMoyenPaiement?.actif
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }
                    `}>
                    <motion.div
                      animate={{ x: editedMoyenPaiement?.actif ? 28 : 2 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                    />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Aperçu */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Aperçu
              </h3>

              <div
                className="rounded-lg p-4 mb-4"
                style={{
                  backgroundColor: `${getColorForType(
                    editedMoyenPaiement?.type
                  )}15`,
                  borderLeft: `4px solid ${getColorForType(
                    editedMoyenPaiement?.type
                  )}`,
                }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${getColorForType(
                        editedMoyenPaiement?.type
                      )}30`,
                    }}>
                    {React.createElement(
                      getIconForType(editedMoyenPaiement?.type),
                      {
                        className: "h-6 w-6",
                        style: {
                          color: getColorForType(editedMoyenPaiement?.type),
                        },
                      }
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {editedMoyenPaiement?.denomination || "Moyen de paiement"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {editedMoyenPaiement?.type === TYPES_PAIEMENT.ESPECES
                        ? "Espèces"
                        : editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                        ? "Paiement Mobile"
                        : "Compte Bancaire"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {editedMoyenPaiement?.type !== TYPES_PAIEMENT.ESPECES && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                          ? "Opérateur"
                          : "Banque"}
                      </span>
                      <span className="font-medium">
                        {editedMoyenPaiement?.groupe || "---"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Numéro</span>
                      <span className="font-medium font-mono text-xs">
                        {editedMoyenPaiement?.numero || "---"}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span
                    className={`font-medium ${
                      editedMoyenPaiement?.actif
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                    {editedMoyenPaiement?.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>

              {editedMoyenPaiement?.description && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm text-foreground">
                    {editedMoyenPaiement?.description}
                  </p>
                </div>
              )}

              {hasUnsavedChanges && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-accent">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Des modifications sont en attente
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Informations */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informations
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-muted-foreground">
                    {editedMoyenPaiement?.type === TYPES_PAIEMENT.ESPECES
                      ? "Le paiement en espèces ne nécessite aucune configuration supplémentaire."
                      : editedMoyenPaiement?.type === TYPES_PAIEMENT.MOBILE
                      ? "Ce moyen de paiement mobile sera disponible pour les transactions via téléphone."
                      : "Ce compte bancaire sera disponible pour les virements et paiements électroniques."}
                  </p>
                </div>

                {hasUnsavedChanges && (
                  <div className="flex items-start gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <p className="text-sm">
                      N'oubliez pas de sauvegarder vos modifications avant de
                      quitter cette page.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <Loader isVisible={loading} text="Chargement du moyen de paiement..." />
    );
  }

  if (!editedMoyenPaiement) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Moyen de paiement introuvable
          </h2>
          <p className="text-muted-foreground mb-4">
            Le moyen de paiement demandé n'existe pas ou a été supprimé
          </p>
          <button
            onClick={() => navigate("/admin/moyens-paiement")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                     font-medium">
            Retour aux moyens de paiement
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <Loader isVisible={isSubmitting} text="Sauvegarde en cours..." />
          </motion.div>
        )}
      </AnimatePresence>
      {isMobile ? <MobileView /> : <DesktopView />}
    </>
  );
};

export default GererUnMoyenDePaiement;
