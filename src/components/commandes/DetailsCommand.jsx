import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCommande } from "@/context/CommandContext";
import CalculatriceDialog from "@/components/commandes/CalculatriceDialog";

const DetailsCommand = () => {
  const {
    actualCommand,
    resetCommande,
    supprimerProduit,
    modifierQuantiteProduit,
    setOpenSurPlaceDialog,
    setOpenALivrerDialog,
  } = useCommande();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);

  const total = actualCommand.reduce(
    (sum, item) => sum + item.quantite * item.prix,
    0
  );

  const openCalculatrice = (produit) => {
    setSelectedProduit(produit);
    setOpenDialog(true);
  };

  const handleConfirm = (newQuantite) => {
    if (selectedProduit && newQuantite > 0) {
      modifierQuantiteProduit(selectedProduit.id, newQuantite);
    }
    setOpenDialog(false);
  };

  return (
    <>
      {/* Boîte principale */}
      <div className="flex flex-col bg-white rounded-xl border shadow-sm p-2 mb-2 relative min-h-[250px]">
        <ScrollArea className="max-h-[180px] pr-2">
          <div className="flex items-center flex-wrap min-h-[32px] pb-16">
            <AnimatePresence>
              {actualCommand.length > 0 ? (
                actualCommand.map((item) => {
                  const isMenu = item.type === "menu";
                  const badgeStyle = isMenu
                    ? "bg-orange-100 text-orange-800"
                    : "bg-blue-100 text-blue-800";

                  return (
                    <motion.div
                      key={item.id || item.denomination}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}>
                      <div
                        className={`flex items-center gap-2 text-xs mr-2 mt-1 px-2 py-1 rounded-full shadow cursor-pointer ${badgeStyle}`}
                        onClick={() => openCalculatrice(item)}>
                        {item.quantite} x {item.denomination} (
                        {item.quantite * item.prix} FCFA)
                        <Trash2
                          className="w-3 h-3 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            supprimerProduit(item.id);
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-400">
                  Aucun produit sélectionné.
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Total + boutons */}
        <div className="absolute bottom-2 right-4 flex flex-col items-end">
          <div className="text-sm font-bold text-green-700">
            Total : {total} FCFA
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-2"
              onClick={resetCommande}>
              Annuler
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs px-2"
              disabled={total === 0}
              onClick={() => {
                setOpenSurPlaceDialog(true);
              }}>
              Sur place
            </Button>
            <Button
              size="sm"
              className="text-xs px-2"
              disabled={total === 0}
              onClick={() => {
                setOpenALivrerDialog(true);
              }}>
              À livrer
            </Button>
          </div>
        </div>
      </div>

      {/* Modale calculatrice */}
      <CalculatriceDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleConfirm}
        produit={selectedProduit}
      />
    </>
  );
};

export default DetailsCommand;
