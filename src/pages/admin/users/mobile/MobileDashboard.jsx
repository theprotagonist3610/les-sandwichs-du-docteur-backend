/**
 * MobileDashboard.jsx
 * Version mobile du dashboard de supervision
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserMetrics } from "@/toolkits/admin/userToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, UserCheck, UserX, Clock, RefreshCw, Eye } from "lucide-react";
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

const MobileDashboard = () => {
  const navigate = useNavigate();
  const { metrics, users, loading, error } = useUserMetrics();

  const recentlyActive = useMemo(() => {
    return users
      .filter((u) => u.presence)
      .sort(
        (a, b) => (b.presence?.updatedAt || 0) - (a.presence?.updatedAt || 0)
      )
      .slice(0, 3);
  }, [users]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Jamais";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "maintenant";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    toast.error("Erreur de connexion au monitoring temps réel");
  }

  return (
    <div className="pb-20">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Supervision</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-100px)]">
        <div className="p-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <Users className="h-6 w-6 text-blue-600 mb-2" />
                <p className="text-[10px] text-blue-700">Total</p>
                <p className="text-xl font-bold text-blue-900">
                  {metrics.total}
                </p>
                <p className="text-[10px] text-blue-600">utilisateurs</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4 pb-4">
                <UserCheck className="h-6 w-6 text-green-600 mb-2" />
                <p className="text-[10px] text-green-700">En ligne</p>
                <p className="text-xl font-bold text-green-900">
                  {metrics.online}
                </p>
                <p className="text-[10px] text-green-600">actifs</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-4 pb-4">
                <UserX className="h-6 w-6 text-gray-600 mb-2" />
                <p className="text-[10px] text-gray-700">Hors ligne</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics.offline}
                </p>
                <p className="text-[10px] text-gray-600">
                  {metrics.away} absents
                </p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4 pb-4">
                <Clock className="h-6 w-6 text-purple-600 mb-2" />
                <p className="text-[10px] text-purple-700">Nouveaux</p>
                <p className="text-xl font-bold text-purple-900">
                  {metrics.newUsers}
                </p>
                <p className="text-[10px] text-purple-600">7 derniers j</p>
              </CardContent>
            </Card>
          </div>

          {/* Activité récente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Activité récente</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate("/admin/users/presence")}>
                  <Eye className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentlyActive.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Aucune activité
                </p>
              ) : (
                recentlyActive.map((user) => {
                  const config =
                    STATUS_CONFIG[user.presence?.status] ||
                    STATUS_CONFIG.offline;
                  return (
                    <Card
                      key={user.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/admin/users/profiles/${user.id}`)
                      }>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                {user.nom?.charAt(0)}
                                {user.prenoms?.[0]?.charAt(0)}
                              </div>
                              <div
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${config.color} rounded-full border border-white`}
                              />
                            </div>
                            <div>
                              <p className="text-xs font-semibold line-clamp-1">
                                {user.nom} {user.prenoms?.[0]}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatRelativeTime(user.presence?.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${config.bgLight} ${config.textColor} text-[10px]`}>
                            {config.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Accès rapides */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Accès rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/users/presence")}>
                <UserCheck className="h-4 w-4 mr-2" />
                Monitoring Présence
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/users/profiles")}>
                <Users className="h-4 w-4 mr-2" />
                Tous les Profils
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MobileDashboard;
