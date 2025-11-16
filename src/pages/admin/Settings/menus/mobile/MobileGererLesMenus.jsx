/**
 * MobileGererLesMenus.jsx
 * Gestion des menus (mobile, vertical & aéré)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMenus } from "@/toolkits/admin/menuToolkit.jsx";
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
import {
  Loader2,
  UtensilsCrossed,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

const MobileGererLesMenus = () => {
  const navigate = useNavigate();
  const { menus, loading, error, sync } = useMenus();

  const [activeTab, setActiveTab] = useState("actifs");

  useEffect(() => {
    sync();
  }, [sync]);

  const menusActifs = menus.filter((m) => m.status !== false);
  const menusNonActifs = menus.filter((m) => m.status === false);

  const handleMenuClick = (menuId) => {
    navigate(`/admin/settings/menus/gerer/${menuId}`);
  };

  const MenuCard = ({ menu }) => (
    <Card
      className="rounded-2xl overflow-hidden hover:shadow-md transition-all active:scale-[0.99]"
      onClick={() => handleMenuClick(menu.id)}>
      {/* Image */}
      {menu.imgURL && (
        <div className="h-40 overflow-hidden bg-muted">
          <img
            src={menu.imgURL}
            alt={menu.denomination}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="truncate">{menu.denomination}</span>
          {menu.status === false && (
            <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </CardTitle>
        {menu.description && (
          <CardDescription className="text-xs line-clamp-2">
            {menu.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-primary">
            {menu.prix} FCFA
          </span>
          {menu.ingredients?.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {menu.ingredients.length} ingrédient(s)
            </span>
          )}
        </div>

        <div className="text-[11px] text-muted-foreground pt-2 border-t">
          {menu.createdAt
            ? `Créé le ${new Date(menu.createdAt).toLocaleDateString("fr-FR")}`
            : "Date inconnue"}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Header compact */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6" />
          <h1 className="text-lg font-bold">Gérer les menus</h1>
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
            onClick={() => navigate("/admin/settings/menus/create")}
            className="h-8">
            <Plus className="mr-1 h-4 w-4" />
            Nouveau
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {loading
          ? "Chargement..."
          : `${menusActifs.length} actif(s) • ${menusNonActifs.length} désactivé(s)`}
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
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="actifs" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Actifs ({menusActifs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="non-actifs" className="flex items-center gap-1">
            <EyeOff className="h-4 w-4" />
            <span className="text-sm">
              Non actifs ({menusNonActifs.length})
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Actifs */}
        <TabsContent value="actifs" className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : menusActifs.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun menu actif
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {menusActifs.map((menu) => (
                <MenuCard key={menu.id} menu={menu} />
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
          ) : menusNonActifs.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun menu désactivé
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
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

export default MobileGererLesMenus;
