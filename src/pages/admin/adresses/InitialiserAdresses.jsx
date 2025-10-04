import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  CheckCircle2,
  MapPin,
  Globe,
  Building2,
  Hash,
} from "lucide-react";
import Loader from "@/components/loaders/Loader";
import useBreakpoint from "@/hooks/useBreakpoint";
import { toast } from "sonner";

// Import du toolkit
import {
  initialiserDepartement,
  getAdressesStats,
} from "@/toolkits/adressesToolkit";

// Import des adresses depuis liste.js
import adresses from "./liste.js";

const InitialiserAdresses = () => {
  const { isMobile, isDesktop } = useBreakpoint(1024);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [initializedDepartements, setInitializedDepartements] = useState({});
  const [totalData, setTotalData] = useState(null);

  // Charger les données existantes au montage
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        const statsResult = await getAdressesStats();

        if (statsResult.success && statsResult.data) {
          const data = statsResult.data;
          setTotalData(data.totaux || []);

          const initialized = {};
          data.totaux?.forEach((item) => {
            if (item.total > 0) {
              initialized[item.departement] = true;
            }
          });
          setInitializedDepartements(initialized);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification:", error);
      }
    };

    checkInitialization();
  }, []);

  // Fonction pour calculer les statistiques d'un département
  const getStats = (liste) => {
    const communes = new Set();
    const arrondissements = new Set();

    liste.forEach((addr) => {
      if (addr.commune) communes.add(addr.commune);
      if (addr.arrondissement) arrondissements.add(addr.arrondissement);
    });

    return {
      communes: communes.size,
      arrondissements: arrondissements.size,
    };
  };

  // Fonction pour initialiser un département
  const handleInitialiserDepartement = async (departementData) => {
    const { departement, liste } = departementData;
    setLoading(true);
    setLoadingText(`Initialisation de ${departement}...`);

    try {
      const result = await initialiserDepartement(departement, liste);

      if (result.success) {
        setInitializedDepartements((prev) => ({
          ...prev,
          [departement]: true,
        }));

        // Rafraîchir les stats
        const statsResult = await getAdressesStats();
        if (statsResult.success) {
          setTotalData(statsResult.data.totaux || []);
        }
      } else if (result.alreadyExists) {
        toast.info(result.error);
        setInitializedDepartements((prev) => ({
          ...prev,
          [departement]: true,
        }));
      }
    } catch (error) {
      console.error(
        `Erreur lors de l'initialisation de ${departement}:`,
        error
      );
      toast.error(`Erreur pour ${departement}`);
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  // Fonction pour initialiser tous les départements
  const initialiserTout = async () => {
    setLoading(true);
    setLoadingText("Initialisation de tous les départements...");

    try {
      let totalCrees = 0;
      const departementsTraites = [];

      for (const departementData of adresses) {
        const { departement, liste } = departementData;
        setLoadingText(`Création des adresses pour ${departement}...`);

        const result = await initialiserDepartement(departement, liste);

        if (result.success) {
          totalCrees += result.count;
          departementsTraites.push({
            departement,
            count: result.count,
            status: "nouveau",
          });
        } else if (result.alreadyExists) {
          departementsTraites.push({
            departement,
            status: "existant",
          });
        }
      }

      // Rafraîchir les stats
      const statsResult = await getAdressesStats();
      if (statsResult.success) {
        setTotalData(statsResult.data.totaux || []);
      }

      const nouveaux = departementsTraites.filter(
        (d) => d.status === "nouveau"
      );

      if (nouveaux.length > 0) {
        toast.success(`${totalCrees} nouvelles adresses créées`, {
          description: nouveaux
            .map((d) => `${d.departement}: ${d.count}`)
            .join(", "),
          duration: 5000,
        });
      } else {
        toast.info("Tous les départements sont déjà initialisés");
      }

      const newInitialized = {};
      departementsTraites.forEach((d) => {
        newInitialized[d.departement] = true;
      });
      setInitializedDepartements(newInitialized);
    } catch (error) {
      console.error("Erreur lors de l'initialisation globale:", error);
      toast.error("Erreur lors de l'initialisation");
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  // Composant carte département
  const DepartementCard = ({ departementData, isInitialized }) => {
    const { departement, liste } = departementData;
    const stats = getStats(liste);
    const deptTotal =
      totalData?.find((t) => t.departement === departement)?.total || 0;

    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={!isInitialized ? "hover" : undefined}
        whileTap={!isInitialized ? "tap" : undefined}>
        <Card
          className={`cursor-pointer transition-colors ${
            isInitialized
              ? "border-green-200 bg-green-50/50 cursor-default"
              : "hover:border-primary"
          }`}
          onClick={() =>
            !isInitialized && handleInitialiserDepartement(departementData)
          }>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: isInitialized ? 0 : [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}>
                  <MapPin className="h-5 w-5 text-primary" />
                </motion.div>
                <CardTitle className="capitalize">{departement}</CardTitle>
              </div>
              <AnimatePresence>
                {isInitialized && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <CardDescription>{liste.length} adresse(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <motion.div
              className="flex items-center justify-between text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}>
              <span className="flex items-center space-x-1 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Communes</span>
              </span>
              <Badge variant="secondary">{stats.communes}</Badge>
            </motion.div>
            <motion.div
              className="flex items-center justify-between text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}>
              <span className="flex items-center space-x-1 text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>Arrondissements</span>
              </span>
              <Badge variant="secondary">{stats.arrondissements}</Badge>
            </motion.div>

            <AnimatePresence mode="wait">
              {isInitialized ? (
                <motion.div
                  key="initialized"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 text-green-600 bg-green-100 p-2 rounded-lg mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {deptTotal} créée(s)
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="not-initialized"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}>
                  <Badge
                    variant="outline"
                    className="w-full justify-center mt-2">
                    Cliquer pour initialiser
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Filtrer les départements
  const departementsInitialises = adresses.filter(
    (d) => initializedDepartements[d.departement]
  );
  const departementsNonInitialises = adresses.filter(
    (d) => !initializedDepartements[d.departement]
  );

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      scale: 1.03,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.97,
    },
  };

  const loaderVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Version Mobile
  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loader"
              variants={loaderVariants}
              initial="hidden"
              animate="visible"
              exit="exit">
              <Loader
                isVisible={loading}
                text={loadingText || "Chargement..."}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 space-y-6">
          {/* Header */}
          <motion.div
            className="text-center space-y-2"
            variants={headerVariants}
            initial="hidden"
            animate="visible">
            <h1 className="text-2xl font-bold flex items-center justify-center space-x-2">
              <Database className="h-6 w-6" />
              <span>Initialiser adresses</span>
            </h1>
            <AnimatePresence mode="wait">
              {totalData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}>
                  <Badge variant="outline" className="text-sm">
                    {totalData.reduce((sum, item) => sum + item.total, 0)}{" "}
                    adresses totales
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Carte initialiser tout si départements non initialisés */}
          <AnimatePresence>
            {departementsNonInitialises.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 100 }}>
                <Card className="border-2 border-primary bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5" />
                      <span>Tout initialiser</span>
                    </CardTitle>
                    <CardDescription>
                      {departementsNonInitialises.length} département(s) à
                      initialiser
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={initialiserTout}
                      disabled={loading}
                      className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Initialiser tout
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Liste des départements */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4">
            <AnimatePresence mode="popLayout">
              {adresses.map((departementData) => (
                <DepartementCard
                  key={departementData.departement}
                  departementData={departementData}
                  isInitialized={
                    initializedDepartements[departementData.departement]
                  }
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </>
    );
  }

  // Version Desktop
  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            variants={loaderVariants}
            initial="hidden"
            animate="visible"
            exit="exit">
            <Loader isVisible={loading} text={loadingText || "Chargement..."} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto py-8 px-6 space-y-6">
        {/* Header */}
        <motion.div
          className="text-center space-y-2"
          variants={headerVariants}
          initial="hidden"
          animate="visible">
          <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
            <Database className="h-8 w-8" />
            <span>Initialisation des adresses</span>
          </h1>
          <p className="text-muted-foreground">
            Gérer la base de données des adresses par département
          </p>
          <AnimatePresence mode="wait">
            {totalData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {totalData.reduce((sum, item) => sum + item.total, 0)}{" "}
                  adresses totales
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Onglets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <Tabs defaultValue="non-initialise" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger
                value="non-initialise"
                className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>
                  Non initialisé ({departementsNonInitialises.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="initialise"
                className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Initialisé ({departementsInitialises.length})</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="non-initialise" className="mt-6">
                <motion.div
                  key="non-initialise"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6">
                  {/* Carte initialiser tout */}
                  <AnimatePresence>
                    {departementsNonInitialises.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 100 }}>
                        <Card className="border-2 border-primary bg-primary/5">
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Globe className="h-6 w-6" />
                              <span>Initialiser tous les départements</span>
                            </CardTitle>
                            <CardDescription>
                              Créer les adresses pour{" "}
                              {departementsNonInitialises.length} département(s)
                              en une seule fois
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button
                              onClick={initialiserTout}
                              disabled={loading}
                              size="lg"
                              className="w-full">
                              <Database className="h-5 w-5 mr-2" />
                              Tout initialiser
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {departementsNonInitialises.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Tous les départements sont initialisés
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {departementsNonInitialises.map((departementData) => (
                          <DepartementCard
                            key={departementData.departement}
                            departementData={departementData}
                            isInitialized={false}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="initialise" className="mt-6">
                <motion.div
                  key="initialise"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit">
                  {departementsInitialises.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Aucun département initialisé pour le moment
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {departementsInitialises.map((departementData) => (
                          <DepartementCard
                            key={departementData.departement}
                            departementData={departementData}
                            isInitialized={true}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </>
  );
};

export default InitialiserAdresses;
