/**
 * MobilePresence.jsx
 * Version mobile du monitoring présence temps réel
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUsersWithPresence } from "@/toolkits/admin/userToolkit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserCheck, UserX, Clock, RefreshCw, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_CONFIG = {
  online: { label: "En ligne", color: "bg-green-500", bgLight: "bg-green-50", textColor: "text-green-700" },
  offline: { label: "Hors ligne", color: "bg-gray-500", bgLight: "bg-gray-50", textColor: "text-gray-700" },
  away: { label: "Absent", color: "bg-orange-500", bgLight: "bg-orange-50", textColor: "text-orange-700" },
};

const MobilePresence = () => {
  const navigate = useNavigate();
  const { users: usersWithPresence, loading, error } = useUsersWithPresence();
  const [filtreStatus, setFiltreStatus] = useState("");
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState("activity");

  const usersFiltres = useMemo(() => {
    let filtered = usersWithPresence;
    if (filtreStatus) filtered = filtered.filter((u) => u.presence.status === filtreStatus);
    if (recherche) {
      const search = recherche.toLowerCase();
      filtered = filtered.filter((u) =>
        u.nom?.toLowerCase().includes(search) ||
        u.prenoms?.some((p) => p.toLowerCase().includes(search)) ||
        u.email?.toLowerCase().includes(search)
      );
    }
    switch (tri) {
      case "activity": return filtered.sort((a, b) => (b.presence?.updatedAt || 0) - (a.presence?.updatedAt || 0));
      case "nom": return filtered.sort((a, b) => a.nom.localeCompare(b.nom));
      default: return filtered;
    }
  }, [usersWithPresence, filtreStatus, recherche, tri]);

  const kpis = useMemo(() => ({
    online: usersWithPresence.filter((u) => u.presence.status === "online").length,
    offline: usersWithPresence.filter((u) => u.presence.status === "offline").length,
    away: usersWithPresence.filter((u) => u.presence.status === "away").length,
  }), [usersWithPresence]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Jamais";
    const diff = Date.now() - timestamp;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "maintenant";
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
  };

  if (loading) {
    return <div className="p-4 space-y-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  if (error) {
    toast.error("Erreur de connexion au monitoring temps réel");
  }

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Présence</h1>
            <p className="text-xs text-muted-foreground">Temps réel</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <UserCheck className="h-4 w-4 text-green-600 mb-1" />
              <p className="text-lg font-bold text-green-900">{kpis.online}</p>
              <p className="text-[10px] text-green-700">En ligne</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3">
              <Clock className="h-4 w-4 text-orange-600 mb-1" />
              <p className="text-lg font-bold text-orange-900">{kpis.away}</p>
              <p className="text-[10px] text-orange-700">Absents</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-3">
              <UserX className="h-4 w-4 text-gray-600 mb-1" />
              <p className="text-lg font-bold text-gray-900">{kpis.offline}</p>
              <p className="text-[10px] text-gray-700">Hors ligne</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={recherche} onChange={(e) => setRecherche(e.target.value)} className="pl-8 h-9 text-sm" />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9"><Filter className="h-4 w-4" /></Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[300px]">
              <SheetHeader><SheetTitle>Filtres</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Statut</label>
                  <Select value={filtreStatus} onValueChange={setFiltreStatus}>
                    <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="online">En ligne</SelectItem>
                      <SelectItem value="away">Absents</SelectItem>
                      <SelectItem value="offline">Hors ligne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tri</label>
                  <Select value={tri} onValueChange={setTri}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activity">Activité récente</SelectItem>
                      <SelectItem value="nom">Nom (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="p-4 space-y-2">
          {usersFiltres.length === 0 ? (
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Aucun utilisateur</p></CardContent></Card>
          ) : (
            usersFiltres.map((user) => {
              const config = STATUS_CONFIG[user.presence.status] || STATUS_CONFIG.offline;
              const isOnline = user.presence.status === "online";
              return (
                <Card key={user.id} className={`cursor-pointer ${isOnline ? "border-green-300" : ""}`} onClick={() => navigate(`/admin/users/profile/${user.id}`)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                            {user.nom?.charAt(0)}{user.prenoms?.[0]?.charAt(0)}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${config.color} rounded-full border border-white ${isOnline ? "animate-pulse" : ""}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold line-clamp-1">{user.nom} {user.prenoms?.[0]}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className={`${config.bgLight} ${config.textColor} text-[10px]`}>{config.label}</Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(user.presence.updatedAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MobilePresence;
