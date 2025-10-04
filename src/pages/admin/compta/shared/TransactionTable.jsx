import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { tableRowVariants } from "@/lib/animations";
import {
  formatMontant,
  formatDateDisplay,
  getPaymentModeIcon,
  getPaymentModeLabel,
  getTransactionColor,
  sortTransactions,
  paginateData,
} from "@/lib/compta-utils";
import { TableLoadingSkeleton } from "./LoadingState";
import { EmptyState } from "./ErrorState";
import { Receipt } from "lucide-react";

/**
 * 📋 Tableau de transactions réutilisable avec pagination
 *
 * @param {Object} props
 * @param {Transaction[]} props.transactions - Liste des transactions
 * @param {Array<string>} props.columns - Colonnes à afficher ['date', 'compte', 'montant', 'mode_paiement', 'description']
 * @param {string} props.sortBy - Colonne de tri par défaut ('date' | 'montant' | 'compte')
 * @param {string} props.sortOrder - Ordre de tri ('asc' | 'desc')
 * @param {Function} props.onRowClick - Callback au clic sur une ligne
 * @param {Object} props.pagination - Config pagination { page: number, pageSize: 100 }
 * @param {boolean} props.loading - État de chargement
 * @param {boolean} props.showActions - Afficher les actions (modifier, supprimer)
 * @param {Function} props.onEdit - Callback édition
 * @param {Function} props.onDelete - Callback suppression
 * @param {string} props.className - Classes CSS additionnelles
 */
export const TransactionTable = ({
  transactions = [],
  columns = ["date", "compte", "montant", "mode_paiement", "description"],
  sortBy: initialSortBy = "date",
  sortOrder: initialSortOrder = "desc",
  onRowClick,
  pagination: initialPagination = { page: 1, pageSize: 100 },
  loading = false,
  showActions = false,
  onEdit,
  onDelete,
  className = "",
}) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [currentPage, setCurrentPage] = useState(initialPagination.page);

  // Tri des transactions
  const sortedTransactions = useMemo(() => {
    return sortTransactions(transactions, sortBy, sortOrder);
  }, [transactions, sortBy, sortOrder]);

  // Pagination
  const paginatedData = useMemo(() => {
    return paginateData(
      sortedTransactions,
      currentPage,
      initialPagination.pageSize
    );
  }, [sortedTransactions, currentPage, initialPagination.pageSize]);

  // Gestion du tri
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Gestion de la pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Gestion du clic sur une ligne
  const handleRowClick = (transaction) => {
    if (onRowClick) {
      onRowClick(transaction);
    } else {
      // Navigation par défaut vers HandleTransactions
      navigate(`/admin/compta/handleTransactions/${transaction.id}`);
    }
  };

  // Configuration des colonnes
  const columnConfig = {
    date: {
      label: "Date",
      sortable: true,
      width: "w-28",
      render: (transaction) => formatDateDisplay(transaction.date, "dd/MM/yy"),
    },
    compte: {
      label: "Compte",
      sortable: true,
      width: "flex-1 min-w-[200px]",
      render: (transaction) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {transaction.compte_denomination}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {transaction.compte_lsd}
          </p>
        </div>
      ),
    },
    montant: {
      label: "Montant",
      sortable: true,
      width: "w-32",
      render: (transaction) => (
        <span
          className={`font-semibold ${getTransactionColor(transaction.type)}`}>
          {transaction.type === "sortie" && "-"}
          {formatMontant(transaction.montant)}
        </span>
      ),
    },
    mode_paiement: {
      label: "Mode",
      sortable: false,
      width: "w-32",
      render: (transaction) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {getPaymentModeIcon(transaction.mode_paiement)}
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {getPaymentModeLabel(transaction.mode_paiement)}
          </span>
        </div>
      ),
    },
    description: {
      label: "Description",
      sortable: false,
      width: "flex-1",
      render: (transaction) => (
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {transaction.description || "-"}
        </p>
      ),
    },
  };

  // Icône de tri
  const SortIcon = ({ column }) => {
    if (sortBy !== column)
      return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return <TableLoadingSkeleton rows={5} columns={columns.length} />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        title="Aucune transaction"
        description="Aucune transaction trouvée pour cette période"
        icon={Receipt}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => {
                const config = columnConfig[column];
                if (!config) return null;

                return (
                  <th
                    key={column}
                    className={`
                      px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider
                      ${config.width}
                      ${
                        config.sortable
                          ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          : ""
                      }
                    `}
                    onClick={() => config.sortable && handleSort(column)}>
                    <div className="flex items-center gap-2">
                      <span>{config.label}</span>
                      {config.sortable && <SortIcon column={column} />}
                    </div>
                  </th>
                );
              })}

              {showActions && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.data.map((transaction, index) => (
              <motion.tr
                key={transaction.id}
                custom={index}
                variants={tableRowVariants}
                initial="initial"
                animate="animate"
                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => handleRowClick(transaction)}>
                {columns.map((column) => {
                  const config = columnConfig[column];
                  if (!config) return null;

                  return (
                    <td key={column} className={`px-4 py-3 ${config.width}`}>
                      {config.render(transaction)}
                    </td>
                  );
                })}

                {showActions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/admin/compta/handleTransactions/${transaction.id}`
                          );
                        }}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Voir">
                        <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>

                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(transaction);
                          }}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded transition-colors"
                          title="Modifier">
                          <Edit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(transaction);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Supprimer">
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginatedData.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Info */}
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Affichage de{" "}
            <span className="font-medium">
              {(currentPage - 1) * initialPagination.pageSize + 1}
            </span>{" "}
            à{" "}
            <span className="font-medium">
              {Math.min(
                currentPage * initialPagination.pageSize,
                paginatedData.totalItems
              )}
            </span>{" "}
            sur <span className="font-medium">{paginatedData.totalItems}</span>{" "}
            transactions
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={!paginatedData.hasPrev}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Première page">
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!paginatedData.hasPrev}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page précédente">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Afficher les 5 pages autour de la page courante
                  return (
                    page === 1 ||
                    page === paginatedData.totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  );
                })
                .map((page, index, array) => {
                  // Ajouter "..." entre les groupes de pages
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`
                          px-3 py-1 rounded text-sm font-medium transition-colors
                          ${
                            page === currentPage
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }
                        `}>
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!paginatedData.hasNext}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page suivante">
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handlePageChange(paginatedData.totalPages)}
              disabled={!paginatedData.hasNext}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Dernière page">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 📋 Version mobile compacte (cards au lieu de tableau)
 */
export const TransactionTableMobile = ({
  transactions = [],
  onRowClick,
  loading = false,
  className = "",
}) => {
  const navigate = useNavigate();

  const handleClick = (transaction) => {
    if (onRowClick) {
      onRowClick(transaction);
    } else {
      navigate(`/admin/compta/handleTransactions/${transaction.id}`);
    }
  };

  if (loading) {
    return <TableLoadingSkeleton rows={3} columns={1} />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        title="Aucune transaction"
        description="Aucune transaction trouvée"
        icon={Receipt}
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {transactions.map((transaction, index) => (
        <motion.div
          key={transaction.id}
          custom={index}
          variants={tableRowVariants}
          initial="initial"
          animate="animate"
          onClick={() => handleClick(transaction)}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {transaction.compte_denomination}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {transaction.compte_lsd}
              </p>
            </div>

            <div
              className={`font-bold ${getTransactionColor(transaction.type)}`}>
              {transaction.type === "sortie" && "-"}
              {formatMontant(transaction.montant)}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {getPaymentModeIcon(transaction.mode_paiement)}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {getPaymentModeLabel(transaction.mode_paiement)}
              </span>
            </div>

            <span className="text-gray-500 dark:text-gray-400">
              {formatDateDisplay(transaction.date, "dd/MM/yy")}
            </span>
          </div>

          {transaction.description && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
              {transaction.description}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
};
