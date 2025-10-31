import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useLoginStore from "@/stores/global/loginStore";
import { loginUser } from "@/toolkits/global/userToolkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SmallLoader from "@/components/global/SmallLoader";
import { AlertCircle, Mail, Lock } from "lucide-react";

const DesktopLogin = () => {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState(null);

  // Sélecteurs individuels
  const email = useLoginStore((state) => state.email);
  const password = useLoginStore((state) => state.password);
  const isLoading = useLoginStore((state) => state.isLoading);

  const setEmail = useLoginStore((state) => state.setEmail);
  const setPassword = useLoginStore((state) => state.setPassword);
  const setIsLoading = useLoginStore((state) => state.setIsLoading);
  const resetForm = useLoginStore((state) => state.resetForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    try {
      setIsLoading(true);
      const result = await loginUser(email, password);
      resetForm();

      // Rediriger vers le dashboard basé sur le rôle
      const role = result.role || "admin";
      navigate(`/${role}/dashboard`);
    } catch (error) {
      setLocalError(error.message || "Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Branding */}
          <div className="text-center lg:text-left space-y-8">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Bon retour !
            </h1>
            <img
              src="/logo_petit.PNG"
              alt="Les Sandwichs du Docteur"
              className="w-80 h-auto mx-auto lg:mx-0"
            />
            <p className="text-xl text-muted-foreground">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {/* Right side - Form */}
          <Card className="shadow-2xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl">Connexion</CardTitle>
              <CardDescription className="text-base">
                Entrez vos identifiants pour vous connecter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Erreur */}
                {localError && (
                  <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md">
                    <AlertCircle size={20} />
                    <span className="text-sm">{localError}</span>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="pl-11 h-12 text-base"
                      required
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-11 h-12 text-base"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? <SmallLoader text="Connexion" /> : "Se connecter"}
                </Button>

                {/* Lien vers Register */}
                <p className="text-base text-center text-muted-foreground">
                  Pas encore de compte ?{" "}
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    S'inscrire
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

export default DesktopLogin;
