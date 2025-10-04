// components/GererUnSupplement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import { updateSupplement } from "@/toolkits/supplementToolkit";
import useEditSupplementStore from "@/stores/useEditSupplementStore";
import { toast } from "sonner";
import {
  Package2,
  DollarSign,
  Image,
  Save,
  X,
  Tag,
  Layers,
  Edit3,
  Check,
  RotateCcw,
  AlertCircle,
  Info,
  ArrowLeft,
  Camera,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Wifi,
  Heart,
  MessageCircleQuestion,
  Gift,
  CreditCard,
} from "lucide-react";

const GererUnSupplement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useBreakpoint();

  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    prix: true,
    image: true,
  });

  const {
    originalSupplement,
    editedSupplement,
    hasChanges,
    isSubmitting,
    initializeSupplement,
    updateField,
    setSubmitting,
    resetToOriginal,
    cleanup,
  } = useEditSupplementStore();

  // Groupes de suppléments disponibles
  const groupesSupplements = [
    "Services divers",
    "Services santé",
    "#QPUD",
    "Cartes et cadeaux",
    "Connectivité",
    "Autres",
  ];

  // Charger le supplément au montage
  useEffect(() => {
    loadData();
    return () => cleanup();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger le supplément
      const supplementDoc = await getDoc(doc(db, "supplements", "liste"));
      if (supplementDoc.exists()) {
        const supplements = supplementDoc.data().supplements || [];
        const supplement = supplements.find((s) => s.id === id);

        if (supplement) {
          initializeSupplement(supplement);
        } else {
          toast.error("Supplément introuvable");
          navigate("/admin/supplements");
          return;
        }
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
    if (!hasChanges) {
      toast.info("Aucune modification à sauvegarder");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateSupplement(
        editedSupplement.id,
        editedSupplement
      );

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Supplément mis à jour avec succès</span>
          </div>
        );
        initializeSupplement(editedSupplement); // Réinitialiser avec les nouvelles valeurs
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

  // Gestion du prix (nombre ou "gratuit")
  const handlePriceChange = (value) => {
    if (value.toLowerCase() === "gratuit") {
      updateField("prix", "gratuit");
    } else {
      const numValue = parseFloat(value);
      updateField("prix", isNaN(numValue) ? 0 : numValue);
    }
  };

  // Formater le prix pour l'affichage
  const formatPrice = (prix) => {
    if (typeof prix === "string" && prix.toLowerCase() === "gratuit") {
      return "Gratuit";
    }
    return `${prix} FCFA`;
  };

  // Toggle section mobile
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Obtenir l'icône selon le groupe
  const getGroupIcon = (groupe) => {
    const groupeLower = (groupe || "").toLowerCase();
    if (groupeLower.includes("divers") || groupeLower.includes("service"))
      return Package2;
    if (groupeLower.includes("wifi") || groupeLower.includes("connexion"))
      return Wifi;
    if (groupeLower.includes("santé") || groupeLower.includes("health"))
      return Heart;
    if (groupeLower.includes("qpud") || groupeLower.includes("question"))
      return MessageCircleQuestion;
    if (groupeLower.includes("carte") || groupeLower.includes("cadeau"))
      return Gift;
    if (groupeLower.includes("connectivité")) return Wifi;
    return Package2;
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
    placeholder = "",
    multiline = false,
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
          className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Choisir...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring"
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
            onClick={() => navigate("/admin/supplements")}
            className="p-2 hover:bg-muted rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="font-semibold text-lg">Modifier le supplément</h1>

          {hasChanges && (
            <button
              onClick={resetToOriginal}
              className="p-2 hover:bg-muted rounded-md">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {hasChanges && (
          <div className="px-4 py-2 bg-accent/10 text-accent text-sm text-center">
            Modifications non sauvegardées
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="p-4 space-y-4">
        {/* Section Informations générales */}
        <MobileSectionCard
          title="Informations générales"
          icon={Info}
          section="general">
          <EditableField
            label="Dénomination"
            value={editedSupplement?.denomination || ""}
            onChange={(value) => updateField("denomination", value)}
            icon={Tag}
            placeholder="Nom du supplément"
          />

          <EditableField
            label="Groupe"
            value={editedSupplement?.groupe || ""}
            onChange={(value) => updateField("groupe", value)}
            icon={Layers}
            options={groupesSupplements}
          />

          <EditableField
            label="Description"
            value={editedSupplement?.description || ""}
            onChange={(value) => updateField("description", value)}
            icon={FileText}
            placeholder="Description du supplément..."
            multiline={true}
          />
        </MobileSectionCard>

        {/* Section Prix */}
        <MobileSectionCard title="Prix" icon={DollarSign} section="prix">
          <div className="space-y-3">
            <EditableField
              label="Prix"
              value={editedSupplement?.prix || ""}
              onChange={handlePriceChange}
              icon={DollarSign}
              placeholder="200 ou gratuit"
            />

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => updateField("prix", "gratuit")}
                className="px-3 py-1 text-xs bg-accent text-accent-foreground rounded">
                Gratuit
              </button>
              <button
                type="button"
                onClick={() => updateField("prix", 200)}
                className="px-3 py-1 text-xs bg-muted text-foreground rounded">
                200 FCFA
              </button>
              <button
                type="button"
                onClick={() => updateField("prix", 500)}
                className="px-3 py-1 text-xs bg-muted text-foreground rounded">
                500 FCFA
              </button>
            </div>
          </div>

          <div className="p-3 bg-accent/10 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Prix affiché</span>
              <span className="text-lg font-bold text-accent">
                {formatPrice(editedSupplement?.prix)}
              </span>
            </div>
          </div>
        </MobileSectionCard>

        {/* Section Image */}
        <MobileSectionCard title="Image" icon={Camera} section="image">
          <EditableField
            label="URL de l'image"
            value={editedSupplement?.imgURL || ""}
            onChange={(value) => updateField("imgURL", value)}
            icon={Image}
            placeholder="https://..."
          />

          {editedSupplement?.imgURL && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3">
              <img
                src={editedSupplement.imgURL}
                alt="Aperçu"
                className="h-40 w-full object-contain rounded-lg bg-muted"
                onError={(e) => (e.target.style.display = "none")}
              />
            </motion.div>
          )}
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
            onClick={() => navigate("/admin/supplements")}
            className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-md
                     font-medium flex items-center justify-center gap-2">
            <X className="h-4 w-4" />
            Annuler
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={!hasChanges || isSubmitting}
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
  const DesktopView = () => {
    const Icon = getGroupIcon(editedSupplement?.groupe);

    return (
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
                  onClick={() => navigate("/admin/supplements")}
                  className="p-2 hover:bg-muted rounded-md">
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Modifier le supplément
                  </h1>
                  <p className="text-muted-foreground">
                    {originalSupplement?.denomination}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {hasChanges && (
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
                  disabled={!hasChanges || isSubmitting}
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
              {/* Section Informations générales */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informations générales
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField
                    label="Dénomination"
                    value={editedSupplement?.denomination || ""}
                    onChange={(value) => updateField("denomination", value)}
                    icon={Tag}
                    placeholder="Nom du supplément"
                  />

                  <EditableField
                    label="Groupe"
                    value={editedSupplement?.groupe || ""}
                    onChange={(value) => updateField("groupe", value)}
                    icon={Layers}
                    options={groupesSupplements}
                  />
                </div>

                <div className="mt-4">
                  <EditableField
                    label="Description"
                    value={editedSupplement?.description || ""}
                    onChange={(value) => updateField("description", value)}
                    icon={FileText}
                    placeholder="Description du supplément..."
                    multiline={true}
                  />
                </div>
              </motion.div>

              {/* Section Prix */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tarification
                </h2>

                <div className="space-y-4">
                  <EditableField
                    label="Prix"
                    value={editedSupplement?.prix || ""}
                    onChange={handlePriceChange}
                    icon={DollarSign}
                    placeholder="200 ou gratuit"
                  />

                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => updateField("prix", "gratuit")}
                      className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-md hover:bg-accent/90">
                      Gratuit
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("prix", 200)}
                      className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80">
                      200 FCFA
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("prix", 500)}
                      className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80">
                      500 FCFA
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("prix", 1000)}
                      className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80">
                      1000 FCFA
                    </button>
                  </div>

                  <div className="p-4 bg-accent/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-accent" />
                        <span className="font-medium">Prix affiché</span>
                        <span className="text-sm text-muted-foreground">
                          (Final)
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-accent">
                        {formatPrice(editedSupplement?.prix)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Section Image */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Image du supplément
                </h2>

                <EditableField
                  label="URL de l'image"
                  value={editedSupplement?.imgURL || ""}
                  onChange={(value) => updateField("imgURL", value)}
                  icon={Image}
                  placeholder="https://..."
                />
              </motion.div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Aperçu de l'image */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Aperçu du supplément
                </h3>

                {/* Icône du groupe */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    className="p-4 bg-primary/10 rounded-xl">
                    <Icon className="h-12 w-12 text-primary" />
                  </motion.div>
                </div>

                {editedSupplement?.imgURL ? (
                  <motion.img
                    key={editedSupplement.imgURL}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={editedSupplement.imgURL}
                    alt="Aperçu"
                    className="h-48 w-full object-cover rounded-lg bg-muted mb-4"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-48 w-full rounded-lg bg-muted flex items-center justify-center mb-4">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nom</span>
                    <span className="font-medium truncate max-w-[150px]">
                      {editedSupplement?.denomination || "Non défini"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Groupe</span>
                    <span className="font-medium">
                      {editedSupplement?.groupe || "Non défini"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-medium text-primary">
                      {formatPrice(editedSupplement?.prix)}
                    </span>
                  </div>
                </div>

                {editedSupplement?.description && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {editedSupplement.description}
                    </p>
                  </div>
                )}

                {/* Badge du type de prix */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-center">
                    {typeof editedSupplement?.prix === "string" &&
                    editedSupplement.prix.toLowerCase() === "gratuit" ? (
                      <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                        Service gratuit
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                        Service payant
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Résumé des modifications */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Résumé
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <span
                      className={`font-medium ${
                        editedSupplement?.actif
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}>
                      {editedSupplement?.actif ? "Actif" : "Désactivé"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-medium">
                      {formatPrice(editedSupplement?.prix)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Groupe</span>
                    <span className="font-medium">
                      {editedSupplement?.groupe || "Non défini"}
                    </span>
                  </div>
                </div>

                {hasChanges && (
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
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return <Loader isVisible={loading} text="Chargement du supplément..." />;
  }

  if (!editedSupplement) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Supplément introuvable
          </h2>
          <p className="text-muted-foreground mb-4">
            Le supplément demandé n'existe pas ou a été supprimé
          </p>
          <button
            onClick={() => navigate("/admin/supplements")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                     font-medium">
            Retour aux suppléments
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

export default GererUnSupplement;
