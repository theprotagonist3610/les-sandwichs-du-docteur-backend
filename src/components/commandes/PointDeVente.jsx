import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePointDeVente } from "@/components/commandeToolkit";
import { useCommande } from "@/context/CommandContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

const PointDeVente = () => {
  const { data: points, loading } = usePointDeVente();
  const { pointDeVente, setPointDeVente } = useCommande();

  const handleSelect = (pv) => {
    setPointDeVente(pv);
  };

  return (
    <>
      {/* Badge d’affichage si point sélectionné */}
      {pointDeVente && (
        <div className="flex justify-center mb-2">
          <div className="text-xs bg-orange-100 text-orange-700 rounded px-3 py-1 shadow-sm">
            Point de vente : {pointDeVente.denomination || pointDeVente.id}
          </div>
        </div>
      )}

      {/* Dialog bloquant si aucun point sélectionné */}
      <Dialog open={!pointDeVente}>
        <DialogContent className="max-w-sm">
          <h2 className="font-bold text-lg mb-2">
            Sélectionnez un point de vente
          </h2>
          {loading ? (
            <div className="text-sm text-gray-500">Chargement...</div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {pointDeVente
                    ? pointDeVente.nom
                    : "Choisir un point de vente"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Rechercher..." />
                  <CommandList>
                    <CommandEmpty>Aucun point trouvé</CommandEmpty>
                    {points.map((pv) => (
                      <CommandItem
                        key={pv.id}
                        onSelect={() => handleSelect(pv)}
                        className="cursor-pointer">
                        {pv.denomination || ""}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PointDeVente;
