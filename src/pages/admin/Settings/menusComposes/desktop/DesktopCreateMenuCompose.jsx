/**
 * DesktopCreateMenuCompose.jsx
 * Création d'un nouveau menu composé (version desktop)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCreateMenuComposeStore from "@/stores/admin/createMenuComposeStore.js";
import { createMenuCompose } from "@/toolkits/admin/menuComposeToolkit.jsx";
import { useMenus } from "@/toolkits/admin/menuToolkit.jsx";
import { useBoissons } from "@/toolkits/admin/boissonToolkit.jsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  X,
  UtensilsCrossed,
  DollarSign,
  FileText,
  Plus,
  Minus,
  Package,
  Coffee,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const DesktopCreateMenuCompose = () => {
  const navigate = useNavigate();

  // Hooks pour récupérer les menus et boissons disponibles
  const { menus, loading: loadingMenus } = useMenus();
  const { boissons, loading: loadingBoissons } = useBoissons();

  // Store
  const denomination = useCreateMenuComposeStore((s) => s.denomination);
  const contenu = useCreateMenuComposeStore((s) => s.contenu);
  const description = useCreateMenuComposeStore((s) => s.description);
  const prix = useCreateMenuComposeStore((s) => s.prix);
  const isLoading = useCreateMenuComposeStore((s) => s.isLoading);
  const error = useCreateMenuComposeStore((s) => s.error);
  const success = useCreateMenuComposeStore((s) => s.success);

  const setDenomination = useCreateMenuComposeStore((s) => s.setDenomination);
  const setDescription = useCreateMenuComposeStore((s) => s.setDescription);
  const setPrix = useCreateMenuComposeStore((s) => s.setPrix);
  const addItem = useCreateMenuComposeStore((s) => s.addItem);
  const removeItem = useCreateMenuComposeStore((s) => s.removeItem);
  const updateItemQuantity = useCreateMenuComposeStore(
    (s) => s.updateItemQuantity
  );
  const setIsLoading = useCreateMenuComposeStore((s) => s.setIsLoading);
  const setError = useCreateMenuComposeStore((s) => s.setError);
  const setSuccess = useCreateMenuComposeStore((s) => s.setSuccess);
  const resetForm = useCreateMenuComposeStore((s) => s.resetForm);

  // État local pour les onglets
  const [activeTab, setActiveTab] = useState("menus");

  // Filtrer les items actifs
  const activeMenus = menus.filter((m) => m.status);
  const activeBoissons = boissons.filter((b) => b.status);

  // Validation
  const canSubmit =
    denomination.trim().length > 0 &&
    contenu.length > 0 &&
    prix > 0 &&
    !isLoading &&
    !success;

  // Calculer le prix total suggéré
  const prixSuggere = contenu.reduce((total, item) => {
    return total + (item.item.prix || 0) * item.quantite;
  }, 0);

  // Handlers
  const handleAddMenu = (menu) => {
    addItem(menu, "menu", 1);
  };

  const handleAddBoisson = (boisson) => {
    addItem(boisson, "boisson", 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsLoading(true);
      setError(null);

      await createMenuCompose({
        denomination,
        contenu,
        description,
        prix,
      });

      setSuccess(true);
      toast.success("Menu composé créé avec succès !");
      setTimeout(() => {
        resetForm();
        navigate("/admin/settings/menuscomposes");
      }, 1500);
    } catch (err) {
      const errorMessage =
        err?.message || "Erreur lors de la création du menu composé";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier si un item est déjà dans le contenu
  const isItemInContenu = (itemId, type) => {
    return contenu.some((c) => c.item.id === itemId && c.type === type);
  };

  // Obtenir la quantité d'un item dans le contenu
  const getItemQuantity = (itemId, type) => {
    const item = contenu.find((c) => c.item.id === itemId && c.type === type);
    return item ? item.quantite : 0;
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/settings/menuscomposes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Créer un menu composé</h1>
          <p className="text-muted-foreground mt-1">
            Combinez plusieurs menus et boissons en une formule
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche - Informations de base */}
          <div className="space-y-6">
            {/* Dénomination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5" />
                  Dénomination
                </CardTitle>
                <CardDescription>Le nom du menu composé</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Ex: Formule Midi Complète"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    className="pr-10"
                  />
                  {denomination.trim().length > 0 && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prix */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Prix
                </CardTitle>
                <CardDescription>
                  Prix du menu composé en FCFA
                  {prixSuggere > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="text-sm p-0 h-auto ml-2"
                      onClick={() => setPrix(prixSuggere)}>
                      Utiliser le prix suggéré ({prixSuggere} FCFA)
                    </Button>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="5000"
                    value={prix}
                    onChange={(e) => setPrix(Number(e.target.value))}
                    className="pr-20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    FCFA
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
                <CardDescription>
                  Description du menu composé (optionnel)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Décrivez le menu composé..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Récapitulatif du contenu */}
            {contenu.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Récapitulatif ({contenu.length} item
                    {contenu.length > 1 ? "s" : ""})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contenu.map((item, index) => (
                    <div
                      key={`${item.item.id}-${item.type}-${index}`}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {item.type === "menu" ? (
                            <UtensilsCrossed className="h-3 w-3 mr-1" />
                          ) : (
                            <Coffee className="h-3 w-3 mr-1" />
                          )}
                          {item.type}
                        </Badge>
                        <span className="font-medium">
                          {item.item.denomination}
                        </span>
                        <span className="text-muted-foreground">
                          x{item.quantite}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({item.item.prix * item.quantite} FCFA)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.item.id, item.type)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Prix suggéré total:</span>
                    <span>{prixSuggere} FCFA</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne droite - Sélection des items */}
          <div className="space-y-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sélection du contenu
                </CardTitle>
                <CardDescription>
                  Ajoutez des menus et boissons à votre formule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="menus">
                      <UtensilsCrossed className="h-4 w-4 mr-2" />
                      Menus ({activeMenus.length})
                    </TabsTrigger>
                    <TabsTrigger value="boissons">
                      <Coffee className="h-4 w-4 mr-2" />
                      Boissons ({activeBoissons.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="menus"
                    className="space-y-2 max-h-[400px] overflow-y-auto">
                    {loadingMenus ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : activeMenus.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Aucun menu disponible
                      </p>
                    ) : (
                      activeMenus.map((menu) => {
                        const inContenu = isItemInContenu(menu.id, "menu");
                        const quantity = getItemQuantity(menu.id, "menu");

                        return (
                          <div
                            key={menu.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                              inContenu
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}>
                            <div className="flex-1">
                              <p className="font-medium">{menu.denomination}</p>
                              <p className="text-sm text-muted-foreground">
                                {menu.prix} FCFA
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {inContenu ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateItemQuantity(
                                        menu.id,
                                        "menu",
                                        quantity - 1
                                      )
                                    }>
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-medium w-8 text-center">
                                    {quantity}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateItemQuantity(
                                        menu.id,
                                        "menu",
                                        quantity + 1
                                      )
                                    }>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleAddMenu(menu)}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>

                  <TabsContent
                    value="boissons"
                    className="space-y-2 max-h-[400px] overflow-y-auto">
                    {loadingBoissons ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : activeBoissons.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Aucune boisson disponible
                      </p>
                    ) : (
                      activeBoissons.map((boisson) => {
                        const inContenu = isItemInContenu(
                          boisson.id,
                          "boisson"
                        );
                        const quantity = getItemQuantity(boisson.id, "boisson");

                        return (
                          <div
                            key={boisson.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                              inContenu
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}>
                            <div className="flex-1">
                              <p className="font-medium">
                                {boisson.denomination}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {boisson.prix} FCFA
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {inContenu ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateItemQuantity(
                                        boisson.id,
                                        "boisson",
                                        quantity - 1
                                      )
                                    }>
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-medium w-8 text-center">
                                    {quantity}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateItemQuantity(
                                        boisson.id,
                                        "boisson",
                                        quantity + 1
                                      )
                                    }>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleAddBoisson(boisson)}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <X className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message de succès */}
        {success && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="h-5 w-5" />
                <p className="text-sm">Menu composé créé avec succès !</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boutons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/admin/settings/menus-composes")}
            disabled={isLoading}>
            Annuler
          </Button>

          <Button type="submit" className="flex-1" disabled={!canSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : success ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Créé
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Créer le menu composé
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DesktopCreateMenuCompose;
