import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCreateTodoStore } from "@/stores/useCreateTodoStore";
import { createTodo } from "@/toolkits/admin/todoToolkit";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupText,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const MobileCreateTodo = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consommer les états individuellement
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
    <div className="container mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/todos")}
          className="mb-3">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold text-gradient-primary mb-1">
          Nouvelle Tâche
        </h1>
        <p className="text-muted-foreground text-sm">
          Créez une nouvelle tâche
        </p>
      </motion.div>

      {/* Formulaire - Layout strictement vertical */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Détails de la tâche</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Titre - Boutons d'édition rapide */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Titre <span className="text-destructive">*</span>
                </label>

                {/* Boutons prédéfinis - Grid 2 colonnes pour mobile */}
                <div className="grid grid-cols-2 gap-2">
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
                      className="text-xs">
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
                      placeholder="Titre personnalisé"
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
                    <InputGroupText>Description</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupTextarea
                    placeholder="Décrivez la tâche..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
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
                      className="w-full justify-start text-left font-normal text-sm">
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
                          className="w-full text-xs">
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
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => (
                    <div key={role} className="flex items-center">
                      <Checkbox
                        id={`role-mobile-${role}`}
                        checked={concern.includes(role)}
                        onCheckedChange={() => toggleRole(role)}
                      />
                      <label
                        htmlFor={`role-mobile-${role}`}
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
                        className="capitalize text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              {concern.length === 0 && concernBy.length === 0 && (
                <div className="bg-muted/50 border border-border rounded-md p-2.5">
                  <p className="text-xs text-muted-foreground">
                    💡 Visible par tous si aucun rôle sélectionné
                  </p>
                </div>
              )}

              {/* Boutons d'action - Verticaux sur mobile */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Création..." : "Créer la tâche"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/todos")}
                  disabled={isSubmitting}
                  className="w-full">
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MobileCreateTodo;
