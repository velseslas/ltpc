import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";

interface UtilisateurRow {
  id: string;
  nom: string;
  email: string;
  role: string;
  statut: string;
}

const Auth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: entreprise, isLoading: isEntrepriseLoading } = useEntreprise();

  const [utilisateurs, setUtilisateurs] = useState<UtilisateurRow[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("utilisateurs")
        .select("id, nom, email, role, statut")
        .order("nom");
      if (data) setUtilisateurs(data as UtilisateurRow[]);
    };
    fetchUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const trimmed = username.trim().toLowerCase();
      const matchedUser = utilisateurs.find(
        (u) => u.nom.toLowerCase() === trimmed
      );

      if (!matchedUser) {
        setError("Utilisateur introuvable");
        setIsLoading(false);
        return;
      }

      if (matchedUser.statut !== "actif") {
        setError("Ce compte utilisateur est inactif");
        setIsLoading(false);
        return;
      }

      const { error } = await signIn(matchedUser.email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Mot de passe incorrect");
        } else {
          setError(error.message);
        }
      } else {
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${matchedUser.nom}`,
        });
        navigate("/");
      }
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
              className="w-12 h-12 rounded-xl object-contain"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center box-glow">
              <Building2 className="w-7 h-7 text-primary-foreground" />
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
                <Label>Utilisateur</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Entrez votre nom d'utilisateur"
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
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-medium"
                disabled={isLoading || !username.trim()}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Se connecter"}
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
