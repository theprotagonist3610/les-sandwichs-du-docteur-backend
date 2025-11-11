/**
 * DesktopProfiles.jsx
 * Liste complète des utilisateurs avec table, filtres et gestion
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  User,
  UserCircle,
  Activity,
  Wifi,
  Download,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_CONFIG = {
  online: {
    label: "En ligne",
    icon: UserCheck,
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  offline: {
    label: "Hors ligne",
    icon: UserX,
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  away: {
    label: "Absent",
    icon: UserCheck,
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
};

const DesktopProfiles = () => {
  const navigate = useNavigate();
  const { users: usersWithPresence, loading, error, refetch } = useUsersWithPresence();

  // États des filtres
  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("all");
  const [filtreSexe, setFiltreSexe] = useState("all");
  const [filtreStatus, setFiltreStatus] = useState("all");
  const [tri, setTri] = useState("nom");

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
      case "email":
        return filtered.sort((a, b) => a.email.localeCompare(b.email));
      case "createdAt":
        return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
    const admins = usersFiltres.filter((u) => u.role === "admin").length;
    const online = usersFiltres.filter((u) => u.presence?.status === "online").length;

    return { total, actifs, admins, online };
  }, [usersFiltres]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
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
    if (minutes < 1) return `${seconds}s`;
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
  };

  const handleExportCSV = () => {
    const headers = ["Nom", "Prénoms", "Email", "Contact", "Sexe", "Rôle", "Statut", "Dernière activité"];
    const rows = usersFiltres.map((u) => [
      u.nom,
      u.prenoms?.join(" "),
      u.email,
      u.contact,
      u.sexe === "m" ? "Homme" : "Femme",
      u.role,
      u.presence?.status || "offline",
      formatDate(u.presence?.lastSeen || u.presence?.updatedAt),
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
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    toast.error("Erreur lors du chargement des utilisateurs");
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestion des Profils
          </h1>
          <p className="text-muted-foreground">
            {stats.total} utilisateur{stats.total > 1 ? "s" : ""} · {stats.actifs} actif{stats.actifs > 1 ? "s" : ""} · {stats.admins} admin{stats.admins > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => navigate("/admin/users/nouveau")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700">Vraiment actifs</p>
                <p className="text-2xl font-bold text-emerald-900">{stats.actifs}</p>
              </div>
              <Wifi className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700">En ligne</p>
                <p className="text-2xl font-bold text-green-900">{stats.online}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-700">Admins</p>
                <p className="text-2xl font-bold text-purple-900">{stats.admins}</p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, contact..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="pl-9"
              />
            </div>

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

            <Select value={filtreSexe} onValueChange={setFiltreSexe}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les sexes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="m">Hommes</SelectItem>
                <SelectItem value="f">Femmes</SelectItem>
              </SelectContent>
            </Select>

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

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Trier par:</span>
            <Select value={tri} onValueChange={setTri}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nom">Nom (A-Z)</SelectItem>
                <SelectItem value="email">Email (A-Z)</SelectItem>
                <SelectItem value="createdAt">Date création</SelectItem>
                <SelectItem value="activity">Activité récente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersFiltres.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  usersFiltres.map((user) => {
                    const config = STATUS_CONFIG[user.presence?.status] || STATUS_CONFIG.offline;
                    const active = isUserActive(user.presence, 90000);
                    const StatusIcon = config.icon;

                    return (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/users/profil/${user.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
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
                                  active ? "bg-emerald-500" : config.color
                                } ${active || user.presence?.status === "online" ? "animate-pulse" : ""}`}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {user.nom} {user.prenoms?.join(" ")}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {user.sexe === "m" ? (
                                  <User className="h-3 w-3" />
                                ) : (
                                  <UserCircle className="h-3 w-3" />
                                )}
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="text-sm">{user.contact}</p>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.role === "admin"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : user.role === "superviseur"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : user.role === "vendeur"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : user.role === "cuisinier"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : user.role === "livreur"
                                ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                                : ""
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
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${
                                active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : `${config.bgColor} ${config.textColor} ${config.borderColor}`
                              }`}
                            >
                              {active ? (
                                <>
                                  <Activity className="h-3 w-3 mr-1" />
                                  Actif
                                </>
                              ) : (
                                <>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </>
                              )}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {formatRelativeTime(user.presence?.lastSeen || user.presence?.updatedAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(user.presence?.lastSeen || user.presence?.updatedAt)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="text-sm">{formatDate(user.createdAt)}</p>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/users/profil/${user.id}`);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir le profil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/users/profil/${user.id}/edit`);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.error("Fonctionnalité à implémenter");
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopProfiles;
