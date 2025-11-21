import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEditTodoStore } from "@/stores/useEditTodoStore";
import { updateTodo, deleteTodo } from "@/toolkits/admin/todoToolkit";
import { useTodos } from "@/toolkits/admin/todoToolkit";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupText,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Users,
  FileText,
  ArrowLeft,
  Save,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

const ROLES = ["admin", "cuisinier", "livreur", "vendeur", "superviseur"];

const DesktopUpdateTodo = () => {
  const navigate = useNavigate();
  const { todoId } = useParams();
  const { allTodos, loading: todosLoading } = useTodos();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Consommer les états individuellement
  const id = useEditTodoStore((state) => state.id);
  const title = useEditTodoStore((state) => state.title);
  const description = useEditTodoStore((state) => state.description);
  const concern = useEditTodoStore((state) => state.concern);
  const concernBy = useEditTodoStore((state) => state.concernBy);
  const deadline = useEditTodoStore((state) => state.deadline);
  const status = useEditTodoStore((state) => state.status);

  const setTitle = useEditTodoStore((state) => state.setTitle);
  const setDescription = useEditTodoStore((state) => state.setDescription);
  const setConcern = useEditTodoStore((state) => state.setConcern);
  const setConcernBy = useEditTodoStore((state) => state.setConcernBy);
  const setDeadline = useEditTodoStore((state) => state.setDeadline);
  const setStatus = useEditTodoStore((state) => state.setStatus);
  const loadTodo = useEditTodoStore((state) => state.loadTodo);
  const reset = useEditTodoStore((state) => state.reset);

  // Charger le TODO
  useEffect(() => {
    if (!todosLoading && allTodos.length > 0) {
      const todo = allTodos.find((t) => t.id === todoId);
      if (todo) {
        loadTodo(todo);
      } else {
        toast.error("TODO introuvable");
        navigate("/admin/todos");
      }
    }
  }, [todoId, allTodos, todosLoading, loadTodo, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateTodo(id, {
        title: title.trim(),
        description: description.trim(),
        concern,
        concernBy,
        deadline,
        status,
      });

      toast.success("TODO mis à jour avec succès !");
      navigate("/admin/todos");
    } catch (error) {
      console.error("Erreur mise à jour TODO:", error);
      toast.error("Erreur lors de la mise à jour du TODO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteTodo(id);
      toast.success("TODO supprimé avec succès !");
      reset();
      navigate("/admin/todos");
    } catch (error) {
      console.error("Erreur suppression TODO:", error);
      toast.error("Erreur lors de la suppression du TODO");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleRole = (role) => {
    if (concern.includes(role)) {
      setConcern(concern.filter((r) => r !== role));
    } else {
      setConcern([...concern, role]);
    }
  };

  const toggleStatus = async () => {
    const newStatus = !status;
    setStatus(newStatus);

    // Si on marque comme terminé, enregistrer et naviguer
    if (newStatus) {
      try {
        await updateTodo(id, {
          title: title.trim(),
          description: description.trim(),
          concern,
          concernBy,
          deadline,
          status: newStatus,
        });

        toast.success("Tâche marquée comme terminée !");
        navigate("/admin/todos", { state: { activeTab: "completed" } });
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors de la mise à jour");
        setStatus(!newStatus); // Rollback
      }
    }
  };

  if (todosLoading || !id) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <span className="text-lg text-muted-foreground">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header avec bouton Marquer comme terminé */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/todos")}
            disabled={isSubmitting || isDeleting}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button
            variant={status ? "outline" : "default"}
            onClick={toggleStatus}
            disabled={isSubmitting || isDeleting}
            className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {status ? "Marquer non terminé" : "Marquer comme terminé"}
          </Button>
        </div>

        <h1 className="text-4xl font-bold text-gradient-primary mb-2">
          Modifier la Tâche
        </h1>
        <p className="text-muted-foreground text-lg">
          Modifiez les informations de cette tâche
        </p>
      </motion.div>

      {/* Formulaire */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Détails de la tâche</CardTitle>
            <CardDescription>
              {status && (
                <Badge
                  variant="default"
                  className="bg-accent text-accent-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Tâche terminée
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre - Boutons d'action rapide */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Titre <span className="text-destructive">*</span>
                </label>

                {/* Boutons prédéfinis */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Achat",
                    "Paiement",
                    "Reunion",
                    "Fabrication",
                    "Ravitaillement",
                    "Autres",
                  ].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={
                        title === preset ||
                        (preset === "Autres" &&
                          ![
                            "Achat",
                            "Paiement",
                            "Reunion",
                            "Fabrication",
                            "Ravitaillement",
                          ].includes(title))
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setTitle(preset === "Autres" ? "" : preset)
                      }
                      className="text-sm">
                      {preset}
                    </Button>
                  ))}
                </div>

                {/* Champ de saisie custom - affiché si "Autres" ou titre personnalisé */}
                {![
                  "Achat",
                  "Paiement",
                  "Reunion",
                  "Fabrication",
                  "Ravitaillement",
                ].includes(title) && (
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <FileText className="h-4 w-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="text"
                      placeholder="Ex: Préparer le menu de la semaine"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </InputGroup>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <InputGroup>
                  <InputGroupAddon align="block-start">
                    <FileText className="h-4 w-4" />
                    <InputGroupText>Description détaillée</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupTextarea
                    placeholder="Décrivez la tâche en détail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </InputGroup>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date butoir</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? (
                        format(new Date(deadline), "PPP", { locale: fr })
                      ) : (
                        <span className="text-muted-foreground">
                          Choisir une date
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={deadline ? new Date(deadline) : undefined}
                      onSelect={(date) =>
                        setDeadline(date ? date.getTime() : null)
                      }
                      initialFocus
                      locale={fr}
                    />
                    {deadline && (
                      <div className="p-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeadline(null)}
                          className="w-full">
                          Supprimer la date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Concerne (Rôles) */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Concerne les rôles
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => (
                    <div key={role} className="flex items-center">
                      <Checkbox
                        id={`role-${role}`}
                        checked={concern.includes(role)}
                        onCheckedChange={() => toggleRole(role)}
                      />
                      <label
                        htmlFor={`role-${role}`}
                        className="ml-2 text-sm capitalize cursor-pointer">
                        {role}
                      </label>
                    </div>
                  ))}
                </div>
                {concern.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {concern.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="capitalize">
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Info si aucun rôle sélectionné */}
              {concern.length === 0 && concernBy.length === 0 && (
                <div className="bg-muted/50 border border-border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">
                    💡 Si aucun rôle ou utilisateur n'est sélectionné, cette
                    tâche sera visible par tous
                  </p>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                  className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
                <div className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/todos")}
                  disabled={isSubmitting || isDeleting}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isDeleting || !title.trim()}
                  className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DesktopUpdateTodo;
