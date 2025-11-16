import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Graphique en courbe pour l'évolution des ventes
 * @param {Array} data - Données [{date: "01/11", value: 45000}, ...]
 * @param {string} xKey - Clé pour l'axe X (défaut: "date")
 * @param {string} yKey - Clé pour l'axe Y (défaut: "value")
 * @param {number} height - Hauteur du graphique (défaut: 300)
 * @param {string} lineColor - Couleur de la ligne (défaut: "#3b82f6")
 */
const SalesLineChart = ({
  data = [],
  xKey = "date",
  yKey = "value",
  height = 300,
  lineColor = "#3b82f6",
  showGrid = true,
  showLegend = false,
}) => {
  // Formater les données pour afficher la date courte
  const formattedData = data.map((item) => ({
    ...item,
    [xKey]: item[xKey]?.length === 8
      ? `${item[xKey].slice(0, 2)}/${item[xKey].slice(2, 4)}`
      : item[xKey],
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            {payload[0].payload[xKey]}
          </p>
          <p className="text-sm opacity-70">
            CA: <span className="font-bold">
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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis
          dataKey={xKey}
          stroke="#6b7280"
          style={{ fontSize: "12px" }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: "12px" }}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={lineColor}
          strokeWidth={3}
          dot={{ fill: lineColor, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SalesLineChart;
