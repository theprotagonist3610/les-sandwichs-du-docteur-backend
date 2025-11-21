/**
 * budgetSuggestions.js
 * Calcule des suggestions de budget basées sur l'historique des opérations
 */

import { getStatistiquesByMonth } from "./statistiques";

/**
 * Calcule une suggestion de budget pour un compte basée sur les 3 derniers mois
 * @param {string} compteId - ID du compte
 * @param {string} moisCible - Mois cible au format MMYYYY
 * @returns {Promise<Object>} Suggestion avec détails
 */
export async function calculerSuggestionBudget(compteId, moisCible) {
  try {
    if (!compteId || !moisCible) {
      return null;
    }

    console.log(`💡 Calcul suggestion budget pour ${compteId} (mois cible: ${moisCible})...`);

    // Déterminer les 3 mois précédents le mois cible
    const mm = parseInt(moisCible.substring(0, 2));
    const yyyy = parseInt(moisCible.substring(2, 6));

    const derniersMois = [];
    for (let i = 1; i <= 3; i++) {
      const date = new Date(yyyy, mm - 1 - i, 1);
      const moisKey = `${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
      derniersMois.push(moisKey);
    }

    console.log(`📊 Analyse des mois: ${derniersMois.join(", ")}`);

    // Récupérer les statistiques de chaque mois
    const statsParMois = [];
    for (const moisKey of derniersMois) {
      try {
        const stats = await getStatistiquesByMonth(moisKey);
        if (stats && stats.comptes && stats.comptes.length > 0) {
          // Trouver le compte dans les stats
          const compteStats = stats.comptes.find((c) => c.compte_id === compteId);
          if (compteStats && compteStats.montant_total > 0) {
            statsParMois.push({
              mois: moisKey,
              montant: compteStats.montant_total,
              nbOperations: compteStats.nombre_operations,
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Pas de stats pour ${moisKey}:`, error.message);
      }
    }

    // Pas assez de données
    if (statsParMois.length === 0) {
      console.log(`ℹ️ Aucune donnée historique pour le compte ${compteId}`);
      return {
        disponible: false,
        raison: "Aucune donnée historique disponible pour ce compte",
        nbMoisAnalyses: 0,
        montantSuggere: 0,
      };
    }

    // Calculer les statistiques
    const montants = statsParMois.map((s) => s.montant);
    const montantTotal = montants.reduce((sum, m) => sum + m, 0);
    const montantMoyen = montantTotal / montants.length;
    const montantMin = Math.min(...montants);
    const montantMax = Math.max(...montants);

    // Calculer l'écart-type pour déterminer la variabilité
    const variance =
      montants.reduce((sum, m) => sum + Math.pow(m - montantMoyen, 2), 0) /
      montants.length;
    const ecartType = Math.sqrt(variance);

    // Coefficient de variation (pour mesurer la stabilité)
    const coefficientVariation = montantMoyen > 0 ? (ecartType / montantMoyen) * 100 : 0;

    // Déterminer la stratégie de suggestion
    let montantSuggere;
    let strategie;
    let confianceNiveau;

    if (coefficientVariation < 20) {
      // Dépenses stables : utiliser la moyenne
      strategie = "moyenne";
      montantSuggere = Math.round(montantMoyen);
      confianceNiveau = "haute";
    } else if (coefficientVariation < 40) {
      // Dépenses modérément variables : moyenne + 10% de marge
      strategie = "moyenne_securisee";
      montantSuggere = Math.round(montantMoyen * 1.1);
      confianceNiveau = "moyenne";
    } else {
      // Dépenses très variables : utiliser le maximum avec marge
      strategie = "maximum_securise";
      montantSuggere = Math.round(montantMax * 1.15);
      confianceNiveau = "faible";
    }

    // Déterminer la tendance
    let tendance = "stable";
    if (statsParMois.length >= 2) {
      const dernierMontant = statsParMois[0].montant;
      const avantDernierMontant = statsParMois[1].montant;
      const variation = ((dernierMontant - avantDernierMontant) / avantDernierMontant) * 100;

      if (variation > 15) {
        tendance = "hausse";
      } else if (variation < -15) {
        tendance = "baisse";
      }
    }

    const suggestion = {
      disponible: true,
      nbMoisAnalyses: statsParMois.length,
      montantSuggere,
      strategie,
      confianceNiveau,
      tendance,
      details: {
        montantMoyen: Math.round(montantMoyen),
        montantMin,
        montantMax,
        ecartType: Math.round(ecartType),
        coefficientVariation: Math.round(coefficientVariation),
      },
      historique: statsParMois.reverse(), // Du plus ancien au plus récent
    };

    console.log(`✅ Suggestion calculée: ${montantSuggere} FCFA (${strategie}, confiance: ${confianceNiveau})`);

    return suggestion;
  } catch (error) {
    console.error("❌ Erreur calcul suggestion budget:", error);
    return {
      disponible: false,
      raison: "Erreur lors du calcul de la suggestion",
      nbMoisAnalyses: 0,
      montantSuggere: 0,
    };
  }
}

/**
 * Calcule des suggestions pour tous les comptes d'une catégorie
 * @param {Array} comptes - Liste des comptes
 * @param {string} moisCible - Mois cible au format MMYYYY
 * @param {string} categorie - Catégorie des comptes ("entree" ou "sortie")
 * @returns {Promise<Map>} Map des suggestions par compte_id
 */
export async function calculerSuggestionsPourComptes(comptes, moisCible, categorie = "sortie") {
  try {
    const suggestions = new Map();

    const comptesFiltered = comptes.filter((c) => c.categorie === categorie);

    console.log(`💡 Calcul suggestions pour ${comptesFiltered.length} comptes de catégorie "${categorie}"...`);

    for (const compte of comptesFiltered) {
      const suggestion = await calculerSuggestionBudget(compte.id, moisCible);
      if (suggestion) {
        suggestions.set(compte.id, suggestion);
      }
    }

    console.log(`✅ ${suggestions.size} suggestions calculées`);

    return suggestions;
  } catch (error) {
    console.error("❌ Erreur calcul suggestions pour comptes:", error);
    return new Map();
  }
}

/**
 * Obtient une description lisible de la suggestion
 * @param {Object} suggestion - Objet suggestion
 * @returns {string} Description textuelle
 */
export function getDescriptionSuggestion(suggestion) {
  if (!suggestion || !suggestion.disponible) {
    return suggestion?.raison || "Pas de suggestion disponible";
  }

  const { montantSuggere, strategie, confianceNiveau, nbMoisAnalyses, tendance } = suggestion;

  let description = `Basé sur ${nbMoisAnalyses} mois d'historique : `;

  if (strategie === "moyenne") {
    description += `Dépenses stables, montant moyen suggéré`;
  } else if (strategie === "moyenne_securisee") {
    description += `Dépenses modérément variables, moyenne + 10% de marge`;
  } else if (strategie === "maximum_securise") {
    description += `Dépenses très variables, maximum + 15% de sécurité`;
  }

  if (tendance === "hausse") {
    description += ` (tendance à la hausse)`;
  } else if (tendance === "baisse") {
    description += ` (tendance à la baisse)`;
  }

  return description;
}

/**
 * Obtient une couleur d'indicateur de confiance
 * @param {string} confianceNiveau - Niveau de confiance
 * @returns {string} Classe CSS de couleur
 */
export function getCouleurConfiance(confianceNiveau) {
  switch (confianceNiveau) {
    case "haute":
      return "text-green-600 bg-green-50 border-green-200";
    case "moyenne":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "faible":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}
