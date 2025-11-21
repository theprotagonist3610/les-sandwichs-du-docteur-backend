/**
 * MobileProfile.jsx
 * Version mobile du profil détaillé d'un utilisateur
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useUser,
  useUserPresence,
  isUserActive,
} from "@/toolkits/admin/userToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  User,
  UserCircle,
  Shield,
  Activity,
  Clock,
  Wifi,
  WifiOff,
  UserCheck,
  UserX,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MobileProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const {
    user,
    loading: loadingUser,
    error: errorUser,
    refetch,
  } = useUser(userId);
  const { presence, loading: loadingPresence } = useUserPresence(userId);
  const [activeTab, setActiveTab] = useState("infos");

  // Forcer le rechargement si userId change
  useEffect(() => {
    if (userId && refetch) {
      refetch();
    }
    console.log(userId);
  }, [userId, refetch]);

  const active = isUserActive(presence, 90000);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Non défini";
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Jamais";
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 30) return "Maintenant";
    if (minutes < 1) return `Il y a ${seconds}s`;
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  const getStatusConfig = () => {
    if (active) {
      return {
        label: "Actif maintenant",
        color: "bg-emerald-500",
        textColor: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: Activity,
      };
    }

    const configs = {
      online: {
        label: "En ligne",
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        icon: UserCheck,
      },
      offline: {
        label: "Hors ligne",
        color: "bg-gray-500",
        textColor: "text-gray-700",
        bgColor: "bg-gray-50",
        icon: UserX,
      },
      away: {
        label: "Absent",
        color: "bg-orange-500",
        textColor: "text-orange-700",
        bgColor: "bg-orange-50",
        icon: Clock,
      },
    };

    return configs[presence?.status] || configs.offline;
  };

  if (loadingUser || loadingPresence) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (errorUser || !user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Utilisateur non trouvé</p>
            <Button
              className="mt-4"
              onClick={() => navigate("/admin/users/profil")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Profil Utilisateur</h1>
      </div>

      {/* Avatar et infos principales */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg ${
                  active
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                    : "bg-gradient-to-br from-blue-400 to-blue-600"
                }`}>
                {user.nom?.charAt(0)}
                {user.prenoms?.[0]?.charAt(0)}
              </div>
              <div
                className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white ${
                  statusConfig.color
                } ${active ? "animate-pulse" : ""}`}
              />
            </div>

            <h2 className="text-xl font-bold mb-1">
              {user.nom} {user.prenoms?.join(" ")}
            </h2>

            <div className="flex gap-2 mb-2">
              <Badge
                variant="outline"
                className={`${statusConfig.bgColor} ${statusConfig.textColor}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>

              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className={
                  user.role === "superviseur"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : user.role === "vendeur"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : user.role === "cuisinier"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : user.role === "livreur"
                    ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                    : ""
                }>
                <Shield className="h-3 w-3 mr-1" />
                {user.role === "admin"
                  ? "Admin"
                  : user.role === "superviseur"
                  ? "Superviseur"
                  : user.role === "vendeur"
                  ? "Vendeur"
                  : user.role === "cuisinier"
                  ? "Cuisinier"
                  : user.role === "livreur"
                  ? "Livreur"
                  : "User"}
              </Badge>
            </div>

            {active && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-700 font-medium">
                  Connexion active
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="presence">Présence</TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="infos" className="space-y-3 mt-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm">{user.contact}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                {user.sexe === "m" ? (
                  <User className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Sexe</p>
                  <p className="text-sm">
                    {user.sexe === "m" ? "Homme" : "Femme"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Date de naissance
                  </p>
                  <p className="text-sm">{formatDate(user.date_naissance)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Membre depuis</p>
                  <p className="text-sm">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Présence */}
        <TabsContent value="presence" className="space-y-3 mt-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {active ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                État de la connexion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <Badge
                  variant="outline"
                  className={`${statusConfig.bgColor} ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </Badge>
              </div>

              {presence?.lastSeen && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Dernier heartbeat
                  </span>
                  <span className="text-sm font-medium">
                    {formatRelativeTime(presence.lastSeen)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Dernière activité
                </span>
                <span className="text-sm font-medium">
                  {formatRelativeTime(
                    presence?.lastSeen || presence?.updatedAt
                  )}
                </span>
              </div>

              {active && (
                <div className="pt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start gap-2">
                    <Wifi className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">
                        Connexion active
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        Heartbeat toutes les 30s. Dernier signal il y a{" "}
                        {Math.floor(
                          (Date.now() - (presence?.lastSeen || 0)) / 1000
                        )}
                        s.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {presence?.updatedAt && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground text-center">
                  Mis à jour {formatDate(presence.updatedAt)}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileProfile;
