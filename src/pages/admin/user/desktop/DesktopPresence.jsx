/**
 * DesktopPresence.jsx
 * Monitoring temps réel des utilisateurs connectés
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUsersWithPresence } from "@/toolkits/admin/userToolkit";
import { Card, CardContent } from "@/components/ui/card";
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
  RefreshCw,
  Search,
  User,
  UserCircle,
  Mail,
  Phone,
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
    if (filtreStatus) {
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
            (b.presence?.updatedAt || 0) - (a.presence?.updatedAt || 0)
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

  // KPIs
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

    return { online, offline, away };
  }, [usersWithPresence]);

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
          <h1 className="text-3xl font-bold">Monitoring Présence</h1>
          <p className="text-muted-foreground">Surveillance en temps réel</p>
        </div>
      </div>

      {/* KPIs compacts */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">En ligne</p>
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
                <p className="text-sm text-orange-700">Absents</p>
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
                <p className="text-sm text-gray-700">Hors ligne</p>
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous</SelectItem>
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
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersFiltres.map((user) => {
            const config =
              STATUS_CONFIG[user.presence.status] || STATUS_CONFIG.offline;
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
                    isOnline ? "ring-2 ring-green-200" : ""
                  }`}
                  onClick={() => navigate(`/admin/user/profile/${user.id}`)}
                >
                  <CardContent className="p-4">
                    {/* Header avec avatar */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {user.nom?.charAt(0)}
                          {user.prenoms?.[0]?.charAt(0)}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 ${config.color} rounded-full border-2 border-white ${
                            isOnline ? "animate-pulse" : ""
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">
                          {user.nom} {user.prenoms?.join(" ")}
                        </p>
                        <Badge
                          variant="outline"
                          className={`${config.bgLight} ${config.textColor} ${config.borderColor} text-[10px] mt-1`}
                        >
                          {config.label}
                        </Badge>
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
                      <div className="flex items-center gap-1 text-muted-foreground pt-2 border-t">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatRelativeTime(user.presence.updatedAt)}
                        </span>
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
