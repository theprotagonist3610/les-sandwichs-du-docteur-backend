/*
- utilise le hook useUser pour detecter le user
- si pas de user renvoi un buttonGroup [S'inscrire | Se connecter]
- si on a un user renvoi un boutonGroup [User.name User.prenoms[0] | badge(user.role)]
- pour realiser les buttonGroup, sert toi du nouveau composant ButtonGroup de <shadcn />
- en cliqant sur s'incrire, on route vers /register, vers /login si on clique sur se connecter
- en cliquant sur le user, on route vers ./profile
 */
import { Link } from "react-router-dom";
import { useUser } from "@/toolkits/global/userToolkit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SmallLoader from "@/components/global/SmallLoader";
import { User } from "lucide-react";
const UserResume = () => {
  const { user, loading } = useUser();

  if (loading) {
    return <SmallLoader text="" spinnerSize={16} showDots={false} />;
  }

  // Si pas d'utilisateur connecté
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/register">S'inscrire</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  // Si utilisateur connecté
  const userName = user.nom || "Utilisateur";
  const userInitial = user.prenoms?.[0]?.toUpperCase() || "";
  const displayName = `${userName} ${userInitial}`;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link to="/profile" className="flex items-center gap-2">
          <User className="h-4 w-4 mr-2" />
          {displayName}
        </Link>
      </Button>
      <Badge variant="secondary" className="capitalize">
        {user.role}
      </Badge>
    </div>
  );
};

export default UserResume;
