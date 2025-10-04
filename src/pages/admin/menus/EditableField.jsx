// components/EditableField.jsx
import React, { useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import useEditMenuStore from "@/stores/useEditMenuStore";

const itemVariants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.15 },
  },
};

const EditableField = React.memo(
  ({
    field,
    label,
    icon: Icon,
    type = "text",
    options = null,
    placeholder = "",
    multiline = false,
  }) => {
    // Sélecteur optimisé - ne se re-rend que si cette valeur spécifique change
    const value = useEditMenuStore((state) => state.editedMenu?.[field]);
    const updateField = useEditMenuStore((state) => state.updateField);

    // Ref pour le debounce
    const timeoutRef = useRef(null);
    const lastValueRef = useRef(value);

    // Nettoyer le timeout au démontage
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Handler optimisé avec debounce pour les inputs texte
    const handleChange = useCallback(
      (e) => {
        const newValue =
          type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;

        // Mise à jour immédiate de la ref pour l'affichage
        lastValueRef.current = newValue;

        // Débounce uniquement pour le texte, pas pour les nombres
        if (type === "text" || multiline) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            updateField(field, newValue);
          }, 150); // 150ms de debounce
        } else {
          // Mise à jour immédiate pour les nombres et les selects
          updateField(field, newValue);
        }
      },
      [field, type, multiline, updateField]
    );

    // Handler pour les selects (pas de debounce)
    const handleSelectChange = useCallback(
      (e) => {
        const newValue = e.target.value;
        updateField(field, newValue);
      },
      [field, updateField]
    );

    return (
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {label}
        </label>

        {options ? (
          <select
            value={value || ""}
            onChange={handleSelectChange}
            className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring transition-shadow">
            <option value="">Choisir...</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            value={value || ""}
            onChange={handleChange}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
          />
        ) : (
          <input
            type={type}
            value={value || (type === "number" ? 0 : "")}
            onChange={handleChange}
            placeholder={placeholder}
            step={type === "number" ? "0.01" : undefined}
            className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        )}
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // Comparaison ultra-précise pour éviter les re-renders
    return (
      prevProps.field === nextProps.field &&
      prevProps.label === nextProps.label &&
      prevProps.type === nextProps.type &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.multiline === nextProps.multiline &&
      prevProps.icon === nextProps.icon &&
      JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options)
    );
  }
);

EditableField.displayName = "EditableField";

export default EditableField;
