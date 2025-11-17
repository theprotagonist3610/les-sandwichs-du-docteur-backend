/**
 * MobileLivraisons.jsx
 * Vue mobile optimisée pour la gestion des livraisons et livreurs
 *
 * Fonctionnalités :
 * - Cards compactes au lieu de tableaux
 * - Actions rapides accessibles
 * - Tabs pour navigation
 * - Filtres simplifiés
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
import {
  Truck,
  Package,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  PackageCheck,
  Play,
  CheckCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useUser } from "@/toolkits/global/userToolkit";
import { useLivraisonsEnCours, useStatistiquesLivraisons } from "@/toolkits/admin/livraisons";
import { getAllLivreurs, createLivreur, updateLivreur, deleteLivreur } from "@/toolkits/admin/livreurs";
import { assignerLivreur, marquerColisRecupere, demarrerLivraison, terminerLivraison } from "@/toolkits/admin/livraisons";
import { STATUT_LABELS, STATUT_COLORS, STATUTS_LIVRAISON } from "@/toolkits/admin/livraisons/constants";
import { toast } from "sonner";

const MobileLivraisons = () => {
  const { user } = useUser();

  // États pour les livraisons
  const { livraisons, loading: loadingLivraisons, refetch: refetchLivraisons } = useLivraisonsEnCours();
  const stats = useStatistiquesLivraisons(livraisons);

  // États pour les livreurs
  const [livreurs, setLivreurs] = useState([]);
  const [loadingLivreurs, setLoadingLivreurs] = useState(true);

  // Filtres
  const [filtreStatut, setFiltreStatut] = useState("tous");

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
    if (filtreStatut === "tous") return livraisons;
    return livraisons.filter((liv) => liv.statut === filtreStatut);
  }, [livraisons, filtreStatut]);

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
      toast.success("Colis récupéré");
      refetchLivraisons();
    } catch (error) {
      console.error("Erreur récupération:", error);
      toast.error(error.message || "Erreur");
    }
  };

  const handleDemarrer = async (livraison) => {
    try {
      await demarrerLivraison(livraison.id, user.uid);
      toast.success("Livraison démarrée");
      refetchLivraisons();
    } catch (error) {
      console.error("Erreur démarrage:", error);
      toast.error(error.message || "Erreur");
    }
  };

  const handleTerminer = async (livraison) => {
    try {
      await terminerLivraison(livraison.id, user.uid);
      toast.success("Livraison terminée !");
      refetchLivraisons();
    } catch (error) {
      console.error("Erreur fin livraison:", error);
      toast.error(error.message || "Erreur");
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
        await updateLivreur(livreurEnEdition.id, formLivreur, user.uid);
        toast.success("Livreur mis à jour");
      } else {
        await createLivreur(formLivreur, user.uid);
        toast.success("Livreur créé");
      }

      setShowModalLivreur(false);
      loadLivreurs();
    } catch (error) {
      console.error("Erreur sauvegarde livreur:", error);
      toast.error(error.message || "Erreur");
    }
  };

  const handleDeleteLivreur = async (livreur) => {
    if (!confirm(`Désactiver ${livreur.denomination} ?`)) return;

    try {
      await deleteLivreur(livreur.id, user.uid);
      toast.success("Livreur désactivé");
      loadLivreurs();
    } catch (error) {
      console.error("Erreur suppression livreur:", error);
      toast.error(error.message || "Erreur");
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
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Livraisons
          </h1>
        </div>
        <Button onClick={refetchLivraisons} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* KPIs Compacts */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En attente</p>
                <p className="text-xl font-bold">{stats.en_attente}</p>
              </div>
              <Clock className="h-6 w-6 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En cours</p>
                <p className="text-xl font-bold">{stats.en_cours}</p>
              </div>
              <Truck className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="livraisons" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="livraisons">
            <Package className="h-4 w-4 mr-1" />
            Livraisons
          </TabsTrigger>
          <TabsTrigger value="livreurs">
            <Users className="h-4 w-4 mr-1" />
            Livreurs
          </TabsTrigger>
        </TabsList>

        {/* ONGLET LIVRAISONS */}
        <TabsContent value="livraisons" className="space-y-3">
          {/* Filtre Statut */}
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

          {/* Liste des livraisons */}
          {livraisonsFiltrees.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center opacity-70">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune livraison</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {livraisonsFiltrees.map((livraison) => (
                <Card key={livraison.id}>
                  <CardContent className="p-4">
                    {/* Header de la card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-lg">{livraison.commande_code}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {livraison.client.nom}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${livraison.client.telephone}`} className="text-blue-600">
                            {livraison.client.telephone}
                          </a>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 items-end">
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${STATUT_COLORS[livraison.statut]}`}>
                          {STATUT_LABELS[livraison.statut]}
                        </span>
                        {livraison.priorite === "urgente" && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Urgente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Livreur et colis */}
                    <div className="mb-3 pb-3 border-b space-y-1">
                      {livraison.livreur ? (
                        <div className="flex items-center gap-2 text-sm">
                          <UserCheck className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{livraison.livreur.nom}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Non assigné</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        {livraison.colis_recupere ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 font-medium">Colis récupéré</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-muted-foreground">Colis non récupéré</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {livraison.statut === STATUTS_LIVRAISON.EN_ATTENTE && (
                        <Button
                          size="sm"
                          className="flex-1"
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
                          className="flex-1"
                          onClick={() => handleMarquerRecupere(livraison)}
                        >
                          <PackageCheck className="h-4 w-4 mr-1" />
                          Récupéré
                        </Button>
                      )}

                      {livraison.statut === STATUTS_LIVRAISON.RECUPEREE && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDemarrer(livraison)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Démarrer
                        </Button>
                      )}

                      {livraison.statut === STATUTS_LIVRAISON.EN_COURS && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleTerminer(livraison)}
                        >
                          <CheckCheck className="h-4 w-4 mr-1" />
                          Terminer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ONGLET LIVREURS */}
        <TabsContent value="livreurs" className="space-y-3">
          <Button onClick={() => handleOpenModalLivreur()} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un livreur
          </Button>

          {livreurs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center opacity-70">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucun livreur</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {livreurs.map((livreur) => (
                <Card key={livreur.id} className={livreur.actif ? "" : "opacity-50"}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${livreur.actif ? "bg-green-100" : "bg-gray-100"}`}>
                          <Users className={`h-5 w-5 ${livreur.actif ? "text-green-600" : "text-gray-500"}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{livreur.denomination}</p>
                          <p className="text-sm text-muted-foreground">{livreur.contact}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        livreur.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {livreur.actif ? "Actif" : "Inactif"}
                      </span>
                    </div>

                    <div className="flex gap-2">
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
              <Label>Livreur</Label>
              <Select value={livreurSelectionne} onValueChange={setLivreurSelectionne}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {livreursActifs.map((livreur) => (
                    <SelectItem key={livreur.id} value={livreur.id}>
                      {livreur.denomination}
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
              {livreurEnEdition ? "Modifier" : "Ajouter"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={formLivreur.denomination}
                onChange={(e) => setFormLivreur({ ...formLivreur, denomination: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <Label>Téléphone</Label>
              <Input
                value={formLivreur.contact}
                onChange={(e) => setFormLivreur({ ...formLivreur, contact: e.target.value })}
                placeholder="+225 01 23 45 67 89"
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
                <Label htmlFor="actif">Actif</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModalLivreur(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveLivreur}>
              {livreurEnEdition ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileLivraisons;
