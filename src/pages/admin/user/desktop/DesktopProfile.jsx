/**
 * DesktopProfile.jsx
 * Détail d'un profil utilisateur (3 colonnes: Infos, Activité, Actions)
 */

import { useParams, useNavigate } from "react-router-dom";
import { useUser, useUserPresence } from "@/toolkits/admin/userToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Edit, User, UserCircle, Mail, Phone, Calendar, Shield, UserCog, Trash, Key, Ban, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_CONFIG = {
  online: { label: "En ligne", color: "bg-green-500", bgLight: "bg-green-50", textColor: "text-green-700", borderColor: "border-green-200" },
  offline: { label: "Hors ligne", color: "bg-gray-500", bgLight: "bg-gray-50", textColor: "text-gray-700", borderColor: "border-gray-200" },
  away: { label: "Absent", color: "bg-orange-500", bgLight: "bg-orange-50", textColor: "text-orange-700", borderColor: "border-orange-200" },
};

const DesktopProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading, refetch } = useUser(id);
  const { presence, loading: loadingPresence } = useUserPresence(id);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(timestamp));
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Jamais";
    const diff = Date.now() - timestamp;
    const min = Math.floor(diff / 60000);
    const h = Math.floor(min / 60);
    const d = Math.floor(h / 24);
    if (min < 1) return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    if (h < 24) return `Il y a ${h}h`;
    return `Il y a ${d}j`;
  };

  if (loading || loadingPresence) {
    return <div className="p-6 space-y-6"><Skeleton className="h-20 w-full" /><div className="grid grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96" />)}</div></div>;
  }

  if (!user) {
    return <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="pt-6"><p className="text-red-600">Utilisateur non trouvé</p><Button onClick={() => navigate("/admin/user/profiles")} className="mt-4">Retour</Button></CardContent></Card></div>;
  }

  const config = STATUS_CONFIG[presence?.status] || STATUS_CONFIG.offline;
  const isOnline = presence?.status === "online";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/user/profiles")}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">{user.nom?.charAt(0)}{user.prenoms?.[0]?.charAt(0)}</div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${config.color} rounded-full border-2 border-white ${isOnline ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user.nom} {user.prenoms?.join(" ")}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role || "user"}</Badge>
              <Badge variant="outline" className={`${config.bgLight} ${config.textColor} ${config.borderColor}`}>{config.label}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch().then(() => toast.success("Actualisé"))}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
          <Button variant="outline"><Edit className="h-4 w-4 mr-2" />Éditer</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">{user.sexe === "m" ? <User className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium text-muted-foreground">Email</label><div className="flex items-center gap-2 mt-1"><Mail className="h-4 w-4" /><p className="text-sm">{user.email}</p></div></div>
            <div><label className="text-sm font-medium text-muted-foreground">Contact</label><div className="flex items-center gap-2 mt-1"><Phone className="h-4 w-4" /><p className="text-sm">{user.contact}</p></div></div>
            <div><label className="text-sm font-medium text-muted-foreground">Date de naissance</label><div className="flex items-center gap-2 mt-1"><Calendar className="h-4 w-4" /><p className="text-sm">{formatDate(user.date_naissance)}</p></div></div>
            <div><label className="text-sm font-medium text-muted-foreground">Sexe</label><p className="text-sm mt-1">{user.sexe === "m" ? "Homme" : "Femme"}</p></div>
            <div className="pt-4 border-t"><label className="text-sm font-medium text-muted-foreground">Compte créé le</label><p className="text-sm mt-1">{formatDate(user.createdAt)}</p></div>
            <div><label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</label><p className="text-sm mt-1">{formatDate(user.updatedAt)}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Activité & Présence</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Card className={`${config.bgLight} ${config.borderColor}`}>
              <CardContent className="pt-4 pb-4">
                <p className={`text-sm ${config.textColor} font-medium mb-1`}>Statut actuel</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${config.color} rounded-full ${isOnline ? "animate-pulse" : ""}`} />
                  <p className={`text-lg font-bold ${config.textColor}`}>{config.label}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{formatRelativeTime(presence?.updatedAt)}</p>
              </CardContent>
            </Card>
            <div><label className="text-sm font-medium text-muted-foreground">Dernière activité</label><p className="text-sm mt-1">{formatRelativeTime(presence?.updatedAt)}</p></div>
            <div><label className="text-sm font-medium text-muted-foreground">Historique des 7 derniers jours</label><p className="text-xs text-muted-foreground mt-2">Fonctionnalité à venir</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" />Actions Admin</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start"><Shield className="h-4 w-4 mr-2" />Changer le rôle</Button>
            <Button variant="outline" className="w-full justify-start"><Key className="h-4 w-4 mr-2" />Réinitialiser mot de passe</Button>
            <div className="pt-3 border-t"><p className="text-sm font-medium mb-3 text-destructive">Zone dangereuse</p>
            <Button variant="outline" className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 mb-2"><Ban className="h-4 w-4 mr-2" />Suspendre le compte</Button>
            <Button variant="destructive" className="w-full justify-start"><Trash className="h-4 w-4 mr-2" />Supprimer le compte</Button></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesktopProfile;
