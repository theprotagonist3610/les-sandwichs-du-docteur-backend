/*
- utilise le hook useUser pour detecter le user
- si pas de user renvoi un buttonGroup [S'inscrire | Se connecter]
- si on a un user renvoi un dropdown menu avec :
  - Trigger (closed): [icon | Nom et prenom]
  - Content (opened): [Rôle] [Voir profil] [Taches en attente]
- en cliqant sur s'incrire, on route vers /register, vers /login si on clique sur se connecter
- en cliquant sur "Voir profil", on route vers ./profile
 */
import { Link } from "react-router-dom";
import { useUser } from "@/toolkits/global/userToolkit";
import { useTodos } from "@/toolkits/admin/todoToolkit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SmallLoader from "@/components/global/SmallLoader";
import { User, UserCircle, ListTodo, ChevronDown } from "lucide-react";

const UserResume = () => {
  const { user, loading } = useUser();
  const { todos, loading: todosLoading } = useTodos();

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
  const userFirstName = user.prenoms?.[0] || "";
  const userInitial = userFirstName?.charAt(0)?.toUpperCase() || "";
  const displayName = `${userName} ${userInitial}.`;
  const userRole = user.role || "Utilisateur";

  // Compter les tâches non complétées
  const pendingTodosCount = !todosLoading 
    ? todos.filter((todo) => !todo.status).length 
    : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 hover:bg-accent transition-colors">
          <UserCircle className="h-4 w-4" />
          <span className="font-medium">{displayName}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span className="font-semibold">{userName} {userFirstName}</span>
          </div>
          <Badge variant="secondary" className="capitalize w-fit">
            {userRole}
          </Badge>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            to={`/${user.role}/users/profiles/${user.id}`}
            className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            <span>Voir profil</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            to={`/${user.role}/todos`}
            className="flex items-center justify-between gap-2 cursor-pointer">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              <span>Tâches en attente</span>
            </div>
            {pendingTodosCount > 0 && (
              <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center px-1">
                {pendingTodosCount > 9 ? "9+" : pendingTodosCount}
              </Badge>
            )}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserResume;
