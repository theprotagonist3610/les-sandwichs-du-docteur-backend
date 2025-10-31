// export default MobileRegister;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useRegisterStore from "@/stores/global/registerStore";
import { createUserWithPrecheck } from "@/toolkits/global/userToolkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import SmallLoader from "@/components/global/SmallLoader";
import PhoneTaker from "@/components/global/PhoneTaker";
import { AlertCircle } from "lucide-react";

const MobileRegister = () => {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState(null);

  // Sélecteurs Zustand
  const nom = useRegisterStore((s) => s.nom);
  const prenoms = useRegisterStore((s) => s.prenoms);
  const email = useRegisterStore((s) => s.email);
  const password = useRegisterStore((s) => s.password);
  const confirmPassword = useRegisterStore((s) => s.confirmPassword);
  const contact = useRegisterStore((s) => s.contact);
  const sexe = useRegisterStore((s) => s.sexe);
  const date_naissance = useRegisterStore((s) => s.date_naissance);
  const isLoading = useRegisterStore((s) => s.isLoading);

  const setNom = useRegisterStore((s) => s.setNom);
  const setPrenoms = useRegisterStore((s) => s.setPrenoms);
  const setEmail = useRegisterStore((s) => s.setEmail);
  const setPassword = useRegisterStore((s) => s.setPassword);
  const setConfirmPassword = useRegisterStore((s) => s.setConfirmPassword);
  const setContact = useRegisterStore((s) => s.setContact);
  const setSexe = useRegisterStore((s) => s.setSexe);
  const setDateNaissance = useRegisterStore((s) => s.setDateNaissance);
  const setIsLoading = useRegisterStore((s) => s.setIsLoading);
  const resetForm = useRegisterStore((s) => s.resetForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword)
      return setLocalError("Les mots de passe ne correspondent pas");
    if (!date_naissance)
      return setLocalError("La date de naissance est requise");

    try {
      setIsLoading(true);
      const timestamp = new Date(date_naissance).getTime();

      const result = await createUserWithPrecheck({
        nom,
        prenoms,
        email,
        password,
        contact,
        sexe,
        date_naissance: timestamp,
      });

      resetForm();

      // Rediriger vers le dashboard basé sur le rôle
      const role = result.role || "admin";
      navigate(`/${role}/dashboard`);
    } catch (error) {
      setLocalError(error.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrenomsChange = (i, v) => {
    const n = [...prenoms];
    n[i] = v;
    setPrenoms(n);
  };
  const addPrenom = () => setPrenoms([...prenoms, ""]);
  const removePrenom = (i) => {
    if (prenoms.length > 1) setPrenoms(prenoms.filter((_, x) => x !== i));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="text-center py-6 px-6 space-y-3 bg-muted/20 border-b">
        <img
          src="/logo_petit.PNG"
          alt="Les Sandwichs du Docteur"
          className="w-28 h-auto mx-auto"
        />
      </header>

      {/* Formulaire */}
      <main className="flex-1 flex justify-center overflow-y-auto py-6 px-6">
        <Card className="w-full max-w-md border border-border/40 shadow-sm rounded-2xl p-4">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-semibold">
              Créer un compte
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Remplissez le formulaire pour vous inscrire
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Erreur */}
              {localError && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-md">
                  <AlertCircle size={16} />
                  <span className="text-xs">{localError}</span>
                </div>
              )}

              {/* Nom */}
              <div className="space-y-1">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom"
                  required
                />
              </div>

              {/* Prénoms */}
              <div className="space-y-1">
                <Label>Prénom(s)</Label>
                <div className="space-y-2">
                  {prenoms.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={p}
                        onChange={(e) => handlePrenomsChange(i, e.target.value)}
                        placeholder={`Prénom ${i + 1}`}
                        required
                      />
                      {prenoms.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removePrenom(i)}>
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPrenom}
                  className="w-full mt-1">
                  + Ajouter un prénom
                </Button>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>

              {/* Contact */}
              <div className="space-y-1">
                <Label htmlFor="contact">Contact</Label>
                <PhoneTaker value={contact} onChange={setContact} />
              </div>

              {/* Sexe */}
              <div className="space-y-1">
                <Label htmlFor="sexe">Sexe</Label>
                <Select value={sexe} onValueChange={setSexe} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Masculin</SelectItem>
                    <SelectItem value="f">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date de naissance */}
              <div className="space-y-1">
                <Label htmlFor="date_naissance">Date de naissance</Label>
                <Input
                  id="date_naissance"
                  type="date"
                  value={date_naissance || ""}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 mt-4"
                disabled={isLoading}>
                {isLoading ? (
                  <SmallLoader text="Inscription" spinnerSize={18} />
                ) : (
                  "S'inscrire"
                )}
              </Button>

              {/* Lien login */}
              <p className="text-xs text-center text-muted-foreground pt-2">
                Vous avez déjà un compte ?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MobileRegister;
