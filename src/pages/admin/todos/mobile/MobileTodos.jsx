import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTodos } from "@/toolkits/admin/todoToolkit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // ← AJOUTER
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  User as UserIcon,
  Users,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import { format, differenceInDays, startOfDay } from "date-fns";
import { getUser } from "@/toolkits/admin/userToolkit";
import { fr } from "date-fns/locale";

const MobileTodos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { todos, allTodos, loading, currentUser } = useTodos();
  const [activeTab, setActiveTab] = useState("todo");
  const [userNamesCache, setUserNamesCache] = useState({});

  // Activer l'onglet depuis le state de navigation
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Nettoyer le state
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Séparer les todos selon leur statut
  const todoList = todos.filter((todo) => !todo.status);
  const completedList = todos.filter((todo) => todo.status);

  // Fonction pour calculer l'urgence d'un TODO
  const getUrgency = (deadline) => {
    if (!deadline) return "normal";

    const now = startOfDay(new Date());
    const deadlineDate = startOfDay(new Date(deadline));
    const daysUntilDeadline = differenceInDays(deadlineDate, now);

    if (daysUntilDeadline === 0) return "critical"; // Jour J
    if (daysUntilDeadline === 1) return "warning"; // J-1
    return "normal";
  };

  // Fonction pour obtenir les classes CSS selon l'urgence
  const getUrgencyClasses = (urgency) => {
    switch (urgency) {
      case "critical":
        return "border-destructive bg-destructive/5 animate-pulse-border-red";
      case "warning":
        return "border-accent bg-accent/5 animate-pulse-border-orange";
      default:
        return "";
    }
  };

  // Animation variants pour les cards
  const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.08,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
    exit: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.3 },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  // Fonction pour obtenir le nom de l'utilisateur depuis son ID
  const getUserName = useCallback(
    (userId) => {
      if (!userId) return "Utilisateur";

      // Cas spécial pour "système"
      if (userId === "système") return "Système";

      // Cas spécial pour "inconnu"
      if (userId === "inconnu") return "Inconnu";

      // Vérifier le cache d'abord
      if (userNamesCache[userId]) {
        return userNamesCache[userId];
      }

      // Si pas en cache, charger depuis Firestore
      getUser(userId)
        .then((userData) => {
          if (userData?.nom && userData?.prenoms?.length > 0) {
            const fullName = `${userData.prenoms[0]} ${userData.nom}`;
            setUserNamesCache((prev) => ({ ...prev, [userId]: fullName }));
          } else if (userData?.nom) {
            // Si pas de prénoms, utiliser juste le nom
            setUserNamesCache((prev) => ({ ...prev, [userId]: userData.nom }));
          } else {
            // Utilisateur non trouvé ou données incomplètes
            setUserNamesCache((prev) => ({ ...prev, [userId]: "Utilisateur supprimé" }));
          }
        })
        .catch((error) => {
          console.error("Erreur getUserName:", error);
          // En cas d'erreur, mettre en cache pour éviter les requêtes répétées
          setUserNamesCache((prev) => ({ ...prev, [userId]: "Utilisateur" }));
        });

      return "Chargement...";
    },
    [userNamesCache]
  );

  // Fonction pour formater la date
  const formatDate = (timestamp) => {
    try {
      return format(new Date(timestamp), "dd MMM yyyy 'à' HH:mm:ss", {
        locale: fr,
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Fonction pour formater la deadline
  const formatDeadline = (timestamp) => {
    try {
      return format(new Date(timestamp), "dd MMM yyyy", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Composant TodoCard
  const TodoCard = ({ todo, index }) => {
    const urgency = getUrgency(todo.deadline);
    const urgencyClasses = getUrgencyClasses(urgency);

    return (
      <motion.div
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileTap={{ scale: 0.98 }}
        className="w-full">
        <Card
          className={`cursor-pointer active:border-primary/50 transition-all duration-200 bg-card ${urgencyClasses}`}
          onClick={() => navigate(`/admin/todos/update/${todo.id}`)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                {todo.status ? (
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className="line-clamp-2">{todo.title}</span>
              </CardTitle>
            </div>

            {/* Date de création */}
            <CardDescription className="flex items-center gap-2 text-xs mt-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Créé le {formatDate(todo.createdAt)}</span>
            </CardDescription>

            {/* Deadline avec badge d'urgence */}
            {todo.deadline && (
              <div className="flex items-center gap-2 mt-2">
                {urgency === "critical" ? (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1 animate-pulse text-xs">
                    <AlertCircle className="h-3 w-3" />
                    <span>Aujourd'hui !</span>
                  </Badge>
                ) : urgency === "warning" ? (
                  <Badge className="flex items-center gap-1 bg-accent text-accent-foreground animate-pulse text-xs">
                    <AlertCircle className="h-3 w-3" />
                    <span>Demain</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>Deadline: {formatDeadline(todo.deadline)}</span>
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Créé par */}
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground font-medium text-xs">
                Créé par{" "}
                <span className="text-foreground">
                  {getUserName(todo.createdBy)}
                </span>
              </span>
            </div>

            {/* Concerné par */}
            {(todo.concern.length > 0 || todo.concernBy.length > 0) && (
              <div className="flex items-start gap-2 text-sm">
                <Users className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  {todo.concern.length > 0 && (
                    <>
                      <span className="text-muted-foreground text-xs">
                        Rôles :
                      </span>
                      {todo.concern.map((role) => (
                        <Badge
                          key={role}
                          variant="secondary"
                          className="text-xs capitalize">
                          {role}
                        </Badge>
                      ))}
                    </>
                  )}
                  {todo.concernBy.length > 0 && (
                    <>
                      <span className="text-muted-foreground text-xs">
                        Utilisateurs :
                      </span>
                      {todo.concernBy.map((userId) => (
                        <Badge
                          key={userId}
                          variant="outline"
                          className="text-xs">
                          {getUserName(userId)}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {todo.concern.length === 0 && todo.concernBy.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span className="italic text-xs">Visible par tous</span>
              </div>
            )}

            {/* Description */}
            {todo.description && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {todo.description}
                  </p>
                </div>
              </div>
            )}

            {/* Statut */}
            {todo.status && (
              <div className="mt-2">
                <Badge
                  variant="default"
                  className="bg-accent text-accent-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Terminé
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Clock className="h-8 w-8 animate-spin text-primary" />
            <span className="text-base text-muted-foreground">
              Chargement...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Animations CSS personnalisées */}
      <style>{`
        @keyframes pulse-border-red {
          0%, 100% {
            border-color: hsl(var(--destructive));
            box-shadow: 0 0 0 0 hsla(var(--destructive), 0.4);
          }
          50% {
            border-color: hsl(var(--destructive) / 0.6);
            box-shadow: 0 0 0 4px hsla(var(--destructive), 0);
          }
        }

        @keyframes pulse-border-orange {
          0%, 100% {
            border-color: hsl(var(--accent));
            box-shadow: 0 0 0 0 hsla(var(--accent), 0.4);
          }
          50% {
            border-color: hsl(var(--accent) / 0.6);
            box-shadow: 0 0 0 4px hsla(var(--accent), 0);
          }
        }

        .animate-pulse-border-red {
          animation: pulse-border-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-pulse-border-orange {
          animation: pulse-border-orange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary mb-1">
            Mes Tâches
          </h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos tâches quotidiennes
          </p>
        </div>
        <Link to="/admin/todos/create">
          <Button size="default" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </Link>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="todo" className="flex items-center gap-2 text-sm">
            <Circle className="h-3.5 w-3.5" />
            <span>À faire</span>
            <Badge variant="secondary" className="ml-auto text-xs h-5">
              {todoList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Terminés</span>
            <Badge variant="secondary" className="ml-auto text-xs h-5">
              {completedList.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Onglet À faire */}
        <TabsContent value="todo" className="mt-0">
          <AnimatePresence mode="wait">
            {todoList.length === 0 ? (
              <motion.div
                key="empty-todo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Aucune tâche en attente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Toutes vos tâches sont terminées ! 🎉
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="todo-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-3">
                {todoList.map((todo, index) => (
                  <TodoCard key={todo.id} todo={todo} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Onglet Terminés */}
        <TabsContent value="completed" className="mt-0">
          <AnimatePresence mode="wait">
            {completedList.length === 0 ? (
              <motion.div
                key="empty-completed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12">
                <Circle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Aucune tâche terminée
                </h3>
                <p className="text-sm text-muted-foreground">
                  Commencez à cocher vos tâches
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="completed-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-3">
                {completedList.map((todo, index) => (
                  <TodoCard key={todo.id} todo={todo} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileTodos;
