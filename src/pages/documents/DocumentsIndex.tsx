import { useNavigate } from "react-router-dom";
import { FileSignature, Briefcase, DollarSign, Award, FileText, ArrowLeft, FolderOpen } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Button } from "@/components/ui/button";

const documentTypes = [
  {
    title: "Dossier administratif LTPC BENMALEK",
    description: "Documents officiels et pièces administratives",
    icon: FolderOpen,
    path: "/documents/dossier-administratif",
    gradient: "from-teal-500/20 to-cyan-500/10",
    iconColor: "text-teal-500",
  },
  {
    title: "Contrat chantier",
    description: "Gestion des contrats clients et projets",
    icon: FileText,
    path: "/documents/contrats",
    gradient: "from-rose-500/20 to-red-500/10",
    iconColor: "text-rose-500",
  },
  {
    title: "Lettre d'engagement",
    description: "Lettres d'engagement clients et projets",
    icon: FileSignature,
    path: "/documents/lettres-engagement",
    gradient: "from-sky-500/20 to-blue-500/10",
    iconColor: "text-sky-500",
  },
  {
    title: "Offre de service",
    description: "Propositions de services aux clients",
    icon: Briefcase,
    path: "/documents/offres-service",
    gradient: "from-emerald-500/20 to-green-500/10",
    iconColor: "text-emerald-500",
  },
  {
    title: "Offre de prix",
    description: "Devis et offres de prix détaillées",
    icon: DollarSign,
    path: "/documents/offres-prix",
    gradient: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-500",
  },
  {
    title: "Attestation de bonne exécution",
    description: "Certificats de bonne réalisation",
    icon: Award,
    path: "/documents/attestations",
    gradient: "from-purple-500/20 to-violet-500/10",
    iconColor: "text-purple-500",
  },
];

const DocumentsIndex = () => {
  const navigate = useNavigate();

  return (
    <>
      <AppBreadcrumb items={[{ label: "Documents" }]} />

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Gestion des <span className="text-primary text-glow">Documents</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Rapports, certificats et documents techniques
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentTypes.map((doc) => (
          <div
            key={doc.path}
            onClick={() => navigate(doc.path)}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50"
          >
            <div className="space-y-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${doc.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <doc.icon className={`h-7 w-7 ${doc.iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {doc.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {doc.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default DocumentsIndex;
