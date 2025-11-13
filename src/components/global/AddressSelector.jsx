/**
 * AddressSelector.jsx
 * Composant de sélection d'adresse avec recherche intelligente
 *
 * Fonctionnalités:
 * - Recherche globale dans toutes les adresses (nom, commune, arrondissement, quartier)
 * - Affichage intelligent des suggestions avec hiérarchie complète
 * - Retourne l'objet adresse complet lors de la sélection
 * - Champ de description pour précisions supplémentaires
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  Check,
  ChevronDown,
  Loader2,
  FileText,
  X,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { searchAdresses, createAdresse } from "@/toolkits/admin/adresseToolkit";
import { toast } from "sonner";

/**
 * Composant de sélection d'adresse intelligent
 * @param {Object} props
 * @param {Object} props.selectedAddress - Adresse sélectionnée { id, ...data }
 * @param {Function} props.onSelectAddress - Callback quand une adresse est sélectionnée
 * @param {string} props.description - Description/précision de l'adresse
 * @param {Function} props.onDescriptionChange - Callback pour la description
 * @param {boolean} props.required - Champ requis
 * @param {string} props.className - Classes CSS additionnelles
 */
const AddressSelector = ({
  selectedAddress,
  onSelectAddress,
  description = "",
  onDescriptionChange,
  required = false,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Dialog de création rapide d'adresse
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAddressValue, setNewAddressValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Formater l'affichage de l'adresse sélectionnée
  const getDisplayValue = () => {
    if (!selectedAddress) return searchQuery;

    const parts = [];
    if (selectedAddress.nom) parts.push(selectedAddress.nom);
    if (selectedAddress.commune) parts.push(selectedAddress.commune);
    if (selectedAddress.arrondissement) parts.push(selectedAddress.arrondissement);
    if (selectedAddress.quartier) parts.push(selectedAddress.quartier);

    return parts.join(", ") || searchQuery;
  };

  // Charger les suggestions en fonction de la recherche
  const loadSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchAdresses(query);
      // Filtrer uniquement les adresses actives
      const activeResults = results.filter((addr) => addr.statut !== false);
      setSuggestions(activeResults);

      if (activeResults.length === 0) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Erreur recherche adresses:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      loadSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, loadSuggestions, isOpen]);

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

  // Gérer la sélection d'une adresse
  const handleSelectAddress = (address) => {
    onSelectAddress(address);
    setSearchQuery(""); // Réinitialiser la recherche
    setIsOpen(false);
    setSelectedIndex(-1);
    setSuggestions([]);
  };

  // Déselectionner l'adresse
  const handleClearAddress = () => {
    onSelectAddress(null);
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Navigation au clavier
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter" && !selectedAddress) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectAddress(suggestions[selectedIndex]);
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

  // Formater l'adresse complète pour l'affichage dans les suggestions
  const formatAddressLabel = (addr) => {
    const parts = [];
    if (addr.nom) parts.push(addr.nom);
    if (addr.commune) parts.push(addr.commune);
    if (addr.arrondissement) parts.push(addr.arrondissement);
    if (addr.quartier) parts.push(addr.quartier);
    return parts.join(", ");
  };

  // Ouvrir le dialog de création
  const handleOpenCreateDialog = () => {
    setNewAddressValue(searchQuery); // Pré-remplir avec la recherche
    setIsCreateDialogOpen(true);
    setIsOpen(false);
  };

  // Créer une nouvelle adresse rapide
  const handleCreateAddress = async () => {
    if (!newAddressValue || newAddressValue.trim() === "") {
      toast.error("Veuillez saisir une adresse");
      return;
    }

    setIsCreating(true);
    try {
      const newAddress = await createAdresse({
        departement: "inconnu",
        commune: "inconnu",
        arrondissement: "inconnu",
        quartier: newAddressValue.trim(),
        localisation: {
          longitude: 0.0,
          latitude: 0.0,
        },
      });

      toast.success("Adresse créée avec succès");

      // Sélectionner automatiquement l'adresse créée
      handleSelectAddress(newAddress);

      // Fermer le dialog et réinitialiser
      setIsCreateDialogOpen(false);
      setNewAddressValue("");
    } catch (error) {
      console.error("Erreur création adresse:", error);
      if (error.message.includes("E_DUPLICATE_ADRESSE")) {
        toast.error("Cette adresse existe déjà");
      } else {
        toast.error("Erreur lors de la création de l'adresse");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Sélection de l'adresse */}
      <div className="space-y-2 relative" ref={containerRef}>
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Adresse de livraison
          {required && <span className="text-red-500">*</span>}
        </Label>

        {/* Adresse sélectionnée */}
        {selectedAddress ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <Card className="flex-1 border-2 border-primary">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <p className="font-medium text-sm">
                        {selectedAddress.nom || "Sans nom"}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {selectedAddress.commune && (
                        <p>Commune: {selectedAddress.commune}</p>
                      )}
                      {selectedAddress.arrondissement && (
                        <p>Arrondissement: {selectedAddress.arrondissement}</p>
                      )}
                      {selectedAddress.quartier && (
                        <p>Quartier: {selectedAddress.quartier}</p>
                      )}
                      {selectedAddress.departement && (
                        <p className="capitalize">
                          Département: {selectedAddress.departement}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleClearAddress}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <Input
              ref={inputRef}
              placeholder="Rechercher une adresse (nom, commune, quartier...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen && e.target.value.length >= 2) {
                  setIsOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchQuery.length >= 2) {
                  setIsOpen(true);
                }
              }}
              className="pl-10 pr-10"
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
            </div>
          </div>
        )}

        {/* Popover de suggestions */}
        <AnimatePresence>
          {isOpen && suggestions.length > 0 && !selectedAddress && (
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
                    {suggestions.map((addr, index) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectAddress(addr)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border last:border-b-0",
                          "flex items-start justify-between gap-2",
                          selectedIndex === index && "bg-accent"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <div className="font-medium text-sm truncate">
                              {formatAddressLabel(addr)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {addr.departement}
                          </div>
                        </div>
                        {selectedIndex === index && (
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message si aucun résultat + Bouton créer */}
        {isOpen &&
          searchQuery.length >= 2 &&
          suggestions.length === 0 &&
          !isLoading &&
          !selectedAddress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute z-50 w-full mt-1"
            >
              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  <p className="text-center text-sm text-muted-foreground">
                    Aucune adresse trouvée pour "{searchQuery}"
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleOpenCreateDialog}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer cette adresse
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
      </div>

      {/* Champ de description (précisions) */}
      {selectedAddress && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <Label className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Précisions / Description (optionnel)
          </Label>
          <Input
            placeholder="Ex: Porte bleue, 3ème étage, à côté de la pharmacie..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Ajoutez des indications supplémentaires pour faciliter la livraison
          </p>
        </motion.div>
      )}

      {/* Dialog de création rapide d'adresse */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Créer une nouvelle adresse
            </DialogTitle>
            <DialogDescription>
              Cette adresse sera enregistrée avec les informations suivantes :
              département, commune et arrondissement "inconnu".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-address">
                Adresse <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-address"
                placeholder="Ex: Marché Dantokpa, Rue des Artisans..."
                value={newAddressValue}
                onChange={(e) => setNewAddressValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    handleCreateAddress();
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Saisissez le nom du quartier ou des détails de l'adresse
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewAddressValue("");
                }}
                disabled={isCreating}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleCreateAddress}
                disabled={isCreating || !newAddressValue.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressSelector;
