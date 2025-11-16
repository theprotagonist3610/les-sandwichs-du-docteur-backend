/**
 * MobileGererUnUser - Modifier un utilisateur spécifique (mobile)
 *
 * Même logique que DesktopGererUnUser :
 * - Récupère l'id via useParams
 * - Charge le user via getUserToolkitForRole(...).getUser
 * - Formulaire d'édition (email non modifiable)
 * - Toasts via sonner
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
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

const MobileGererUnUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Sélecteurs (un par variable)
  const nom = useGererUnUserStore((s) => s.nom);
  const prenoms = useGererUnUserStore((s) => s.prenoms);
  const email = useGererUnUserStore((s) => s.email);
  const contact = useGererUnUserStore((s) => s.contact);
  const sexe = useGererUnUserStore((s) => s.sexe);
  const date_naissance = useGererUnUserStore((s) => s.date_naissance);
  const role = useGererUnUserStore((s) => s.role);
  const isLoading = useGererUnUserStore((s) => s.isLoading);
  const isSaving = useGererUnUserStore((s) => s.isSaving);
  const error = useGererUnUserStore((s) => s.error);
  const success = useGererUnUserStore((s) => s.success);

  const setNom = useGererUnUserStore((s) => s.setNom);
  const setPrenoms = useGererUnUserStore((s) => s.setPrenoms);
  const setContact = useGererUnUserStore((s) => s.setContact);
  const setSexe = useGererUnUserStore((s) => s.setSexe);
  const setDateNaissance = useGererUnUserStore((s) => s.setDateNaissance);
  const setRole = useGererUnUserStore((s) => s.setRole);
  const setIsLoading = useGererUnUserStore((s) => s.setIsLoading);
  const setIsSaving = useGererUnUserStore((s) => s.setIsSaving);
  const setError = useGererUnUserStore((s) => s.setError);
  const setSuccess = useGererUnUserStore((s) => s.setSuccess);
  const loadUser = useGererUnUserStore((s) => s.loadUser);

  // États locaux validation
  const [nomTouched, setNomTouched] = useState(false);
  const [prenomsTouched, setPrenomsTouched] = useState(false);

  // Charger l'utilisateur (même logique que Desktop)
  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);

        // 1) Toolkit par défaut (admin) pour récupérer le rôle
        const tk0 = await getUserToolkitForRole("admin");
        const userData = await tk0.getUser(id);
        if (!userData) {
          const msg = "Utilisateur introuvable";
          setError(msg);
          toast.error(msg);
          return;
        }

        // 2) Toolkit du rôle réel
        const tk = await getUserToolkitForRole(userData.role);
        const fullUser = await tk.getUser(id);

        loadUser(fullUser);
      } catch (err) {
        const msg =
          err.message || "Erreur lors de la récupération de l'utilisateur";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) fetchUser();
  }, [id]);

  // Validation
  const isNomValid = nom.length > 0;
  const isPrenomsValid =
    prenoms.length > 0 && prenoms.every((p) => p.length > 0);
  const canSave = isNomValid && isPrenomsValid && !isSaving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      setIsSaving(true);
      setError(null);

      const tk = await getUserToolkitForRole(role);
      await tk.updateUser(id, {
        nom,
        prenoms,
        contact,
        sexe,
        date_naissance,
        role,
      });

      setSuccess(true);
      toast.success("Utilisateur modifié avec succès !");
      setTimeout(() => navigate("/admin/settings/users/gerer"), 1500);
    } catch (err) {
      const msg =
        err.message || "Erreur lors de la modification de l'utilisateur";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const RoleIcon = role ? roleIcons[role] : User;

  // Loading
  if (isLoading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/settings/users/gerer")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-lg">Gérer l'utilisateur</CardTitle>
                <CardDescription className="text-sm">
                  Modifier les informations utilisateur
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="my-2" />
          <CardContent className="py-10">
            <div className="flex items-center justify-center">
              <SmallLoader text="Chargement de l'utilisateur..." />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erreur initiale (pas d'email hydraté)
  if (error && !email) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/settings/users/gerer")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-lg">Gérer l'utilisateur</CardTitle>
                <CardDescription className="text-sm">
                  Modifier les informations utilisateur
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="my-2" />
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
              {error}
            </div>
            <Button
              className="w-full"
              onClick={() => navigate("/admin/settings/users/gerer")}>
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/settings/users/gerer")}
              disabled={isSaving}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <CardTitle className="text-lg">Gérer l'utilisateur</CardTitle>
              <CardDescription className="text-sm">
                Modifier {nom} {prenoms.join(" ")}
              </CardDescription>
            </div>
            <RoleIcon className="h-6 w-6 text-primary" />
          </div>
        </CardHeader>
        <Separator className="my-2" />

        {/* Formulaire */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (readonly) */}
            <div className="space-y-1">
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
            <div className="space-y-1">
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
            <div className="space-y-1">
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
                  onChange={(e) =>
                    setPrenoms(e.target.value.split(" ").filter((p) => p))
                  }
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
            <div className="space-y-1">
              <Label htmlFor="contact">Contact</Label>
              <PhoneTaker
                value={contact}
                onChange={setContact}
                disabled={isSaving}
              />
            </div>

            {/* Sexe */}
            <div className="space-y-1">
              <Label htmlFor="sexe">Sexe</Label>
              <Select value={sexe} onValueChange={setSexe} disabled={isSaving}>
                <SelectTrigger className="flex-1 rounded-none border-none bg-transparent shadow-none focus:ring-0 focus:outline-none">
                  <SelectValue placeholder="Sélectionner le sexe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="f">Féminin</SelectItem>
                  <SelectItem value="m">Masculin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date de naissance */}
            <div className="space-y-1">
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
                  onChange={(e) =>
                    setDateNaissance(new Date(e.target.value).getTime())
                  }
                  disabled={isSaving}
                />
              </InputGroup>
            </div>

            {/* Rôle */}
            <div className="space-y-1">
              <Label htmlFor="role">Rôle</Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <RoleIcon className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <Select
                  value={role}
                  onValueChange={setRole}
                  disabled={isSaving}>
                  <SelectTrigger className="flex-1 rounded-none border-none bg-transparent shadow-none focus:ring-0 focus:outline-none">
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

            {/* Messages */}
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-600 text-green-600 px-3 py-2 rounded-md text-sm">
                Utilisateur modifié avec succès ! Redirection...
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/settings/users/gerer")}
                disabled={isSaving}
                className="w-full">
                Annuler
              </Button>
              <Button type="submit" disabled={!canSave} className="w-full">
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

export default MobileGererUnUser;
