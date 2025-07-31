import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sandwich, CupSoda } from "lucide-react";
import { useCommande } from "@/context/CommandContext";

// Icônes dynamiques si besoin
const iconMap = {
  sandwich: Sandwich,
  soda: CupSoda,
};

const CommandTabs = ({ onProduitClick }) => {
  const [tab, setTab] = useState("menu");

  const {
    menus,
    boissons,
    todayCommand,
    actualCommand,
    loadingMenus,
    loadingBoissons,
    loadingTodayCommand,
  } = useCommande();

  // Dictionnaire { id: quantite } pour affichage du badge
  const commandeMap = actualCommand.reduce((acc, item) => {
    acc[item.id] = item.quantite;
    return acc;
  }, {});

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid grid-cols-3 w-full mb-2">
        <TabsTrigger
          value="menu"
          className="text-xs flex items-center gap-1 justify-center">
          <Sandwich className="w-4 h-4" />
          Menus
        </TabsTrigger>
        <TabsTrigger
          value="boisson"
          className="text-xs flex items-center gap-1 justify-center">
          <CupSoda className="w-4 h-4" />
          Boissons
        </TabsTrigger>
        <TabsTrigger
          value="commandes"
          className="text-xs flex items-center gap-1 justify-center">
          <Loader2 className="w-4 h-4" />
          Commandes
        </TabsTrigger>
      </TabsList>

      {/* Onglet Menus */}
      <TabsContent value="menu">
        {loadingMenus ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {menus.map((prod) => {
              const Icon = iconMap[prod.icone] || Sandwich;
              return (
                <div
                  key={prod.id}
                  className="bg-gray-100 rounded-lg p-2 flex flex-col items-center cursor-pointer hover:shadow-md transition relative"
                  onClick={() => onProduitClick && onProduitClick(prod)}>
                  <Icon className="w-6 h-6 text-orange-500 mb-1" />
                  <div className="font-semibold text-sm text-center mb-1">
                    {prod.denomination}
                  </div>
                  <div className="font-bold text-xs mb-1">{prod.prix} FCFA</div>

                  {/* ✅ Badge de quantité */}
                  {commandeMap[prod.id] > 0 && (
                    <Badge className="absolute top-1 right-1 text-[10px] bg-green-500 text-white rounded-full px-2 py-0.5">
                      x{commandeMap[prod.id]}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* Onglet Boissons */}
      <TabsContent value="boisson">
        {loadingBoissons ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {boissons.map((prod) => {
              const Icon = iconMap[prod.icone] || CupSoda;
              return (
                <div
                  key={prod.id}
                  className="bg-gray-100 rounded-lg p-2 flex flex-col items-center cursor-pointer hover:shadow-md transition relative"
                  onClick={() => onProduitClick && onProduitClick(prod)}>
                  <Icon className="w-6 h-6 text-blue-500 mb-1" />
                  <div className="font-semibold text-sm text-center mb-1">
                    {prod.denomination}
                  </div>
                  <div className="font-bold text-xs mb-1">{prod.prix} FCFA</div>

                  {/* ✅ Badge de quantité */}
                  {commandeMap[prod.id] > 0 && (
                    <Badge className="absolute top-1 right-1 text-[10px] bg-green-500 text-white rounded-full px-2 py-0.5">
                      x{commandeMap[prod.id]}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* Onglet Commandes du jour */}
      <TabsContent value="commandes">
        {loadingTodayCommand ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
          </div>
        ) : todayCommand.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            Aucune commande aujourd'hui.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayCommand.map((cmd) => (
              <div
                key={cmd.code_commande || cmd.id}
                className="bg-orange-50 rounded-lg px-3 py-2 shadow">
                <div className="font-semibold text-orange-900 text-sm">
                  Client : {cmd.prenom_client || <i>Inconnu</i>}
                </div>
                <div className="text-xs text-gray-600">
                  Payé : {cmd.cout_total} FCFA ({cmd.paiement?.type})
                  {cmd.paiement?.reste_a_devoir > 0 && (
                    <span className="text-red-600 ml-1">
                      • Reste : {cmd.paiement.reste_a_devoir} FCFA
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {cmd.produits?.map((p, i) => (
                    <Badge
                      key={i}
                      className="bg-orange-100 text-orange-900 text-xs">
                      {p.quantite}x {p.nom}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-gray-400 text-right mt-1">
                  {cmd.createdAt?.toDate
                    ? cmd.createdAt.toDate().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default CommandTabs;
