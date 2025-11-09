/**
 * DesktopProfiles.jsx
 * Liste de tous les profils utilisateurs avec filtres
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "@/toolkits/admin/userToolkit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, RefreshCw, Search, Eye, Edit, UserCog, User, UserCircle, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const DesktopProfiles = () => {
  const navigate = useNavigate();
  const { users, loading, refetch } = useUsers();
  const [filtreRole, setFiltreRole] = useState("");
  const [filtreSexe, setFiltreSexe] = useState("");
  const [recherche, setRecherche] = useState("");

  const usersFiltres = useMemo(() => {
    let filtered = users;
    if (filtreRole) filtered = filtered.filter((u) => u.role === filtreRole);
    if (filtreSexe) filtered = filtered.filter((u) => u.sexe === filtreSexe);
    if (recherche) {
      const search = recherche.toLowerCase();
      filtered = filtered.filter((u) =>
        u.nom?.toLowerCase().includes(search) ||
        u.prenoms?.some((p) => p.toLowerCase().includes(search)) ||
        u.email?.toLowerCase().includes(search) ||
        u.contact?.includes(search)
      );
    }
    return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [users, filtreRole, filtreSexe, recherche]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    regularUsers: users.filter((u) => u.role === "user" || !u.role).length,
    male: users.filter((u) => u.sexe === "m").length,
    female: users.filter((u) => u.sexe === "f").length,
  }), [users]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(timestamp));
  };

  if (loading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-16 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profils Utilisateurs</h1>
          <p className="text-muted-foreground">{stats.total} utilisateurs • {stats.admins} admins • {stats.regularUsers} users</p>
        </div>
        <Button variant="outline" onClick={() => refetch().then(() => toast.success("Actualisé"))}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-700 font-medium">Total</p><p className="text-3xl font-bold text-blue-900">{stats.total}</p></div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-purple-700 font-medium">Admins</p><p className="text-3xl font-bold text-purple-900">{stats.admins}</p></div>
              <Shield className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-cyan-50 border-cyan-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-cyan-700 font-medium">Hommes</p><p className="text-3xl font-bold text-cyan-900">{stats.male}</p></div>
              <User className="h-10 w-10 text-cyan-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pink-50 border-pink-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-pink-700 font-medium">Femmes</p><p className="text-3xl font-bold text-pink-900">{stats.female}</p></div>
              <UserCircle className="h-10 w-10 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, email, contact..." value={recherche} onChange={(e) => setRecherche(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtreRole} onValueChange={setFiltreRole}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tous les rôles" /></SelectTrigger>
          <SelectContent><SelectItem value="">Tous</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="user">User</SelectItem></SelectContent>
        </Select>
        <Select value={filtreSexe} onValueChange={setFiltreSexe}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tous" /></SelectTrigger>
          <SelectContent><SelectItem value="">Tous</SelectItem><SelectItem value="m">Hommes</SelectItem><SelectItem value="f">Femmes</SelectItem></SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Sexe</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersFiltres.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun utilisateur trouvé</TableCell></TableRow>
            ) : (
              usersFiltres.map((user) => (
                <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/users/profile/${user.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">{user.nom?.charAt(0)}{user.prenoms?.[0]?.charAt(0)}</div>
                      <div>
                        <p className="font-semibold">{user.nom} {user.prenoms?.join(" ")}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.contact}</TableCell>
                  <TableCell><Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role || "user"}</Badge></TableCell>
                  <TableCell>{user.sexe === "m" ? <User className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/profile/${user.id}`); }}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default DesktopProfiles;
