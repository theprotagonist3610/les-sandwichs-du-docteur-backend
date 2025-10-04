// components/IngredientsManager.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, Beaker, Trash2 } from "lucide-react";
import useEditMenuStore from "@/stores/useEditMenuStore";

// ==========================================
// COMPOSANT ITEM D'INGRÉDIENT
// ==========================================
const IngredientItem = React.memo(
  ({ ingredient, onQuantityChange, onRemove }) => {
    const handleQuantityChange = useCallback(
      (e) => {
        onQuantityChange(ingredient.id, parseFloat(e.target.value) || 0);
      },
      [ingredient.id, onQuantityChange]
    );

    const handleRemove = useCallback(() => {
      onRemove(ingredient.id);
    }, [ingredient.id, onRemove]);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 p-3 bg-muted rounded-md">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Beaker className="h-4 w-4 text-primary flex-shrink-0" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {ingredient.denomination}
          </p>
          {ingredient.calories && (
            <p className="text-xs text-muted-foreground">
              {ingredient.calories} kcal {ingredient.symbole || ""}
            </p>
          )}
        </div>

        <input
          type="number"
          value={ingredient.quantite || 0}
          onChange={handleQuantityChange}
          className="w-20 px-2 py-1 text-sm rounded border border-input bg-background
                 focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Qté"
          min="0"
          step="0.1"
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleRemove}
          className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors">
          <Trash2 className="h-4 w-4" />
        </motion.button>
      </motion.div>
    );
  }
);

IngredientItem.displayName = "IngredientItem";

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
const IngredientsManager = React.memo(() => {
  const {
    editedMenu,
    availableIngredients,
    addIngredient,
    removeIngredient,
    updateIngredientQuantity,
  } = useEditMenuStore();

  const [localIngredientSearch, setLocalIngredientSearch] = useState("");
  const [localShowDropdown, setLocalShowDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Filtrer les ingrédients localement
  const localFilteredIngredients = useMemo(() => {
    if (!localIngredientSearch) return [];

    const searchLower = localIngredientSearch.toLowerCase();
    return availableIngredients.filter(
      (ing) =>
        ing.denomination.toLowerCase().includes(searchLower) &&
        !editedMenu?.ingredients?.find((existing) => existing.id === ing.id)
    );
  }, [localIngredientSearch, availableIngredients, editedMenu?.ingredients]);

  // Handler pour l'ajout d'ingrédient
  const handleAddIngredientLocal = useCallback(
    (ingredient) => {
      addIngredient(ingredient);
      setLocalIngredientSearch("");
      setLocalShowDropdown(false);
      searchInputRef.current?.focus();
    },
    [addIngredient]
  );

  // Handler pour le focus
  const handleFocus = useCallback(() => {
    setLocalShowDropdown(true);
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
  }, []);

  // Handler pour le blur avec délai
  const handleBlur = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setLocalShowDropdown(false);
    }, 200);
  }, []);

  // Handler pour le changement de recherche
  const handleSearchChange = useCallback((e) => {
    setLocalIngredientSearch(e.target.value);
    setLocalShowDropdown(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* Recherche et ajout d'ingrédient */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={localIngredientSearch}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Rechercher un ingrédient..."
            className="w-full pl-10 pr-3 py-2 rounded-md border border-input bg-background
                     focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Dropdown des ingrédients */}
        <AnimatePresence>
          {localShowDropdown &&
            localIngredientSearch &&
            localFilteredIngredients.length > 0 && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto
                       bg-card border border-border rounded-md shadow-lg z-10"
                onMouseDown={(e) => e.preventDefault()}>
                {localFilteredIngredients.map((ing) => (
                  <motion.button
                    key={ing.id}
                    whileHover={{
                      backgroundColor: "rgb(var(--muted) / 0.5)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddIngredientLocal(ing)}
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-2">
                      <Beaker className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{ing.denomination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {ing.calories && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {ing.calories} kcal
                        </span>
                      )}
                      {ing.emoji && <span>{ing.emoji}</span>}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
        </AnimatePresence>

        {/* Message si aucun résultat */}
        {localShowDropdown &&
          localIngredientSearch &&
          localFilteredIngredients.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-full left-0 right-0 mt-1 p-3 bg-card border border-border rounded-md shadow-lg z-10">
              <p className="text-sm text-muted-foreground text-center">
                Aucun ingrédient trouvé
              </p>
            </motion.div>
          )}
      </div>

      {/* Liste des ingrédients actuels */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {editedMenu?.ingredients?.map((ingredient) => (
            <IngredientItem
              key={ingredient.id}
              ingredient={ingredient}
              onQuantityChange={updateIngredientQuantity}
              onRemove={removeIngredient}
            />
          ))}
        </AnimatePresence>

        {(!editedMenu?.ingredients || editedMenu.ingredients.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8">
            <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucun ingrédient ajouté
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Recherchez et ajoutez des ingrédients ci-dessus
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
});

IngredientsManager.displayName = "IngredientsManager";

export default IngredientsManager;
