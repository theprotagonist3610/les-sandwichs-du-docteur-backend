/**
 * MobileGererLesMenusComposes.jsx
 * Gestion des menus composés (mobile, vertical & aéré)
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
import { Separator } from "@/components/ui/separator";
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

const MobileGererLesMenusComposes = () => {
  const navigate = useNavigate();
  const { menusComposes, loading, error, sync } = useMenusComposes();

  const [activeTab, setActiveTab] = useState("actifs");

  useEffect(() => {
    sync();
  }, [sync]);

  const menusComposesActifs = menusComposes.filter((m) => m.status !== false);
  const menusComposesNonActifs = menusComposes.filter((m) => m.status === false);

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

  const MenuComposeCard = ({ menuCompose }) => {
    const itemCounts = getItemCounts(menuCompose.contenu);

    return (
      <Card
        className="rounded-2xl overflow-hidden hover:shadow-md transition-all active:scale-[0.99]"
        onClick={() => handleMenuComposeClick(menuCompose.id)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="truncate">{menuCompose.denomination}</span>
            {menuCompose.status === false && (
              <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </CardTitle>
          {menuCompose.description && (
            <CardDescription className="text-xs line-clamp-2">
              {menuCompose.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Contenu du menu composé */}
          <div className="flex flex-wrap gap-2">
            {itemCounts.menus > 0 && (
              <Badge variant="secondary" className="text-xs">
                <UtensilsCrossed className="h-3 w-3 mr-1" />
                {itemCounts.menus} menu{itemCounts.menus > 1 ? "s" : ""}
              </Badge>
            )}
            {itemCounts.boissons > 0 && (
              <Badge variant="outline" className="text-xs">
                <Coffee className="h-3 w-3 mr-1" />
                {itemCounts.boissons} boisson{itemCounts.boissons > 1 ? "s" : ""}
              </Badge>
            )}
            {menuCompose.contenu?.length === 0 && (
              <span className="text-xs text-muted-foreground italic">
                Aucun contenu
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-bold text-primary">
              {menuCompose.prix} FCFA
            </span>
            <span className="text-xs text-muted-foreground">
              {menuCompose.contenu?.length || 0} item(s)
            </span>
          </div>

          <div className="text-[11px] text-muted-foreground pt-2 border-t">
            {menuCompose.createdAt
              ? `Créé le ${new Date(menuCompose.createdAt).toLocaleDateString("fr-FR")}`
              : "Date inconnue"}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Header compact */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <h1 className="text-lg font-bold">Menus composés</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={sync}
            disabled={loading}
            className="h-8">
            <RefreshCw
              className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/admin/settings/menuscomposes/create")}
            className="h-8">
            <Plus className="mr-1 h-4 w-4" />
            Nouveau
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {loading
          ? "Chargement..."
          : `${menusComposesActifs.length} actif(s) • ${menusComposesNonActifs.length} désactivé(s)`}
      </p>

      <Separator />

      {/* Message d'erreur */}
      {error && (
        <Card className="rounded-2xl border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="actifs" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Actifs ({menusComposesActifs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="non-actifs" className="flex items-center gap-1">
            <EyeOff className="h-4 w-4" />
            <span className="text-sm">
              Non actifs ({menusComposesNonActifs.length})
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Actifs */}
        <TabsContent value="actifs" className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : menusComposesActifs.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun menu composé actif
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {menusComposesActifs.map((menuCompose) => (
                <MenuComposeCard key={menuCompose.id} menuCompose={menuCompose} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Non actifs */}
        <TabsContent value="non-actifs" className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : menusComposesNonActifs.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun menu composé désactivé
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {menusComposesNonActifs.map((menuCompose) => (
                <MenuComposeCard key={menuCompose.id} menuCompose={menuCompose} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileGererLesMenusComposes;
