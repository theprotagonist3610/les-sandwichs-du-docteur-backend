/**
 * DesktopPresence.jsx
 * Monitoring temps réel avec détection d'activité réelle (heartbeat)
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUsersWithPresence, isUserActive } from "@/toolkits/admin/userToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCheck,
  UserX,
  Clock,
  Search,
  User,
  UserCircle,
  Mail,
  Phone,
  Activity,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

const DesktopPresence = () => {
  const navigate = useNavigate();
  const { users: usersWithPresence, loading, error } = useUsersWithPresence();
  const [filtreStatus, setFiltreStatus] = useState("");
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState("activity");

  // Appliquer filtres
  const usersFiltres = useMemo(() => {
    let filtered = usersWithPresence;

    // Filtre status
    if (filtreStatus === "active") {
      // Filtre spécial : seulement les vraiment actifs
      filtered = filtered.filter((u) => isUserActive(u.presence, 90000));
    } else if (filtreStatus) {
      filtered = filtered.filter((u) => u.presence.status === filtreStatus);
    }

    // Recherche
    if (recherche) {
      const search = recherche.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nom?.toLowerCase().includes(search) ||
          u.prenoms?.some((p) => p.toLowerCase().includes(search)) ||
          u.email?.toLowerCase().includes(search) ||
          u.contact?.includes(search)
      );
    }

    // Tri
    switch (tri) {
      case "activity":
        return filtered.sort(
          (a, b) =>
            (b.presence?.lastSeen || b.presence?.updatedAt || 0) -
            (a.presence?.lastSeen || a.presence?.updatedAt || 0)
        );
      case "nom":
        return filtered.sort((a, b) => a.nom.localeCompare(b.nom));
      case "status":
        const statusOrder = { online: 0, away: 1, offline: 2 };
        return filtered.sort(
          (a, b) =>
            statusOrder[a.presence.status] - statusOrder[b.presence.status]
        );
      default:
        return filtered;
    }
  }, [usersWithPresence, filtreStatus, recherche, tri]);

  // KPIs avec distinction actifs/en ligne
  const kpis = useMemo(() => {
    const online = usersWithPresence.filter(
      (u) => u.presence.status === "online"
    ).length;
    const offline = usersWithPresence.filter(
      (u) => u.presence.status === "offline"
    ).length;
    const away = usersWithPresence.filter(
      (u) => u.presence.status === "away"
    ).length;
    const reallyActive = usersWithPresence.filter((u) =>
      isUserActive(u.presence, 90000)
    ).length;

    return { online, offline, away, reallyActive };
  }, [usersWithPresence]);

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
        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    toast.error("Erreur de connexion au monitoring temps réel");
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Monitoring Présence
            <Badge variant="outline" className="text-xs animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              Temps réel
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Surveillance avec détection d'activité réelle (heartbeat)
          </p>
        </div>
      </div>

      {/* KPIs compacts */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Vraiment actifs
                </p>
                <p className="text-2xl font-bold text-emerald-900">{kpis.reallyActive}</p>
              </div>
              <Wifi className="h-8 w-8 text-emerald-600 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700">En ligne</p>
                <p className="text-2xl font-bold text-green-900">{kpis.online}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-700">Absents</p>
                <p className="text-2xl font-bold text-orange-900">{kpis.away}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-700">Hors ligne</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.offline}</p>
              </div>
              <UserX className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, contact..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtreStatus} onValueChange={setFiltreStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous</SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3" />
                Vraiment actifs
              </div>
            </SelectItem>
            <SelectItem value="online">En ligne</SelectItem>
            <SelectItem value="away">Absents</SelectItem>
            <SelectItem value="offline">Hors ligne</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tri} onValueChange={setTri}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activity">Activité récente</SelectItem>
            <SelectItem value="nom">Nom (A-Z)</SelectItem>
            <SelectItem value="status">Statut</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste utilisateurs */}
      {usersFiltres.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <WifiOff className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersFiltres.map((user) => {
            const config =
              STATUS_CONFIG[user.presence.status] || STATUS_CONFIG.offline;
            const active = isUserActive(user.presence, 90000);
            const isOnline = user.presence.status === "online";

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer hover:shadow-md transition-all ${config.borderColor} ${
                    active ? "ring-2 ring-emerald-300" : ""
                  }`}
                  onClick={() => navigate(`/admin/users/profil/${user.id}`)}
                >
                  <CardContent className="p-4">
                    {/* Header avec avatar */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          active
                            ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                            : "bg-gradient-to-br from-blue-400 to-blue-600"
                        }`}>
                          {user.nom?.charAt(0)}
                          {user.prenoms?.[0]?.charAt(0)}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 ${
                            active ? "bg-emerald-500" : config.color
                          } rounded-full border-2 border-white ${
                            active ? "animate-pulse" : isOnline ? "animate-pulse" : ""
                          }`}
                        >
                          {active && (
                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">
                          {user.nom} {user.prenoms?.join(" ")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`${
                              active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : `${config.bgLight} ${config.textColor} ${config.borderColor}`
                            } text-[10px]`}
                          >
                            {active ? (
                              <>
                                <Activity className="h-2 w-2 mr-1" />
                                Actif
                              </>
                            ) : (
                              config.label
                            )}
                          </Badge>
                        </div>
                      </div>
                      {user.sexe && (
                        <div className="text-muted-foreground">
                          {user.sexe === "m" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <UserCircle className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Informations */}
                    <div className="space-y-2 text-xs">
                      {user.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="line-clamp-1">{user.email}</span>
                        </div>
                      )}
                      {user.contact && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{user.contact}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatRelativeTime(user.presence.lastSeen || user.presence.updatedAt)}
                          </span>
                        </div>
                        {active && (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                            <Wifi className="h-2 w-2 mr-1" />
                            Live
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DesktopPresence;
