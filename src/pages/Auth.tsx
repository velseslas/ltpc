import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Lock, User, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: entreprise, isLoading: isEntrepriseLoading } = useEntreprise();

  const isUsersLoading = false;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const trimmed = username.trim().toLowerCase();
      if (!trimmed) {
        setError("Identifiant requis");
        return;
      }

      // Resolve username/email -> email via secure edge function (no PII exposed)
      let emailToUse = trimmed;
      if (!trimmed.includes("@")) {
        const { data: lookup, error: lookupError } = await supabase.functions.invoke(
          "lookup-user-email",
          { body: { identifier: trimmed } }
        );
        if (lookupError || !lookup?.found) {
          setError("Identifiants incorrects");
          return;
        }
        if (lookup.statut && lookup.statut !== "actif") {
          setError("Ce compte utilisateur est inactif");
          return;
        }
        emailToUse = (lookup.email as string).trim().toLowerCase();
      }

      const { error } = await signIn(emailToUse, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Identifiants incorrects");
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Connexion réussie",
        description: `Bienvenue`,
      });
      navigate("/");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEntrepriseLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        {/* Logo Header */}
        <div className="flex items-center justify-center gap-3">
          {entreprise?.logo_url ? (
            <img
              src={entreprise.logo_url}
              alt={entreprise.nom || "Logo"}
              className="w-16 h-16 rounded-xl object-contain bg-white/10 p-1"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center box-glow">
              <Building2 className="w-9 h-9 text-primary-foreground" />
            </div>
          )}
          <span className="font-display font-bold text-2xl">
            {(entreprise?.nom || "ENTREPRISE").split(" ").map((word, i) => (
              <span key={i} className={i % 2 === 0 ? "text-primary text-glow" : "text-foreground"}>
                {word}{" "}
              </span>
            ))}
          </span>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-display">Connexion</CardTitle>
            <p className="text-muted-foreground text-sm">Accédez à votre espace de gestion</p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Utilisateur ou email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Entrez votre nom d'utilisateur ou email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary border-border"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-medium"
                disabled={isLoading || isUsersLoading || !username.trim()}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isUsersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Système de gestion de laboratoire de matériaux de construction
        </p>
      </div>
    </div>
  );
};

export default Auth;
