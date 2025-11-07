/**
 * DesktopComptes.jsx
 * Vue desktop pour les comptes comptables avec navigation et historique
 */

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Eye,
  History,
} from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";

// Recharts
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Hook personnalisé
import { useComptesData } from "../../../../hooks/useComptesData";

// Store
import useComptesStore from "../../../../stores/admin/useComptesStore";

// Utilitaires
import {
  formatMontant,
  formatPourcentage,
  formatDateComplete,
  getCompteOhadaConfig,
  getCategorieLabel,
  getTypeOperationLabel,
} from "../../../../utils/comptabilite/comptesFormatters";

import {
  getOperationsCompteToday,
  calculerStatistiquesCompte,
  calculerRepartitionOperations,
} from "../../../../utils/comptabilite/calculerSoldesComptes";

import { calculerDataEvolutionCompte } from "../../../../utils/comptabilite/comptesCharts";

// Components
import ComptesSkeleton from "../components/ComptesSkeleton";

const DesktopComptes = () => {
  // ============================================================================
  // HOOKS
  // ============================================================================

  const {
    comptesComptables,
    comptesEntree,
    comptesSortie,
    soldeTotal,
    variationPourcentage,
    compteSelectionne,
    isLoading,
    error,
    dataRepartition,
    dataEntreesSorties,
    dataFluxCategorie,
    top5Entrees,
    top5Sorties,
    selectionnerCompte,
    deselectionnerCompte,
    rafraichir,
  } = useComptesData();

  // Store pour la vue
  const vue = useComptesStore((state) => state.vue);
  const setVue = useComptesStore((state) => state.setVue);
  const filtreCategorie = useComptesStore((state) => state.filtreCategorie);
  const setFiltreCategorie = useComptesStore((state) => state.setFiltreCategorie);
  const filtreRecherche = useComptesStore((state) => state.filtreRecherche);
  const setFiltreRecherche = useComptesStore((state) => state.setFiltreRecherche);
  const getComptesFiltered = useComptesStore((state) => state.getComptesFiltered);

  // État local pour les opérations du compte sélectionné
  const [operationsCompte, setOperationsCompte] = useState([]);
  const [loadingOperations, setLoadingOperations] = useState(false);

  // ============================================================================
  // EFFET - Charger les opérations quand un compte est sélectionné
  // ============================================================================

  useEffect(() => {
    const chargerOperations = async () => {
      if (compteSelectionne) {
        setLoadingOperations(true);
        try {
          const ops = await getOperationsCompteToday(compteSelectionne.id);
          setOperationsCompte(ops);
        } catch (err) {
          console.error("Erreur chargement opérations:", err);
        } finally {
          setLoadingOperations(false);
        }
      } else {
        setOperationsCompte([]);
      }
    };

    chargerOperations();
  }, [compteSelectionne]);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  const handleVoirDetail = useCallback(
    (compte) => {
      selectionnerCompte(compte);
      setVue("detail");
    },
    [selectionnerCompte, setVue]
  );

  const handleRetourListe = useCallback(() => {
    deselectionnerCompte();
    setVue("liste");
  }, [deselectionnerCompte, setVue]);

  const handleRefresh = useCallback(() => {
    rafraichir();
  }, [rafraichir]);

  // ============================================================================
  // DONNÉES MÉMOÏSÉES
  // ============================================================================

  const comptesAffichage = useMemo(() => {
    return getComptesFiltered();
  }, [getComptesFiltered]);

  const statsCompteSelectionne = useMemo(() => {
    if (!compteSelectionne || operationsCompte.length === 0) {
      return { total: 0, nombre: 0, moyenne: 0 };
    }
    return calculerStatistiquesCompte(compteSelectionne.id, operationsCompte);
  }, [compteSelectionne, operationsCompte]);

  const repartitionCompteSelectionne = useMemo(() => {
    if (!compteSelectionne || operationsCompte.length === 0) {
      return { entrees: 0, sorties: 0 };
    }
    return calculerRepartitionOperations(compteSelectionne.id, operationsCompte);
  }, [compteSelectionne, operationsCompte]);

  const dataEvolutionCompte = useMemo(() => {
    if (!compteSelectionne || operationsCompte.length === 0) {
      return [];
    }
    return calculerDataEvolutionCompte(operationsCompte);
  }, [compteSelectionne, operationsCompte]);

  // ============================================================================
  // RENDU - LOADING
  // ============================================================================

  if (isLoading) {
    return <ComptesSkeleton />;
  }

  // ============================================================================
  // RENDU - ERROR
  // ============================================================================

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // RENDU - VUE DÉTAIL
  // ============================================================================

  if (vue === "detail" && compteSelectionne) {
    const config = getCompteOhadaConfig(compteSelectionne.code_ohada);
    const IconCompte = config.icon;

    return (
      <div className="p-6 space-y-6">
        {/* Header avec retour */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleRetourListe} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Info compte */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className="p-4 rounded-full"
                style={{ backgroundColor: `${config.strokeColor}20` }}
              >
                <IconCompte className="h-8 w-8" style={{ color: config.strokeColor }} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{compteSelectionne.denomination}</h2>
                <p className="text-muted-foreground">
                  Code OHADA: {compteSelectionne.code_ohada} • {config.category} •{" "}
                  {getCategorieLabel(compteSelectionne.categorie)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Solde</p>
                <p className="text-3xl font-bold">{formatMontant(compteSelectionne.solde)} FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total des opérations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMontant(statsCompteSelectionne.total)} FCFA</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statsCompteSelectionne.nombre} opération(s)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Montant moyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMontant(statsCompteSelectionne.moyenne)} FCFA</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Répartition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-green-600">Entrées</p>
                  <p className="text-lg font-semibold">{formatMontant(repartitionCompteSelectionne.entrees)}</p>
                </div>
                <div>
                  <p className="text-sm text-red-600">Sorties</p>
                  <p className="text-lg font-semibold">{formatMontant(repartitionCompteSelectionne.sorties)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique d'évolution */}
        {dataEvolutionCompte.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Évolution du compte</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dataEvolutionCompte}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cumul" stroke="#3b82f6" name="Cumul" strokeWidth={2} />
                  <Line type="monotone" dataKey="montant" stroke="#10b981" name="Montant" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Historique des opérations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des opérations ({operationsCompte.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOperations ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : operationsCompte.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune opération aujourd'hui
              </p>
            ) : (
              <div className="space-y-3">
                {operationsCompte.map((operation) => (
                  <motion.div
                    key={operation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{operation.motif}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateComplete(operation.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={operation.type_operation === "entree" ? "default" : "destructive"}>
                        {getTypeOperationLabel(operation.type_operation)}
                      </Badge>
                      <p className={`text-lg font-bold ${
                        operation.type_operation === "entree" ? "text-green-600" : "text-red-600"
                      }`}>
                        {operation.type_operation === "entree" ? "+" : "-"}
                        {formatMontant(operation.montant)} FCFA
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // RENDU - VUE LISTE
  // ============================================================================

  return (
    <div className="p-6 space-y-6">
      {/* Header avec résumé global */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comptes Comptables</h1>
          <p className="text-muted-foreground">Gestion et suivi des comptes OHADA</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatMontant(soldeTotal)} FCFA</p>
            <div className="flex items-center gap-2 mt-2">
              {variationPourcentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  variationPourcentage >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatPourcentage(variationPourcentage)} vs hier
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comptes d'Entrée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{comptesEntree.length}</p>
            <p className="text-sm text-muted-foreground mt-1">comptes actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comptes de Sortie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{comptesSortie.length}</p>
            <p className="text-sm text-muted-foreground mt-1">comptes actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou code OHADA..."
                  value={filtreRecherche}
                  onChange={(e) => setFiltreRecherche(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtreCategorie || "all"} onValueChange={(val) => setFiltreCategorie(val === "all" ? null : val)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="entree">Entrées</SelectItem>
                <SelectItem value="sortie">Sorties</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs : Liste / Graphiques */}
      <Tabs defaultValue="liste" className="w-full">
        <TabsList>
          <TabsTrigger value="liste">Liste des comptes</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
        </TabsList>

        {/* TAB: Liste */}
        <TabsContent value="liste" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tous les comptes ({comptesAffichage.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {comptesAffichage.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun compte trouvé</p>
              ) : (
                <div className="space-y-3">
                  {comptesAffichage.map((compte) => {
                    const config = getCompteOhadaConfig(compte.code_ohada);
                    const IconCompte = config.icon;

                    return (
                      <motion.div
                        key={compte.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-all cursor-pointer group"
                        onClick={() => handleVoirDetail(compte)}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="p-3 rounded-full"
                            style={{ backgroundColor: `${config.strokeColor}20` }}
                          >
                            <IconCompte className="h-6 w-6" style={{ color: config.strokeColor }} />
                          </div>
                          <div>
                            <p className="font-semibold">{compte.denomination}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>Code: {compte.code_ohada}</span>
                              <Badge variant="outline">{config.category}</Badge>
                              <Badge variant={compte.categorie === "entree" ? "default" : "destructive"}>
                                {getCategorieLabel(compte.categorie)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Solde</p>
                            <p className="text-xl font-bold">
                              {formatMontant(compte.solde || 0)} FCFA
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Graphiques */}
        <TabsContent value="graphiques" className="space-y-6">
          {/* Entrées vs Sorties */}
          <Card>
            <CardHeader>
              <CardTitle>Entrées vs Sorties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataEntreesSorties.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="montant" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">Total Entrées</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatMontant(dataEntreesSorties.totalEntrees)} FCFA
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">Total Sorties</p>
                    <p className="text-2xl font-bold text-red-900">
                      {formatMontant(dataEntreesSorties.totalSorties)} FCFA
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">Solde Net</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatMontant(dataEntreesSorties.soldeNet)} FCFA
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flux par catégorie */}
          <Card>
            <CardHeader>
              <CardTitle>Flux par catégorie OHADA</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dataFluxCategorie} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nom" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="montant">
                    {dataFluxCategorie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 - Comptes d'Entrée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {top5Entrees.map((compte, index) => (
                  <div key={compte.code} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{compte.nom}</p>
                        <p className="text-sm text-muted-foreground">{compte.code}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-600">{formatMontant(compte.solde)} FCFA</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 - Comptes de Sortie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {top5Sorties.map((compte, index) => (
                  <div key={compte.code} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{compte.nom}</p>
                        <p className="text-sm text-muted-foreground">{compte.code}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-red-600">{formatMontant(compte.solde)} FCFA</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesktopComptes;
