/**
 * DesktopGererLesMenusComposes.jsx
 * Composant pour gérer les menus composés existants avec tabs actifs/non actifs
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMenusComposes } from "@/toolkits/admin/menuComposeToolkit.jsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  UtensilsCrossed,
  Coffee,
} from "lucide-react";

const DesktopGererLesMenusComposes = () => {
  const navigate = useNavigate();
  const { menusComposes, loading, error, sync } = useMenusComposes();

  const [activeTab, setActiveTab] = useState("actifs");

  // Synchroniser au montage
  useEffect(() => {
    sync();
  }, [sync]);

  // Filtrer les menus composés actifs et non actifs
  const menusComposesActifs = menusComposes.filter((mc) => mc.status !== false);
  const menusComposesNonActifs = menusComposes.filter(
    (mc) => mc.status === false
  );

  // Gérer le clic sur une card
  const handleMenuComposeClick = (menuComposeId) => {
    navigate(`/admin/settings/menuscomposes/gerer/${menuComposeId}`);
  };

  // Compter les items par type
  const getItemCounts = (contenu) => {
    const counts = { menus: 0, boissons: 0 };
    contenu?.forEach((item) => {
      if (item.type === "menu") {
        counts.menus += item.quantite;
      } else if (item.type === "boisson") {
        counts.boissons += item.quantite;
      }
    });
    return counts;
  };

  // Render d'une card de menu composé
  const MenuComposeCard = ({ menuCompose }) => {
    const itemCounts = getItemCounts(menuCompose.contenu);

    return (
      <Card
        className="overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:scale-105"
        onClick={() => handleMenuComposeClick(menuCompose.id)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="truncate">{menuCompose.denomination}</span>
            {menuCompose.status === false && (
              <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </CardTitle>
          {menuCompose.description && (
            <CardDescription className="text-sm line-clamp-2">
              {menuCompose.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Contenu du menu composé */}
          <div className="flex flex-wrap gap-2">
            {itemCounts.menus > 0 && (
              <Badge variant="secondary">
                <UtensilsCrossed className="h-3 w-3 mr-1" />
                {itemCounts.menus} menu{itemCounts.menus > 1 ? "s" : ""}
              </Badge>
            )}
            {itemCounts.boissons > 0 && (
              <Badge variant="outline">
                <Coffee className="h-3 w-3 mr-1" />
                {itemCounts.boissons} boisson{itemCounts.boissons > 1 ? "s" : ""}
              </Badge>
            )}
            {menuCompose.contenu?.length === 0 && (
              <span className="text-sm text-muted-foreground italic">
                Aucun contenu
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-lg font-bold text-primary">
              {menuCompose.prix} FCFA
            </span>
            <span className="text-sm text-muted-foreground">
              {menuCompose.contenu?.length || 0} item(s)
            </span>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Créé le{" "}
            {menuCompose.createdAt
              ? new Date(menuCompose.createdAt).toLocaleDateString("fr-FR")
              : "Date inconnue"}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Gérer les menus composés
          </h1>
          <p className="text-muted-foreground mt-2">
            {loading
              ? "Chargement..."
              : `${menusComposesActifs.length} menu(s) composé(s) actif(s), ${menusComposesNonActifs.length} désactivé(s)`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={sync} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Button
            onClick={() => navigate("/admin/settings/menuscomposes/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau menu composé
          </Button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="actifs" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Actifs ({menusComposesActifs.length})
          </TabsTrigger>
          <TabsTrigger value="non-actifs" className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Non actifs ({menusComposesNonActifs.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Actifs */}
        <TabsContent value="actifs" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : menusComposesActifs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  Aucun menu composé actif
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menusComposesActifs.map((menuCompose) => (
                <MenuComposeCard
                  key={menuCompose.id}
                  menuCompose={menuCompose}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Non actifs */}
        <TabsContent value="non-actifs" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : menusComposesNonActifs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  Aucun menu composé désactivé
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menusComposesNonActifs.map((menuCompose) => (
                <MenuComposeCard
                  key={menuCompose.id}
                  menuCompose={menuCompose}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesktopGererLesMenusComposes;
