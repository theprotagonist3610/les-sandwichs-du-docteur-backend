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
import { Button } from "@/components/ui/button";
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
import { fr } from "date-fns/locale";
import { getUser } from "@/toolkits/admin/userToolkit";

const DesktopTodos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { todos, allTodos, loading, currentUser } = useTodos();
  const [activeTab, setActiveTab] = useState("todo");
  const [userNamesCache, setUserNamesCache] = useState({});

  // Activer l'onglet depuis le state de navigation
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Nettoyer le state pour éviter que ça persiste
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
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  // Fonction pour obtenir le nom de l'utilisateur depuis son ID avec cache
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
        whileHover={{
          scale: 1.02,
          boxShadow: "0 8px 24px rgba(164, 22, 36, 0.12)",
          transition: { duration: 0.2 },
        }}
        className="h-full">
        <Card
          className={`h-full cursor-pointer hover:border-primary/50 transition-all duration-200 bg-card ${urgencyClasses}`}
          onClick={() => navigate(`/admin/todos/update/${todo.id}`)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                {todo.status ? (
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className="line-clamp-2">{todo.title}</span>
              </CardTitle>
            </div>

            {/* Date de création */}
            <CardDescription className="flex items-center gap-2 text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Créé le {formatDate(todo.createdAt)}</span>
            </CardDescription>

            {/* Deadline avec badge d'urgence */}
            {todo.deadline && (
              <div className="flex items-center gap-2 mt-1">
                {urgency === "critical" ? (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1 animate-pulse">
                    <AlertCircle className="h-3 w-3" />
                    <span>Aujourd'hui !</span>
                  </Badge>
                ) : urgency === "warning" ? (
                  <Badge className="flex items-center gap-1 bg-accent text-accent-foreground animate-pulse">
                    <AlertCircle className="h-3 w-3" />
                    <span>Demain</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
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
              <span className="text-muted-foreground font-medium">
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
                      <span className="text-muted-foreground text-xs ml-2">
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
                  <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">
              Chargement des tâches...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
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
        className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient-primary mb-2">
            Mes Tâches
          </h1>
          <p className="text-muted-foreground text-lg">
            Gérez et suivez vos tâches quotidiennes
          </p>
        </div>
        <Link to="/admin/todos/create">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Ajouter
          </Button>
        </Link>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="todo" className="flex items-center gap-2">
            <Circle className="h-4 w-4" />
            <span>À faire</span>
            <Badge variant="secondary" className="ml-auto">
              {todoList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Terminés</span>
            <Badge variant="secondary" className="ml-auto">
              {completedList.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo">
          <AnimatePresence mode="wait">
            {todoList.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 px-4">
                <Circle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Aucune tâche en cours
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Vous n'avez aucune tâche à faire pour le moment. Créez-en une
                  nouvelle !
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todoList.map((todo, index) => (
                  <TodoCard key={todo.id} todo={todo} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="completed">
          <AnimatePresence mode="wait">
            {completedList.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 px-4">
                <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Aucune tâche terminée
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Les tâches que vous terminerez apparaîtront ici.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

export default DesktopTodos;
