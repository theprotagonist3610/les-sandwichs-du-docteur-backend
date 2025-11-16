/**
 * DesktopGererUneOperationComptable.jsx
 * Page d'édition d'une opération comptable - Version Desktop
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
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const DesktopGererUneOperationComptable = () => {
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
  // Date affichée uniquement (non éditable pour éviter problèmes de cohérence)
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
        toast.error("Erreur lors du chargement");
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
        // Date non modifiable (cohérence comptable)
      };

      await updateOperation(id, updates);

      toast.success("Opération mise à jour");
      navigate("/admin/comptabilite/gerer");
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Supprimer l'opération
  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette opération ?")) {
      return;
    }

    try {
      setDeleting(true);

      await deleteOperation(id);

      toast.success("Opération supprimée");
      navigate("/admin/comptabilite/gerer");
    } catch (err) {
      console.error("Erreur suppression:", err);
      toast.error(err.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Vérifier si le formulaire a changé
  const hasChanges =
    operation &&
    (montant !== operation.montant.toString() ||
      motif !== operation.motif);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !operation) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Opération introuvable"}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate("/admin/comptabilite/gerer")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/admin/comptabilite/gerer")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Modifier l'opération</h1>
            <p className="text-muted-foreground">ID: {operation.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Supprimer
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving || deleting}>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations non-modifiables */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informations fixes</CardTitle>
            <CardDescription>Ces champs ne peuvent pas être modifiés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>Type d'opération</Label>
              <div className="flex items-center gap-2">
                {operation.type_operation === "entree" ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">Entrée</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-700">Sortie</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compte */}
            <div className="space-y-2">
              <Label>Compte comptable</Label>
              <div className="space-y-1">
                <Badge variant="outline" className="font-mono">
                  {operation.compte_ohada}
                </Badge>
                <p className="text-sm font-medium">{operation.compte_denomination}</p>
              </div>
            </div>

            {/* Metadata */}
            <Separator />
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Créé le: {new Date(operation.createdAt).toLocaleString("fr-FR")}</p>
              {operation.updatedAt && (
                <p>Modifié le: {new Date(operation.updatedAt).toLocaleString("fr-FR")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulaire d'édition */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Champs modifiables</CardTitle>
            <CardDescription>Modifiez les informations de l'opération</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (FCFA) *</Label>
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
              <p className="text-sm text-muted-foreground">
                Montant de l'opération en Francs CFA
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date de l'opération</Label>
              <InputGroup>
                <InputGroupInput
                  id="date"
                  type="date"
                  value={date}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </InputGroup>
              <p className="text-sm text-muted-foreground">
                La date ne peut pas être modifiée pour garantir la cohérence comptable.
                Pour changer la date, supprimez cette opération et créez-en une nouvelle.
              </p>
            </div>

            {/* Motif */}
            <div className="space-y-2">
              <Label htmlFor="motif">Motif / Description *</Label>
              <Textarea
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={4}
                placeholder="Décrivez le motif de cette opération..."
                required
              />
              <p className="text-sm text-muted-foreground">
                Description détaillée de l'opération
              </p>
            </div>

            {hasChanges && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Vous avez des modifications non sauvegardées
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesktopGererUneOperationComptable;
