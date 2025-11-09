/**
 * MobileProfile.jsx
 * Version mobile du détail profil avec tabs
 */

import { useParams, useNavigate } from "react-router-dom";
import { useUser, useUserPresence } from "@/toolkits/admin/userToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw, Info, Activity, Settings, Mail, Phone, Calendar, User, UserCircle, Shield, Key, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_CONFIG = {
  online: { label: "En ligne", color: "bg-green-500", bgLight: "bg-green-50", textColor: "text-green-700" },
  offline: { label: "Hors ligne", color: "bg-gray-500", bgLight: "bg-gray-50", textColor: "text-gray-700" },
  away: { label: "Absent", color: "bg-orange-500", bgLight: "bg-orange-50", textColor: "text-orange-700" },
};

const MobileProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading, refetch } = useUser(id);
  const { presence } = useUserPresence(id);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(timestamp));
  };

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
    return <div className="p-4 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!user) {
    return <div className="p-4"><Card className="border-red-200 bg-red-50"><CardContent className="pt-6"><p className="text-sm text-red-600">Utilisateur non trouvé</p><Button size="sm" onClick={() => navigate("/admin/user/profiles")} className="mt-4">Retour</Button></CardContent></Card></div>;
  }

  const config = STATUS_CONFIG[presence?.status] || STATUS_CONFIG.offline;
  const isOnline = presence?.status === "online";

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/user/profiles")}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">{user.nom?.charAt(0)}{user.prenoms?.[0]?.charAt(0)}</div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${config.color} rounded-full border border-white ${isOnline ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold line-clamp-1">{user.nom} {user.prenoms?.[0]}</h1>
            <div className="flex gap-1"><Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-[10px]">{user.role || "user"}</Badge><Badge variant="outline" className={`${config.bgLight} ${config.textColor} text-[10px]`}>{config.label}</Badge></div>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch().then(() => toast.success("Actualisé"))}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="p-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="text-xs"><Info className="h-3 w-3 mr-1" />Infos</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs"><Activity className="h-3 w-3 mr-1" />Activité</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs"><Settings className="h-3 w-3 mr-1" />Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-3 mt-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-1">{user.sexe === "m" ? <User className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}Informations</CardTitle></CardHeader><CardContent className="space-y-3 text-xs">
            <div><label className="text-muted-foreground">Email</label><div className="flex items-center gap-1 mt-1"><Mail className="h-3 w-3" /><p>{user.email}</p></div></div>
            <div><label className="text-muted-foreground">Contact</label><div className="flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /><p>{user.contact}</p></div></div>
            <div><label className="text-muted-foreground">Date de naissance</label><div className="flex items-center gap-1 mt-1"><Calendar className="h-3 w-3" /><p>{formatDate(user.date_naissance)}</p></div></div>
            <div><label className="text-muted-foreground">Sexe</label><p className="mt-1">{user.sexe === "m" ? "Homme" : "Femme"}</p></div>
            <div className="pt-3 border-t"><label className="text-muted-foreground">Créé le</label><p className="mt-1">{formatDate(user.createdAt)}</p></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-3 mt-4">
          <Card className={`${config.bgLight} border-2 ${config.textColor}`}><CardContent className="pt-4 pb-4"><p className="text-xs font-medium mb-1">Statut actuel</p><div className="flex items-center gap-2"><div className={`w-2 h-2 ${config.color} rounded-full ${isOnline ? "animate-pulse" : ""}`} /><p className="text-base font-bold">{config.label}</p></div><p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(presence?.updatedAt)}</p></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Dernière activité</CardTitle></CardHeader><CardContent className="text-xs"><p>{formatRelativeTime(presence?.updatedAt)}</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-3 mt-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Gestion</CardTitle></CardHeader><CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start"><Shield className="h-4 w-4 mr-2" />Changer rôle</Button>
            <Button variant="outline" size="sm" className="w-full justify-start"><Key className="h-4 w-4 mr-2" />Réinitialiser mot de passe</Button>
            <Button variant="destructive" size="sm" className="w-full justify-start"><Trash className="h-4 w-4 mr-2" />Supprimer</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileProfile;
