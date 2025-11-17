/**
 * QuickActions - Barre d'actions rapides
 * Boutons pour les actions courantes du dashboard
 */

import { useNavigate } from "react-router-dom";
import { Plus, ShoppingCart, DollarSign, ChefHat, Truck, Package, BarChart3 } from "lucide-react";

/**
 * Composant QuickActions
 */
const QuickActions = ({ onAction = null }) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: "vente",
      label: "Nouvelle Vente",
      icon: ShoppingCart,
      color: "bg-primary hover:bg-primary/90",
      route: "/admin/commandes/panneau_de_ventes",
    },
    {
      id: "operation",
      label: "Opération Compta",
      icon: DollarSign,
      color: "bg-secondary hover:bg-secondary/90",
      route: "/admin/comptabilite",
    },
    {
      id: "production",
      label: "Production",
      icon: ChefHat,
      color: "bg-accent hover:bg-accent/90",
      route: "/admin/production",
    },
    {
      id: "livraison",
      label: "Livraison",
      icon: Truck,
      color: "bg-muted hover:bg-muted/90",
      route: "/admin/livraisons/livraisons",
    },
    {
      id: "stock",
      label: "Mouvement Stock",
      icon: Package,
      color: "bg-primary/80 hover:bg-primary/70",
      route: "/admin/stock/operations/create",
    },
    {
      id: "statistiques",
      label: "Statistiques",
      icon: BarChart3,
      color: "bg-secondary/80 hover:bg-secondary/70",
      route: "/admin/statistiques",
    },
  ];

  const handleClick = (action) => {
    // Appeler le callback si fourni
    onAction?.(action.id);

    // Naviguer vers la route
    if (action.route) {
      navigate(action.route);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Actions Rapides</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleClick(action)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg
                text-foreground transition-all duration-200
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
