import { Calendar } from "lucide-react";

/**
 * 📅 Champ sélecteur de date
 */
const DatePickerField = ({ value, onChange, error, disabled = false }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Date <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>

        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full pl-10 pr-4 py-2 border rounded-lg
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
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

      {disabled && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          La date ne peut pas être modifiée après la création
        </p>
      )}
    </div>
  );
};

export default DatePickerField;
