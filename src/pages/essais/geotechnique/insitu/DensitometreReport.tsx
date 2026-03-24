import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useEchantillonGeotechniqueById, getGeoPrefix } from "@/hooks/useEchantillonsGeotechniqueFactory";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";

function pf(v: unknown): number { return parseFloat(String(v ?? "")) || 0; }
function fmt(v: number, dec = 2): string { return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec); }

export default function DensitometreReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const essaiType = "densitometre";
  const basePath = "/essais/geotechnique/in-situ/densitometre";

  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const { data: entreprise } = useEntreprise();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!echantillon) {
    return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const prefix = getGeoPrefix(essaiType);
  const numero = `${prefix}-${String(echantillon.numero).padStart(3, "0")}`;
  const r = (echantillon.resultats as Record<string, string>) || {};

  const v0 = pf(r.v0);
  const v1 = pf(r.v1);
  const V = v1 - v0;
  const M = pf(r.M);
  const tare = pf(r.tare);
  const H = pf(r.H);
  const S = pf(r.S);
  const I = S - tare;
  const E = H - S;
  const W = I > 0 ? (E / I) * 100 : 0;
  const P = V > 0 ? M / V : 0;
  const Pd = (100 + W) > 0 ? (P * 100) / (100 + W) : 0;
  const yd_max = pf(r.yd_max);
  const compactage = yd_max > 0 ? (Pd / yd_max) * 100 : 0;

  const verificationUrl = `${window.location.origin}/essais/geotechnique/in-situ/densitometre/${id}`;

  const rows = [
    { sym: "V0", label: "Volume initial", formula: "", unit: "cm³", val: fmt(v0) },
    { sym: "V1", label: "Volume final", formula: "", unit: "cm³", val: fmt(v1) },
    { sym: "V", label: "Volume du trou", formula: "(V1 - V0)", unit: "cm³", val: fmt(V) },
    { sym: "M", label: "Masse du sol extrait du trou", formula: "", unit: "g", val: fmt(M, 1) },
    { sym: "", label: "Tare", formula: "", unit: "g", val: fmt(tare, 1) },
    { sym: "H", label: "Tare + sol humide", formula: "", unit: "g", val: fmt(H, 1) },
    { sym: "S", label: "Tare + sol sec", formula: "", unit: "g", val: fmt(S, 1) },
    { sym: "I", label: "Sol sec", formula: "(S - Tare)", unit: "g", val: fmt(I, 1) },
    { sym: "E", label: "Poids de l'eau", formula: "(H - S)", unit: "g", val: fmt(E, 1) },
    { sym: "W", label: "Teneur en eau", formula: "(E / I × 100)", unit: "%", val: fmt(W) },
    { sym: "P", label: "Densité humide", formula: "(M / V)", unit: "g/cm³", val: fmt(P, 3) },
    { sym: "Pd", label: "Densité sèche", formula: "(P×100 / (100+W))", unit: "g/cm³", val: fmt(Pd, 3) },
  ];

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "In-Situ", path: "/essais/geotechnique/in-situ" },
          { label: "Densitomètre", path: basePath },
          { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
          { label: "Rapport" }
        ]} />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Rapport <span className="text-primary">{numero}</span>
            </h1>
          </div>
          <Button onClick={handlePrint} className="gradient-primary text-primary-foreground">
            <Printer className="h-4 w-4 mr-2" />Imprimer
          </Button>
        </div>
      </div>

      <div ref={printRef} className="bg-white text-black p-8 rounded-lg shadow-sm print:shadow-none print:p-0 max-w-4xl mx-auto print:max-w-none" style={{ fontFamily: "serif" }}>
        <ReportHeader
          entreprise={entreprise}
          verificationUrl={verificationUrl}
          title="ESSAI AU DENSITOMÈTRE À MEMBRANE"
          subtitle="Détermination de la densité en place"
        />

        {/* Infos échantillon */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border border-gray-300 p-3 rounded">
            <p><span className="font-bold">N° Échantillon :</span> {numero}</p>
            <p><span className="font-bold">Client :</span> {echantillon.clients?.nom || "-"}</p>
            <p><span className="font-bold">Chantier :</span> {echantillon.chantiers?.nom || "-"}</p>
          </div>
          <div className="border border-gray-300 p-3 rounded">
            <p><span className="font-bold">Date de prélèvement :</span> {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</p>
            <p><span className="font-bold">Type de sol :</span> {echantillon.type_sol}</p>
            
          </div>
        </div>

        {/* Tableau résultats */}
        <table className="w-full border-collapse border border-black text-sm mb-6">
          <thead>
            <tr className="bg-[#d4e5f7]">
              <th className="border border-black p-2 text-left w-12">Sym.</th>
              <th className="border border-black p-2 text-left">Désignation</th>
              <th className="border border-black p-2 text-center w-28">Formule</th>
              <th className="border border-black p-2 text-center w-16">Unité</th>
              <th className="border border-black p-2 text-center w-20">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-black p-2 font-bold text-center">{row.sym}</td>
                <td className="border border-black p-2">{row.label}</td>
                <td className="border border-black p-2 text-center text-gray-600">{row.formula}</td>
                <td className="border border-black p-2 text-center font-semibold">{row.unit}</td>
                <td className="border border-black p-2 text-center font-bold">{row.val}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Ligne Evd */}
        {yd_max > 0 && (
          <table className="w-full border-collapse border border-black text-sm mb-6">
            <tbody>
              <tr className="bg-[#d4e5f7]">
                <td className="border border-black p-2 font-bold text-center w-12">Evd</td>
                <td className="border border-black p-2 text-center">γd max</td>
                <td className="border border-black p-2 text-center font-bold">{fmt(yd_max, 1)}</td>
                <td className="border border-black p-2 text-center">% Compactage</td>
                <td className="border border-black p-2 text-center font-bold text-lg">{fmt(compactage, 1)}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Observations */}
        {r.notes && (
          <div className="border border-gray-300 p-3 rounded mb-6">
            <p className="font-bold text-sm mb-1">Observations :</p>
            <p className="text-sm">{r.notes}</p>
          </div>
        )}

        {/* Signature */}
        <div className="flex justify-between mt-12 text-sm">
          <div className="text-center">
            <p className="font-bold mb-8">L'opérateur</p>
            {echantillon.intervenants?.signature_url && (
              <img src={echantillon.intervenants.signature_url} alt="Signature" className="h-16 mx-auto mb-2" />
            )}
            <p>{echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : ""}</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-8">Le directeur du laboratoire</p>
            <p>_________________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
