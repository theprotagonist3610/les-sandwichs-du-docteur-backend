import { DollarSign } from "lucide-react";

/**
 * 💰 Champ de saisie du montant
 */
const AmountInput = ({ value, onChange, error, transactionType }) => {
  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Permettre uniquement les nombres et un point décimal
    if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Montant (FCFA) <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        <div
          className={`
          absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none
          ${
            transactionType === "entree"
              ? "text-green-500"
              : transactionType === "sortie"
              ? "text-red-500"
              : "text-gray-400"
          }
        `}>
          <DollarSign className="w-5 h-5" />
        </div>

        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0"
          className={`
            w-full pl-10 pr-4 py-2 border rounded-lg
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${
              error
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }
          `}
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {value && !error && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
            minimumFractionDigits: 0,
          }).format(parseFloat(value) || 0)}
        </p>
      )}
    </div>
  );
};

export default AmountInput;
