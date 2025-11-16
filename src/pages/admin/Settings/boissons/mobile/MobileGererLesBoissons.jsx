/**
 * MobileGererLesBoissons.jsx
 * Gestion des boissons (mobile, vertical & aéré)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBoissons } from "@/toolkits/admin/boissonToolkit.jsx";
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
  GlassWater,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

const MobileGererLesBoissons = () => {
  const navigate = useNavigate();
  const { boissons, loading, error, sync } = useBoissons();

  const [activeTab, setActiveTab] = useState("actifs");

  useEffect(() => {
    sync();
  }, [sync]);

  const boissonsActives = boissons.filter((b) => b.status !== false);
  const boissonsNonActives = boissons.filter((b) => b.status === false);

  const handleBoissonClick = (boissonId) => {
    navigate(`/admin/settings/boissons/gerer/${boissonId}`);
  };

  const BoissonCard = ({ boisson }) => (
    <Card
      className="rounded-2xl overflow-hidden hover:shadow-md transition-all active:scale-[0.99]"
      onClick={() => handleBoissonClick(boisson.id)}>
      {/* Image */}
      {boisson.imgURL && (
        <div className="h-40 overflow-hidden bg-muted">
          <img
            src={boisson.imgURL}
            alt={boisson.denomination}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="truncate">{boisson.denomination}</span>
          {boisson.status === false && (
            <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </CardTitle>
        {boisson.description && (
          <CardDescription className="text-xs line-clamp-2">
            {boisson.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-primary">
            {boisson.prix} FCFA
          </span>
        </div>

        <div className="text-[11px] text-muted-foreground pt-2 border-t">
          {boisson.createdAt
            ? `Créé le ${new Date(boisson.createdAt).toLocaleDateString(
                "fr-FR"
              )}`
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
          <GlassWater className="h-6 w-6" />
          <h1 className="text-lg font-bold">Gérer les boissons</h1>
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
            onClick={() => navigate("/admin/settings/boissons/create")}
            className="h-8">
            <Plus className="mr-1 h-4 w-4" />
            Nouveau
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {loading
          ? "Chargement..."
          : `${boissonsActives.length} active(s) • ${boissonsNonActives.length} désactivée(s)`}
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
            <span className="text-sm">Actifs ({boissonsActives.length})</span>
          </TabsTrigger>
          <TabsTrigger value="non-actifs" className="flex items-center gap-1">
            <EyeOff className="h-4 w-4" />
            <span className="text-sm">
              Non actifs ({boissonsNonActives.length})
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Actifs */}
        <TabsContent value="actifs" className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : boissonsActives.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune boisson active
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {boissonsActives.map((boisson) => (
                <BoissonCard key={boisson.id} boisson={boisson} />
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
          ) : boissonsNonActives.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune boisson désactivée
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {boissonsNonActives.map((boisson) => (
                <BoissonCard key={boisson.id} boisson={boisson} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileGererLesBoissons;