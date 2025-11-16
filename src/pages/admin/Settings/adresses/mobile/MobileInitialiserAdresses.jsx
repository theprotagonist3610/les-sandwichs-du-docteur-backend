import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Building2,
  Map,
  MapPinned,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Database,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  initializeDepartements,
  DEPARTEMENTS_BENIN,
  useAdressesByDepartement,
  getAllAdresses,
  createAdresse,
} from "@/toolkits/admin/adresseToolkit";
import { toast } from "sonner";
import adressesData from "../liste";

// Métadonnées des départements du Bénin
const DEPARTEMENTS_DATA = {
  alibori: { nom: "Alibori", capitale: "Kandi", color: "#3b82f6" },
  atacora: { nom: "Atacora", capitale: "Natitingou", color: "#8b5cf6" },
  atlantique: { nom: "Atlantique", capitale: "Allada", color: "#ec4899" },
  borgou: { nom: "Borgou", capitale: "Parakou", color: "#f59e0b" },
  collines: { nom: "Collines", capitale: "Savalou", color: "#10b981" },
  couffo: { nom: "Couffo", capitale: "Aplahoué", color: "#14b8a6" },
  donga: { nom: "Donga", capitale: "Djougou", color: "#6366f1" },
  littoral: { nom: "Littoral", capitale: "Cotonou", color: "#ef4444" },
  mono: { nom: "Mono", capitale: "Lokossa", color: "#f97316" },
  oueme: { nom: "Ouémé", capitale: "Porto-Novo", color: "#84cc16" },
  plateau: { nom: "Plateau", capitale: "Pobè", color: "#06b6d4" },
  zou: { nom: "Zou", capitale: "Abomey", color: "#a855f7" },
  inconnu: { nom: "Inconnu", capitale: "N/A", color: "#64748b" },
};

const DepartementCard = ({ departementId }) => {
  const { adresses, loading, sync } = useAdressesByDepartement(
    DEPARTEMENTS_DATA[departementId]?.nom || departementId
  );
  const departement = DEPARTEMENTS_DATA[departementId];

  // Calculer les statistiques
  const communes = [...new Set(adresses.map((a) => a.commune))];
  const arrondissements = [
    ...new Set(adresses.map((a) => a.arrondissement).filter(Boolean)),
  ];
  const quartiers = [
    ...new Set(adresses.map((a) => a.quartier).filter(Boolean)),
  ];

  const stats = [
    {
      label: "Communes",
      value: communes.length,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      label: "Arrondissements",
      value: arrondissements.length,
      icon: Map,
      color: "text-purple-600",
    },
    {
      label: "Quartiers",
      value: quartiers.length,
      icon: MapPinned,
      color: "text-pink-600",
    },
    {
      label: "Total",
      value: adresses.length,
      icon: MapPin,
      color: "text-green-600",
    },
  ];

  const isInitialized = adresses.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader
          className="pb-3"
          style={{ borderLeftWidth: 4, borderLeftColor: departement.color }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: departement.color }}
              >
                {departement.nom.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-base">{departement.nom}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {departement.capitale}
                </p>
              </div>
            </div>
            {isInitialized && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <div>
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={sync}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Actualiser
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MobileInitialiserAdresses = () => {
  const [initializing, setInitializing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState(null);

  const handleInitializeAll = async () => {
    try {
      setInitializing(true);
      toast.info("Initialisation en cours...");

      const result = await initializeDepartements();

      setStats({
        created: result.created.length,
        existing: result.existing.length,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erreur(s)`);
      } else if (result.created.length > 0) {
        toast.success(`${result.created.length} département(s) initialisé(s)`);
      } else {
        toast.info("Départements déjà initialisés");
      }

      // Recharger les statistiques globales
      const allAdresses = await getAllAdresses();
      console.log(`📊 Total: ${allAdresses.length} adresses`);
    } catch (error) {
      console.error("Erreur initialisation:", error);
      toast.error(error.message || "Erreur lors de l'initialisation");
    } finally {
      setInitializing(false);
    }
  };

  const handleImportAdresses = async () => {
    try {
      setImporting(true);
      toast.info("Importation en cours...");

      let totalCreated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      // Pour chaque département dans les données
      for (const deptData of adressesData) {
        const departementNom = deptData.departement;
        const adresses = deptData.liste;

        console.log(
          `📥 Importation de ${adresses.length} adresses pour ${departementNom}`
        );

        // Pour chaque adresse dans le département
        for (const adresse of adresses) {
          try {
            await createAdresse({
              nom: "", // Pas de nom par défaut
              departement: adresse.departement,
              commune: adresse.commune,
              arrondissement: adresse.arrondissement,
              quartier: adresse.quartier,
              localisation: {
                longitude: 0,
                latitude: 0,
              },
            });
            totalCreated++;
          } catch (error) {
            if (error.message.includes("E_DUPLICATE_ADRESSE")) {
              totalSkipped++;
            } else {
              totalErrors++;
              console.error("Erreur création adresse:", error.message);
            }
          }
        }
      }

      // Afficher le résultat
      const message = `${totalCreated} créées, ${totalSkipped} doublons, ${totalErrors} erreurs`;

      if (totalErrors > 0) {
        toast.error(message);
      } else if (totalCreated > 0) {
        toast.success(message);
      } else {
        toast.info("Adresses déjà importées");
      }

      setStats({
        created: totalCreated,
        existing: totalSkipped,
        errors: totalErrors,
      });

      // Recharger les statistiques globales
      const allAdresses = await getAllAdresses();
      console.log(`📊 Total après import: ${allAdresses.length} adresses`);
    } catch (error) {
      console.error("Erreur importation:", error);
      toast.error(error.message || "Erreur lors de l'importation");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Initialiser les Adresses</h1>
        <p className="text-sm text-muted-foreground">
          Gérer les 12 départements du Bénin
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleInitializeAll}
            disabled={initializing || importing}
            variant="outline"
            className="gap-2"
          >
            {initializing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Database className="w-3 h-3" />
            )}
            Initialiser
          </Button>

          <Button
            onClick={handleImportAdresses}
            disabled={initializing || importing}
            className="gap-2"
          >
            {importing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            Importer
          </Button>
        </div>
      </div>

      {/* Stats globales */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2"
        >
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <p className="text-xl font-bold">{stats.created}</p>
                <p className="text-[10px] text-muted-foreground text-center">
                  Créés
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center gap-1">
                <Database className="w-6 h-6 text-blue-600" />
                <p className="text-xl font-bold">{stats.existing}</p>
                <p className="text-[10px] text-muted-foreground text-center">
                  Existants
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center gap-1">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <p className="text-xl font-bold">{stats.errors}</p>
                <p className="text-[10px] text-muted-foreground text-center">
                  Erreurs
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Liste des départements */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {DEPARTEMENTS_BENIN.map((departementId) => (
            <DepartementCard
              key={departementId}
              departementId={departementId}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileInitialiserAdresses;
