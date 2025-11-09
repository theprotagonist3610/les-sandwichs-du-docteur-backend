/**
 * MobileProfiles.jsx
 * Version mobile de la liste des profils
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "@/toolkits/admin/userToolkit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, RefreshCw, Search, Filter, User, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const MobileProfiles = () => {
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
        u.nom?.toLowerCase().includes(search) || u.prenoms?.some((p) => p.toLowerCase().includes(search)) || u.email?.toLowerCase().includes(search)
      );
    }
    return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [users, filtreRole, filtreSexe, recherche]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
  }), [users]);

  if (loading) {
    return <div className="p-4 space-y-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  }

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold">Profils</h1><p className="text-xs text-muted-foreground">{stats.total} users • {stats.admins} admins</p></div>
          <Button variant="outline" size="icon" onClick={() => refetch().then(() => toast.success("Actualisé"))}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={recherche} onChange={(e) => setRecherche(e.target.value)} className="pl-8 h-9 text-sm" />
          </div>
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9"><Filter className="h-4 w-4" /></Button></SheetTrigger>
            <SheetContent side="bottom" className="h-[300px]">
              <SheetHeader><SheetTitle>Filtres</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4">
                <div><label className="text-sm font-medium mb-2 block">Rôle</label><Select value={filtreRole} onValueChange={setFiltreRole}><SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger><SelectContent><SelectItem value="">Tous</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="user">User</SelectItem></SelectContent></Select></div>
                <div><label className="text-sm font-medium mb-2 block">Sexe</label><Select value={filtreSexe} onValueChange={setFiltreSexe}><SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger><SelectContent><SelectItem value="">Tous</SelectItem><SelectItem value="m">Hommes</SelectItem><SelectItem value="f">Femmes</SelectItem></SelectContent></Select></div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-150px)]">
        <div className="p-4 space-y-2">
          {usersFiltres.length === 0 ? (
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Aucun utilisateur</p></CardContent></Card>
          ) : (
            usersFiltres.map((user) => (
              <Card key={user.id} className="cursor-pointer" onClick={() => navigate(`/admin/users/profile/${user.id}`)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{user.nom?.charAt(0)}{user.prenoms?.[0]?.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">{user.nom} {user.prenoms?.[0]}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-[10px]">{user.role || "user"}</Badge>
                      {user.sexe === "m" ? <User className="h-3 w-3" /> : <UserCircle className="h-3 w-3" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MobileProfiles;
