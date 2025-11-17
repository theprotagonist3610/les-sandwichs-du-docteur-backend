/**
 * VentesWidget - Widget détaillé des ventes et commandes
 * Affiche le top vendeurs et les produits les plus vendus
 */

import { ShoppingCart, TrendingUp, Award, Package } from "lucide-react";
import WidgetContainer from "./WidgetContainer";

/**
 * Composant VentesWidget
 */
const VentesWidget = ({ kpiData, commandesJour = [], onViewMore }) => {
  const { details } = kpiData;

  // Calculer le CA total réalisé
  const caRealise = commandesJour.reduce((sum, cmd) => sum + (cmd.montant || 0), 0);

  // Calculer le top vendeurs depuis les vraies commandes
  const topVendeurs = (() => {
    const vendeurStats = {};

    commandesJour.forEach((cmd) => {
      const vendeurNom = cmd.vendeur || "Vendeur inconnu";
      if (!vendeurStats[vendeurNom]) {
        vendeurStats[vendeurNom] = { nom: vendeurNom, ventes: 0, ca: 0 };
      }
      vendeurStats[vendeurNom].ventes += 1;
      vendeurStats[vendeurNom].ca += cmd.montant || 0;
    });

    return Object.values(vendeurStats)
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 3)
      .map((v, index) => ({ ...v, id: index + 1 }));
  })();

  // Calculer le top produits depuis les vraies commandes
  const topProduits = (() => {
    const produitStats = {};

    commandesJour.forEach((cmd) => {
      if (cmd.items && Array.isArray(cmd.items)) {
        cmd.items.forEach((item) => {
          const produitNom = item.nom || item.nomProduit || "Produit inconnu";
          if (!produitStats[produitNom]) {
            produitStats[produitNom] = { nom: produitNom, quantite: 0 };
          }
          produitStats[produitNom].quantite += item.quantite || 1;
        });
      }
    });

    return Object.values(produitStats)
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 3)
      .map((p, index) => ({ ...p, id: index + 1 }));
  })();

  // Stats depuis les vraies données
  const stats = {
    objectif: 800000, // TODO: Récupérer depuis configuration
    realise: caRealise,
    surPlace: details.surPlace || 0,
    aLivrer: details.aLivrer || 0,
    panierMoyen: details.panierMoyen || 0,
  };

  const progression = stats.objectif > 0 ? ((stats.realise / stats.objectif) * 100).toFixed(0) : 0;

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
            <span className="text-sm font-medium text-muted-foreground">Objectif du jour</span>
            <span className="text-sm font-bold text-card-foreground">{progression}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progression, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(stats.realise)}{" "}
              FCFA
            </span>
            <span className="text-xs text-muted-foreground">
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
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
            <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">Sur place</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.surPlace}</p>
          </div>
          <div className="bg-accent/20 rounded-lg p-3 text-center">
            <p className="text-xs text-accent-foreground font-medium mb-1">À livrer</p>
            <p className="text-lg font-bold text-accent-foreground">{stats.aLivrer}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-xs text-primary font-medium mb-1">Panier moy.</p>
            <p className="text-lg font-bold text-primary">
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
            <Award className="w-4 h-4 text-accent-foreground" />
            <h4 className="text-sm font-medium text-muted-foreground">Top Vendeurs</h4>
          </div>
          {topVendeurs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune vente aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topVendeurs.map((vendeur, index) => (
                <div
                  key={vendeur.id}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${
                        index === 0
                          ? "bg-accent/30 text-accent-foreground"
                          : index === 1
                            ? "bg-muted text-muted-foreground"
                            : "bg-accent/20 text-accent-foreground"
                      }
                    `}
                    >
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-card-foreground">{vendeur.nom}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-card-foreground">{vendeur.ventes}</p>
                    <p className="text-xs text-muted-foreground">
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
          )}
        </div>

        {/* Top Produits */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h4 className="text-sm font-medium text-muted-foreground">Top Produits</h4>
          </div>
          {topProduits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun produit vendu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topProduits.map((produit) => (
                <div
                  key={produit.id}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                >
                  <span className="text-sm text-muted-foreground">{produit.nom}</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{produit.quantite}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default VentesWidget;
