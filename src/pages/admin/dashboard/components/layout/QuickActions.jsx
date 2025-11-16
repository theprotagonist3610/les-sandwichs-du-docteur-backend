/**
 * QuickActions - Barre d'actions rapides
 * Boutons pour les actions courantes du dashboard
 */

import { Plus, ShoppingCart, DollarSign, ChefHat, Truck, Package, BarChart3 } from "lucide-react";

/**
 * Composant QuickActions
 */
const QuickActions = ({ onAction = null }) => {
  const actions = [
    {
      id: "vente",
      label: "Nouvelle Vente",
      icon: ShoppingCart,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      id: "operation",
      label: "Opération Compta",
      icon: DollarSign,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      id: "production",
      label: "Production",
      icon: ChefHat,
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      id: "livraison",
      label: "Livraison",
      icon: Truck,
      color: "bg-orange-600 hover:bg-orange-700",
    },
    {
      id: "stock",
      label: "Mouvement Stock",
      icon: Package,
      color: "bg-yellow-600 hover:bg-yellow-700",
    },
    {
      id: "statistiques",
      label: "Statistiques",
      icon: BarChart3,
      color: "bg-indigo-600 hover:bg-indigo-700",
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Actions Rapides</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction?.(action.id)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg
                text-white transition-all duration-200
                ${action.color}
              `}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
