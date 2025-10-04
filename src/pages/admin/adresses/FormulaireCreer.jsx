// components/FormulaireCreer.jsx
import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

// Store
import { useAdresseStore } from "@/stores/useAdresseStore";

// Toolkit
import { createAdresse } from "@/toolkits/adressesToolkit";
import { useAdresses } from "@/toolkits/adressesToolkit";

// Components UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FormulaireCreer = () => {
  const { refresh } = useAdresses();

  // Zustand store
  const {
    nouvelleAdresse,
    loading,
    updateNouvelleAdresseField,
    resetNouvelleAdresse,
    setLoading,
  } = useAdresseStore();

  // Soumission
  const handleCreer = useCallback(async () => {
    if (!nouvelleAdresse.quartier) {
      toast.error("Le quartier est obligatoire");
      return;
    }

    const departement = nouvelleAdresse.departement || "non-classe";

    setLoading(true);

    try {
      const result = await createAdresse(departement, {
        departement: nouvelleAdresse.departement,
        commune: nouvelleAdresse.commune,
        arrondissement: nouvelleAdresse.arrondissement,
        quartier: nouvelleAdresse.quartier,
        loc: [],
      });

      if (result.success) {
        toast.success("Nouvelle adresse créée avec succès");
        resetNouvelleAdresse();
        refresh();
      }
    } catch (error) {
      console.error("Erreur création adresse:", error);
      toast.error("Erreur lors de la création de l'adresse");
    } finally {
      setLoading(false);
    }
  }, [nouvelleAdresse, setLoading, resetNouvelleAdresse, refresh]);

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4">
      <motion.div variants={itemVariants}>
        <Label htmlFor="departement">Département</Label>
        <Input
          id="departement"
          placeholder="Ex: Littoral (optionnel)"
          value={nouvelleAdresse.departement}
          onChange={(e) =>
            updateNouvelleAdresseField("departement", e.target.value)
          }
          className="mt-1"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Label htmlFor="commune">Commune</Label>
        <Input
          id="commune"
          placeholder="Ex: Cotonou (optionnel)"
          value={nouvelleAdresse.commune}
          onChange={(e) =>
            updateNouvelleAdresseField("commune", e.target.value)
          }
          className="mt-1"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Label htmlFor="arrondissement">Arrondissement</Label>
        <Input
          id="arrondissement"
          placeholder="Ex: 1er (optionnel)"
          value={nouvelleAdresse.arrondissement}
          onChange={(e) =>
            updateNouvelleAdresseField("arrondissement", e.target.value)
          }
          className="mt-1"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Label htmlFor="quartier">Quartier *</Label>
        <Input
          id="quartier"
          placeholder="Ex: Ganhi"
          value={nouvelleAdresse.quartier}
          onChange={(e) =>
            updateNouvelleAdresseField("quartier", e.target.value)
          }
          className="mt-1"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Button
          onClick={handleCreer}
          disabled={loading || !nouvelleAdresse.quartier}
          className="w-full"
          size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Créer le quartier
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default FormulaireCreer;
