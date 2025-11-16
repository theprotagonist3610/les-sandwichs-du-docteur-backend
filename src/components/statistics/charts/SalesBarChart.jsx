import React from "react";
import {
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
 * Graphique en barres pour les ventes
 * @param {Array} data - Données [{name: "Sur place", value: 270000}, ...]
 * @param {string} xKey - Clé pour l'axe X (défaut: "name")
 * @param {string} yKey - Clé pour l'axe Y (défaut: "value")
 * @param {number} height - Hauteur du graphique (défaut: 300)
 * @param {string} barColor - Couleur des barres (défaut: "#3b82f6")
 */
const SalesBarChart = ({
  data = [],
  xKey = "name",
  yKey = "value",
  height = 300,
  barColor = "#3b82f6",
  showGrid = true,
  showLegend = false,
  horizontal = false,
}) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            {payload[0].payload[xKey]}
          </p>
          <p className="text-sm opacity-70">
            <span className="font-bold">
              {payload[0].value?.toLocaleString()} FCFA
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 opacity-70">
        Aucune donnée disponible
      </div>
    );
  }

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey={xKey} width={100} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Bar dataKey={yKey} fill={barColor} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis dataKey={xKey} stroke="#6b7280" style={{ fontSize: "12px" }} />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: "12px" }}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        <Bar dataKey={yKey} fill={barColor} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SalesBarChart;
