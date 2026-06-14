import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileSignature, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLettresEngagement } from "@/hooks/useDocuments";
import { useEngagementArticles, useUpsertEngagementArticles, DEFAULT_ENGAGEMENT_ARTICLES } from "@/hooks/useEngagementArticles";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

interface ArticleEdit {
  number: number;
  titre: string;
  contenu: string;
}

const EngagementEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { query } = useLettresEngagement();
  const { data: savedArticles, isLoading: loadingArticles } = useEngagementArticles(id || "");
  const upsertArticles = useUpsertEngagementArticles();

  const engagement = query.data?.find((c: any) => c.id === id);

  const [articles, setArticles] = useState<ArticleEdit[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    if (loadingArticles) return;

    const merged = DEFAULT_ENGAGEMENT_ARTICLES.map((def) => {
      const saved = savedArticles?.find((a) => a.article_number === def.number);
      return {
        number: def.number,
        titre: saved?.titre || def.titre,
        contenu: saved?.contenu || def.contenu,
      };
    });
    setArticles(merged);
    setInitialized(true);
  }, [savedArticles, loadingArticles, initialized]);

  const updateArticle = (num: number, field: "titre" | "contenu", value: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.number === num ? { ...a, [field]: value } : a))
    );
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await upsertArticles.mutateAsync(
        articles.map((a) => ({
          engagement_id: id,
          article_number: a.number,
          titre: a.titre,
          contenu: a.contenu,
        }))
      );
      toast.success("Articles sauvegardés avec succès");
      navigate(`/documents/lettres-engagement/${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  if (!engagement) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Lettre d'engagement introuvable</p>
      </div>
    );
  }

  return (
    <>
      <AppBreadcrumb items={[
        { label: "Documents", path: "/documents" },
        { label: "Lettres d'engagement", path: "/documents/lettres-engagement" },
        { label: engagement.titre, path: `/documents/lettres-engagement/${id}` },
        { label: "Modifier" },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate(`/documents/lettres-engagement/${id}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-blue-500" />
              </div>
              Modifier les articles
            </h1>
            <p className="text-sm text-muted-foreground ml-14">{engagement.titre}</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={upsertArticles.isPending}
          className="gap-2 gradient-primary text-primary-foreground"
        >
          {upsertArticles.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Enregistrer
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Utilisez <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{"{{clientName}}"}</code>, 
        <code className="bg-secondary px-1.5 py-0.5 rounded text-xs ml-1">{"{{chantierName}}"}</code>, 
        <code className="bg-secondary px-1.5 py-0.5 rounded text-xs ml-1">{"{{labName}}"}</code> pour insérer dynamiquement les noms.
      </p>

      {/* Articles */}
      <div className="space-y-6">
        {articles.map((article) => (
          <div
            key={article.number}
            className="rounded-xl bg-card border border-border p-6 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500 font-bold text-sm flex-shrink-0">
                {String(article.number).padStart(2, "0")}
              </div>
              <div className="flex-1">
                <Label className="text-muted-foreground text-xs">Titre de l'article</Label>
                <Input
                  value={article.titre}
                  onChange={(e) => updateArticle(article.number, "titre", e.target.value)}
                  className="bg-secondary border-0 text-foreground font-semibold mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Contenu</Label>
              <Textarea
                value={article.contenu}
                onChange={(e) => updateArticle(article.number, "contenu", e.target.value)}
                className="bg-secondary border-0 text-foreground mt-1 min-h-[120px] resize-y"
                rows={Math.max(4, article.contenu.split("\n").length + 1)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save button */}
      <div className="flex justify-end mt-8 pb-8">
        <Button
          onClick={handleSave}
          disabled={upsertArticles.isPending}
          className="gap-2 gradient-primary text-primary-foreground"
        >
          {upsertArticles.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Enregistrer les modifications
        </Button>
      </div>
    </>
  );
};

export default EngagementEditPage;
