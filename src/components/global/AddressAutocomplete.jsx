import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Composant d'autocomplétion pour les champs d'adresse
 * @param {Object} props
 * @param {string} props.label - Label du champ
 * @param {string} props.value - Valeur actuelle
 * @param {Function} props.onChange - Callback onChange
 * @param {Function} props.onSelect - Callback lorsqu'une suggestion est sélectionnée (reçoit l'objet suggestion complet)
 * @param {Function} props.getSuggestions - Fonction async pour obtenir les suggestions
 * @param {string} props.placeholder - Placeholder
 * @param {React.Component} props.icon - Icône Lucide
 * @param {boolean} props.required - Champ requis
 * @param {string} props.className - Classes CSS additionnelles
 * @param {boolean} props.isOpen - État d'ouverture contrôlé (optionnel)
 * @param {Function} props.onOpenChange - Callback pour changer l'état d'ouverture (optionnel)
 */
const AddressAutocomplete = ({
  label,
  value,
  onChange,
  onSelect,
  getSuggestions,
  placeholder = "",
  icon: Icon,
  required = false,
  className = "",
  isOpen: controlledIsOpen,
  onOpenChange,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Déterminer si on utilise l'état contrôlé ou interne
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Fonction pour changer l'état d'ouverture
  const setIsOpen = (value) => {
    if (isControlled && onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalIsOpen(value);
    }
  };

  // Charger les suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!getSuggestions) return;

      // Ne charger que si le composant est ouvert
      if (!isOpen) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await getSuggestions(value);
        setSuggestions(results);
        // N'ouvrir automatiquement que si on a des résultats
        if (results.length === 0) {
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Erreur chargement suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(loadSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value, getSuggestions, isOpen]);

  // Fermer le popover si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gérer la sélection d'une suggestion
  const handleSelectSuggestion = (suggestion) => {
    onChange({ target: { value: suggestion.value } });
    if (onSelect) {
      onSelect(suggestion);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Navigation au clavier
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn("space-y-2 relative", className)} ref={containerRef}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <InputGroup>
        {Icon && (
          <InputGroupAddon>
            <InputGroupText>
              <Icon />
            </InputGroupText>
          </InputGroupAddon>
        )}
        <InputGroupInput
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            )}
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      {/* Popover de suggestions */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1"
          >
            <Card className="shadow-lg border-2">
              <CardContent className="p-0">
                <div className="max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.value}-${index}`}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border last:border-b-0",
                        "flex items-center justify-between gap-2",
                        selectedIndex === index && "bg-accent"
                      )}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{suggestion.label}</div>
                        {suggestion.departement && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {suggestion.commune && `${suggestion.commune}, `}
                            {suggestion.arrondissement &&
                              `${suggestion.arrondissement}, `}
                            {suggestion.departement.charAt(0).toUpperCase() +
                              suggestion.departement.slice(1)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {suggestion.count !== undefined && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {suggestion.count}
                          </span>
                        )}
                        {selectedIndex === index && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressAutocomplete;
