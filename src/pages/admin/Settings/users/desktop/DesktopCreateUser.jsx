/**
 * DesktopCreateUser - Formulaire de création d'un pré-utilisateur (desktop)
 *
 * Permet d'ajouter un email dans la collection preusers avec son rôle
 * Utilise le store Zustand avec sélecteurs individuels
 * Validation en temps réel avec icônes check/croix
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCreateUserStore from "@/stores/admin/createUserStore";
import { addPreUser } from "@/toolkits/global/userToolkit";
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
  Mail,
  UserCircle,
  Check,
  X,
  ArrowLeft,
  Shield,
  Truck,
  ShoppingCart,
  ChefHat,
  Users,
} from "lucide-react";
import SmallLoader from "@/components/global/SmallLoader";

// Icônes pour chaque rôle
const roleIcons = {
  admin: Shield,
  superviseur: Users,
  livreur: Truck,
  vendeur: ShoppingCart,
  cuisinier: ChefHat,
};

const DesktopCreateUser = () => {
  const navigate = useNavigate();

  // Sélecteurs individuels pour éviter les rerenders
  const email = useCreateUserStore((state) => state.email);
  const role = useCreateUserStore((state) => state.role);
  const isLoading = useCreateUserStore((state) => state.isLoading);
  const error = useCreateUserStore((state) => state.error);
  const success = useCreateUserStore((state) => state.success);

  const setEmail = useCreateUserStore((state) => state.setEmail);
  const setRole = useCreateUserStore((state) => state.setRole);
  const setIsLoading = useCreateUserStore((state) => state.setIsLoading);
  const setError = useCreateUserStore((state) => state.setError);
  const setSuccess = useCreateUserStore((state) => state.setSuccess);
  const resetForm = useCreateUserStore((state) => state.resetForm);

  // Validation locale
  const [emailTouched, setEmailTouched] = useState(false);
  const [roleTouched, setRoleTouched] = useState(false);

  // Validation email
  const isEmailValid =
    email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isRoleValid = role.length > 0;

  const canSubmit = isEmailValid && isRoleValid && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    try {
      setIsLoading(true);
      setError(null);

      await addPreUser(email, role);

      setSuccess(true);

      // Reset après 1.5s et redirection
      setTimeout(() => {
        resetForm();
        navigate("/admin/settings/users/gerer");
      }, 1500);
    } catch (err) {
      setError(err.message || "Erreur lors de la création du pré-utilisateur");
    } finally {
      setIsLoading(false);
    }
  };

  const RoleIcon = UserCircle;

  return (
    <div className="container mx-auto max-w-2xl p-6 space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/settings/users")}
          disabled={isLoading}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Créer un pré-utilisateur
          </h1>
          <p className="text-muted-foreground mt-1">
            Ajouter un email autorisé à s'inscrire avec son rôle
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du pré-utilisateur</CardTitle>
          <CardDescription>
            L'email sera autorisé à créer un compte avec le rôle spécifié
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <Mail className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  type="email"
                  placeholder="utilisateur@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={emailTouched && !isEmailValid}
                  disabled={isLoading}
                  required
                />
                {emailTouched && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>
                      {isEmailValid ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </InputGroupText>
                  </InputGroupAddon>
                )}
              </InputGroup>
              {emailTouched && !isEmailValid && (
                <p className="text-sm text-destructive">Email invalide</p>
              )}
            </div>

            {/* Rôle */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Rôle <span className="text-destructive">*</span>
              </Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <RoleIcon className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <Select
                  value={role}
                  onValueChange={(value) => {
                    setRole(value);
                    setRoleTouched(true);
                  }}
                  disabled={isLoading}>
                  <SelectTrigger
                    className="flex-1 rounded-none border-0 bg-transparent shadow-none focus:ring-0"
                    aria-invalid={roleTouched && !isRoleValid}>
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
                {roleTouched && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>
                      {isRoleValid ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </InputGroupText>
                  </InputGroupAddon>
                )}
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
                  Pré-utilisateur créé avec succès ! Redirection...
                </p>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/settings/users")}
                disabled={isLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isLoading ? (
                  <SmallLoader text="Création..." spinnerSize={14} />
                ) : (
                  "Créer le pré-utilisateur"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopCreateUser;
