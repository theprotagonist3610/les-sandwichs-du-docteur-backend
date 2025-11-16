/**
 * VentesWidget - Widget détaillé des ventes et commandes
 * Affiche le top vendeurs et les produits les plus vendus
 */

import { ShoppingCart, TrendingUp, Award, Package } from "lucide-react";
import WidgetContainer from "./WidgetContainer";

/**
 * Composant VentesWidget
 */
const VentesWidget = ({ kpiData, onViewMore }) => {
  const { details } = kpiData;

  // Données simulées - TODO: Récupérer depuis commandeToolkit
  const topVendeurs = [
    { id: 1, nom: "Jean Dosseh", ventes: 18, ca: 270000 },
    { id: 2, nom: "Marie Koffi", ventes: 14, ca: 210000 },
    { id: 3, nom: "Paul Agbodjan", ventes: 13, ca: 195000 },
  ];

  const topProduits = [
    { id: 1, nom: "Sandwich Poulet Mayo", quantite: 23 },
    { id: 2, nom: "Menu Complet", quantite: 18 },
    { id: 3, nom: "Coca-Cola 33cl", quantite: 31 },
  ];

  const stats = {
    objectif: 800000,
    realise: 675000,
    surPlace: 32,
    aLivrer: 13,
    panierMoyen: 15000,
  };

  const progression = ((stats.realise / stats.objectif) * 100).toFixed(0);

  return (
    <WidgetContainer
      titre="Ventes & Commandes"
      icon={ShoppingCart}
      color="green"
      onViewMore={onViewMore}
      viewMoreLabel="Toutes les ventes"
    >
      <div className="space-y-6">
        {/* Objectif du jour */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Objectif du jour</span>
            <span className="text-sm font-bold text-gray-900">{progression}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progression, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(stats.realise)}{" "}
              FCFA
            </span>
            <span className="text-xs text-gray-500">
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(stats.objectif)}{" "}
              FCFA
            </span>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-700 font-medium mb-1">Sur place</p>
            <p className="text-lg font-bold text-green-600">{stats.surPlace}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-xs text-orange-700 font-medium mb-1">À livrer</p>
            <p className="text-lg font-bold text-orange-600">{stats.aLivrer}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-700 font-medium mb-1">Panier moy.</p>
            <p className="text-lg font-bold text-blue-600">
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(stats.panierMoyen)}
            </p>
          </div>
        </div>

        {/* Top Vendeurs */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-yellow-600" />
            <h4 className="text-sm font-medium text-gray-700">Top Vendeurs</h4>
          </div>
          <div className="space-y-2">
            {topVendeurs.map((vendeur, index) => (
              <div
                key={vendeur.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : index === 1
                          ? "bg-gray-200 text-gray-700"
                          : "bg-orange-100 text-orange-700"
                    }
                  `}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{vendeur.nom}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{vendeur.ventes}</p>
                  <p className="text-xs text-gray-500">
                    {new Intl.NumberFormat("fr-FR", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(vendeur.ca)}{" "}
                    F
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Produits */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-medium text-gray-700">Top Produits</h4>
          </div>
          <div className="space-y-2">
            {topProduits.map((produit) => (
              <div
                key={produit.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700">{produit.nom}</span>
                <span className="text-sm font-bold text-green-600">{produit.quantite}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default VentesWidget;
