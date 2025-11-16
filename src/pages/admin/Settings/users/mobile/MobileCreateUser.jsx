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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

const roleIcons = {
  admin: Shield,
  superviseur: Users,
  livreur: Truck,
  vendeur: ShoppingCart,
  cuisinier: ChefHat,
};

const MobileCreateUser = () => {
  const navigate = useNavigate();

  // Zustand store
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
    <div className="p-4 max-w-md mx-auto">
      <Card className="shadow-md border rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/settings/users")}
              disabled={isLoading}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-xl font-semibold">
                Créer un pré-utilisateur
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Ajoutez un email autorisé et son rôle
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Séparateur shadcn */}
        <Separator className="my-2" />

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
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
                <p className="text-xs text-destructive">Email invalide</p>
              )}
            </div>

            {/* Rôle */}
            <div className="space-y-1">
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
                    className="flex-1 rounded-none border-none bg-transparent shadow-none focus:ring-0 focus:outline-none"
                    aria-invalid={roleTouched && !isRoleValid}>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <Shield className="h-4 w-4 mr-1" /> Administrateur
                    </SelectItem>
                    <SelectItem value="superviseur">
                      <Users className="h-4 w-4 mr-1" /> Superviseur
                    </SelectItem>
                    <SelectItem value="vendeur">
                      <ShoppingCart className="h-4 w-4 mr-1" /> Vendeur
                    </SelectItem>
                    <SelectItem value="livreur">
                      <Truck className="h-4 w-4 mr-1" /> Livreur
                    </SelectItem>
                    <SelectItem value="cuisinier">
                      <ChefHat className="h-4 w-4 mr-1" /> Cuisinier
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

            {/* Messages */}
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-600 text-green-600 px-3 py-2 rounded-md text-sm">
                Pré-utilisateur créé avec succès ! Redirection...
              </div>
            )}

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/settings/users")}
                disabled={isLoading}
                className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={!canSubmit} className="flex-1">
                {isLoading ? (
                  <SmallLoader text="Création..." spinnerSize={14} />
                ) : (
                  "Créer"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileCreateUser;
