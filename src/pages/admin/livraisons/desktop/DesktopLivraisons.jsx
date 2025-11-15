/**
 * DesktopLivraisons.jsx
 * Vue desktop complète pour la gestion des livraisons et livreurs
 *
 * Fonctionnalités :
 * - Onglet Livraisons : Tableau des livraisons avec filtres et actions
 * - Onglet Livreurs : CRUD des livreurs
 * - KPIs temps réel
 * - Sync RTDB pour mises à jour automatiques
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Truck,
  Package,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  PackageCheck,
  Play,
  CheckCheck,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useLivraisonsEnCours, useStatistiquesLivraisons } from "@/toolkits/admin/livraisons";
import { getAllLivreurs, createLivreur, updateLivreur, deleteLivreur } from "@/toolkits/admin/livreurs";
import { assignerLivreur, marquerColisRecupere, demarrerLivraison, terminerLivraison } from "@/toolkits/admin/livraisons";
import { STATUT_LABELS, STATUT_COLORS, STATUTS_LIVRAISON } from "@/toolkits/admin/livraisons/constants";
import { toast } from "sonner";

const DesktopLivraisons = () => {
  const user = useAuthStore((state) => state.user);

  // États pour les livraisons
  const { livraisons, loading: loadingLivraisons, error: errorLivraisons, refetch: refetchLivraisons } = useLivraisonsEnCours();
  const stats = useStatistiquesLivraisons(livraisons);

  // États pour les livreurs
  const [livreurs, setLivreurs] = useState([]);
  const [loadingLivreurs, setLoadingLivreurs] = useState(true);

  // Filtres
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreLivreur, setFiltreLivreur] = useState("tous");
  const [filtrePriorite, setFiltrePriorite] = useState("tous");

  // Modals livreurs
  const [showModalLivreur, setShowModalLivreur] = useState(false);
  const [livreurEnEdition, setLivreurEnEdition] = useState(null);
  const [formLivreur, setFormLivreur] = useState({
    denomination: "",
    contact: "",
    actif: true,
  });

  // Modal assignation
  const [showModalAssignation, setShowModalAssignation] = useState(false);
  const [livraisonEnAssignation, setLivraisonEnAssignation] = useState(null);
  const [livreurSelectionne, setLivreurSelectionne] = useState("");

  // Charger les livreurs
  React.useEffect(() => {
    loadLivreurs();
  }, []);

  const loadLivreurs = async () => {
    try {
      setLoadingLivreurs(true);
      const data = await getAllLivreurs({ useCache: false });
      setLivreurs(data);
    } catch (error) {
      console.error("Erreur chargement livreurs:", error);
      toast.error("Impossible de charger les livreurs");
    } finally {
      setLoadingLivreurs(false);
    }
  };

  // Filtrer les livraisons
  const livraisonsFiltrees = useMemo(() => {
    if (!livraisons) return [];

    return livraisons.filter((liv) => {
      const matchStatut = filtreStatut === "tous" || liv.statut === filtreStatut;
      const matchLivreur = filtreLivreur === "tous" || liv.livreur?.id === filtreLivreur;
      const matchPriorite = filtrePriorite === "tous" || liv.priorite === filtrePriorite;

      return matchStatut && matchLivreur && matchPriorite;
    });
  }, [livraisons, filtreStatut, filtreLivreur, filtrePriorite]);

  // Livreurs actifs uniquement
  const livreursActifs = useMemo(() => {
    return livreurs.filter((l) => l.actif);
  }, [livreurs]);

  // === HANDLERS LIVRAISONS ===

  const handleAssignerLivreur = async () => {
    if (!livraisonEnAssignation || !livreurSelectionne) return;

    try {
      const livreur = livreurs.find((l) => l.id === livreurSelectionne);
      if (!livreur) throw new Error("Livreur introuvable");

      await assignerLivreur(
        livraisonEnAssignation.id,
        {
          livreur_id: livreur.id,
          livreur_nom: livreur.denomination,
        },
        user.uid
      );

      toast.success(`Livreur ${livreur.denomination} assigné`);
      setShowModalAssignation(false);
      setLivraisonEnAssignation(null);
      setLivreurSelectionne("");
      refetchLivraisons();
    } catch (error) {
      console.error("Erreur assignation:", error);
      toast.error(error.message || "Erreur lors de l'assignation");
    }
  };

  const handleMarquerRecupere = async (livraison) => {
    try {
      await marquerColisRecupere(livraison.id, user.uid);
      toast.success("Colis marqué comme récupéré");
      refetchLivraisons();
    } catch (error) {
      console.error("Erreur récupération:", error);
      toast.error(error.message || "Erreur lors de la récupération");
    }
  };

  const handleDemarrer = async (livraison) => {
    try {
      await demarrerLivraison(livraison.id, user.uid);
      toast.success("Livraison démarrée");
      refetchLivraisons();
    } catch (error) {
      console.error("Erreur démarrage:", error);
      toast.error(error.message || "Erreur lors du démarrage");
    }
  };

  const handleTerminer = async (livraison) => {
    try {
      await terminerLivraison(livraison.id, user.uid);
      toast.success("Livraison terminée !");
      refetchLivraisons();
    } catch (error) {
      console.error("Erreur fin livraison:", error);
      toast.error(error.message || "Erreur lors de la finalisation");
    }
  };

  // === HANDLERS LIVREURS ===

  const handleOpenModalLivreur = (livreur = null) => {
    if (livreur) {
      setLivreurEnEdition(livreur);
      setFormLivreur({
        denomination: livreur.denomination,
        contact: livreur.contact,
        actif: livreur.actif,
      });
    } else {
      setLivreurEnEdition(null);
      setFormLivreur({
        denomination: "",
        contact: "",
        actif: true,
      });
    }
    setShowModalLivreur(true);
  };

  const handleSaveLivreur = async () => {
    try {
      if (!formLivreur.denomination || !formLivreur.contact) {
        toast.error("Veuillez remplir tous les champs");
        return;
      }

      if (livreurEnEdition) {
        // Mise à jour
        await updateLivreur(livreurEnEdition.id, formLivreur, user.uid);
        toast.success("Livreur mis à jour");
      } else {
        // Création
        await createLivreur(formLivreur, user.uid);
        toast.success("Livreur créé avec succès");
      }

      setShowModalLivreur(false);
      loadLivreurs();
    } catch (error) {
      console.error("Erreur sauvegarde livreur:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
    }
  };

  const handleDeleteLivreur = async (livreur) => {
    if (!confirm(`Désactiver le livreur ${livreur.denomination} ?`)) return;

    try {
      await deleteLivreur(livreur.id, user.uid);
      toast.success("Livreur désactivé");
      loadLivreurs();
    } catch (error) {
      console.error("Erreur suppression livreur:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  if (loadingLivraisons && loadingLivreurs) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-lg opacity-70">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="h-8 w-8" />
            Gestion des Livraisons
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Suivi des livraisons et gestion des livreurs
          </p>
        </div>

        <Button onClick={refetchLivraisons} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.en_attente}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assignées</p>
                <p className="text-2xl font-bold">{stats.assignee}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Récupérées</p>
                <p className="text-2xl font-bold">{stats.recuperee}</p>
              </div>
              <PackageCheck className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{stats.en_cours}</p>
              </div>
              <Truck className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Livrées</p>
                <p className="text-2xl font-bold text-green-600">{stats.livree}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="livraisons" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="livraisons">
            <Package className="h-4 w-4 mr-2" />
            Livraisons ({livraisonsFiltrees.length})
          </TabsTrigger>
          <TabsTrigger value="livreurs">
            <Users className="h-4 w-4 mr-2" />
            Livreurs ({livreurs.length})
          </TabsTrigger>
        </TabsList>

        {/* ONGLET LIVRAISONS */}
        <TabsContent value="livraisons" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Statut</Label>
                  <Select value={filtreStatut} onValueChange={setFiltreStatut}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les statuts</SelectItem>
                      <SelectItem value={STATUTS_LIVRAISON.EN_ATTENTE}>En attente</SelectItem>
                      <SelectItem value={STATUTS_LIVRAISON.ASSIGNEE}>Assignées</SelectItem>
                      <SelectItem value={STATUTS_LIVRAISON.RECUPEREE}>Récupérées</SelectItem>
                      <SelectItem value={STATUTS_LIVRAISON.EN_COURS}>En cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Livreur</Label>
                  <Select value={filtreLivreur} onValueChange={setFiltreLivreur}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les livreurs</SelectItem>
                      {livreursActifs.map((livreur) => (
                        <SelectItem key={livreur.id} value={livreur.id}>
                          {livreur.denomination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priorité</Label>
                  <Select value={filtrePriorite} onValueChange={setFiltrePriorite}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Toutes les priorités</SelectItem>
                      <SelectItem value="normale">Normale</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des livraisons */}
          <Card>
            <CardHeader>
              <CardTitle>Livraisons en cours</CardTitle>
            </CardHeader>
            <CardContent>
              {livraisonsFiltrees.length === 0 ? (
                <div className="text-center py-12 opacity-70">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Aucune livraison en cours</p>
                  <p className="text-sm mt-2">Toutes les livraisons sont terminées</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-semibold">Code</th>
                        <th className="p-3 text-left font-semibold">Client</th>
                        <th className="p-3 text-left font-semibold">Téléphone</th>
                        <th className="p-3 text-left font-semibold">Statut</th>
                        <th className="p-3 text-left font-semibold">Livreur</th>
                        <th className="p-3 text-center font-semibold">Priorité</th>
                        <th className="p-3 text-center font-semibold">Colis</th>
                        <th className="p-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {livraisonsFiltrees.map((livraison) => (
                        <tr key={livraison.id} className="border-b hover:bg-accent/50 transition-colors">
                          <td className="p-3 font-medium">{livraison.commande_code}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {livraison.client.nom}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {livraison.client.telephone}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[livraison.statut]}`}>
                              {STATUT_LABELS[livraison.statut]}
                            </span>
                          </td>
                          <td className="p-3">
                            {livraison.livreur ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-blue-500" />
                                {livraison.livreur.nom}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Non assigné</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {livraison.priorite === "urgente" ? (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                Urgente
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                Normale
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {livraison.colis_recupere ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              {livraison.statut === STATUTS_LIVRAISON.EN_ATTENTE && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setLivraisonEnAssignation(livraison);
                                    setShowModalAssignation(true);
                                  }}
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Assigner
                                </Button>
                              )}

                              {livraison.statut === STATUTS_LIVRAISON.ASSIGNEE && !livraison.colis_recupere && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarquerRecupere(livraison)}
                                >
                                  <PackageCheck className="h-4 w-4 mr-1" />
                                  Récupéré
                                </Button>
                              )}

                              {livraison.statut === STATUTS_LIVRAISON.RECUPEREE && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDemarrer(livraison)}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Démarrer
                                </Button>
                              )}

                              {livraison.statut === STATUTS_LIVRAISON.EN_COURS && (
                                <Button
                                  size="sm"
                                  onClick={() => handleTerminer(livraison)}
                                >
                                  <CheckCheck className="h-4 w-4 mr-1" />
                                  Terminer
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET LIVREURS */}
        <TabsContent value="livreurs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Liste des Livreurs</CardTitle>
              <Button onClick={() => handleOpenModalLivreur()}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un livreur
              </Button>
            </CardHeader>
            <CardContent>
              {livreurs.length === 0 ? (
                <div className="text-center py-12 opacity-70">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Aucun livreur</p>
                  <p className="text-sm mt-2">Ajoutez votre premier livreur</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {livreurs.map((livreur) => (
                    <Card key={livreur.id} className={livreur.actif ? "" : "opacity-50"}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${livreur.actif ? "bg-green-100" : "bg-gray-100"}`}>
                              <Users className={`h-5 w-5 ${livreur.actif ? "text-green-600" : "text-gray-500"}`} />
                            </div>
                            <div>
                              <p className="font-semibold">{livreur.denomination}</p>
                              <p className="text-sm text-muted-foreground">{livreur.contact}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            livreur.actif
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {livreur.actif ? "Actif" : "Inactif"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleOpenModalLivreur(livreur)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          {livreur.actif && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteLivreur(livreur)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Assignation Livreur */}
      <Dialog open={showModalAssignation} onOpenChange={setShowModalAssignation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un livreur</DialogTitle>
            <DialogDescription>
              Commande : {livraisonEnAssignation?.commande_code}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Sélectionner un livreur</Label>
              <Select value={livreurSelectionne} onValueChange={setLivreurSelectionne}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un livreur" />
                </SelectTrigger>
                <SelectContent>
                  {livreursActifs.map((livreur) => (
                    <SelectItem key={livreur.id} value={livreur.id}>
                      {livreur.denomination} - {livreur.contact}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModalAssignation(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssignerLivreur} disabled={!livreurSelectionne}>
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Livreur */}
      <Dialog open={showModalLivreur} onOpenChange={setShowModalLivreur}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {livreurEnEdition ? "Modifier le livreur" : "Ajouter un livreur"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={formLivreur.denomination}
                onChange={(e) => setFormLivreur({ ...formLivreur, denomination: e.target.value })}
                placeholder="Ex: Jean Dupont"
              />
            </div>

            <div>
              <Label>Téléphone</Label>
              <Input
                value={formLivreur.contact}
                onChange={(e) => setFormLivreur({ ...formLivreur, contact: e.target.value })}
                placeholder="Ex: +225 01 23 45 67 89"
              />
            </div>

            {livreurEnEdition && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actif"
                  checked={formLivreur.actif}
                  onChange={(e) => setFormLivreur({ ...formLivreur, actif: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="actif">Livreur actif</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModalLivreur(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveLivreur}>
              {livreurEnEdition ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopLivraisons;
