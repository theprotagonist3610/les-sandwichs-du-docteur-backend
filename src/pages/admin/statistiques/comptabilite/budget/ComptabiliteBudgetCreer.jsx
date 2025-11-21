import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, Lightbulb, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComptesListe } from "@/toolkits/admin/comptabiliteToolkit";
import { creerBudget } from "@/toolkits/admin/comptabilite/budgets";
import { 
  calculerSuggestionBudget,
  getDescriptionSuggestion,
  getCouleurConfiance,
} from "@/toolkits/admin/comptabilite/budgetSuggestions";
import { toast } from "sonner";

const ComptabiliteBudgetCreer = () => {
  const navigate = useNavigate();
  const { comptes, loading: loadingComptes } = useComptesListe();

  // État du formulaire
  const [mois, setMois] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [lignes, setLignes] = useState([]);
  const [saving, setSaving] = useState(false);

  // État des suggestions
  const [suggestions, setSuggestions] = useState(new Map());
  const [loadingSuggestions, setLoadingSuggestions] = useState(new Map());

  // Générer les options de mois (6 mois avant et 12 mois après)
  const optionsMois = useMemo(() => {
    const options = [];
    const now = new Date();

    for (let i = -6; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      const moisKey = `${mm}${yyyy}`;

      const moisNoms = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];
      const label = `${moisNoms[date.getMonth()]} ${yyyy}`;

      options.push({ value: moisKey, label });
    }

    return options;
  }, []);

  // Auto-générer le nom quand le mois change
  const handleMoisChange = (value) => {
    setMois(value);
    // Auto-générer le nom si vide
    if (!nom) {
      const option = optionsMois.find((opt) => opt.value === value);
      if (option) {
        setNom(`Budget ${option.label}`);
      }
    }
  };

  // Ajouter une ligne
  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        id: Date.now(),
        compte_id: "",
        montant_previsionnel: "",
        seuil_alerte: 80,
      },
    ]);
  };

  // Supprimer une ligne
  const supprimerLigne = (id) => {
    setLignes(lignes.filter((l) => l.id !== id));
  };

  // Modifier une ligne
  const modifierLigne = (id, field, value) => {
    setLignes(
      lignes.map((ligne) =>
        ligne.id === id ? { ...ligne, [field]: value } : ligne
      )
    );

    // Si changement de compte, charger la suggestion
    if (field === "compte_id" && value && mois) {
      chargerSuggestion(id, value);
    }
  };

  // Charger la suggestion pour un compte
  const chargerSuggestion = async (ligneId, compteId) => {
    if (!compteId || !mois) return;

    try {
      setLoadingSuggestions((prev) => new Map(prev).set(ligneId, true));

      const suggestion = await calculerSuggestionBudget(compteId, mois);

      setSuggestions((prev) => new Map(prev).set(ligneId, suggestion));
      setLoadingSuggestions((prev) => {
        const newMap = new Map(prev);
        newMap.delete(ligneId);
        return newMap;
      });
    } catch (error) {
      console.error("Erreur chargement suggestion:", error);
      setLoadingSuggestions((prev) => {
        const newMap = new Map(prev);
        newMap.delete(ligneId);
        return newMap;
      });
    }
  };

  // Appliquer une suggestion
  const appliquerSuggestion = (ligneId, montant) => {
    modifierLigne(ligneId, "montant_previsionnel", montant.toString());
    toast.success("Suggestion appliquée");
  };

  // Calculer le total
  const total = useMemo(() => {
    return lignes.reduce((sum, ligne) => {
      const montant = parseFloat(ligne.montant_previsionnel) || 0;
      return sum + montant;
    }, 0);
  }, [lignes]);

  // Valider et sauvegarder
  const handleSave = async () => {
    try {
      // Validations
      if (!mois) {
        toast.error("Veuillez sélectionner un mois");
        return;
      }

      if (!nom.trim()) {
        toast.error("Veuillez saisir un nom de budget");
        return;
      }

      if (lignes.length === 0) {
        toast.error("Ajoutez au moins une ligne budgétaire");
        return;
      }

      // Vérifier que toutes les lignes sont complètes
      const lignesIncompletes = lignes.filter(
        (l) => !l.compte_id || !l.montant_previsionnel || l.montant_previsionnel <= 0
      );

      if (lignesIncompletes.length > 0) {
        toast.error("Certaines lignes sont incomplètes ou invalides");
        return;
      }

      setSaving(true);

      // Préparer les données
      const lignesBudget = lignes.map((ligne) => {
        const compte = comptes.find((c) => c.id === ligne.compte_id);
        return {
          compte_id: ligne.compte_id,
          code_ohada: compte.code_ohada,
          denomination: compte.denomination,
          categorie: compte.categorie,
          montant_previsionnel: parseFloat(ligne.montant_previsionnel),
          seuil_alerte: parseInt(ligne.seuil_alerte),
        };
      });

      const budgetData = {
        mois,
        nom: nom.trim(),
        description: description.trim(),
        lignes_budget: lignesBudget,
      };

      // Créer le budget
      const nouveauBudget = await creerBudget(budgetData);

      toast.success("Budget créé avec succès");

      // Rediriger vers la page de détails
      navigate(`/admin/statistiques/comptabilite/budget/${nouveauBudget.id}`);
    } catch (error) {
      console.error("❌ Erreur création budget:", error);
      toast.error(error.message || "Erreur lors de la création du budget");
      setSaving(false);
    }
  };

  if (loadingComptes) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin text-6xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/admin/statistiques/comptabilite/budget")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Créer un Budget</h1>
          <p className="text-sm opacity-70 mt-1">
            Définissez un nouveau budget prévisionnel
          </p>
        </div>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mois */}
          <div className="space-y-2">
            <Label htmlFor="mois">Mois *</Label>
            <Select value={mois} onValueChange={handleMoisChange}>
              <SelectTrigger id="mois">
                <SelectValue placeholder="Sélectionnez un mois" />
              </SelectTrigger>
              <SelectContent>
                {optionsMois.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du budget *</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Budget Janvier 2025"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes ou objectifs du budget..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lignes budgétaires */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lignes Budgétaires</CardTitle>
            <Button size="sm" onClick={ajouterLigne}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lignes.length === 0 ? (
            <div className="text-center py-8 opacity-70">
              <p className="mb-4">Aucune ligne budgétaire ajoutée</p>
              <Button variant="outline" onClick={ajouterLigne}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la première ligne
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {lignes.map((ligne, index) => (
                <div
                  key={ligne.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg"
                >
                  {/* Numéro */}
                  <div className="flex items-center md:col-span-1">
                    <span className="font-semibold text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Compte */}
                  <div className="md:col-span-5 space-y-1">
                    <Label>Compte *</Label>
                    <Select
                      value={ligne.compte_id}
                      onValueChange={(value) =>
                        modifierLigne(ligne.id, "compte_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un compte" />
                      </SelectTrigger>
                      <SelectContent>
                        {comptes
                          .filter((c) => c.categorie === "sortie")
                          .map((compte) => (
                            <SelectItem key={compte.id} value={compte.id}>
                              {compte.code_ohada} - {compte.denomination}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Montant prévisionnel */}
                  <div className="md:col-span-3 space-y-1">
                    <Label>Montant prévu (FCFA) *</Label>
                    <Input
                      type="number"
                      value={ligne.montant_previsionnel}
                      onChange={(e) =>
                        modifierLigne(ligne.id, "montant_previsionnel", e.target.value)
                      }
                      placeholder="Ex: 500000"
                      min="0"
                    />
                  </div>

                  {/* Seuil d'alerte */}
                  <div className="md:col-span-2 space-y-1">
                    <Label>Seuil (%)</Label>
                    <Input
                      type="number"
                      value={ligne.seuil_alerte}
                      onChange={(e) =>
                        modifierLigne(ligne.id, "seuil_alerte", e.target.value)
                      }
                      min="0"
                      max="100"
                    />
                  </div>

                  {/* Bouton supprimer */}
                  <div className="flex items-end md:col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => supprimerLigne(ligne.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Suggestion intelligente */}
                  {ligne.compte_id && mois && (
                    <div className="md:col-span-12 mt-2">
                      {loadingSuggestions.get(ligne.id) ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-gray-50 rounded-md">
                          <div className="animate-spin">⏳</div>
                          <span>Analyse de l'historique...</span>
                        </div>
                      ) : suggestions.get(ligne.id) ? (
                        (() => {
                          const suggestion = suggestions.get(ligne.id);
                          if (!suggestion.disponible) {
                            return (
                              <div className="flex items-start gap-2 text-sm text-muted-foreground p-3 bg-gray-50 rounded-md">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{suggestion.raison}</span>
                              </div>
                            );
                          }

                          const couleurConfiance = getCouleurConfiance(suggestion.confianceNiveau);
                          const TendanceIcon = suggestion.tendance === "hausse" ? TrendingUp : 
                                               suggestion.tendance === "baisse" ? TrendingDown : null;

                          return (
                            <div className={`p-3 border rounded-md ${couleurConfiance.replace('text-', 'border-')}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  {/* En-tête avec icône */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                                    <span className="font-semibold text-sm">Suggestion basée sur l'historique</span>
                                    {TendanceIcon && (
                                      <TendanceIcon className="h-4 w-4 ml-1" />
                                    )}
                                  </div>

                                  {/* Description */}
                                  <p className="text-xs text-muted-foreground mb-3">
                                    {getDescriptionSuggestion(suggestion)}
                                  </p>

                                  {/* Détails statistiques */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Moyenne:</span>
                                      <span className="ml-1 font-medium">{suggestion.details.montantMoyen.toLocaleString()} FCFA</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Min:</span>
                                      <span className="ml-1 font-medium">{suggestion.details.montantMin.toLocaleString()} FCFA</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Max:</span>
                                      <span className="ml-1 font-medium">{suggestion.details.montantMax.toLocaleString()} FCFA</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Variabilité:</span>
                                      <span className="ml-1 font-medium">{suggestion.details.coefficientVariation}%</span>
                                    </div>
                                  </div>

                                  {/* Historique (si disponible) */}
                                  {suggestion.historique && suggestion.historique.length > 0 && (
                                    <div className="mt-2 pt-2 border-t">
                                      <p className="text-xs text-muted-foreground mb-1">Historique récent:</p>
                                      <div className="flex gap-2">
                                        {suggestion.historique.map((h) => (
                                          <div key={h.mois} className="text-xs">
                                            <span className="font-mono">{h.mois}:</span>
                                            <span className="ml-1 font-medium">{(h.montant / 1000).toFixed(0)}k</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Montant suggéré et bouton d'application */}
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Montant suggéré</p>
                                    <p className="text-lg font-bold">{suggestion.montantSuggere.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">FCFA</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => appliquerSuggestion(ligne.id, suggestion.montantSuggere)}
                                    className="whitespace-nowrap"
                                  >
                                    Appliquer
                                  </Button>
                                </div>
                              </div>

                              {/* Badge de confiance */}
                              <div className="mt-2 pt-2 border-t flex items-center justify-between">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${couleurConfiance}`}>
                                  Confiance: {suggestion.confianceNiveau}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Basé sur {suggestion.nbMoisAnalyses} mois
                                </span>
                              </div>
                            </div>
                          );
                        })()
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {lignes.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Budget Total Prévisionnel</span>
                <span className="text-2xl">
                  {total.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">Remarques importantes</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Seuls les comptes de <strong>sortie</strong> peuvent être budgétisés</li>
                <li>Le <strong>seuil d'alerte</strong> est le pourcentage à partir duquel vous recevrez une alerte (par défaut 80%)</li>
                <li>Un seul budget <strong>actif</strong> est autorisé par mois</li>
                <li>Les budgets ne peuvent pas être modifiés en cours de mois</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/statistiques/comptabilite/budget")}
          disabled={saving}
        >
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving || lignes.length === 0}>
          {saving ? (
            <>
              <div className="animate-spin mr-2">⏳</div>
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ComptabiliteBudgetCreer;
