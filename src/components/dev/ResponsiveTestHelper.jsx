// components/dev/ResponsiveTestHelper.jsx
// ⚠️ À utiliser uniquement en développement pour tester l'interface

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Tablet, Eye, EyeOff } from "lucide-react";

const ResponsiveTestHelper = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState("desktop");
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    // Afficher seulement en développement
    if (process.env.NODE_ENV !== "development") return;

    const updateSize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);

      if (width < 768) {
        setCurrentBreakpoint("mobile");
      } else if (width < 1024) {
        setCurrentBreakpoint("tablet");
      } else {
        setCurrentBreakpoint("desktop");
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Simuler différents utilisateurs pour tester
  const testUsers = [
    {
      nom: "Dupont",
      prenoms: ["Jean"],
      sexe: "H",
      role: "superviseur",
      level: "admin",
    },
    {
      nom: "Martin",
      prenoms: ["Marie"],
      sexe: "F",
      role: "vendeuse",
      level: "user",
    },
    {
      nom: "Kouassi",
      prenoms: ["Paul"],
      sexe: "H",
      role: "livreur",
      level: "user",
    },
    {
      nom: "Akissi",
      prenoms: ["Claire"],
      sexe: "F",
      role: "cuisiniere",
      level: "user",
    },
  ];

  const switchUser = (user) => {
    localStorage.setItem("lsd_user", JSON.stringify(user));
    window.location.reload();
  };

  const clearUser = () => {
    localStorage.removeItem("lsd_user");
    window.location.reload();
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      {/* Bouton toggle */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-1/2 right-4 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Outils de test responsive">
        {isVisible ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>

      {/* Panel de test */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isVisible ? 0 : "100%" }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-40 overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              🛠️ Test Responsive
            </h3>
            <div className="text-sm text-gray-600">
              Mode développement seulement
            </div>
          </div>

          {/* Informations écran */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              {currentBreakpoint === "mobile" && (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              {currentBreakpoint === "tablet" && (
                <Tablet className="w-4 h-4 mr-2" />
              )}
              {currentBreakpoint === "desktop" && (
                <Monitor className="w-4 h-4 mr-2" />
              )}
              Écran Actuel
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Largeur:</span>
                <span className="font-mono">{screenWidth}px</span>
              </div>
              <div className="flex justify-between">
                <span>Breakpoint:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    currentBreakpoint === "mobile"
                      ? "bg-red-100 text-red-800"
                      : currentBreakpoint === "tablet"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                  {currentBreakpoint}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Layout:</span>
                <span className="font-medium">
                  {screenWidth < 768 ? "Mobile" : "Desktop"}
                </span>
              </div>
            </div>
          </div>

          {/* Breakpoints */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">📏 Breakpoints</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 rounded bg-red-50">
                <span>📱 Mobile</span>
                <span className="font-mono text-xs"> 768px</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-yellow-50">
                <span>📱 Tablet</span>
                <span className="font-mono text-xs">768px - 1024px</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-green-50">
                <span>🖥️ Desktop</span>
                <span className="font-mono text-xs"> 1024px</span>
              </div>
            </div>
          </div>

          {/* Test utilisateurs */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              👥 Test Utilisateurs
            </h4>
            <div className="space-y-2">
              {testUsers.map((user, index) => (
                <button
                  key={index}
                  onClick={() => switchUser(user)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {user.prenoms[0]} {user.nom}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        user.role === "superviseur"
                          ? "bg-purple-500"
                          : user.role === "vendeuse"
                          ? "bg-orange-500"
                          : user.role === "livreur"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span className="capitalize">{user.role}</span>
                    {user.level === "admin" && (
                      <span className="bg-blue-100 text-blue-800 px-1 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </button>
              ))}

              <button
                onClick={clearUser}
                className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors">
                🚪 Déconnexion (aucun user)
              </button>
            </div>
          </div>

          {/* Features testées */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              ✅ Features à Tester
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-blue-50 rounded">
                <div className="font-medium">📱 Mobile:</div>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• Header collapse auto (10s)</li>
                  <li>• AppToolbar 6 icônes</li>
                  <li>• Sidebar overlay</li>
                  <li>• Badge coloré par rôle</li>
                </ul>
              </div>

              <div className="p-2 bg-green-50 rounded">
                <div className="font-medium">🖥️ Desktop:</div>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• Header une ligne</li>
                  <li>• Navigation directe</li>
                  <li>• Dropdown profil</li>
                  <li>• Changement thème</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              ⚡ Actions Rapides
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full p-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                🔄 Recharger la page
              </button>

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full p-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                🗑️ Clear localStorage
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ResponsiveTestHelper;

// ===========================================
// UTILISATION DANS APP.JSX
// ===========================================

/* Ajouter dans App.jsx en mode développement :

import ResponsiveTestHelper from '@/components/dev/ResponsiveTestHelper';

const App = () => {
  return (
    <Router>
      <div className="App min-h-screen">
        <ResponsiveTestHelper />
      </div>
    </Router>
  );
};

*/
