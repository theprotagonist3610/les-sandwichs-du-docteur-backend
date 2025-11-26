import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import { useComptabiliteSystem } from "@/hooks/useComptabiliteSystem";
import { usePresenceManager } from "@/toolkits/admin/userToolkit";
import { useUser } from "@/toolkits/global/userToolkit";
import { useClotureObligatoire } from "@/hooks/useClotureObligatoire";
import ClotureObligatoireDialog from "@/components/dialogs/ClotureObligatoireDialog";
import NotificationCloture23h from "@/components/dialogs/NotificationCloture23h";
import { usePendingAlerts } from "@/hooks/usePendingAlerts";
import FloatingAlertsNotification from "@/components/dialogs/FloatingAlertsNotification";
import { useAutoCleanup, useAutoCleanupCaches } from "@/utils/notificationHelpers";

const MainLayout = () => {
  // Initialiser le système de comptabilité (notifications, nettoyage, etc.)
  useComptabiliteSystem();

  // Nettoyage automatique des notifications obsolètes (> 48h)
  useAutoCleanup();

  // Nettoyage automatique des caches expirés (toutes les 10 min)
  useAutoCleanupCaches();

  // Initialiser le système de présence avec heartbeat automatique
  usePresenceManager({
    enabled: true,
    heartbeatInterval: 30000 // 30 secondes
  });

  // Récupérer l'utilisateur connecté (sans argument pour l'utilisateur courant)
  const { user } = useUser();
  const isAdmin = user?.role === "admin";

  // Hook de clôture (pour tous les utilisateurs, pas seulement admin)
  const {
    clotureRequise,
    notification23h,
    donneesJournee,
    loading: loadingCloture,
    clotureEnCours,
    lancerCloture,
    cacherNotification23h,
    ouvrirClotureManuelle,
  } = useClotureObligatoire(true); // Activé pour tout le monde

  // Hook pour les alertes en attente (vérification cyclique chaque heure)
  const {
    pendingTodos,
    pendingNotifications,
    showAlert,
    dismissAlert,
  } = usePendingAlerts();

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="pt-26">
        <Outlet />
      </main>

      {/* Dialog clôture obligatoire (Admin ET Non-Admin) */}
      {/*clotureRequise && (
        <ClotureObligatoireDialog
          open={clotureRequise}
          donneesJournee={donneesJournee}
          onLancerCloture={lancerCloture}
          loading={loadingCloture}
          clotureEnCours={clotureEnCours}
          isAdmin={isAdmin}
          userId={user?.id}
          userName={`${user?.nom} ${user?.prenoms?.join(' ')}`}
        />
      )*/}

      {/* Notification 23H (Admin uniquement) */}
      {/*isAdmin && notification23h && !clotureRequise && (
        <NotificationCloture23h
          open={notification23h}
          onDismiss={cacherNotification23h}
          onFaireCloture={ouvrirClotureManuelle}
        />
      )*/}

      {/* Notification flottante des alertes en attente (Mobile: bas gauche) */}
      <FloatingAlertsNotification
        show={showAlert}
        pendingTodos={pendingTodos}
        pendingNotifications={pendingNotifications}
        onDismiss={dismissAlert}
        isMobile={true}
      />
    </div>
  );
};

export default MainLayout;
