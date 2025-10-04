import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Map } from "lucide-react";

// Hooks
import useBreakpoint from "@/hooks/useBreakpoint";

// Components
import FormulaireSituer from "@/pages/admin/adresses/FormulaireSituer";
import FormulaireCreer from "@/pages/admin/adresses/FormulaireCreer";

// Components UI
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AjouterAdresse = () => {
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useBreakpoint(1024);
  const [activeMode, setActiveMode] = useState("situer");

  // Animations
  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 },
    },
  };

  // Version Mobile
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Ajouter une adresse</h1>
          <div className="w-10" />
        </div>

        {/* Sélecteur de mode */}
        <div className="p-4 bg-card border-b">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeMode === "situer" ? "default" : "outline"}
              onClick={() => setActiveMode("situer")}
              className="flex items-center justify-center">
              <MapPin className="h-4 w-4 mr-2" />
              Situer
            </Button>
            <Button
              variant={activeMode === "creer" ? "default" : "outline"}
              onClick={() => setActiveMode("creer")}
              className="flex items-center justify-center">
              <Plus className="h-4 w-4 mr-2" />
              Créer
            </Button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {activeMode === "situer" ? (
              <motion.div
                key="situer"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit">
                <Card>
                  <CardHeader>
                    <CardTitle>Situer une adresse</CardTitle>
                    <CardDescription>
                      Ajouter une localisation à une adresse existante
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormulaireSituer />
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="creer"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit">
                <Card>
                  <CardHeader>
                    <CardTitle>Créer un nouveau quartier</CardTitle>
                    <CardDescription>
                      Ajouter manuellement une nouvelle adresse
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormulaireCreer />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // Version Desktop
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-8 px-6">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ajouter une adresse</h1>
            <p className="text-muted-foreground mt-2">
              Situer une adresse existante ou créer un nouveau quartier
            </p>
          </div>
          <Map className="h-12 w-12 text-primary" />
        </div>
      </motion.div>

      {/* Onglets Desktop */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}>
        <Tabs defaultValue="situer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="situer" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Situer une adresse</span>
            </TabsTrigger>
            <TabsTrigger value="creer" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Créer un nouveau quartier</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="situer" className="mt-6">
              <motion.div
                key="situer"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit">
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Situer une adresse
                    </CardTitle>
                    <CardDescription>
                      Ajouter une localisation avec coordonnées GPS à une
                      adresse existante
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormulaireSituer />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="creer" className="mt-6">
              <motion.div
                key="creer"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit">
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Plus className="h-5 w-5 mr-2" />
                      Créer un nouveau quartier
                    </CardTitle>
                    <CardDescription>
                      Ajouter manuellement une nouvelle adresse à la base de
                      données
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormulaireCreer />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default AjouterAdresse;
