/**
 * KPIGrid - Grille responsive pour afficher les KPIs
 * Organise les KPICards en grille adaptative
 */

import KPICard from "./KPICard";

/**
 * Composant KPIGrid
 */
const KPIGrid = ({ kpis, onKPIClick = null }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* KPI Trésorerie */}
      <KPICard
        titre={kpis.tresorerie.titre}
        valeur={kpis.tresorerie.valeur}
        format={kpis.tresorerie.format}
        variation={kpis.tresorerie.variation}
        trend={kpis.tresorerie.trend}
        icon={kpis.tresorerie.icon}
        color={kpis.tresorerie.color}
        suffix="FCFA"
        onClick={() => onKPIClick?.("comptabilite")}
      />

      {/* KPI Commandes */}
      <KPICard
        titre={kpis.commandes.titre}
        valeur={kpis.commandes.valeur}
        format={kpis.commandes.format}
        variation={kpis.commandes.variation}
        trend={kpis.commandes.trend}
        icon={kpis.commandes.icon}
        color={kpis.commandes.color}
        onClick={() => onKPIClick?.("commandes")}
      />

      {/* KPI Livraisons */}
      <KPICard
        titre={kpis.livraisons.titre}
        valeur={kpis.livraisons.valeur}
        format={kpis.livraisons.format}
        variation={kpis.livraisons.variation}
        trend={kpis.livraisons.trend}
        icon={kpis.livraisons.icon}
        color={kpis.livraisons.color}
        onClick={() => onKPIClick?.("livraisons")}
      />

      {/* KPI Production */}
      <KPICard
        titre={kpis.production.titre}
        valeur={kpis.production.valeur}
        format={kpis.production.format}
        variation={kpis.production.variation}
        trend={kpis.production.trend}
        icon={kpis.production.icon}
        color={kpis.production.color}
        onClick={() => onKPIClick?.("production")}
      />

      {/* KPI Stock */}
      <KPICard
        titre={kpis.stock.titre}
        valeur={kpis.stock.valeur}
        format={kpis.stock.format}
        variation={kpis.stock.variation}
        trend={kpis.stock.trend}
        icon={kpis.stock.icon}
        color={kpis.stock.color}
        onClick={() => onKPIClick?.("stock")}
      />

      {/* KPI Présence */}
      <KPICard
        titre={kpis.presence.titre}
        valeur={kpis.presence.valeur}
        format={kpis.presence.format}
        fractionTotal={kpis.presence.fractionTotal}
        variation={kpis.presence.variation}
        trend={kpis.presence.trend}
        icon={kpis.presence.icon}
        color={kpis.presence.color}
        onClick={() => onKPIClick?.("users")}
      />
    </div>
  );
};

export default KPIGrid;
