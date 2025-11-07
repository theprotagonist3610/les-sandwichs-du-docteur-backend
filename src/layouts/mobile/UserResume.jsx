/*
- utilise le hook useUser pour detecter le user
- si pas de user renvoi un button Stack [S'inscrire | Se connecter]
- si on a un user renvoi un bouton Stack [User.name User.prenoms[0] | badge(user.role)]
- en cliqant sur s'incrire, on route vers /register, vers /login si on clique sur se connecter
- en cliquant sur le user, on route vers ./profile
 */
import { Link } from "react-router-dom";
import { useUser } from "@/toolkits/global/userToolkit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SmallLoader from "@/components/global/SmallLoader";

const UserResume = () => {
  const { user, loading } = useUser();

  if (loading) {
    return <SmallLoader text="" spinnerSize={14} showDots={false} />;
  }

  // Si pas d'utilisateur connecté
  if (!user) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link to="/register">S'inscrire</Link>
        </Button>
        <Button size="sm" asChild className="w-full">
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
    <div className="flex flex-col gap-2 w-full">
      <Button variant="outline" size="sm" asChild className="w-full">
        <Link to="/profile" className="flex items-center justify-between gap-2">
          <span className="truncate">{displayName}</span>
          <Badge
            variant="secondary"
            className="capitalize text-xs flex-shrink-0">
            {user.role}
          </Badge>
        </Link>
      </Button>
    </div>
  );
};

export default UserResume;
