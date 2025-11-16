/**
 * ProductionCharts.jsx
 * Composants charts réutilisables pour le dashboard de production
 * Utilise Recharts pour la visualisation des données
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Utilitaire pour formater une date courte (DD/MM)
 */
function formatDateShort(dayKey) {
  if (!dayKey || dayKey.length !== 8) return dayKey;
  const day = dayKey.substring(0, 2);
  const month = dayKey.substring(2, 4);
  return `${day}/${month}`;
}

/**
 * Chart 1: Productions de la semaine (LineChart)
 * Affiche l'évolution du nombre de productions sur 7 jours
 */
export const WeekProductionsChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    return data.map((stat) => ({
      date: formatDateShort(stat.date),
      total: stat.total_productions || 0,
      terminees: stat.productions_terminees || 0,
      en_cours: stat.productions_en_cours || 0,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888" />
        <YAxis tick={{ fontSize: 11 }} stroke="#888" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Total"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="terminees"
          stroke="#10b981"
          strokeWidth={2}
          name="Terminées"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Chart 2: Top recettes produites (BarChart horizontal)
 * Affiche les recettes les plus produites
 */
export const TopRecettesChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.quantite_totale - a.quantite_totale)
      .slice(0, 10)
      .map((recette) => ({
        ...recette,
        displayName:
          recette.denomination.length > 20
            ? recette.denomination.substring(0, 20) + "..."
            : recette.denomination,
      }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#888" />
        <YAxis
          type="category"
          dataKey="displayName"
          width={120}
          tick={{ fontSize: 10 }}
          stroke="#888"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value, name) => {
            if (name === "quantite_totale") return [value, "Quantité"];
            return [value, name];
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar
          dataKey="quantite_totale"
          fill="#3b82f6"
          name="Quantité produite"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Chart 3: Productions par emplacement (PieChart)
 * Répartition des productions par emplacement
 */
export const EmplacementsChart = ({ data = [] }) => {
  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ];

  const chartData = useMemo(() => {
    return data
      .map((emp) => ({
        name: emp.denomination || emp.emplacementId,
        value: emp.quantite,
      }))
      .filter((item) => item.value > 0);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={70}
          fill="#8884d8"
          dataKey="value">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * Chart 4: Efficacité de production (LineChart multi-axes)
 * Temps moyen et taux de réussite sur la semaine
 */
export const EfficaciteChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    return data.map((stat) => ({
      date: formatDateShort(stat.date),
      temps_moyen: stat.efficacite?.temps_moyen_minutes || 0,
      taux_reussite: stat.efficacite?.taux_reussite || 100,
      prod_par_heure: stat.efficacite?.productions_par_heure || 0,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888" />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11 }}
          stroke="#888"
          label={{ value: "Minutes", angle: -90, position: "insideLeft", fontSize: 10 }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11 }}
          stroke="#888"
          label={{ value: "%", angle: 90, position: "insideRight", fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="temps_moyen"
          stroke="#f59e0b"
          strokeWidth={2}
          name="Temps moyen (min)"
          dot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="taux_reussite"
          stroke="#10b981"
          strokeWidth={2}
          name="Taux réussite (%)"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Chart 5: Items produits par jour (BarChart)
 * Volume de production quotidien
 */
export const VolumeProductionChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    return data.map((stat) => ({
      date: formatDateShort(stat.date),
      items: stat.total_items_produits || 0,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888" />
        <YAxis tick={{ fontSize: 11 }} stroke="#888" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar
          dataKey="items"
          fill="#3b82f6"
          name="Items produits"
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Chart 6: Comparaison Menus vs Boissons (BarChart empilé)
 * Compare les volumes de production entre menus et boissons
 */
export const MenusVsBoissonsChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    return data.map((stat) => {
      const menus =
        stat.top_recettes
          ?.filter((r) => r.type === "menu")
          .reduce((sum, r) => sum + r.quantite_totale, 0) || 0;

      const boissons =
        stat.top_recettes
          ?.filter((r) => r.type === "boisson")
          .reduce((sum, r) => sum + r.quantite_totale, 0) || 0;

      return {
        date: formatDateShort(stat.date),
        menus,
        boissons,
      };
    });
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888" />
        <YAxis tick={{ fontSize: 11 }} stroke="#888" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar
          dataKey="menus"
          stackId="a"
          fill="#f59e0b"
          name="Menus 🍔"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="boissons"
          stackId="a"
          fill="#3b82f6"
          name="Boissons 🥤"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
