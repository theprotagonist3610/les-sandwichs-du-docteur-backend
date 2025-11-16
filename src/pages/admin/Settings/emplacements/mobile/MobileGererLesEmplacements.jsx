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

const MobileGererLesEmplacements = () => {
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-destructive text-center">
          <p className="font-semibold">Erreur de chargement</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Emplacements</h1>
            <p className="text-sm text-muted-foreground">
              {emplacements.length} emplacement{emplacements.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={handleCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>
      </motion.div>

      {/* Liste des emplacements */}
      <div className="space-y-4">
        {emplacements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  Aucun emplacement trouvé
                </p>
                <Button onClick={handleCreateNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier emplacement
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          emplacements.map((emplacement, index) => {
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
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNavigateToEmplacement(emplacement.id)}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                          <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {emplacement.denomination}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {typeConfig.label}
                            {emplacement.type?.sous_type && ` • ${emplacement.type.sous_type}`}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Position */}
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {emplacement.position?.actuelle?.quartier || emplacement.position?.actuelle?.commune || "Position non définie"}
                      </span>
                    </div>

                    {/* Vendeur */}
                    {emplacement.vendeur_actuel && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {emplacement.vendeur_actuel.nom} {emplacement.vendeur_actuel.prenoms?.join(" ")}
                        </span>
                      </div>
                    )}

                    {/* Horaires */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className={isOpenToday ? "text-green-600" : "text-muted-foreground"}>
                        {isOpenToday ? "Ouvert aujourd'hui" : "Fermé aujourd'hui"}
                      </span>
                    </div>

                    {/* Stock */}
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {stockTotal > 0 ? `${stockTotal} article${stockTotal > 1 ? "s" : ""} en stock` : "Stock vide"}
                      </span>
                    </div>

                    {/* Thème */}
                    {emplacement.theme_central?.theme && (
                      <div className="flex items-center gap-2 text-sm pt-2 border-t">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {emplacement.theme_central.theme}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MobileGererLesEmplacements;
