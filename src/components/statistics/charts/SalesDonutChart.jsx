import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

/**
 * Graphique en donut pour la répartition des ventes
 * @param {Array} data - Données [{name: "Espèces", value: 292500}, ...]
 * @param {Array} colors - Couleurs personnalisées (défaut: bleu et vert)
 * @param {number} height - Hauteur du graphique (défaut: 300)
 */
const SalesDonutChart = ({
  data = [],
  colors = ["#22c55e", "#3b82f6"],
  height = 200,
  showLegend = true,
}) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);

      return (
        <div className="bg-card p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm opacity-70">
            <span className="font-bold">
              {payload[0].value.toLocaleString()} FCFA
            </span>
          </p>
          <p className="text-xs opacity-70">{percentage}%</p>
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
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {/* {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={18}
            formatter={(value, entry) => (
              <span className="text-xs">{value}</span>
            )}
          />
        )} */}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SalesDonutChart;
