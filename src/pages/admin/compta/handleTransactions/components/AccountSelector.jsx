import { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dropdownVariants } from "@/lib/animations";
import comptes from "@/toolkits/comptabilite/liste";

/**
 * 🏦 Sélecteur de compte avec recherche
 */
const AccountSelector = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Liste de tous les comptes
  const allComptes = useMemo(() => {
    return comptes.flatMap((groupe) =>
      groupe.liste.map((compte) => ({
        code: compte.code_lsd,
        denomination: compte.denomination,
        groupe: groupe.groupe,
        type: compte.type,
        code_ohada: compte.code_ohada,
      }))
    );
  }, []);

  // Filtrer les comptes par recherche
  const filteredComptes = useMemo(() => {
    if (!searchTerm) return allComptes;

    const term = searchTerm.toLowerCase();
    return allComptes.filter(
      (compte) =>
        compte.denomination.toLowerCase().includes(term) ||
        compte.code.toLowerCase().includes(term) ||
        compte.groupe.toLowerCase().includes(term)
    );
  }, [searchTerm, allComptes]);

  // Compte sélectionné
  const selectedCompte = useMemo(() => {
    return allComptes.find((c) => c.code === value);
  }, [value, allComptes]);

  // Grouper par catégorie
  const groupedComptes = useMemo(() => {
    const groups = {};
    filteredComptes.forEach((compte) => {
      if (!groups[compte.groupe]) {
        groups[compte.groupe] = [];
      }
      groups[compte.groupe].push(compte);
    });
    return groups;
  }, [filteredComptes]);

  const handleSelect = (compte) => {
    onChange(compte.code);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Compte <span className="text-red-500">*</span>
      </label>

      {/* Bouton sélection */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-4 py-2 border rounded-lg
          bg-white dark:bg-gray-900
          text-gray-900 dark:text-gray-100
          hover:bg-gray-50 dark:hover:bg-gray-800
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors
          ${
            error
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
          }
        `}>
        <span className={selectedCompte ? "" : "text-gray-400"}>
          {selectedCompte
            ? `${selectedCompte.denomination} (${selectedCompte.code})`
            : "Sélectionner un compte..."}
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-hidden">
            {/* Barre de recherche */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un compte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Liste des comptes */}
            <div className="overflow-y-auto max-h-80">
              {Object.keys(groupedComptes).length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Aucun compte trouvé
                </div>
              ) : (
                Object.entries(groupedComptes).map(
                  ([groupe, comptesGroupe]) => (
                    <div key={groupe}>
                      {/* En-tête du groupe */}
                      <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {groupe}
                      </div>

                      {/* Comptes du groupe */}
                      {comptesGroupe.map((compte) => (
                        <button
                          key={compte.code}
                          type="button"
                          onClick={() => handleSelect(compte)}
                          className={`
                          w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700
                          hover:bg-gray-50 dark:hover:bg-gray-700
                          transition-colors
                          ${
                            value === compte.code
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }
                        `}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {compte.denomination}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {compte.code} • {compte.code_ohada} •{" "}
                                {compte.type}
                              </p>
                            </div>

                            {value === compte.code && (
                              <span className="ml-2 text-blue-600 dark:text-blue-400">
                                ✓
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountSelector;
