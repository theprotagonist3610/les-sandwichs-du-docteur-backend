import { motion } from "framer-motion";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useComptaStore } from "@/stores/comptaStore";
import { useEffect } from "react";

/**
 * 🔄 Indicateur de synchronisation avec Firestore
 * Affiche l'état de sync et le dernier timestamp
 */
export const SyncIndicator = ({ className = "" }) => {
  const { lastSync, isSyncing, isOffline, updateSyncStatus } = useComptaStore();

  // Vérifier l'état de connexion périodiquement
  useEffect(() => {
    const checkConnection = () => {
      updateSyncStatus();
    };

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkConnection, 30000);

    // Écouter les événements online/offline
    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);

    // Vérification initiale
    checkConnection();

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, [updateSyncStatus]);

  const getLastSyncText = () => {
    if (!lastSync) return "Jamais synchronisé";

    try {
      return formatDistanceToNow(new Date(lastSync), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return "Date invalide";
    }
  };

  const getIcon = () => {
    if (isOffline) return <CloudOff className="w-4 h-4 text-red-500" />;
    if (isSyncing)
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    return <Cloud className="w-4 h-4 text-green-500" />;
  };

  const getStatus = () => {
    if (isOffline) return "Hors ligne";
    if (isSyncing) return "Synchronisation...";
    return "Synchronisé";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        bg-gray-100 dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        ${className}
      `}>
      {getIcon()}

      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {getStatus()}
        </span>

        {!isOffline && lastSync && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getLastSyncText()}
          </span>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 🔄 Version compacte (icône uniquement avec tooltip)
 */
export const SyncIndicatorCompact = ({ className = "" }) => {
  const { lastSync, isSyncing, isOffline, updateSyncStatus } = useComptaStore();

  useEffect(() => {
    const checkConnection = () => {
      updateSyncStatus();
    };

    const interval = setInterval(checkConnection, 30000);
    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);
    checkConnection();

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, [updateSyncStatus]);

  const getLastSyncText = () => {
    if (!lastSync) return "Jamais synchronisé";

    try {
      return `Dernière sync: ${formatDistanceToNow(new Date(lastSync), {
        addSuffix: true,
        locale: fr,
      })}`;
    } catch {
      return "Date invalide";
    }
  };

  const getIcon = () => {
    if (isOffline) return <CloudOff className="w-5 h-5 text-red-500" />;
    if (isSyncing)
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    return <Cloud className="w-5 h-5 text-green-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative group ${className}`}
      title={getLastSyncText()}>
      {getIcon()}

      {/* Tooltip */}
      <div
        className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
        px-3 py-2 rounded-lg bg-gray-900 text-white text-xs
        opacity-0 group-hover:opacity-100 transition-opacity
        pointer-events-none whitespace-nowrap z-50
      ">
        {getLastSyncText()}
        <div
          className="
          absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-gray-900
        "
        />
      </div>
    </motion.div>
  );
};
