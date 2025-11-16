/**
 * DesktopDashboard.jsx
 * Dashboard de supervision des utilisateurs avec système de présence robuste
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserMetrics, isUserActive } from "@/toolkits/admin/userToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  User,
  UserCircle,
  Eye,
  ListFilter,
  Activity,
  Wifi,
  WifiOff,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const STATUS_CONFIG = {
  online: {
    label: "En ligne",
    color: "bg-green-500",
    bgLight: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  offline: {
    label: "Hors ligne",
    color: "bg-gray-500",
    bgLight: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
  },
  away: {
    label: "Absent",
    color: "bg-orange-500",
    bgLight: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
};

const DesktopDashboard = () => {
  const navigate = useNavigate();
  const { metrics, users, loading, error } = useUserMetrics({
    activityThreshold: 90000, // 90 secondes
  });

  // Utilisateurs récemment actifs (vraiment actifs basé sur lastSeen)
  const recentlyActive = useMemo(() => {
    return users
      .filter((u) => u.presence && isUserActive(u.presence, 90000))
      .sort((a, b) => (b.presence?.lastSeen || 0) - (a.presence?.lastSeen || 0))
      .slice(0, 5);
  }, [users]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Jamais";
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 30) return "En ce moment";
    if (minutes < 1) return `Il y a ${seconds}s`;
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    toast.error("Erreur de connexion au monitoring temps réel");
  }

  const activePercentage =
    metrics.total > 0
      ? Math.round((metrics.reallyOnline / metrics.total) * 100)
      : 0;
  const onlinePercentage =
    metrics.total > 0 ? Math.round((metrics.online / metrics.total) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Dashboard Utilisateurs
            <Badge variant="outline" className="text-xs">
              Temps réel
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Supervision et monitoring avec système de présence robuste
          </p>
        </div>
        <Button onClick={() => navigate("/admin/users/profiles")}>
          <ListFilter className="h-4 w-4 mr-2" />
          Voir tous les profils
        </Button>
      </div>

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">
                  Total Utilisateurs
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {metrics.total}
                </p>
                <p className="text-xs text-blue-600">
                  {metrics.male} H / {metrics.female} F
                </p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="z-10">
                <p className="text-sm text-emerald-700 font-medium flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Vraiment Actifs
                </p>
                <p className="text-3xl font-bold text-emerald-900">
                  {metrics.reallyOnline}
                </p>
                <p className="text-xs text-emerald-600">
                  {activePercentage}% du total
                </p>
              </div>
              <Wifi className="h-10 w-10 text-emerald-600 animate-pulse" />
            </div>
            <Progress value={activePercentage} className="mt-3 h-1" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">En ligne</p>
                <p className="text-3xl font-bold text-green-900">
                  {metrics.online}
                </p>
                <p className="text-xs text-green-600">
                  {onlinePercentage}% connectés
                </p>
              </div>
              <UserCheck className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">
                  Nouveaux (7j)
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {metrics.newUsers}
                </p>
                <p className="text-xs text-purple-600">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Utilisateurs récents
                </p>
              </div>
              <Clock className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerte si différence entre online et reallyOnline */}
      {metrics.online > metrics.reallyOnline && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {metrics.online - metrics.reallyOnline} utilisateur(s)
                  marqué(s) "en ligne" mais inactif(s)
                </p>
                <p className="text-xs text-amber-700">
                  Ces utilisateurs n'ont pas envoyé de heartbeat récent (&lt;
                  90s). Ils peuvent avoir perdu leur connexion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution et Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut de connexion */}
        <Card>
          <CardHeader>
            <CardTitle>Statut de connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Vraiment actifs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-900">
                    {metrics.reallyOnline}
                  </span>
                  <Badge variant="secondary">{activePercentage}%</Badge>
                </div>
              </div>
              <Progress
                value={activePercentage}
                className="h-2 bg-emerald-100"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">En ligne (total)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-900">
                    {metrics.online}
                  </span>
                  <Badge variant="secondary">{onlinePercentage}%</Badge>
                </div>
              </div>
              <Progress value={onlinePercentage} className="h-2 bg-green-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <span className="text-sm font-medium">Hors ligne</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {metrics.offline}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Utilisateurs actifs maintenant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                Utilisateurs actifs maintenant
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/admin/users/presence")}>
                <Eye className="h-4 w-4 mr-1" />
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyActive.length === 0 ? (
              <div className="text-center py-8">
                <WifiOff className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucun utilisateur actif en ce moment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentlyActive.map((user) => {
                  const config =
                    STATUS_CONFIG[user.presence?.status] ||
                    STATUS_CONFIG.offline;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/admin/users/profiles/${user.id}`)
                      }>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                            {user.nom?.charAt(0)}
                            {user.prenoms?.[0]?.charAt(0)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse">
                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {user.nom} {user.prenoms?.join(" ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Activity className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(
                            user.presence?.lastSeen || user.presence?.updatedAt
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistiques additionnelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution par sexe */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution par sexe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Hommes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-900">
                    {metrics.male}
                  </span>
                  <Badge variant="secondary">
                    {metrics.total > 0
                      ? Math.round((metrics.male / metrics.total) * 100)
                      : 0}
                    %
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      metrics.total > 0
                        ? (metrics.male / metrics.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-pink-600" />
                  <span className="text-sm font-medium">Femmes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-pink-900">
                    {metrics.female}
                  </span>
                  <Badge variant="secondary">
                    {metrics.total > 0
                      ? Math.round((metrics.female / metrics.total) * 100)
                      : 0}
                    %
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      metrics.total > 0
                        ? (metrics.female / metrics.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribution par rôle */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution par rôle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-sm font-medium">Administrateurs</span>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  {metrics.admins}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm font-medium">Superviseurs</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  {metrics.superviseurs}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">Vendeurs</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  {metrics.vendeurs}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-sm font-medium">Cuisiniers</span>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                  {metrics.cuisiniers}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                  <span className="text-sm font-medium">Livreurs</span>
                </div>
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 border-cyan-200">
                  {metrics.livreurs}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <span className="text-sm font-medium">Utilisateurs</span>
                </div>
                <Badge variant="secondary">
                  {metrics.regularUsers}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
          onClick={() => navigate("/admin/users/presence")}>
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block mb-3">
              <UserCheck className="h-12 w-12 text-green-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <p className="font-semibold mb-1">Monitoring Présence</p>
            <p className="text-sm text-muted-foreground">
              Surveillance en temps réel
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
          onClick={() => navigate("/admin/users/profiles")}>
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-blue-600" />
            <p className="font-semibold mb-1">Tous les Profils</p>
            <p className="text-sm text-muted-foreground">
              Gérer les utilisateurs
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]">
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-purple-600" />
            <p className="font-semibold mb-1">Historique</p>
            <p className="text-sm text-muted-foreground">Logs et activités</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesktopDashboard;
