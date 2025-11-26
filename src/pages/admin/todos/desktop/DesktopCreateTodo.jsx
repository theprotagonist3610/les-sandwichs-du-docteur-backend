import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCreateTodoStore } from "@/stores/useCreateTodoStore";
import { createTodo } from "@/toolkits/admin/todoToolkit";
import { useUser } from "@/toolkits/global/userToolkit";
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

const DesktopCreateTodo = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer l'utilisateur courant
  const { user } = useUser();

  // Consommer les états individuellement pour éviter rerenders
  const title = useCreateTodoStore((state) => state.title);
  const description = useCreateTodoStore((state) => state.description);
  const concern = useCreateTodoStore((state) => state.concern);
  const concernBy = useCreateTodoStore((state) => state.concernBy);
  const deadline = useCreateTodoStore((state) => state.deadline);

  const setTitle = useCreateTodoStore((state) => state.setTitle);
  const setDescription = useCreateTodoStore((state) => state.setDescription);
  const setConcern = useCreateTodoStore((state) => state.setConcern);
  const setConcernBy = useCreateTodoStore((state) => state.setConcernBy);
  const setDeadline = useCreateTodoStore((state) => state.setDeadline);
  const reset = useCreateTodoStore((state) => state.reset);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      await createTodo({
        title: title.trim(),
        description: description.trim(),
        concern,
        concernBy,
        deadline,
        createdBy: user?.id || "inconnu",
      });

      toast.success("TODO créé avec succès !");
      reset();
      navigate("/admin/todos");
    } catch (error) {
      console.error("Erreur création TODO:", error);
      toast.error("Erreur lors de la création du TODO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (role) => {
    if (concern.includes(role)) {
      setConcern(concern.filter((r) => r !== role));
    } else {
      setConcern([...concern, role]);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/todos")}
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-4xl font-bold text-gradient-primary mb-2">
          Nouvelle Tâche
        </h1>
        <p className="text-muted-foreground text-lg">
          Créez une nouvelle tâche à assigner
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
              Remplissez les informations de la nouvelle tâche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre - Boutons d'édition rapide */}
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
                  variant="outline"
                  onClick={() => navigate("/admin/todos")}
                  disabled={isSubmitting}
                  className="flex-1">
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="flex-1 gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Création..." : "Créer la tâche"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DesktopCreateTodo;
