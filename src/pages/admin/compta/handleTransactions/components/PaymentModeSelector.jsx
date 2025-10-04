import { motion } from "framer-motion";

/**
 * 💳 Sélecteur de mode de paiement
 */
const PaymentModeSelector = ({ value, onChange }) => {
  const modes = [
    { value: "caisse", label: "Caisse", icon: "💵", description: "Espèces" },
    {
      value: "mobile_money",
      label: "Mobile Money",
      icon: "📱",
      description: "Paiement mobile",
    },
    {
      value: "banque",
      label: "Banque",
      icon: "🏦",
      description: "Virement/Chèque",
    },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Mode de paiement <span className="text-red-500">*</span>
      </label>

      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => (
          <motion.button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
              ${
                value === mode.value
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 dark:border-blue-400"
                  : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              }
            `}>
            <span className="text-3xl">{mode.icon}</span>
            <div className="text-center">
              <p
                className={`text-sm font-medium ${
                  value === mode.value
                    ? "text-blue-900 dark:text-blue-100"
                    : "text-gray-900 dark:text-gray-100"
                }`}>
                {mode.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {mode.description}
              </p>
            </div>

            {value === mode.value && (
              <motion.div
                layoutId="selectedMode"
                className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PaymentModeSelector;
