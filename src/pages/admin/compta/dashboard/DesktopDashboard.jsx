import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Table } from "lucide-react";
import { cardStaggerContainer } from "@/lib/animations";
import { useComptaStore } from "@/stores/comptaStore";
import GraphicTab from "./components/GraphicTab";
import TableTab from "./components/TableTab";

/**
 * 🖥️ Dashboard Desktop
 * 2 onglets: Graphique (cards + charts) et Tableau (transactions)
 */
const DesktopDashboard = () => {
  const { activeView, setActiveView } = useComptaStore();
  const [currentTab, setCurrentTab] = useState(activeView || "graphic");

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setActiveView(tab);
  };

  const tabs = [
    { id: "graphic", label: "Graphique", icon: BarChart3 },
    { id: "table", label: "Tableau", icon: Table },
  ];

  return (
    <div className="space-y-6">
      {/* Onglets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 inline-flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-6 py-2.5 rounded-md font-medium transition-all
                ${
                  currentTab === tab.id
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }
              `}>
              {currentTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-600 rounded-md"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu des onglets */}
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}>
        {currentTab === "graphic" ? <GraphicTab /> : <TableTab />}
      </motion.div>
    </div>
  );
};

export default DesktopDashboard;
