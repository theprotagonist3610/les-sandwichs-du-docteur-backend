/**
 * DesktopGererLesBoissons.jsx
 * Composant pour gérer les boissons existantes avec tabs actifs/non actifs
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBoissons } from "@/toolkits/admin/boissonToolkit.jsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, GlassWater, Plus, RefreshCw, Eye, EyeOff } from "lucide-react";

const DesktopGererLesBoissons = () => {
  const navigate = useNavigate();
  const { boissons, loading, error, sync } = useBoissons();

  const [activeTab, setActiveTab] = useState("actifs");

  // Synchroniser au montage
  useEffect(() => {
    sync();
  }, [sync]);

  // Filtrer les boissons actives et non actives
  const boissonsActives = boissons.filter((boisson) => boisson.status !== false);
  const boissonsNonActives = boissons.filter((boisson) => boisson.status === false);

  // Gérer le clic sur une card
  const handleBoissonClick = (boissonId) => {
    navigate(`/admin/settings/boissons/gerer/${boissonId}`);
  };

  // Render d'une card de boisson
  const BoissonCard = ({ boisson }) => (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:scale-105"
      onClick={() => handleBoissonClick(boisson.id)}
    >
      {/* Image */}
      {boisson.imgURL && (
        <div className="h-48 overflow-hidden bg-muted">
          <img
            src={boisson.imgURL}
            alt={boisson.denomination}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="truncate">{boisson.denomination}</span>
          {boisson.status === false && (
            <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </CardTitle>
        {boisson.description && (
          <CardDescription className="text-sm line-clamp-2">
            {boisson.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-primary">
            {boisson.prix} FCFA
          </span>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Créé le {new Date(boisson.createdAt).toLocaleDateString("fr-FR")}
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
            <GlassWater className="h-8 w-8" />
            Gérer les boissons
          </h1>
          <p className="text-muted-foreground mt-2">
            {loading
              ? "Chargement..."
              : `${boissonsActives.length} boisson(s) active(s), ${boissonsNonActives.length} boisson(s) désactivée(s)`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={sync} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={() => navigate("/admin/settings/boissons/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle boisson
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
            Actifs ({boissonsActives.length})
          </TabsTrigger>
          <TabsTrigger value="non-actifs" className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Non actifs ({boissonsNonActives.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Actifs */}
        <TabsContent value="actifs" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : boissonsActives.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Aucune boisson active</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boissonsActives.map((boisson) => (
                <BoissonCard key={boisson.id} boisson={boisson} />
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
          ) : boissonsNonActives.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Aucune boisson désactivée</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

export default DesktopGererLesBoissons;