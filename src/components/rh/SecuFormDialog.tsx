import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, X } from "lucide-react";
import { useEntreprise } from "@/hooks/useEntreprise";
import type { Intervenant } from "@/hooks/useIntervenants";
import { format } from "date-fns";

interface SecuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employe: Intervenant | null;
}

/**
 * Formulaire CNAS SECU-01 — Déclaration et demande d'affiliation d'un assuré social.
 * Pré-rempli avec les informations de l'employé et de l'entreprise.
 */
export const SecuFormDialog = ({ open, onOpenChange, employe }: SecuFormDialogProps) => {
  const { data: entreprise } = useEntreprise();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    nom_epoux: "",
    date_naissance: "",
    lieu_naissance: "",
    commune_naissance: "",
    wilaya_naissance: "",
    prenom_pere: "",
    nom_mere: "",
    prenom_mere: "",
    sexe: "M",
    situation_famille: "Célibataire",
    nationalite: "Algérienne",
    adresse: "",
    cnas: "",
    cin: "",
    date_recrutement: "",
    profession: "",
    employeur: "",
    numero_employeur: "",
  });

  useEffect(() => {
    if (!employe) return;
    setForm((prev) => ({
      ...prev,
      nom: employe.nom || "",
      prenom: employe.prenom || "",
      date_naissance: employe.date_naissance || "",
      adresse: employe.adresse || "",
      cnas: employe.cnas || "",
      cin: employe.cin || "",
      date_recrutement: employe.date_embauche || "",
      profession: (employe as any).postes?.nom || employe.role || "",
      employeur: entreprise?.nom || "",
      numero_employeur: (entreprise as any)?.numero_cnas || "",
    }));
  }, [employe, entreprise]);

  const handleChange = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handlePrint = () => window.print();

  const fmt = (d: string) => (d ? format(new Date(d), "dd/MM/yyyy") : "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0" data-ref="report">
        <DialogHeader className="px-6 pt-6 print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle>
              Déclaration CNAS — SECU-01
              {employe && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {employe.prenom} {employe.nom}
                </span>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Éditable / non imprimé */}
          <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-border/50 bg-card/40 p-4">
            <div className="space-y-1">
              <Label>N° d'immatriculation CNAS</Label>
              <Input value={form.cnas} onChange={(e) => handleChange("cnas", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>N° CIN</Label>
              <Input value={form.cin} onChange={(e) => handleChange("cin", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nom du père</Label>
              <Input value={form.prenom_pere} onChange={(e) => handleChange("prenom_pere", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nom de la mère</Label>
              <Input value={form.nom_mere} onChange={(e) => handleChange("nom_mere", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Prénom de la mère</Label>
              <Input value={form.prenom_mere} onChange={(e) => handleChange("prenom_mere", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Lieu de naissance</Label>
              <Input value={form.lieu_naissance} onChange={(e) => handleChange("lieu_naissance", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Commune de naissance</Label>
              <Input value={form.commune_naissance} onChange={(e) => handleChange("commune_naissance", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Wilaya de naissance</Label>
              <Input value={form.wilaya_naissance} onChange={(e) => handleChange("wilaya_naissance", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Sexe</Label>
              <select
                value={form.sexe}
                onChange={(e) => handleChange("sexe", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Situation de famille</Label>
              <select
                value={form.situation_famille}
                onChange={(e) => handleChange("situation_famille", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Célibataire</option>
                <option>Marié(e)</option>
                <option>Divorcé(e)</option>
                <option>Veuf(ve)</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Nom de l'époux (si applicable)</Label>
              <Input value={form.nom_epoux} onChange={(e) => handleChange("nom_epoux", e.target.value)} />
            </div>
          </div>

          {/* Rendu du formulaire officiel */}
          <div
            id="secu-print-area"
            className="bg-white text-black rounded-lg border border-border/50 p-8 text-sm print:border-0 print:p-0 print:shadow-none"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            <div className="text-center mb-4">
              <div className="text-xs">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</div>
              <div className="text-xs">Caisse Nationale des Assurances Sociales des Travailleurs Salariés</div>
              <h2 className="text-base font-bold mt-2 uppercase">
                Déclaration et demande d'affiliation d'un assuré social
              </h2>
              <div className="text-xs mt-1">Imprimé CNAS 04-2021 — SECU.01</div>
            </div>

            {/* Employeur */}
            <section className="border border-black p-3 mb-4">
              <div className="font-semibold uppercase mb-2 text-xs">Déclaration de l'employeur</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <Field label="Employeur (Raison sociale)" value={form.employeur} />
                <Field label="N° employeur" value={form.numero_employeur} />
                <Field label="Date de recrutement" value={fmt(form.date_recrutement)} />
                <Field label="Qualité / Profession" value={form.profession} />
              </div>
              <div className="mt-6 text-right text-xs">Signature et cachet</div>
            </section>

            {/* Assuré */}
            <section className="border border-black p-3 mb-4">
              <div className="font-semibold uppercase mb-2 text-xs">Renseignements concernant l'assuré social</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <Field label="Nom" value={form.nom.toUpperCase()} />
                <Field label="Prénom" value={form.prenom} />
                <Field label="Nom de l'époux" value={form.nom_epoux} />
                <Field label="N° CNAS" value={form.cnas} />
                <Field label="N° CIN" value={form.cin} />
                <Field label="Date de naissance" value={fmt(form.date_naissance)} />
                <Field label="Lieu de naissance" value={form.lieu_naissance} />
                <Field label="Commune de naissance" value={form.commune_naissance} />
                <Field label="Wilaya de naissance" value={form.wilaya_naissance} />
                <Field label="Nom du père" value={form.prenom_pere} />
                <Field label="Nom de la mère" value={form.nom_mere} />
                <Field label="Prénom de la mère" value={form.prenom_mere} />
                <Field label="Sexe" value={form.sexe === "M" ? "Masculin" : "Féminin"} />
                <Field label="Situation de famille" value={form.situation_famille} />
                <Field label="Nationalité" value={form.nationalite} />
                <Field label="Adresse complète" value={form.adresse} />
              </div>
            </section>

            {/* Ayants droit */}
            <section className="border border-black p-3 mb-4">
              <div className="font-semibold uppercase mb-2 text-xs">Enfants ayants droit</div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {["Rang", "Nom", "Prénom", "Date de naissance", "Réservé"].map((h) => (
                      <th key={h} className="border border-black px-2 py-1 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }, (_, i) => (
                    <tr key={i}>
                      <td className="border border-black px-2 py-2">{String(i + 1).padStart(2, "0")}</td>
                      <td className="border border-black px-2 py-2">&nbsp;</td>
                      <td className="border border-black px-2 py-2">&nbsp;</td>
                      <td className="border border-black px-2 py-2">&nbsp;</td>
                      <td className="border border-black px-2 py-2">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Conjoint */}
            <section className="border border-black p-3 mb-4">
              <div className="font-semibold uppercase mb-2 text-xs">Conjoint(s) ayants droit</div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {["Rang", "Nom de jeune fille", "Prénom", "Date de naissance", "Réservé"].map((h) => (
                      <th key={h} className="border border-black px-2 py-1 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[80, 81].map((r) => (
                    <tr key={r}>
                      <td className="border border-black px-2 py-2">{r}</td>
                      <td className="border border-black px-2 py-2">&nbsp;</td>
                      <td className="border border-black px-2 py-2">&nbsp;</td>
                      <td className="border border-black px-2 py-2">&nbsp;</td>
                      <td className="border border-black px-2 py-2">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Déclaration assuré */}
            <section className="border border-black p-3 text-xs">
              <div className="font-semibold uppercase mb-2">Déclaration de l'assuré social</div>
              <p className="leading-relaxed">
                Je, soussigné(e){" "}
                <span className="font-semibold">
                  {form.prenom} {form.nom.toUpperCase()}
                </span>
                , déclare que les informations figurant sur la présente demande d'affiliation sont exactes
                et complètes. Je m'engage à informer immédiatement la caisse de tout changement pouvant
                intervenir dans ma situation familiale ou socio-professionnelle.
              </p>
              <div className="mt-6 flex justify-between">
                <div>
                  À <span className="underline">{form.lieu_naissance || "…………………"}</span> le{" "}
                  <span className="underline">{format(new Date(), "dd/MM/yyyy")}</span>
                </div>
                <div>Signature de l'assuré social</div>
              </div>
            </section>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex gap-1 items-baseline">
    <span className="text-[10px] uppercase text-gray-600 whitespace-nowrap">{label} :</span>
    <span className="border-b border-dotted border-black flex-1 px-1 min-h-[1.2em]">{value || " "}</span>
  </div>
);
