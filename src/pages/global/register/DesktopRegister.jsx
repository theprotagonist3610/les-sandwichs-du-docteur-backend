import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useRegisterStore from "@/stores/global/registerStore";
import { createUserWithPrecheck } from "@/toolkits/global/userToolkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SmallLoader from "@/components/global/SmallLoader";
import PhoneTaker from "@/components/global/PhoneTaker";
import { AlertCircle } from "lucide-react";

const DesktopRegister = () => {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState(null);

  // Sélecteurs individuels pour éviter les rerenders
  const nom = useRegisterStore((state) => state.nom);
  const prenoms = useRegisterStore((state) => state.prenoms);
  const email = useRegisterStore((state) => state.email);
  const password = useRegisterStore((state) => state.password);
  const confirmPassword = useRegisterStore((state) => state.confirmPassword);
  const contact = useRegisterStore((state) => state.contact);
  const sexe = useRegisterStore((state) => state.sexe);
  const date_naissance = useRegisterStore((state) => state.date_naissance);
  const isLoading = useRegisterStore((state) => state.isLoading);

  const setNom = useRegisterStore((state) => state.setNom);
  const setPrenoms = useRegisterStore((state) => state.setPrenoms);
  const setEmail = useRegisterStore((state) => state.setEmail);
  const setPassword = useRegisterStore((state) => state.setPassword);
  const setConfirmPassword = useRegisterStore((state) => state.setConfirmPassword);
  const setContact = useRegisterStore((state) => state.setContact);
  const setSexe = useRegisterStore((state) => state.setSexe);
  const setDateNaissance = useRegisterStore((state) => state.setDateNaissance);
  const setIsLoading = useRegisterStore((state) => state.setIsLoading);
  const resetForm = useRegisterStore((state) => state.resetForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    // Validation locale
    if (password !== confirmPassword) {
      setLocalError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!date_naissance) {
      setLocalError("La date de naissance est requise");
      return;
    }

    try {
      setIsLoading(true);

      // Convertir date en timestamp
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
      const role = result.user?.role || "admin";
      navigate(`/${role}/dashboard`);
    } catch (error) {
      setLocalError(error.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrenomsChange = (index, value) => {
    const newPrenoms = [...prenoms];
    newPrenoms[index] = value;
    setPrenoms(newPrenoms);
  };

  const addPrenom = () => {
    setPrenoms([...prenoms, ""]);
  };

  const removePrenom = (index) => {
    if (prenoms.length > 1) {
      const newPrenoms = prenoms.filter((_, i) => i !== index);
      setPrenoms(newPrenoms);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <div className="text-center lg:text-left space-y-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Bienvenue
            </h1>
            <img
              src="/logo_petit.PNG"
              alt="Les Sandwichs du Docteur"
              className="w-64 h-auto mx-auto lg:mx-0"
            />
            <p className="text-lg text-muted-foreground">
              Rejoignez-nous et profitez d'une expérience unique
            </p>
          </div>

          {/* Right side - Form */}
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Créer un compte</CardTitle>
              <CardDescription>
                Remplissez le formulaire pour vous inscrire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Erreur */}
                {localError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                    <AlertCircle size={18} />
                    <span className="text-sm">{localError}</span>
                  </div>
                )}

                {/* Grid layout for 2 columns */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Nom */}
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Votre nom"
                      required
                    />
                  </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact</Label>
                    <PhoneTaker
                      value={contact}
                      onChange={setContact}
                    />
                  </div>
                </div>

                {/* Prénoms - Full width */}
                <div className="space-y-2">
                  <Label>Prénom(s)</Label>
                  {prenoms.map((prenom, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={prenom}
                        onChange={(e) => handlePrenomsChange(index, e.target.value)}
                        placeholder={`Prénom ${index + 1}`}
                        required
                      />
                      {prenoms.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removePrenom(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPrenom}
                    className="w-full"
                  >
                    + Ajouter un prénom
                  </Button>
                </div>

                {/* Grid layout for 2 columns */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Sexe */}
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="date_naissance">Date de naissance</Label>
                    <Input
                      id="date_naissance"
                      type="date"
                      value={date_naissance || ""}
                      onChange={(e) => setDateNaissance(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email - Full width */}
                <div className="space-y-2">
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

                {/* Grid layout for 2 columns */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <SmallLoader text="Inscription" /> : "S'inscrire"}
                </Button>

                {/* Lien vers Login */}
                <p className="text-sm text-center text-muted-foreground">
                  Vous avez déjà un compte ?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Se connecter
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DesktopRegister;
