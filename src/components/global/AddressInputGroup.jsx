/**
 * AddressInputGroup.jsx
 * Groupe de 4 champs d'adresse avec adaptation automatique hiérarchique
 *
 * Utilise AddressAutocomplete pour chaque champ et gère:
 * - Adaptation descendante: département → commune → arrondissement → quartier
 * - Adaptation ascendante: si un enfant est choisi, les parents se remplissent automatiquement
 */

import { useCallback } from "react";
import { Map, Building2, MapPin, Home } from "lucide-react";
import AddressAutocomplete from "./AddressAutocomplete";

import {
  getSuggestionsDepartements,
  getSuggestionsCommunes,
  getSuggestionsArrondissements,
  getSuggestionsQuartiers,
} from "@/toolkits/admin/adresseToolkit.jsx";

const AddressInputGroup = ({
  departement,
  commune,
  arrondissement,
  quartier,
  onDepartementChange,
  onCommuneChange,
  onArrondissementChange,
  onQuartierChange,
  required = true,
  className = "",
}) => {
  // Département sélectionné
  const handleDepartementSelect = useCallback((suggestion) => {
    onDepartementChange(suggestion.value);

    // Si le département change, réinitialiser les enfants
    if (suggestion.value !== departement) {
      onCommuneChange("");
      onArrondissementChange("");
      onQuartierChange("");
    }
  }, [departement, onDepartementChange, onCommuneChange, onArrondissementChange, onQuartierChange]);

  // Commune sélectionnée
  const handleCommuneSelect = useCallback((suggestion) => {
    onCommuneChange(suggestion.value);

    // Adaptation ascendante: mettre à jour le département parent si différent
    if (suggestion.departement && suggestion.departement !== departement) {
      onDepartementChange(suggestion.departement);
    }

    // Si la commune change, réinitialiser les enfants
    if (suggestion.value !== commune) {
      onArrondissementChange("");
      onQuartierChange("");
    }
  }, [commune, departement, onCommuneChange, onDepartementChange, onArrondissementChange, onQuartierChange]);

  // Arrondissement sélectionné
  const handleArrondissementSelect = useCallback((suggestion) => {
    onArrondissementChange(suggestion.value);

    // Adaptation ascendante: mettre à jour les parents si nécessaire
    if (suggestion.departement && suggestion.departement !== departement) {
      onDepartementChange(suggestion.departement);
    }
    if (suggestion.commune && suggestion.commune !== commune) {
      onCommuneChange(suggestion.commune);
    }

    // Si l'arrondissement change, réinitialiser le quartier
    if (suggestion.value !== arrondissement) {
      onQuartierChange("");
    }
  }, [arrondissement, commune, departement, onArrondissementChange, onDepartementChange, onCommuneChange, onQuartierChange]);

  // Quartier sélectionné
  const handleQuartierSelect = useCallback((suggestion) => {
    onQuartierChange(suggestion.value);

    // Adaptation ascendante complète: mettre à jour tous les parents
    if (suggestion.departement && suggestion.departement !== departement) {
      onDepartementChange(suggestion.departement);
    }
    if (suggestion.commune && suggestion.commune !== commune) {
      onCommuneChange(suggestion.commune);
    }
    if (suggestion.arrondissement && suggestion.arrondissement !== arrondissement) {
      onArrondissementChange(suggestion.arrondissement);
    }
  }, [quartier, arrondissement, commune, departement, onQuartierChange, onArrondissementChange, onCommuneChange, onDepartementChange]);

  // Wrapper pour getSuggestions avec filtrage hiérarchique
  const getDepartementSuggestions = useCallback(async (query) => {
    return await getSuggestionsDepartements(query);
  }, []);

  const getCommuneSuggestions = useCallback(async (query) => {
    // Filtrer par département si sélectionné
    return await getSuggestionsCommunes(query, departement);
  }, [departement]);

  const getArrondissementSuggestions = useCallback(async (query) => {
    // Filtrer par département et commune
    return await getSuggestionsArrondissements(query, departement, commune);
  }, [departement, commune]);

  const getQuartierSuggestions = useCallback(async (query) => {
    // Filtrer par département, commune et arrondissement
    return await getSuggestionsQuartiers(query, departement, commune, arrondissement);
  }, [departement, commune, arrondissement]);

  return (
    <div className={className}>
      {/* Département */}
      <AddressAutocomplete
        label="Département"
        value={departement}
        onChange={(e) => onDepartementChange(e.target.value)}
        onSelect={handleDepartementSelect}
        getSuggestions={getDepartementSuggestions}
        placeholder="Ex: Atlantique, Littoral..."
        icon={Map}
        required={required}
      />

      {/* Commune */}
      <AddressAutocomplete
        label="Commune"
        value={commune}
        onChange={(e) => onCommuneChange(e.target.value)}
        onSelect={handleCommuneSelect}
        getSuggestions={getCommuneSuggestions}
        placeholder="Ex: Cotonou, Porto-Novo..."
        icon={Building2}
        required={required}
        className="mt-4"
      />

      {/* Arrondissement */}
      <AddressAutocomplete
        label="Arrondissement"
        value={arrondissement}
        onChange={(e) => onArrondissementChange(e.target.value)}
        onSelect={handleArrondissementSelect}
        getSuggestions={getArrondissementSuggestions}
        placeholder="Ex: 1er arrondissement..."
        icon={MapPin}
        required={false}
        className="mt-4"
      />

      {/* Quartier */}
      <AddressAutocomplete
        label="Quartier"
        value={quartier}
        onChange={(e) => onQuartierChange(e.target.value)}
        onSelect={handleQuartierSelect}
        getSuggestions={getQuartierSuggestions}
        placeholder="Ex: Akpakpa, Godomey..."
        icon={Home}
        required={false}
        className="mt-4"
      />
    </div>
  );
};

export default AddressInputGroup;
