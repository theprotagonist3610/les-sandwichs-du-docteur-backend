import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommande } from "@/context/CommandContext";
import { Wallet2, Smartphone, ArrowRightLeft, Tags } from "lucide-react";
import { useCurrentUser } from "../useCurrentUser";
function paiementMonitor(data) {
  const {
    montant_recu_especes = 0,
    montant_recu_momo = 0,
    reliquat_rendu = 0,
    total = 0,
    reduction = 0,
  } = data;

  const montant_recu = montant_recu_especes + montant_recu_momo;
  const reduction_percent = total > 0 ? reduction / total : 0;
  const dette = Math.max(0, total - montant_recu + reliquat_rendu - reduction);
  const reste_a_devoir = dette;

  return {
    ...data,
    montant_recu,
    reduction_percent,
    dette,
    reste_a_devoir,
  };
}

const PaiementSelector = ({ prixLivraison }) => {
  const { paiement, updatePaiement, actualCommand } = useCommande();
  const [mode, setMode] = useState("especes");
  const [total, setTotal] = useState(0);
  const user = useCurrentUser();
  useEffect(() => {
    let temp = actualCommand.reduce(
      (sum, item) => sum + item.quantite * item.prix,
      0
    );
    setTotal(prixLivraison?.prix ? prixLivraison?.prix + temp : temp);
  }, [actualCommand, prixLivraison]);

  const handleChange = (key, val) => {
    const value = Number(val);
    const current = { ...paiement.infos, [key]: value, total };
    const monitored = paiementMonitor(current);

    updatePaiement({
      infos: monitored,
      statut:
        monitored.dette === 0
          ? "paye"
          : monitored.montant_recu > 0
          ? "partiel"
          : "non paye",
    });
  };

  const renderInput = (key, label, icon) => (
    <div className="space-y-1">
      <label className="text-xs flex items-center gap-1">
        {icon} {label}
      </label>
      <Input
        type="number"
        min={0}
        value={paiement.infos[key] || ""}
        onChange={(e) => handleChange(key, e.target.value)}
        className="w-full text-sm"
      />
    </div>
  );

  return (
    <div className="border rounded-md p-2 bg-gray-50 text-sm">
      <Tabs value={mode} onValueChange={setMode} className="w-full">
        <div className="flex flex-wrap gap-2 justify-center text-xs">
          <TabsList className="flex gap-2 mb-8 flex-wrap">
            <TabsTrigger value="especes">Espèces</TabsTrigger>
            <TabsTrigger value="momo">MoMo</TabsTrigger>
            <TabsTrigger value="mixte">Esp. + MoMo</TabsTrigger>
            <TabsTrigger value="plus-tard">Plus tard</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="max-h-[320px] mt-2 space-y-3">
          <TabsContent value="especes" className="space-y-3">
            {user?.fonction === "superviseur" &&
              renderInput(
                "reduction",
                "Faire une reduction ?",
                <Tags className="w-4 h-4" />
              )}
            {renderInput(
              "montant_recu",
              "Montant reçu",
              <Wallet2 className="w-4 h-4" />
            )}
            {renderInput(
              "reliquat_rendu",
              "Reliquat rendu",
              <ArrowRightLeft className="w-4 h-4" />
            )}
            <div className="text-xs text-muted-foreground">
              Total à payer : {total} FCFA
            </div>
            <div className="text-xs text-muted-foreground">
              Reste à devoir : {paiement.infos.reste_a_devoir || 0} FCFA
            </div>
          </TabsContent>

          <TabsContent value="momo" className="space-y-3">
            {user?.fonction === "superviseur" &&
              renderInput(
                "reduction",
                "Faire une reduction ?",
                <Tags className="w-4 h-4" />
              )}
            {renderInput(
              "montant_recu",
              "Montant MoMo reçu",
              <Smartphone className="w-4 h-4" />
            )}
            <div className="text-xs text-muted-foreground">
              Total : {total} FCFA
            </div>
            <div className="text-xs text-muted-foreground">
              Reste : {paiement.infos.reste_a_devoir || 0} FCFA
            </div>
          </TabsContent>

          <TabsContent value="mixte" className="space-y-3">
            {user?.fonction === "superviseur" &&
              renderInput(
                "reduction",
                "Faire une reduction ?",
                <Tags className="w-4 h-4" />
              )}
            {renderInput(
              "montant_recu_especes",
              "Montant espèces",
              <Wallet2 className="w-4 h-4" />
            )}
            {renderInput(
              "montant_recu_momo",
              "Montant MoMo",
              <Smartphone className="w-4 h-4" />
            )}
            {renderInput(
              "reliquat_rendu",
              "Reliquat rendu",
              <ArrowRightLeft className="w-4 h-4" />
            )}
            <div className="text-xs text-muted-foreground">
              Total : {total} FCFA
            </div>
            <div className="text-xs text-muted-foreground">
              Reste : {paiement.infos.reste_a_devoir || 0} FCFA
            </div>
          </TabsContent>

          <TabsContent value="plus-tard" className="space-y-2">
            <div className="text-sm text-orange-700">
              Cette commande est enregistrée comme une{" "}
              <strong>vente à crédit</strong>.
            </div>
            <div className="text-xs">Total à payer : {total} FCFA</div>
            <div className="text-xs">Dette : {total} FCFA</div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default PaiementSelector;
