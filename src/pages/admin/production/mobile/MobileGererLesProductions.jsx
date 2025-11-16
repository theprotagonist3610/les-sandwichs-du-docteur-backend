import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Clock,
  Package,
  Play,
  AlertCircle,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useProductionDefinitions, useProductionsEnAttente, scheduleProduction, updateProductionDefinition, deleteProductionDefinition } from "@/toolkits/admin/productionToolkit";

const MobileGererLesProductions = () => {
  const navigate = useNavigate();
  const { definitions, loading: loadingDefinitions } = useProductionDefinitions();
  const { items: productionsEnAttente, loading: loadingProductions, sync: syncProductions } = useProductionsEnAttente();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState(null);
  const [quantitePrincipale, setQuantitePrincipale] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour l'édition de recette
  const [editDenomination, setEditDenomination] = useState("");
  const [editType, setEditType] = useState("menu");

  // Les productions en attente viennent directement du hook
  // Plus besoin de filtrer, toutes les productions affichées sont "Programmee" ou "en_cours"

  // Ouvrir le dialog de programmation
  const handleProgrammer = (definition, e) => {
    e?.stopPropagation();
    setSelectedDefinition(definition);
    setQuantitePrincipale(definition.ingredient_principal.quantite_par_defaut || 0);
    setNote("");
    setDialogOpen(true);
  };

  // Ouvrir le dialog d'édition
  const handleEdit = (definition, e) => {
    e?.stopPropagation();
    setSelectedDefinition(definition);
    setEditDenomination(definition.denomination);
    setEditType(definition.type);
    setEditDialogOpen(true);
  };

  // Soumettre l'édition
  const handleSubmitEdit = async () => {
    if (!selectedDefinition || !editDenomination) {
      toast.error("Veuillez saisir une dénomination");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProductionDefinition(selectedDefinition.id, {
        denomination: editDenomination,
        type: editType,
      });
      toast.success("Recette modifiée avec succès");
      setEditDialogOpen(false);
    } catch (error) {
      console.error("❌ Erreur édition:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer une recette
  const handleDelete = async (definitionId, e) => {
    e?.stopPropagation();
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) return;

    try {
      await deleteProductionDefinition(definitionId);
      toast.success("Recette supprimée");
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // Naviguer vers une production
  const handleNavigateToProduction = (productionId) => {
    navigate(`/admin/production/gerer/${productionId}`);
  };

  // Soumettre la programmation
  const handleSubmitProgrammation = async () => {
    if (!selectedDefinition || quantitePrincipale <= 0) {
      toast.error("Veuillez saisir une quantité valide");
      return;
    }

    try {
      setIsSubmitting(true);
      await scheduleProduction(selectedDefinition.id, quantitePrincipale, note);
      toast.success(`Production programmée: ${selectedDefinition.denomination}`);
      setDialogOpen(false);
      syncProductions();
    } catch (error) {
      console.error("❌ Erreur programmation:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <ChefHat className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Gérer les Productions</h1>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="recettes" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recettes">
            <Package className="w-4 h-4 mr-1" />
            Recettes
          </TabsTrigger>
          <TabsTrigger value="en-attente">
            <Clock className="w-4 h-4 mr-1" />
            En attente
            {productionsEnAttente.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5">
                {productionsEnAttente.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Recettes */}
        <TabsContent value="recettes" className="flex-1 overflow-y-auto space-y-4 mt-4">
          {loadingDefinitions ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 animate-pulse text-muted-foreground" />
            </div>
          ) : definitions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucune recette disponible</p>
            </div>
          ) : (
            <AnimatePresence>
              {definitions.map((def, index) => (
                <motion.div
                  key={def.id}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={cardVariants}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card>
                    {/* En-tête */}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{def.denomination}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Badge variant="outline">{def.type}</Badge>
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleEdit(def, e)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => handleProgrammer(def, e)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Programmer
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Ingrédient Principal */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                          Ingrédient Principal
                        </p>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          {def.ingredient_principal.denomination}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {def.ingredient_principal.quantite_par_defaut}{" "}
                          {def.ingredient_principal.unite.symbol}
                        </p>
                      </div>

                      {/* Recette */}
                      {def.recette && def.recette.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Recette ({def.recette.length} ingrédients)
                          </p>
                          <div className="space-y-1">
                            {def.recette.map((line, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-sm p-2 bg-secondary/30 rounded"
                              >
                                <span>{line.ingredient}</span>
                                <span className="font-medium">
                                  {line.quantite} {line.unite.symbol}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Produit Fini */}
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                          Produit Fini
                        </p>
                        <p className="font-semibold text-green-900 dark:text-green-100">
                          {def.produit_fini?.denomination || def.denomination}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Unité: {def.produit_fini?.unite.symbol || "N/A"}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          📦 Ajouté au stock après production
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        {/* Tab 2: Productions en attente */}
        <TabsContent value="en-attente" className="flex-1 overflow-y-auto space-y-4 mt-4">
          {loadingProductions ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 animate-pulse text-muted-foreground" />
            </div>
          ) : productionsEnAttente.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucune production en attente</p>
            </div>
          ) : (
            <AnimatePresence>
              {productionsEnAttente.map((prod, index) => (
                <motion.div
                  key={prod.id}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={cardVariants}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => handleNavigateToProduction(prod.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{prod.denomination}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={prod.status === "en_cours" ? "default" : "secondary"}
                            >
                              {prod.status === "en_cours" ? "En cours" : "Programmée"}
                            </Badge>
                            <Badge variant="outline">{prod.type}</Badge>
                            <Badge variant="outline" className="text-xs">ID: {prod.id.slice(-6)}</Badge>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Quantité cible</span>
                        <span className="font-medium">
                          {prod.principal_cible.quantite} {prod.principal_cible.unite.symbol}
                        </span>
                      </div>
                      {prod.note && (
                        <div className="p-2 bg-secondary/30 rounded text-sm">
                          <p className="text-xs text-muted-foreground mb-1">Note</p>
                          <p>{prod.note}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(prod.date).toLocaleString("fr-FR")}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

      </Tabs>

      {/* Dialog de programmation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programmer une Production</DialogTitle>
            <DialogDescription>
              {selectedDefinition?.denomination}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantite">
                Quantité de {selectedDefinition?.ingredient_principal.denomination}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantite"
                  type="number"
                  min="0"
                  step="0.1"
                  value={quantitePrincipale}
                  onChange={(e) => setQuantitePrincipale(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-primary min-w-[60px]">
                  {selectedDefinition?.ingredient_principal.unite.symbol}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optionnelle)</Label>
              <Input
                id="note"
                placeholder="Ex: Pour le service du soir"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitProgrammation} disabled={isSubmitting || quantitePrincipale <= 0}>
              {isSubmitting ? "Programmation..." : "Programmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition de recette */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la Recette</DialogTitle>
            <DialogDescription>
              Modification de la dénomination et du type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-denomination">Dénomination</Label>
              <Input
                id="edit-denomination"
                type="text"
                value={editDenomination}
                onChange={(e) => setEditDenomination(e.target.value)}
                placeholder="Ex: Sandwich Poulet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editType === "menu" ? "default" : "outline"}
                  onClick={() => setEditType("menu")}
                  className="flex-1"
                >
                  Menu
                </Button>
                <Button
                  type="button"
                  variant={editType === "boisson" ? "default" : "outline"}
                  onClick={() => setEditType("boisson")}
                  className="flex-1"
                >
                  Boisson
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting || !editDenomination}>
              {isSubmitting ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileGererLesProductions;
