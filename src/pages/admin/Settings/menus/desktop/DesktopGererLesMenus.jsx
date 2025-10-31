/**
 * DesktopGererLesMenus.jsx
 * Composant pour gérer les menus existants avec tabs actifs/non actifs
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMenus } from "@/toolkits/admin/menuToolkit.jsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UtensilsCrossed, Plus, RefreshCw, Eye, EyeOff } from "lucide-react";

const DesktopGererLesMenus = () => {
  const navigate = useNavigate();
  const { menus, loading, error, sync } = useMenus();

  const [activeTab, setActiveTab] = useState("actifs");

  // Synchroniser au montage
  useEffect(() => {
    sync();
  }, [sync]);

  // Filtrer les menus actifs et non actifs
  const menusActifs = menus.filter((menu) => menu.status !== false);
  const menusNonActifs = menus.filter((menu) => menu.status === false);

  // Gérer le clic sur une card
  const handleMenuClick = (menuId) => {
    navigate(`/admin/settings/menus/gerer/${menuId}`);
  };

  // Render d'une card de menu
  const MenuCard = ({ menu }) => (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:scale-105"
      onClick={() => handleMenuClick(menu.id)}
    >
      {/* Image */}
      {menu.imgURL && (
        <div className="h-48 overflow-hidden bg-muted">
          <img
            src={menu.imgURL}
            alt={menu.denomination}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="truncate">{menu.denomination}</span>
          {menu.status === false && (
            <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </CardTitle>
        {menu.description && (
          <CardDescription className="text-sm line-clamp-2">
            {menu.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-primary">
            {menu.prix} FCFA
          </span>

          {menu.ingredients && menu.ingredients.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {menu.ingredients.length} ingrédient(s)
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Créé le {new Date(menu.createdAt).toLocaleDateString("fr-FR")}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8" />
            Gérer les menus
          </h1>
          <p className="text-muted-foreground mt-2">
            {loading
              ? "Chargement..."
              : `${menusActifs.length} menu(s) actif(s), ${menusNonActifs.length} menu(s) désactivé(s)`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={sync} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={() => navigate("/admin/settings/menus/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau menu
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="actifs" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Actifs ({menusActifs.length})
          </TabsTrigger>
          <TabsTrigger value="non-actifs" className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Non actifs ({menusNonActifs.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Actifs */}
        <TabsContent value="actifs" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : menusActifs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Aucun menu actif</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menusActifs.map((menu) => (
                <MenuCard key={menu.id} menu={menu} />
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
          ) : menusNonActifs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Aucun menu désactivé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menusNonActifs.map((menu) => (
                <MenuCard key={menu.id} menu={menu} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesktopGererLesMenus;
