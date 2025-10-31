import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store,
  MapPin,
  User,
  Clock,
  Package,
  Plus,
  Building2,
  TrendingUp,
  Navigation,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SmallLoader from "@/components/global/SmallLoader";
import { useEmplacements, EMPLACEMENT_TYPES } from "@/toolkits/admin/emplacementToolkit.jsx";

const EMPLACEMENT_TYPE_CONFIG = {
  [EMPLACEMENT_TYPES.ENTREPOT]: {
    label: "Entrepôt",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  [EMPLACEMENT_TYPES.POINT_DE_VENTE]: {
    label: "Point de vente",
    icon: Store,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  [EMPLACEMENT_TYPES.STAND]: {
    label: "Stand",
    icon: MapPin,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
};

const DesktopGererLesEmplacements = () => {
  const navigate = useNavigate();
  const { emplacements, loading, error } = useEmplacements();

  const handleNavigateToEmplacement = (id) => {
    navigate(`/admin/settings/emplacements/gerer/${id}`);
  };

  const handleCreateNew = () => {
    navigate("/admin/settings/emplacements/create");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SmallLoader text="Chargement des emplacements" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-destructive text-center">
          <p className="font-semibold text-lg">Erreur de chargement</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Emplacements</h1>
              <p className="text-muted-foreground mt-2">
                {emplacements.length} emplacement{emplacements.length > 1 ? "s" : ""} enregistré{emplacements.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="h-5 w-5 mr-2" />
              Nouvel emplacement
            </Button>
          </div>
        </motion.div>

        {/* Liste des emplacements en grid */}
        {emplacements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center"
          >
            <Card className="max-w-md w-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Store className="h-16 w-16 text-muted-foreground mb-6" />
                <p className="text-lg font-medium mb-2">Aucun emplacement</p>
                <p className="text-muted-foreground text-center mb-6">
                  Commencez par créer votre premier emplacement
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-5 w-5 mr-2" />
                  Créer un emplacement
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {emplacements.map((emplacement, index) => {
              const typeConfig = EMPLACEMENT_TYPE_CONFIG[emplacement.type?.famille] || EMPLACEMENT_TYPE_CONFIG[EMPLACEMENT_TYPES.POINT_DE_VENTE];
              const TypeIcon = typeConfig.icon;

              // Calcul du stock total
              const stockTotal = emplacement.stock_actuel
                ? Object.values(emplacement.stock_actuel).reduce(
                    (sum, stock) => sum + (stock.quantite || 0),
                    0
                  )
                : 0;

              // Vérifier si ouvert aujourd'hui
              const today = new Date().toLocaleDateString("fr-FR", { weekday: "short" }).toLowerCase();
              const jourMapping = {
                lun: "lun",
                mar: "mar",
                mer: "mer",
                jeu: "jeu",
                ven: "ven",
                sam: "sam",
                dim: "dim",
              };
              const todayKey = jourMapping[today] || "lun";
              const isOpenToday = emplacement.horaires?.[todayKey]?.ouvert || false;

              return (
                <motion.div
                  key={emplacement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full"
                    onClick={() => handleNavigateToEmplacement(emplacement.id)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${typeConfig.bgColor}`}>
                            <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">
                              {emplacement.denomination}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {typeConfig.label}
                              {emplacement.type?.sous_type && ` • ${emplacement.type.sous_type}`}
                            </CardDescription>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Position */}
                      <div className="flex items-center gap-3">
                        <Navigation className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Localisation</p>
                          <p className="text-sm text-muted-foreground">
                            {emplacement.position?.actuelle?.quartier || emplacement.position?.actuelle?.commune || "Position non définie"}
                          </p>
                        </div>
                      </div>

                      {/* Vendeur */}
                      {emplacement.vendeur_actuel ? (
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Vendeur</p>
                            <p className="text-sm text-muted-foreground">
                              {emplacement.vendeur_actuel.nom} {emplacement.vendeur_actuel.prenoms?.join(" ")}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Vendeur</p>
                            <p className="text-sm text-muted-foreground">Non assigné</p>
                          </div>
                        </div>
                      )}

                      {/* Horaires */}
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Statut</p>
                          <p className={`text-sm ${isOpenToday ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
                            {isOpenToday ? "Ouvert aujourd'hui" : "Fermé aujourd'hui"}
                          </p>
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Stock</p>
                          <p className="text-sm text-muted-foreground">
                            {stockTotal > 0 ? `${stockTotal} article${stockTotal > 1 ? "s" : ""}` : "Vide"}
                          </p>
                        </div>
                      </div>

                      {/* Thème */}
                      {emplacement.theme_central?.theme && (
                        <div className="flex items-center gap-3 pt-3 border-t">
                          <TrendingUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Thème</p>
                            <p className="text-sm text-muted-foreground">
                              {emplacement.theme_central.theme}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopGererLesEmplacements;
