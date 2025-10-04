import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { chartVariants } from "@/lib/animations";
import { ChartLoadingSkeleton } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { formatMontant } from "@/lib/compta-utils";

/**
 * 📈 Wrapper générique pour tous les graphiques Recharts
 *
 * @param {Object} props
 * @param {string} props.type - Type de graphique ('line' | 'bar' | 'area' | 'pie')
 * @param {Array} props.data - Données du graphique
 * @param {Object} props.config - Configuration Recharts
 * @param {boolean} props.loading - État de chargement
 * @param {string} props.error - Message d'erreur
 * @param {Function} props.onRetry - Callback retry en cas d'erreur
 * @param {string} props.title - Titre du graphique
 * @param {string} props.subtitle - Sous-titre
 * @param {number} props.height - Hauteur en pixels (défaut: 300)
 * @param {string} props.className - Classes CSS additionnelles
 */
export const ChartWrapper = ({
  type,
  data,
  config = {},
  loading = false,
  error = null,
  onRetry,
  title,
  subtitle,
  height = 300,
  className = "",
}) => {
  // Gestion du loading
  if (loading) {
    return (
      <div className={className}>
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}
        <ChartLoadingSkeleton />
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className={className}>
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
        )}
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  // Pas de données
  if (!data || data.length === 0) {
    return (
      <div className={className}>
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
        )}
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune donnée à afficher
          </p>
        </div>
      </div>
    );
  }

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {entry.name}:
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {typeof entry.value === "number"
                ? formatMontant(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Rendu du graphique selon le type
  const renderChart = () => {
    const commonProps = {
      data,
      margin: config.margin || { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <XAxis
              dataKey={config.xAxisKey || "name"}
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend !== false && <Legend />}
            {config.lines?.map((line, index) => (
              <Line
                key={index}
                type={line.type || "monotone"}
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth || 2}
                name={line.name}
                dot={line.dot !== false}
              />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <XAxis
              dataKey={config.xAxisKey || "name"}
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend !== false && <Legend />}
            {config.bars?.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                fill={bar.fill}
                name={bar.name}
                radius={bar.radius || [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <XAxis
              dataKey={config.xAxisKey || "name"}
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend !== false && <Legend />}
            {config.areas?.map((area, index) => (
              <Area
                key={index}
                type={area.type || "monotone"}
                dataKey={area.dataKey}
                stroke={area.stroke}
                fill={area.fill}
                name={area.name}
                fillOpacity={area.fillOpacity || 0.6}
              />
            ))}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={config.labelLine !== false}
              label={config.label !== false}
              outerRadius={config.outerRadius || 100}
              innerRadius={config.innerRadius || 0}
              dataKey={config.dataKey || "value"}
              nameKey={config.nameKey || "name"}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    config.colors?.[index] || `hsl(${index * 45}, 70%, 60%)`
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend !== false && <Legend />}
          </PieChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-red-500">
            Type de graphique non supporté: {type}
          </div>
        );
    }
  };

  return (
    <motion.div
      variants={chartVariants}
      initial="initial"
      animate="animate"
      className={className}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  );
};

/**
 * 📊 Variantes prédéfinies pour les graphiques courants
 */

// Line Chart - Évolution CA
export const EvolutionCAChart = ({ data, loading, error, onRetry }) => (
  <ChartWrapper
    type="line"
    data={data}
    loading={loading}
    error={error}
    onRetry={onRetry}
    title="Évolution du chiffre d'affaires"
    config={{
      xAxisKey: "mois",
      lines: [
        {
          dataKey: "ca",
          stroke: "#3b82f6",
          name: "CA",
          strokeWidth: 3,
        },
      ],
    }}
  />
);

// Bar Chart - Charges vs Produits
export const ChargesProduitChart = ({ data, loading, error, onRetry }) => (
  <ChartWrapper
    type="bar"
    data={data}
    loading={loading}
    error={error}
    onRetry={onRetry}
    title="Charges vs Produits"
    config={{
      xAxisKey: "periode",
      bars: [
        {
          dataKey: "charges",
          fill: "#ef4444",
          name: "Charges",
        },
        {
          dataKey: "produits",
          fill: "#10b981",
          name: "Produits",
        },
      ],
    }}
  />
);

// Pie Chart - Modes de paiement
export const ModePaiementChart = ({ data, loading, error, onRetry }) => (
  <ChartWrapper
    type="pie"
    data={data}
    loading={loading}
    error={error}
    onRetry={onRetry}
    title="Répartition par mode de paiement"
    config={{
      dataKey: "montant",
      nameKey: "mode",
      colors: ["#f59e0b", "#3b82f6", "#10b981"],
      outerRadius: 100,
      label: true,
    }}
  />
);

// Area Chart - Comparaison périodes
export const ComparisonChart = ({ data, loading, error, onRetry }) => (
  <ChartWrapper
    type="area"
    data={data}
    loading={loading}
    error={error}
    onRetry={onRetry}
    title="Comparaison avec la période précédente"
    config={{
      xAxisKey: "jour",
      areas: [
        {
          dataKey: "actuel",
          stroke: "#3b82f6",
          fill: "#3b82f6",
          name: "Période actuelle",
          fillOpacity: 0.6,
        },
        {
          dataKey: "precedent",
          stroke: "#94a3b8",
          fill: "#94a3b8",
          name: "Période précédente",
          fillOpacity: 0.3,
        },
      ],
    }}
  />
);
