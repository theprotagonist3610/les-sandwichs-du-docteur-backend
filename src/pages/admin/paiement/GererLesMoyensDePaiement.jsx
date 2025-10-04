import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  useMoyensPaiement,
  desactiverMoyenPaiement,
  reactiverMoyenPaiement,
  TYPES_PAIEMENT,
} from "@/toolkits/moyenPaiementToolkit";
import { toast } from "sonner";
import {
  Wallet,
  CreditCard,
  Smartphone,
  Building2,
  Power,
  PowerOff,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Archive,
  MoreVertical,
  Eye,
  Edit3,
  Hash,
  DollarSign,
} from "lucide-react";

// Composant Item Mobile
const MobileListItem = ({
  moyenPaiement,
  processingId,
  showActions,
  setShowActions,
  handleNavigate,
  handleToggleStatus,
  getIconForType,
  getColorForType,
}) => {
  const Icon = getIconForType(moyenPaiement.type);
  const isProcessing = processingId === moyenPaiement.id;
  const isShowingActions = showActions === moyenPaiement.id;

  const listItemVariants = {
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

  return (
    <motion.div
      layout
      variants={listItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-lg border border-border p-4 mb-3"
      onClick={() => handleNavigate(moyenPaiement.id)}>
      <div className="flex items-start gap-3">
        {/* Icône et statut */}
        <div
          className="p-2 rounded-lg"
          style={{
            backgroundColor: moyenPaiement.actif
              ? `${getColorForType(moyenPaiement.type)}20`
              : "#f3f4f6",
          }}>
          <Icon
            className="h-5 w-5"
            style={{
              color: moyenPaiement.actif
                ? getColorForType(moyenPaiement.type)
                : "#9ca3af",
            }}
          />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground truncate">
                {moyenPaiement.denomination}
              </h3>
              <p className="text-sm text-muted-foreground">
                {moyenPaiement.type === TYPES_PAIEMENT.ESPECES
                  ? "Espèces"
                  : moyenPaiement.type === TYPES_PAIEMENT.MOBILE
                  ? "Paiement Mobile"
                  : "Compte Bancaire"}
              </p>
            </div>

            {/* Menu actions */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(isShowingActions ? null : moyenPaiement.id);
              }}
              className="p-1.5 rounded-md hover:bg-muted">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Informations supplémentaires */}
          {moyenPaiement.type !== TYPES_PAIEMENT.ESPECES && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {moyenPaiement.type === TYPES_PAIEMENT.MOBILE ? (
                  <Smartphone className="h-3 w-3" />
                ) : (
                  <Building2 className="h-3 w-3" />
                )}
                {moyenPaiement.groupe}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Hash className="h-3 w-3" />
                {moyenPaiement.numero}
              </span>
            </div>
          )}

          {/* Badge de statut */}
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                moyenPaiement.actif
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
              {moyenPaiement.actif ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Actif
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Inactif
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Actions dropdown */}
      <AnimatePresence>
        {isShowingActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-border flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleToggleStatus(moyenPaiement, e)}
              disabled={isProcessing}
              className={`
                flex-1 px-3 py-2 rounded-md font-medium text-sm
                flex items-center justify-center gap-2
                ${
                  moyenPaiement.actif
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }
                disabled:opacity-50
              `}>
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : moyenPaiement.actif ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Réactiver
                </>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate(moyenPaiement.id)}
              className="flex-1 px-3 py-2 bg-accent/10 text-accent hover:bg-accent/20
                       rounded-md font-medium text-sm flex items-center justify-center gap-2">
              <Eye className="h-4 w-4" />
              Détails
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Composant Card Desktop
const DesktopCard = ({
  moyenPaiement,
  processingId,
  handleNavigate,
  handleToggleStatus,
  getIconForType,
  getColorForType,
}) => {
  const Icon = getIconForType(moyenPaiement.type);
  const isProcessing = processingId === moyenPaiement.id;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    hover: {
      y: -5,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98 },
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover="hover"
      whileTap="tap"
      className="relative bg-card rounded-lg border border-border p-5 cursor-pointer
                 hover:shadow-lg transition-shadow overflow-hidden group"
      onClick={() => handleNavigate(moyenPaiement.id)}>
      {/* Badge de statut */}
      <div className="absolute top-4 right-4">
        {moyenPaiement.actif ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <XCircle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* En-tête avec icône */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="p-2.5 rounded-lg"
          style={{
            backgroundColor: moyenPaiement.actif
              ? `${getColorForType(moyenPaiement.type)}20`
              : "#f3f4f6",
          }}>
          <Icon
            className="h-6 w-6"
            style={{
              color: moyenPaiement.actif
                ? getColorForType(moyenPaiement.type)
                : "#9ca3af",
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground truncate">
            {moyenPaiement.denomination}
          </h3>
          <p className="text-sm text-muted-foreground">
            {moyenPaiement.type === TYPES_PAIEMENT.ESPECES
              ? "Paiement en espèces"
              : moyenPaiement.type === TYPES_PAIEMENT.MOBILE
              ? "Paiement mobile"
              : "Compte bancaire"}
          </p>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="space-y-3">
        {moyenPaiement.type !== TYPES_PAIEMENT.ESPECES && (
          <>
            {/* Groupe/Opérateur */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {moyenPaiement.type === TYPES_PAIEMENT.MOBILE
                  ? "Opérateur"
                  : "Banque"}
              </span>
              <span className="font-medium text-sm">
                {moyenPaiement.groupe}
              </span>
            </div>

            {/* Numéro */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Numéro</span>
              <span className="font-mono text-sm font-medium">
                {moyenPaiement.numero}
              </span>
            </div>
          </>
        )}

        {/* Type */}
        <div className="pt-3 border-t border-border">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full font-medium"
            style={{
              backgroundColor: `${getColorForType(moyenPaiement.type)}20`,
              color: getColorForType(moyenPaiement.type),
            }}>
            <Icon className="h-3.5 w-3.5" />
            {moyenPaiement.type === TYPES_PAIEMENT.ESPECES
              ? "Espèces"
              : moyenPaiement.type === TYPES_PAIEMENT.MOBILE
              ? "Mobile"
              : "Bancaire"}
          </span>
        </div>
      </div>

      {/* Actions au survol */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-background/95 backdrop-blur-sm
                   flex items-center justify-center gap-3 opacity-0 
                   group-hover:opacity-100 transition-opacity">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate(moyenPaiement.id);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                   font-medium flex items-center gap-2">
          <Edit3 className="h-4 w-4" />
          Modifier
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => handleToggleStatus(moyenPaiement, e)}
          disabled={isProcessing}
          className={`
            px-4 py-2 rounded-md font-medium
            flex items-center gap-2 disabled:opacity-50
            ${
              moyenPaiement.actif
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground"
            }
          `}>
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : moyenPaiement.actif ? (
            <>
              <PowerOff className="h-4 w-4" />
              Désactiver
            </>
          ) : (
            <>
              <Power className="h-4 w-4" />
              Réactiver
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Vue Mobile
const MobileView = ({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  activeTab,
  setActiveTab,
  moyensActifs,
  moyensInactifs,
  filteredActifs,
  filteredInactifs,
  loading,
  error,
  processingId,
  showActions,
  setShowActions,
  handleNavigate,
  handleToggleStatus,
  getIconForType,
  getColorForType,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background">
      {/* En-tête fixe */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground mb-3">
            Gérer les moyens de paiement
          </h1>

          {/* Barre de recherche */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-card
                       focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Filtre par type */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType("all")}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                ${
                  selectedType === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}>
              Tous ({moyensActifs.length + moyensInactifs.length})
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType(TYPES_PAIEMENT.ESPECES)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                ${
                  selectedType === TYPES_PAIEMENT.ESPECES
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}>
              Espèces
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType(TYPES_PAIEMENT.MOBILE)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                ${
                  selectedType === TYPES_PAIEMENT.MOBILE
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}>
              Mobile
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType(TYPES_PAIEMENT.BANCAIRE)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                ${
                  selectedType === TYPES_PAIEMENT.BANCAIRE
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}>
              Bancaire
            </motion.button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex border-t border-border">
          <button
            onClick={() => setActiveTab("actifs")}
            className={`
              flex-1 py-3 text-sm font-medium relative
              ${
                activeTab === "actifs"
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            `}>
            Activés ({filteredActifs.length})
            {activeTab === "actifs" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("inactifs")}
            className={`
              flex-1 py-3 text-sm font-medium relative
              ${
                activeTab === "inactifs"
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            `}>
            Désactivés ({filteredInactifs.length})
            {activeTab === "inactifs" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>
      </div>

      {/* Liste des moyens de paiement */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <p className="text-muted-foreground">Erreur de chargement</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible">
              {activeTab === "actifs" ? (
                filteredActifs.length > 0 ? (
                  filteredActifs.map((mp) => (
                    <MobileListItem
                      key={mp.id}
                      moyenPaiement={mp}
                      processingId={processingId}
                      showActions={showActions}
                      setShowActions={setShowActions}
                      handleNavigate={handleNavigate}
                      handleToggleStatus={handleToggleStatus}
                      getIconForType={getIconForType}
                      getColorForType={getColorForType}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Aucun moyen de paiement actif trouvé
                    </p>
                  </motion.div>
                )
              ) : filteredInactifs.length > 0 ? (
                filteredInactifs.map((mp) => (
                  <MobileListItem
                    key={mp.id}
                    moyenPaiement={mp}
                    processingId={processingId}
                    showActions={showActions}
                    setShowActions={setShowActions}
                    handleNavigate={handleNavigate}
                    handleToggleStatus={handleToggleStatus}
                    getIconForType={getIconForType}
                    getColorForType={getColorForType}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12">
                  <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Aucun moyen de paiement désactivé
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Vue Desktop
const DesktopView = ({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  activeTab,
  setActiveTab,
  moyensActifs,
  moyensInactifs,
  filteredActifs,
  filteredInactifs,
  loading,
  error,
  processingId,
  handleNavigate,
  handleToggleStatus,
  getIconForType,
  getColorForType,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gestion des moyens de paiement
              </h1>
              <p className="text-muted-foreground mt-1">
                {moyensActifs.length + moyensInactifs.length} moyens au total
              </p>
            </div>

            {/* Statistiques rapides */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {moyensActifs.length}
                </p>
                <p className="text-sm text-muted-foreground">Activés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">
                  {moyensInactifs.length}
                </p>
                <p className="text-sm text-muted-foreground">Désactivés</p>
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par dénomination..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background
                         focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background
                       focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">Tous les types</option>
              <option value={TYPES_PAIEMENT.ESPECES}>Espèces</option>
              <option value={TYPES_PAIEMENT.MOBILE}>Paiement Mobile</option>
              <option value={TYPES_PAIEMENT.BANCAIRE}>Compte Bancaire</option>
            </select>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="actifs" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Activés ({filteredActifs.length})
            </TabsTrigger>
            <TabsTrigger value="inactifs" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Désactivés ({filteredInactifs.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-24">
                <RefreshCw className="h-12 w-12 text-primary animate-spin" />
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  Une erreur est survenue
                </p>
              </motion.div>
            ) : (
              <>
                <TabsContent value="actifs">
                  {filteredActifs.length > 0 ? (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredActifs.map((mp) => (
                        <DesktopCard
                          key={mp.id}
                          moyenPaiement={mp}
                          processingId={processingId}
                          handleNavigate={handleNavigate}
                          handleToggleStatus={handleToggleStatus}
                          getIconForType={getIconForType}
                          getColorForType={getColorForType}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-24">
                      <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Aucun moyen de paiement actif trouvé
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm || selectedType !== "all"
                          ? "Essayez de modifier vos filtres"
                          : "Commencez par ajouter des moyens de paiement"}
                      </p>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="inactifs">
                  {filteredInactifs.length > 0 ? (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredInactifs.map((mp) => (
                        <DesktopCard
                          key={mp.id}
                          moyenPaiement={mp}
                          processingId={processingId}
                          handleNavigate={handleNavigate}
                          handleToggleStatus={handleToggleStatus}
                          getIconForType={getIconForType}
                          getColorForType={getColorForType}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-24">
                      <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Aucun moyen de paiement désactivé
                      </h3>
                      <p className="text-muted-foreground">
                        Les moyens de paiement désactivés apparaîtront ici
                      </p>
                    </motion.div>
                  )}
                </TabsContent>
              </>
            )}
          </AnimatePresence>
        </Tabs>
      </div>
    </motion.div>
  );
};

// Composant principal
const GererLesMoyensDePaiement = () => {
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();
  const { moyensActifs, moyensInactifs, loading, error } = useMoyensPaiement();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [activeTab, setActiveTab] = useState("actifs");
  const [processingId, setProcessingId] = useState(null);
  const [showActions, setShowActions] = useState(null);

  // Filtrer les moyens de paiement
  const filterMoyens = (moyens) => {
    return moyens.filter((moyen) => {
      const matchesSearch = moyen.denomination
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || moyen.type === selectedType;
      return matchesSearch && matchesType;
    });
  };

  const filteredActifs = useMemo(
    () => filterMoyens(moyensActifs),
    [moyensActifs, searchTerm, selectedType]
  );

  const filteredInactifs = useMemo(
    () => filterMoyens(moyensInactifs),
    [moyensInactifs, searchTerm, selectedType]
  );

  // Gérer la désactivation/réactivation
  const handleToggleStatus = async (moyenPaiement, e) => {
    e.stopPropagation();
    setProcessingId(moyenPaiement.id);

    try {
      const action = moyenPaiement.actif
        ? desactiverMoyenPaiement
        : reactiverMoyenPaiement;
      const result = await action(moyenPaiement.id);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            {moyenPaiement.actif ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            <span>
              {moyenPaiement.denomination}{" "}
              {moyenPaiement.actif ? "désactivé" : "réactivé"} avec succès
            </span>
          </div>
        );
      } else {
        toast.error("Erreur lors de la modification du statut");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setProcessingId(null);
      setShowActions(null);
    }
  };

  // Navigation vers la page de détail
  const handleNavigate = (moyenPaiementId) => {
    navigate(`/admin/paiement/paiement/${moyenPaiementId}`);
  };

  // Obtenir l'icône selon le type
  const getIconForType = (type) => {
    switch (type) {
      case TYPES_PAIEMENT.ESPECES:
        return Wallet;
      case TYPES_PAIEMENT.MOBILE:
        return Smartphone;
      case TYPES_PAIEMENT.BANCAIRE:
        return Building2;
      default:
        return CreditCard;
    }
  };

  // Obtenir la couleur selon le type
  const getColorForType = (type) => {
    switch (type) {
      case TYPES_PAIEMENT.ESPECES:
        return "#22c55e";
      case TYPES_PAIEMENT.MOBILE:
        return "#3b82f6";
      case TYPES_PAIEMENT.BANCAIRE:
        return "#a855f7";
      default:
        return "#6b7280";
    }
  };

  // Props communes pour les composants
  const commonProps = {
    searchTerm,
    setSearchTerm,
    selectedType,
    setSelectedType,
    activeTab,
    setActiveTab,
    moyensActifs,
    moyensInactifs,
    filteredActifs,
    filteredInactifs,
    loading,
    error,
    processingId,
    showActions,
    setShowActions,
    handleNavigate,
    handleToggleStatus,
    getIconForType,
    getColorForType,
  };

  return isMobile ? (
    <MobileView {...commonProps} />
  ) : (
    <DesktopView {...commonProps} />
  );
};

export default GererLesMoyensDePaiement;
