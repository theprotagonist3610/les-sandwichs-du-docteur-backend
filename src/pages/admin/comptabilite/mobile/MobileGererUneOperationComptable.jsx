/**
 * MobileGererUneOperationComptable.jsx
 * Page d'édition d'une opération comptable - Version Mobile
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  getOperationsToday,
  updateOperation,
  deleteOperation,
} from "@/toolkits/admin/comptabiliteToolkit";

const MobileGererUneOperationComptable = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [operation, setOperation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Champs éditables
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [date, setDate] = useState("");

  // Charger l'opération
  useEffect(() => {
    const loadOperation = async () => {
      try {
        setLoading(true);
        setError(null);

        const { operations } = await getOperationsToday();
        const op = operations.find((o) => o.id === id);

        if (!op) {
          setError("Opération introuvable");
          return;
        }

        setOperation(op);
        setMontant(op.montant.toString());
        setMotif(op.motif);
        setDate(new Date(op.date).toISOString().split("T")[0]);
      } catch (err) {
        console.error("Erreur chargement opération:", err);
        setError(err.message);
        toast.error("Erreur chargement");
      } finally {
        setLoading(false);
      }
    };

    loadOperation();
  }, [id]);

  // Sauvegarder les modifications
  const handleSave = async () => {
    try {
      setSaving(true);

      const updates = {
        montant: parseFloat(montant),
        motif: motif.trim(),
        date: new Date(date).getTime(),
      };

      await updateOperation(id, updates);

      toast.success("Opération mise à jour");
      navigate("/admin/comptabilite/gerer");
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      toast.error(err.message || "Erreur sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Supprimer l'opération
  const handleDelete = async () => {
    if (!confirm("Supprimer cette opération ?")) {
      return;
    }

    try {
      setDeleting(true);

      await deleteOperation(id);

      toast.success("Opération supprimée");
      navigate("/admin/comptabilite/gerer");
    } catch (err) {
      console.error("Erreur suppression:", err);
      toast.error(err.message || "Erreur suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Vérifier si le formulaire a changé
  const hasChanges =
    operation &&
    (montant !== operation.montant.toString() ||
      motif !== operation.motif ||
      date !== new Date(operation.date).toISOString().split("T")[0]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !operation) {
    return (
      <div className="container mx-auto p-4 pb-24">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Opération introuvable"}</AlertDescription>
        </Alert>
        <Button size="sm" onClick={() => navigate("/admin/comptabilite/gerer")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 space-y-4">
      {/* Header sticky */}
      <div className="sticky top-0 bg-background z-10 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/admin/comptabilite/gerer")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">Modifier</h1>
            <p className="text-xs text-muted-foreground truncate">ID: {operation.id}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="w-full"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Supprimer
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving || deleting}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>

      <Separator />

      {/* Informations fixes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations fixes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Type */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <div>
              {operation.type_operation === "entree" ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Entrée</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">Sortie</span>
                </div>
              )}
            </div>
          </div>

          {/* Compte */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Compte</Label>
            <div className="space-y-1">
              <Badge variant="outline" className="font-mono text-xs">
                {operation.compte_ohada}
              </Badge>
              <p className="text-sm font-medium">{operation.compte_denomination}</p>
            </div>
          </div>

          {/* Metadata */}
          <Separator />
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Créé: {new Date(operation.createdAt).toLocaleDateString("fr-FR")}</p>
            {operation.updatedAt && (
              <p>Modifié: {new Date(operation.updatedAt).toLocaleDateString("fr-FR")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'édition */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Champs modifiables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant" className="text-sm">
              Montant (FCFA) *
            </Label>
            <InputGroup>
              <InputGroupInput
                id="montant"
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                min="0"
                step="1"
                required
              />
            </InputGroup>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm">
              Date *
            </Label>
            <InputGroup>
              <InputGroupInput
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </InputGroup>
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif" className="text-sm">
              Motif *
            </Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              placeholder="Description..."
              required
            />
          </div>

          {hasChanges && (
            <Alert className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Modifications non sauvegardées
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileGererUneOperationComptable;
