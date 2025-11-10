/**
 * DesktopProfile.jsx
 * Page de profil détaillé d'un utilisateur avec présence en temps réel
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser, useUserPresence, isUserActive } from "@/toolkits/admin/userToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  History,
  UserCheck,
  UserX,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const DesktopProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, loading: loadingUser, error: errorUser } = useUser(userId);
  const { presence, loading: loadingPresence } = useUserPresence(userId);
  const [activeTab, setActiveTab] = useState("infos");

  const active = isUserActive(presence, 90000);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Non défini";
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Jamais";
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 30) return "En ce moment";
    if (minutes < 1) return `Il y a ${seconds} secondes`;
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  };

  const getStatusConfig = () => {
    if (active) {
      return {
        label: "Actif maintenant",
        color: "bg-emerald-500",
        textColor: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        icon: Activity,
        description: "L'utilisateur envoie des heartbeats actifs",
      };
    }

    const statusConfigs = {
      online: {
        label: "En ligne",
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: UserCheck,
        description: "Connecté mais pas d'activité récente",
      },
      offline: {
        label: "Hors ligne",
        color: "bg-gray-500",
        textColor: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: UserX,
        description: "Non connecté",
      },
      away: {
        label: "Absent",
        color: "bg-orange-500",
        textColor: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: Clock,
        description: "Inactif depuis un moment",
      },
    };

    return statusConfigs[presence?.status] || statusConfigs.offline;
  };

  if (loadingUser || loadingPresence) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px] col-span-2" />
        </div>
      </div>
    );
  }

  if (errorUser || !user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <UserX className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Utilisateur non trouvé</p>
            <Button className="mt-4" onClick={() => navigate("/admin/users/profil")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users/profil")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profil Utilisateur</h1>
            <p className="text-muted-foreground">Détails et activité en temps réel</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/admin/users/profil/${userId}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Informations principales */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Avatar et statut */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg ${
                      active
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                        : "bg-gradient-to-br from-blue-400 to-blue-600"
                    }`}
                  >
                    {user.nom?.charAt(0)}
                    {user.prenoms?.[0]?.charAt(0)}
                  </div>
                  <div
                    className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white ${statusConfig.color} ${
                      active || presence?.status === "online" ? "animate-pulse" : ""
                    }`}
                  >
                    {active && (
                      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-1">
                  {user.nom} {user.prenoms?.join(" ")}
                </h2>

                <Badge
                  variant="outline"
                  className={`${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} mb-3`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>

                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="mb-4">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role === "admin" ? "Administrateur" : "Utilisateur"}
                </Badge>

                <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Présence en temps réel */}
          <Card className={`${statusConfig.borderColor} border-2`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {active ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                État de la connexion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <span className="text-sm font-medium">{statusConfig.label}</span>
              </div>

              {presence?.lastSeen && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dernier heartbeat</span>
                  <span className="text-sm font-medium">{formatRelativeTime(presence.lastSeen)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dernière activité</span>
                <span className="text-sm font-medium">
                  {formatRelativeTime(presence?.lastSeen || presence?.updatedAt)}
                </span>
              </div>

              {presence?.updatedAt && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Mis à jour {formatDate(presence.updatedAt)}
                  </p>
                </div>
              )}

              {active && (
                <div className="pt-3">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 border border-emerald-200">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-700 font-medium">Connexion active</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Membre depuis</span>
                <span className="text-sm font-medium">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dernière connexion</span>
                <span className="text-sm font-medium">
                  {formatRelativeTime(presence?.lastSeen || presence?.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main content - Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="infos">
                <Info className="h-4 w-4 mr-2" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="presence">
                <Activity className="h-4 w-4 mr-2" />
                Présence
              </TabsTrigger>
              <TabsTrigger value="historique">
                <History className="h-4 w-4 mr-2" />
                Historique
              </TabsTrigger>
            </TabsList>

            {/* Onglet Informations */}
            <TabsContent value="infos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nom</label>
                      <p className="text-lg font-semibold mt-1">{user.nom}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Prénom(s)</label>
                      <p className="text-lg font-semibold mt-1">{user.prenoms?.join(" ")}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block">Email</label>
                        <p className="text-base">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block">Contact</label>
                        <p className="text-base">{user.contact}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {user.sexe === "m" ? (
                        <User className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block">Sexe</label>
                        <p className="text-base">{user.sexe === "m" ? "Homme" : "Femme"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block">Date de naissance</label>
                        <p className="text-base">{formatDate(user.date_naissance)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ID Utilisateur</span>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{user.id}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rôle</span>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role || "user"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date de création</span>
                    <span className="text-sm font-medium">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dernière mise à jour</span>
                    <span className="text-sm font-medium">{formatDate(user.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Présence */}
            <TabsContent value="presence" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Détails de la présence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                      <p className="text-sm text-muted-foreground mb-1">Statut actuel</p>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-5 w-5 ${statusConfig.textColor}`} />
                        <p className="text-lg font-bold">{statusConfig.label}</p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg ${active ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"} border`}>
                      <p className="text-sm text-muted-foreground mb-1">Activité réelle</p>
                      <div className="flex items-center gap-2">
                        {active ? (
                          <>
                            <Activity className="h-5 w-5 text-emerald-700" />
                            <p className="text-lg font-bold text-emerald-700">Actif</p>
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-5 w-5 text-gray-700" />
                            <p className="text-lg font-bold text-gray-700">Inactif</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {presence?.lastSeen && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-1">
                          Dernier heartbeat (lastSeen)
                        </label>
                        <p className="text-base font-semibold">{formatRelativeTime(presence.lastSeen)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(presence.lastSeen)}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1">
                        Dernière mise à jour (updatedAt)
                      </label>
                      <p className="text-base font-semibold">{formatRelativeTime(presence?.updatedAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(presence?.updatedAt)}</p>
                    </div>

                    {presence?.userName && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-1">
                          Nom affiché
                        </label>
                        <p className="text-base">{presence.userName}</p>
                      </div>
                    )}
                  </div>

                  {active && (
                    <div className="pt-4">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                        <Wifi className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-emerald-900">Connexion active détectée</p>
                          <p className="text-sm text-emerald-700 mt-1">
                            L'utilisateur envoie des heartbeats toutes les 30 secondes. Dernier heartbeat il y a{" "}
                            {Math.floor((Date.now() - (presence?.lastSeen || 0)) / 1000)} secondes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Historique */}
            <TabsContent value="historique" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historique d'activité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      </div>
                      <div className="pb-8">
                        <p className="font-medium">
                          {active ? "Actif maintenant" : statusConfig.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatRelativeTime(presence?.lastSeen || presence?.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      </div>
                      <div className="pb-8">
                        <p className="font-medium">Compte créé</p>
                        <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>

                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">L'historique complet sera bientôt disponible</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default DesktopProfile;
