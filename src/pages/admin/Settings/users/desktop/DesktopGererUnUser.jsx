/**
 * DesktopGererUnUser - Modifier un utilisateur spécifique (desktop)
 *
 * Permet de consulter et modifier les informations d'un utilisateur
 * L'email n'est pas modifiable
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGererUnUserStore from "@/stores/admin/gererUnUserStore";
import { getUserToolkitForRole } from "@/toolkits/global/userToolkit";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Calendar,
  Check,
  X,
  ArrowLeft,
  Shield,
  Users,
  Truck,
  ShoppingCart,
  ChefHat,
  Save,
} from "lucide-react";
import SmallLoader from "@/components/global/SmallLoader";
import PhoneTaker from "@/components/global/PhoneTaker";
import { toast } from "sonner";

// Icônes par rôle
const roleIcons = {
  admin: Shield,
  superviseur: Users,
  livreur: Truck,
  vendeur: ShoppingCart,
  cuisinier: ChefHat,
};

const DesktopGererUnUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Sélecteurs individuels du store
  const nom = useGererUnUserStore((state) => state.nom);
  const prenoms = useGererUnUserStore((state) => state.prenoms);
  const email = useGererUnUserStore((state) => state.email);
  const contact = useGererUnUserStore((state) => state.contact);
  const sexe = useGererUnUserStore((state) => state.sexe);
  const date_naissance = useGererUnUserStore((state) => state.date_naissance);
  const role = useGererUnUserStore((state) => state.role);
  const isLoading = useGererUnUserStore((state) => state.isLoading);
  const isSaving = useGererUnUserStore((state) => state.isSaving);
  const error = useGererUnUserStore((state) => state.error);
  const success = useGererUnUserStore((state) => state.success);

  const setNom = useGererUnUserStore((state) => state.setNom);
  const setPrenoms = useGererUnUserStore((state) => state.setPrenoms);
  const setContact = useGererUnUserStore((state) => state.setContact);
  const setSexe = useGererUnUserStore((state) => state.setSexe);
  const setDateNaissance = useGererUnUserStore((state) => state.setDateNaissance);
  const setRole = useGererUnUserStore((state) => state.setRole);
  const setIsLoading = useGererUnUserStore((state) => state.setIsLoading);
  const setIsSaving = useGererUnUserStore((state) => state.setIsSaving);
  const setError = useGererUnUserStore((state) => state.setError);
  const setSuccess = useGererUnUserStore((state) => state.setSuccess);
  const loadUser = useGererUnUserStore((state) => state.loadUser);

  // États locaux pour la validation
  const [nomTouched, setNomTouched] = useState(false);
  const [prenomsTouched, setPrenomsTouched] = useState(false);

  // Charger l'utilisateur
  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);

        // Charger d'abord les données de base pour détecter le rôle
        const toolkit = await getUserToolkitForRole("admin");
        const userData = await toolkit.getUser(id);

        if (!userData) {
          setError("Utilisateur introuvable");
          toast.error("Utilisateur introuvable");
          return;
        }

        // Maintenant qu'on a le rôle, charger le bon toolkit
        const userToolkit = await getUserToolkitForRole(userData.role);
        const fullUserData = await userToolkit.getUser(id);

        loadUser(fullUserData);
      } catch (err) {
        const errorMessage = err.message || "Erreur lors de la récupération de l'utilisateur";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchUser();
    }
  }, [id]);

  // Validation
  const isNomValid = nom.length > 0;
  const isPrenomsValid = prenoms.length > 0 && prenoms.every((p) => p.length > 0);

  const canSave = isNomValid && isPrenomsValid && !isSaving;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSave) return;

    try {
      setIsSaving(true);
      setError(null);

      // Charger le toolkit approprié selon le rôle de l'utilisateur
      const userToolkit = await getUserToolkitForRole(role);

      // Utiliser updateUser du toolkit approprié
      await userToolkit.updateUser(id, {
        nom,
        prenoms,
        contact,
        sexe,
        date_naissance,
        role,
      });

      setSuccess(true);
      toast.success("Utilisateur modifié avec succès !");

      // Redirection après 1.5s
      setTimeout(() => {
        navigate("/admin/settings/users/gerer");
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || "Erreur lors de la modification de l'utilisateur";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const RoleIcon = role ? roleIcons[role] : User;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/settings/users/gerer")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gérer l'utilisateur</h1>
            <p className="text-muted-foreground mt-1">Modifier les informations utilisateur</p>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <SmallLoader text="Chargement de l'utilisateur..." />
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="container mx-auto max-w-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/settings/users/gerer")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gérer l'utilisateur</h1>
            <p className="text-muted-foreground mt-1">Modifier les informations utilisateur</p>
          </div>
        </div>

        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>

        <div className="flex justify-center">
          <Button onClick={() => navigate("/admin/settings/users/gerer")}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/settings/users/gerer")}
          disabled={isSaving}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Gérer l'utilisateur</h1>
          <p className="text-muted-foreground mt-1">
            Modifier les informations de {nom} {prenoms.join(" ")}
          </p>
        </div>
        <RoleIcon className="h-8 w-8 text-primary" />
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations utilisateur</CardTitle>
          <CardDescription>Les champs marqués d'un * sont obligatoires</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (non modifiable) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (non modifiable)</Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <Mail className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </InputGroup>
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="nom">
                Nom <span className="text-destructive">*</span>
              </Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <User className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="nom"
                  type="text"
                  placeholder="Nom de famille"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  onBlur={() => setNomTouched(true)}
                  aria-invalid={nomTouched && !isNomValid}
                  disabled={isSaving}
                  required
                />
                {nomTouched && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>
                      {isNomValid ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </InputGroupText>
                  </InputGroupAddon>
                )}
              </InputGroup>
            </div>

            {/* Prénoms */}
            <div className="space-y-2">
              <Label htmlFor="prenoms">
                Prénoms <span className="text-destructive">*</span>
              </Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <User className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="prenoms"
                  type="text"
                  placeholder="Prénoms (séparés par des espaces)"
                  value={prenoms.join(" ")}
                  onChange={(e) => setPrenoms(e.target.value.split(" ").filter((p) => p))}
                  onBlur={() => setPrenomsTouched(true)}
                  aria-invalid={prenomsTouched && !isPrenomsValid}
                  disabled={isSaving}
                  required
                />
                {prenomsTouched && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>
                      {isPrenomsValid ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </InputGroupText>
                  </InputGroupAddon>
                )}
              </InputGroup>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label htmlFor="contact">Contact</Label>
              <PhoneTaker
                value={contact}
                onChange={setContact}
                disabled={isSaving}
              />
            </div>

            {/* Sexe */}
            <div className="space-y-2">
              <Label htmlFor="sexe">Sexe</Label>
              <Select value={sexe} onValueChange={setSexe} disabled={isSaving}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le sexe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="f">Féminin</SelectItem>
                  <SelectItem value="m">Masculin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date de naissance */}
            <div className="space-y-2">
              <Label htmlFor="date_naissance">Date de naissance</Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <Calendar className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="date_naissance"
                  type="date"
                  value={
                    date_naissance
                      ? new Date(date_naissance).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => setDateNaissance(new Date(e.target.value).getTime())}
                  disabled={isSaving}
                />
              </InputGroup>
            </div>

            {/* Rôle */}
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <RoleIcon className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <Select value={role} onValueChange={setRole} disabled={isSaving}>
                  <SelectTrigger className="flex-1 rounded-none border-0 bg-transparent shadow-none focus:ring-0">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Administrateur</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="superviseur">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Superviseur</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="vendeur">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Vendeur</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="livreur">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <span>Livreur</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cuisinier">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        <span>Cuisinier</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </InputGroup>
            </div>

            {/* Messages d'erreur/succès */}
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-start gap-2">
                <X className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-600 text-green-600 px-4 py-3 rounded-md flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  Utilisateur modifié avec succès ! Redirection...
                </p>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/settings/users/gerer")}
                disabled={isSaving}>
                Annuler
              </Button>
              <Button type="submit" disabled={!canSave}>
                {isSaving ? (
                  <SmallLoader text="Enregistrement..." spinnerSize={14} />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopGererUnUser;
