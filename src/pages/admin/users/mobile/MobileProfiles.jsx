/**
 * MobileProfiles.jsx
 * Version mobile de la liste des utilisateurs avec filtres et gestion
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  User,
  UserCircle,
  Activity,
  Wifi,
  Download,
  Plus,
  ChevronRight,
  Phone,
  Mail,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_CONFIG = {
  online: {
    label: "En ligne",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
  },
  offline: {
    label: "Hors ligne",
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
  },
  away: {
    label: "Absent",
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
  },
};

const MobileProfiles = () => {
  const navigate = useNavigate();
  const { users: usersWithPresence, loading, error } = useUsersWithPresence();

  // États des filtres
  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("all");
  const [filtreSexe, setFiltreSexe] = useState("all");
  const [filtreStatus, setFiltreStatus] = useState("all");
  const [tri, setTri] = useState("nom");
  const [showFilters, setShowFilters] = useState(false);

  // Appliquer tous les filtres
  const usersFiltres = useMemo(() => {
    let filtered = usersWithPresence;

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

    // Filtre rôle
    if (filtreRole !== "all") {
      filtered = filtered.filter((u) => u.role === filtreRole);
    }

    // Filtre sexe
    if (filtreSexe !== "all") {
      filtered = filtered.filter((u) => u.sexe === filtreSexe);
    }

    // Filtre status
    if (filtreStatus === "active") {
      filtered = filtered.filter((u) => isUserActive(u.presence, 90000));
    } else if (filtreStatus !== "all") {
      filtered = filtered.filter((u) => u.presence?.status === filtreStatus);
    }

    // Tri
    switch (tri) {
      case "nom":
        return filtered.sort((a, b) => a.nom.localeCompare(b.nom));
      case "activity":
        return filtered.sort(
          (a, b) =>
            (b.presence?.lastSeen || b.presence?.updatedAt || 0) -
            (a.presence?.lastSeen || a.presence?.updatedAt || 0)
        );
      default:
        return filtered;
    }
  }, [usersWithPresence, recherche, filtreRole, filtreSexe, filtreStatus, tri]);

  // Statistiques
  const stats = useMemo(() => {
    const total = usersFiltres.length;
    const actifs = usersFiltres.filter((u) => isUserActive(u.presence, 90000)).length;
    const online = usersFiltres.filter((u) => u.presence?.status === "online").length;

    return { total, actifs, online };
  }, [usersFiltres]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Jamais";
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 30) return "Maintenant";
    if (minutes < 1) return `${seconds}s`;
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
  };

  const handleExportCSV = () => {
    const headers = ["Nom", "Prénoms", "Email", "Contact", "Sexe", "Rôle", "Statut"];
    const rows = usersFiltres.map((u) => [
      u.nom,
      u.prenoms?.join(" "),
      u.email,
      u.contact,
      u.sexe === "m" ? "Homme" : "Femme",
      u.role,
      u.presence?.status || "offline",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Export CSV réussi");
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    toast.error("Erreur lors du chargement des utilisateurs");
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Profils
          </h1>
          <Button size="sm" onClick={() => navigate("/admin/users/nouveau")}>
            <Plus className="h-4 w-4 mr-1" />
            Nouveau
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {stats.total} utilisateurs · {stats.actifs} actifs
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-3 pb-3 px-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-3 pb-3 px-3">
            <p className="text-xs text-emerald-700">Actifs</p>
            <p className="text-xl font-bold text-emerald-900">{stats.actifs}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-3 pb-3 px-3">
            <p className="text-xs text-green-700">En ligne</p>
            <p className="text-xl font-bold text-green-900">{stats.online}</p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-9"
          />
        </div>
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filtres et tri</SheetTitle>
              <SheetDescription>
                Affinez votre recherche d'utilisateurs
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rôle</label>
                <Select value={filtreRole} onValueChange={setFiltreRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les rôles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="superviseur">Superviseur</SelectItem>
                    <SelectItem value="vendeur">Vendeur</SelectItem>
                    <SelectItem value="cuisinier">Cuisinier</SelectItem>
                    <SelectItem value="livreur">Livreur</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sexe</label>
                <Select value={filtreSexe} onValueChange={setFiltreSexe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="m">Hommes</SelectItem>
                    <SelectItem value="f">Femmes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select value={filtreStatus} onValueChange={setFiltreStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Vraiment actifs</SelectItem>
                    <SelectItem value="online">En ligne</SelectItem>
                    <SelectItem value="away">Absents</SelectItem>
                    <SelectItem value="offline">Hors ligne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Trier par</label>
                <Select value={tri} onValueChange={setTri}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nom">Nom (A-Z)</SelectItem>
                    <SelectItem value="activity">Activité récente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFiltreRole("all");
                    setFiltreSexe("all");
                    setFiltreStatus("all");
                    setTri("nom");
                  }}
                >
                  Réinitialiser
                </Button>
                <Button className="flex-1" onClick={() => setShowFilters(false)}>
                  Appliquer
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Liste des utilisateurs */}
      <div className="space-y-2">
        {usersFiltres.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </CardContent>
          </Card>
        ) : (
          usersFiltres.map((user) => {
            const config = STATUS_CONFIG[user.presence?.status] || STATUS_CONFIG.offline;
            const active = isUserActive(user.presence, 90000);

            return (
              <Card
                key={user.id}
                className="cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                onClick={() => navigate(`/admin/users/profil/${user.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                            active
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                              : "bg-gradient-to-br from-blue-400 to-blue-600"
                          }`}
                        >
                          {user.nom?.charAt(0)}
                          {user.prenoms?.[0]?.charAt(0)}
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            active ? "bg-emerald-500 animate-pulse" : config.color
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {user.nom} {user.prenoms?.join(" ")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={
                              user.role === "admin"
                                ? "bg-purple-50 text-purple-700 border-purple-200 text-xs"
                                : user.role === "superviseur"
                                ? "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                                : user.role === "vendeur"
                                ? "bg-green-50 text-green-700 border-green-200 text-xs"
                                : user.role === "cuisinier"
                                ? "bg-orange-50 text-orange-700 border-orange-200 text-xs"
                                : user.role === "livreur"
                                ? "bg-cyan-50 text-cyan-700 border-cyan-200 text-xs"
                                : "text-xs"
                            }
                          >
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
                          <Badge
                            variant="outline"
                            className={`${
                              active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : `${config.bgColor} ${config.textColor}`
                            } text-xs`}
                          >
                            {active ? (
                              <>
                                <Activity className="h-3 w-3 mr-1" />
                                Actif
                              </>
                            ) : (
                              config.label
                            )}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pl-15">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.contact && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{user.contact}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground mt-2 pl-15">
                    Dernière activité:{" "}
                    {formatRelativeTime(user.presence?.lastSeen || user.presence?.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Bouton Export (flottant) */}
      {usersFiltres.length > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleExportCSV}
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter en CSV ({usersFiltres.length})
        </Button>
      )}
    </div>
  );
};

export default MobileProfiles;
