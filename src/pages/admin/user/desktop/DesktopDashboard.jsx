/**
 * DesktopDashboard.jsx
 * Dashboard de supervision des utilisateurs
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "@/toolkits/admin/userToolkit";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/firebase";
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
  RefreshCw,
  Eye,
  ListFilter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
  const { users, loading: loadingUsers, refetch } = useUsers();
  const [presences, setPresences] = useState({});
  const [loadingPresences, setLoadingPresences] = useState(true);

  // Real-time listener pour les présences
  useEffect(() => {
    const presencesRef = ref(rtdb, "presence");

    const unsubscribe = onValue(presencesRef, (snapshot) => {
      if (snapshot.exists()) {
        setPresences(snapshot.val());
      } else {
        setPresences({});
      }
      setLoadingPresences(false);
    }, (error) => {
      console.error("Erreur RTDB:", error);
      toast.error("Erreur de connexion au monitoring temps réel");
      setLoadingPresences(false);
    });

    return () => unsubscribe();
  }, []);

  // Calcul des KPIs
  const kpis = useMemo(() => {
    const presencesList = Object.values(presences);
    const online = presencesList.filter((p) => p.status === "online").length;
    const offline = presencesList.filter((p) => p.status === "offline").length;
    const away = presencesList.filter((p) => p.status === "away").length;

    const male = users.filter((u) => u.sexe === "m").length;
    const female = users.filter((u) => u.sexe === "f").length;

    // Nouveaux utilisateurs (7 derniers jours)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsers = users.filter((u) => u.createdAt >= sevenDaysAgo).length;

    return {
      total: users.length,
      online,
      offline,
      away,
      male,
      female,
      newUsers,
    };
  }, [users, presences]);

  // Utilisateurs récemment actifs
  const recentlyActive = useMemo(() => {
    const presencesList = Object.entries(presences).map(([userId, data]) => ({
      userId,
      ...data,
      user: users.find((u) => u.id === userId),
    }));

    return presencesList
      .filter((p) => p.user)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 5);
  }, [presences, users]);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Données actualisées");
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Jamais";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  if (loadingUsers || loadingPresences) {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Utilisateurs</h1>
          <p className="text-muted-foreground">
            Supervision et monitoring en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => navigate("/admin/user/profiles")}>
            <ListFilter className="h-4 w-4 mr-2" />
            Voir tous les profils
          </Button>
        </div>
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
                <p className="text-3xl font-bold text-blue-900">{kpis.total}</p>
                <p className="text-xs text-blue-600">
                  {kpis.male} H / {kpis.female} F
                </p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">En ligne</p>
                <p className="text-3xl font-bold text-green-900">
                  {kpis.online}
                </p>
                <p className="text-xs text-green-600">
                  {kpis.total > 0
                    ? Math.round((kpis.online / kpis.total) * 100)
                    : 0}
                  % actifs
                </p>
              </div>
              <UserCheck className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">Hors ligne</p>
                <p className="text-3xl font-bold text-gray-900">
                  {kpis.offline}
                </p>
                <p className="text-xs text-gray-600">
                  {kpis.away} absents
                </p>
              </div>
              <UserX className="h-10 w-10 text-gray-600" />
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
                  {kpis.newUsers}
                </p>
                <p className="text-xs text-purple-600">Utilisateurs récents</p>
              </div>
              <Clock className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution et Activité */}
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
                    {kpis.male}
                  </span>
                  <Badge variant="secondary">
                    {kpis.total > 0
                      ? Math.round((kpis.male / kpis.total) * 100)
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
                      kpis.total > 0 ? (kpis.male / kpis.total) * 100 : 0
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
                    {kpis.female}
                  </span>
                  <Badge variant="secondary">
                    {kpis.total > 0
                      ? Math.round((kpis.female / kpis.total) * 100)
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
                      kpis.total > 0 ? (kpis.female / kpis.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Activité récente</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/admin/user/presence")}
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyActive.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité récente
              </p>
            ) : (
              <div className="space-y-3">
                {recentlyActive.map((presence) => {
                  const config = STATUS_CONFIG[presence.status] || STATUS_CONFIG.offline;
                  return (
                    <div
                      key={presence.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/admin/user/profile/${presence.userId}`)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                            {presence.user?.nom?.charAt(0)}
                            {presence.user?.prenoms?.[0]?.charAt(0)}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 ${config.color} rounded-full border-2 border-white ${
                              presence.status === "online" ? "animate-pulse" : ""
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {presence.user?.nom} {presence.user?.prenoms?.join(" ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {presence.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={`${config.bgLight} ${config.textColor} ${config.borderColor}`}
                        >
                          {config.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(presence.updatedAt)}
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

      {/* Accès rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/user/presence")}
        >
          <CardContent className="pt-6 text-center">
            <UserCheck className="h-12 w-12 mx-auto mb-3 text-green-600" />
            <p className="font-semibold mb-1">Monitoring Présence</p>
            <p className="text-sm text-muted-foreground">
              Surveillance en temps réel
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/user/profiles")}
        >
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-blue-600" />
            <p className="font-semibold mb-1">Tous les Profils</p>
            <p className="text-sm text-muted-foreground">
              Gérer les utilisateurs
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-purple-600" />
            <p className="font-semibold mb-1">Historique</p>
            <p className="text-sm text-muted-foreground">
              Logs et activités
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesktopDashboard;
