import { FileText } from "lucide-react";

/**
 * 📝 Champ de description (optionnel)
 */
const DescriptionField = ({ value, onChange }) => {
  const maxLength = 500;
  const remainingChars = maxLength - (value?.length || 0);

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <FileText className="w-4 h-4" />
        Description
        <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ajoutez une description pour cette transaction..."
        rows={4}
        maxLength={maxLength}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />

      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ajoutez des détails sur cette transaction
        </p>
        <p
          className={`text-xs ${
            remainingChars < 50
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400"
          }`}>
          {remainingChars} caractères restants
        </p>
      </div>
    </div>
  );
};

export default DescriptionField;
