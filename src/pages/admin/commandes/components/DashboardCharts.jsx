/**
 * DashboardCharts.jsx
 * Composants de charts pour le Dashboard des commandes
 * Utilise Recharts pour les visualisations
 */

import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * LineChart: Évolution des commandes de la semaine
 * @param {Array} data - Statistiques de la semaine
 */
export const WeekCommandesChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    return data.map((stat) => ({
      date: formatDateShort(stat.date),
      commandes: stat.nombre_commandes || 0,
      ventes: stat.total_ventes || 0,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          stroke="#888"
        />
        <YAxis tick={{ fontSize: 10 }} stroke="#888" />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Line
          type="monotone"
          dataKey="commandes"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Commandes"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * BarChart: Top 10 des articles les plus vendus
 * @param {Array} data - Liste des articles avec total
 */
export const TopArticlesChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    // Trier par total décroissant et prendre le top 10
    return [...data]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((article) => ({
        nom: truncate(article.denomination, 15),
        quantite: article.total,
      }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis type="number" tick={{ fontSize: 10 }} stroke="#888" />
        <YAxis
          dataKey="nom"
          type="category"
          tick={{ fontSize: 9 }}
          stroke="#888"
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="quantite" fill="#10b981" name="Quantité vendue" />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * BarChart: Ventes par vendeur
 * @param {Array} data - Liste des vendeurs avec total
 * @param {Array} users - Liste des utilisateurs pour enrichir les noms
 */
export const VenteursChart = ({ data = [], users = [] }) => {
  const chartData = useMemo(() => {
    return data.map((vendeur) => {
      // Enrichir avec le nom réel du vendeur
      const user = users.find((u) => u.id === vendeur.userId);
      const nom = user ? `${user.nom} ${user.prenoms[0]}` : vendeur.nom;

      return {
        nom: truncate(nom, 15),
        commandes: vendeur.total_commandes,
        ventes: vendeur.total_ventes,
      };
    });
  }, [data, users]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="nom" tick={{ fontSize: 9 }} stroke="#888" />
        <YAxis tick={{ fontSize: 10 }} stroke="#888" />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar dataKey="commandes" fill="#8b5cf6" name="Commandes" />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Double LineChart: Évolution des encaissements Espèces vs Mobile Money
 * @param {Array} data - Statistiques de la semaine avec encaissements
 */
export const EncaissementsChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    return data.map((stat) => ({
      date: formatDateShort(stat.date),
      especes: stat.encaissements?.especes || 0,
      momo: stat.encaissements?.momo || 0,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          stroke="#888"
        />
        <YAxis tick={{ fontSize: 10 }} stroke="#888" />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value) => `${value.toLocaleString()} F`}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Line
          type="monotone"
          dataKey="especes"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Espèces"
        />
        <Line
          type="monotone"
          dataKey="momo"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Mobile Money"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formate une date au format court (ex: "04/11")
 * @param {string} dateKey - Format DDMMYYYY
 * @returns {string} Format DD/MM
 */
function formatDateShort(dateKey) {
  if (!dateKey || dateKey.length !== 8) return "";
  const day = dateKey.substring(0, 2);
  const month = dateKey.substring(2, 4);
  return `${day}/${month}`;
}

/**
 * Tronque un texte à une longueur donnée
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
function truncate(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
