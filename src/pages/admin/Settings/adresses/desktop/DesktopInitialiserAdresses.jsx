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
      label: "Total adresses",
      value: adresses.length,
      icon: MapPin,
      color: "text-green-600",
    },
  ];

  const isInitialized = adresses.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader
          className="pb-3"
          style={{ borderLeftWidth: 4, borderLeftColor: departement.color }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: departement.color }}
              >
                {departement.nom.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-lg">{departement.nom}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Capitale: {departement.capitale}
                </p>
              </div>
            </div>
            {isInitialized && (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">
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
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DesktopInitialiserAdresses = () => {
  const [initializing, setInitializing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState(null);

  const handleInitializeAll = async () => {
    try {
      setInitializing(true);
      toast.info("Initialisation des départements en cours...");

      const result = await initializeDepartements();

      setStats({
        created: result.created.length,
        existing: result.existing.length,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        toast.error(
          `Initialisation terminée avec ${result.errors.length} erreur(s)`
        );
      } else if (result.created.length > 0) {
        toast.success(
          `${result.created.length} département(s) initialisé(s) avec succès`
        );
      } else {
        toast.info("Tous les départements sont déjà initialisés");
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
      toast.info("Importation des adresses en cours...");

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
      const message = `Importation terminée: ${totalCreated} créées, ${totalSkipped} doublons ignorés, ${totalErrors} erreurs`;

      if (totalErrors > 0) {
        toast.error(message);
      } else if (totalCreated > 0) {
        toast.success(message);
      } else {
        toast.info("Toutes les adresses existent déjà");
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Initialiser les Adresses</h1>
          <p className="text-muted-foreground mt-1">
            Gérer les 12 départements du Bénin et leurs adresses
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleInitializeAll}
            disabled={initializing || importing}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            {initializing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Database className="w-5 h-5" />
            )}
            Initialiser Documents
          </Button>

          <Button
            onClick={handleImportAdresses}
            disabled={initializing || importing}
            size="lg"
            className="gap-2"
          >
            {importing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            Importer Adresses
          </Button>
        </div>
      </div>

      {/* Stats globales */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-3xl font-bold">{stats.created}</p>
                  <p className="text-sm text-muted-foreground">Créés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-3xl font-bold">{stats.existing}</p>
                  <p className="text-sm text-muted-foreground">Existants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-3xl font-bold">{stats.errors}</p>
                  <p className="text-sm text-muted-foreground">Erreurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Grille des départements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

export default DesktopInitialiserAdresses;
