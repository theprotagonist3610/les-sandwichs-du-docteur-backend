import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Search,
} from "lucide-react";
import { dropdownVariants } from "@/lib/animations";
import { useComptaStore } from "@/stores/comptaStore";
import comptes from "@/toolkits/comptabilite/liste";

/**
 * 🔍 Toolbar de filtrage des transactions
 *
 * @param {Object} props
 * @param {Function} props.onFilterChange - Callback quand les filtres changent
 * @param {Function} props.onReset - Callback pour reset les filtres
 * @param {boolean} props.compact - Mode compact (moins de space)
 * @param {string} props.className - Classes CSS additionnelles
 */
export const FilterToolbar = ({
  onFilterChange,
  onReset,
  compact = false,
  className = "",
}) => {
  const { filters, setFilters, resetFilters } = useComptaStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Compteur de filtres actifs
  const activeFiltersCount = Object.values(filters).filter((value) => {
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some((v) => v !== null && v !== "all");
    }
    return value !== "all" && value !== null;
  }).length;

  // Liste de tous les comptes pour le select
  const allComptes = comptes.flatMap((groupe) =>
    groupe.liste.map((compte) => ({
      code: compte.code_lsd,
      denomination: compte.denomination,
      groupe: groupe.groupe,
    }))
  );

  // Filtrer les comptes par recherche
  const filteredComptes = allComptes.filter(
    (compte) =>
      compte.denomination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      compte.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gestion des changements de filtres
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleReset = () => {
    resetFilters();
    setSearchTerm("");

    if (onReset) {
      onReset();
    }
  };

  return (
    <div className={`${className}`}>
      {/* Bouton toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <X className="w-4 h-4" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Panel de filtres */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Plage de dates */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                Période
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.start || ""}
                    onChange={(e) =>
                      handleFilterChange("dateRange", {
                        ...filters.dateRange,
                        start: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.end || ""}
                    onChange={(e) =>
                      handleFilterChange("dateRange", {
                        ...filters.dateRange,
                        end: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Type de transaction */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <TrendingUp className="w-4 h-4" />
                Type de transaction
              </label>
              <div className="flex gap-2">
                {[
                  { value: "all", label: "Tous", icon: null },
                  { value: "entree", label: "Entrées", icon: TrendingUp },
                  { value: "sortie", label: "Sorties", icon: TrendingDown },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange("type", option.value)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors
                      ${
                        filters.type === option.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                    `}>
                    {option.icon && <option.icon className="w-4 h-4" />}
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CreditCard className="w-4 h-4" />
                Mode de paiement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: "all", label: "Tous", icon: "💰" },
                  { value: "caisse", label: "Caisse", icon: "💵" },
                  { value: "mobile_money", label: "Mobile", icon: "📱" },
                  { value: "banque", label: "Banque", icon: "🏦" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleFilterChange("paymentMode", option.value)
                    }
                    className={`
                      flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors
                      ${
                        filters.paymentMode === option.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                    `}>
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Montant */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <DollarSign className="w-4 h-4" />
                Plage de montant (FCFA)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Montant min
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={filters.amountRange.min || ""}
                    onChange={(e) =>
                      handleFilterChange("amountRange", {
                        ...filters.amountRange,
                        min: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Montant max
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="∞"
                    value={filters.amountRange.max || ""}
                    onChange={(e) =>
                      handleFilterChange("amountRange", {
                        ...filters.amountRange,
                        max: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Compte */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Search className="w-4 h-4" />
                Compte
              </label>

              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un compte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Liste des comptes */}
              <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => handleFilterChange("account", "all")}
                  className={`
                    w-full text-left px-4 py-2 border-b border-gray-200 dark:border-gray-700 transition-colors
                    ${
                      filters.account === "all"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }
                  `}>
                  <div className="font-medium">Tous les comptes</div>
                </button>

                {filteredComptes.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Aucun compte trouvé
                  </div>
                ) : (
                  filteredComptes.map((compte) => (
                    <button
                      key={compte.code}
                      onClick={() => handleFilterChange("account", compte.code)}
                      className={`
                        w-full text-left px-4 py-2 border-b border-gray-200 dark:border-gray-700 transition-colors
                        ${
                          filters.account === compte.code
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }
                      `}>
                      <div className="font-medium">{compte.denomination}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {compte.code} • {compte.groupe}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * 🔍 Version compacte pour mobile
 */
export const FilterToolbarCompact = ({
  onFilterChange,
  onReset,
  className = "",
}) => {
  const { filters, setFilters, resetFilters } = useComptaStore();
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = Object.values(filters).filter((value) => {
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some((v) => v !== null && v !== "all");
    }
    return value !== "all" && value !== null;
  }).length;

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleReset = () => {
    resetFilters();

    if (onReset) {
      onReset();
    }
  };

  return (
    <div className={className}>
      {/* Bouton toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="text-sm text-red-600 dark:text-red-400">
            Réinitialiser
          </button>
        )}
      </button>

      {/* Sheet mobile */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Filtres
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-6">
                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "all", label: "Tous" },
                      { value: "entree", label: "Entrées" },
                      { value: "sortie", label: "Sorties" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange("type", option.value)}
                        className={`
                          px-3 py-2 rounded-lg text-sm transition-colors
                          ${
                            filters.type === option.value
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }
                        `}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode de paiement */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mode de paiement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "all", label: "Tous", icon: "💰" },
                      { value: "caisse", label: "Caisse", icon: "💵" },
                      { value: "mobile_money", label: "Mobile", icon: "📱" },
                      { value: "banque", label: "Banque", icon: "🏦" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleFilterChange("paymentMode", option.value)
                        }
                        className={`
                          flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                          ${
                            filters.paymentMode === option.value
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }
                        `}>
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Période
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.dateRange.start || ""}
                      onChange={(e) =>
                        handleFilterChange("dateRange", {
                          ...filters.dateRange,
                          start: e.target.value,
                        })
                      }
                      placeholder="Date début"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="date"
                      value={filters.dateRange.end || ""}
                      onChange={(e) =>
                        handleFilterChange("dateRange", {
                          ...filters.dateRange,
                          end: e.target.value,
                        })
                      }
                      placeholder="Date fin"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Montants */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Montant (FCFA)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={filters.amountRange.min || ""}
                      onChange={(e) =>
                        handleFilterChange("amountRange", {
                          ...filters.amountRange,
                          min: e.target.value
                            ? parseFloat(e.target.value)
                            : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={filters.amountRange.max || ""}
                      onChange={(e) =>
                        handleFilterChange("amountRange", {
                          ...filters.amountRange,
                          max: e.target.value
                            ? parseFloat(e.target.value)
                            : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium">
                  Appliquer les filtres
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
