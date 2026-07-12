import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { useEntreprise } from "@/hooks/useEntreprise";
import type { Intervenant } from "@/hooks/useIntervenants";
import { format } from "date-fns";

interface SecuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employe: Intervenant | null;
}

/** Case à cocher (une lettre par case) */
const Boxes = ({ value = "", count = 12 }: { value?: string; count?: number }) => {
  const chars = value.padEnd(count, " ").slice(0, count).split("");
  return (
    <div className="inline-flex flex-wrap gap-[1px] align-middle">
      {chars.map((c, i) => (
        <span
          key={i}
          className="inline-block w-[12px] h-[15px] border border-black text-center text-[9px] leading-[15px]"
        >
          {c.trim() || "\u00A0"}
        </span>
      ))}
    </div>
  );
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2 mb-[3px]">
    <span className="text-[9px] w-[120px] shrink-0 pt-[1px]">{label} ......</span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-black text-white text-[10px] font-bold uppercase px-2 py-[3px] text-center tracking-wide">
    {children}
  </div>
);

/** Bandeau officiel CNAS : logo + texte arabe + "– Immatriculation –" */
const CnasHeader = () => (
  <div className="mb-2">
    <div className="bg-black text-white flex items-stretch" style={{ minHeight: "54px" }}>
      {/* Logo rond CNAS */}
      <div className="flex items-center justify-center px-3">
        <div
          className="rounded-full bg-white text-black flex items-center justify-center border-2 border-white"
          style={{ width: "46px", height: "46px" }}
        >
          <div className="text-center leading-none">
            <div className="text-[6px] font-bold" dir="rtl">الصندوق</div>
            <div className="text-[10px] font-black tracking-tight">CNAS</div>
          </div>
        </div>
      </div>
      {/* Textes arabes */}
      <div className="flex-1 flex flex-col justify-center pr-3 text-right" dir="rtl">
        <div className="text-[11px] font-semibold" style={{ letterSpacing: "1px" }}>
          وزارة العمل و التشغيل و الضمان الإجتماعي
        </div>
        <div className="text-[14px] font-bold mt-[2px]">
          الصندوق الوطني للتأمينات الإجتماعية للعمال الأجراء
        </div>
      </div>
    </div>
    <div className="text-center italic text-[10px] font-semibold py-[2px]">
      – Immatriculation –
    </div>
  </div>
);

/** Formulaire CNAS SECU-01 — Déclaration et demande d'affiliation d'un assuré social. */
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
    code_postal: "",
    cnas: "",
    cin: "",
    date_recrutement: "",
    profession: "",
    employeur: "",
    numero_employeur: "",
    fait_a: "",
    fait_le: "",
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
      fait_le: format(new Date(), "dd/MM/yyyy"),
    }));
  }, [employe, entreprise]);

  const handlePrint = () => window.print();

  const dob = form.date_naissance ? new Date(form.date_naissance) : null;
  const dobJ = dob ? String(dob.getDate()).padStart(2, "0") : "";
  const dobM = dob ? String(dob.getMonth() + 1).padStart(2, "0") : "";
  const dobA = dob ? String(dob.getFullYear()) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1400px] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 print:hidden">
          <DialogTitle>
            CNAS — SECU.01
            {employe && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {employe.prenom} {employe.nom}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-6" data-ref="report">
          <div
            id="secu-form"
            className="bg-white text-black mx-auto"
            style={{ fontFamily: "Arial, Helvetica, sans-serif", width: "297mm" }}
          >
            {/* ============ PAGE 1 ============ */}
            <div className="secu-page grid grid-cols-2 gap-3 p-4" style={{ pageBreakAfter: "always" }}>
              {/* ---------- COLONNE GAUCHE : CADRE RESERVE A LA CAISSE ---------- */}
              <div>
                <CnasHeader />
                <div className="border border-black">
                <div className="text-center bg-black text-white text-[10px] font-bold py-[3px]">
                  CADRE RESERVE A LA CAISSE
                </div>

                <div className="grid grid-cols-2 gap-2 p-2">
                  {/* Colonne interne gauche */}
                  <div className="text-[9px]">
                    <Row label="Numéro acte de naissance"><Boxes count={10} /></Row>
                    <Row label="Sexe"><Boxes count={1} /></Row>
                    <Row label="Situation de famille"><Boxes count={1} /></Row>
                    <Row label="Statut"><Boxes count={1} /></Row>
                    <Row label="Position"><Boxes count={1} /></Row>
                    <Row label="Nationalité"><Boxes count={2} /></Row>
                    <Row label="Numéro employeur">
                      <Boxes value={form.numero_employeur} count={12} />
                    </Row>
                    <Row label="Date de recrutement">
                      <Boxes
                        value={form.date_recrutement ? format(new Date(form.date_recrutement), "ddMMyyyy") : ""}
                        count={8}
                      />
                    </Row>
                    <Row label="Numéro subsistant"><Boxes count={10} /></Row>
                    <Row label="Caisse étrangère"><Boxes count={5} /></Row>
                    <Row label="Mode de paiement"><Boxes count={1} /></Row>
                    <Row label="Code banque ou C.C.P."><Boxes count={7} /></Row>
                    <Row label="Numéro de compte"><Boxes count={14} /></Row>
                    <Row label="Code mutuelle"><Boxes count={4} /></Row>
                    <Row label="Numéro mutuelle"><Boxes count={8} /></Row>
                  </div>

                  {/* Colonne interne droite : visas */}
                  <div className="space-y-2 text-[9px]">
                    <div className="border border-black">
                      <div className="bg-black text-white text-[9px] font-bold text-center py-[2px]">
                        VISA SERVICE IMMATRICULATION
                      </div>
                      <div className="p-2 h-[110px]">
                        <div>Assuré immatriculé provisoirement sous le numéro :</div>
                        <div className="my-1"><Boxes count={9} /></div>
                        <div>et / ou affecté au :</div>
                        <div className="font-bold my-1">centre payeur <Boxes count={6} /></div>
                        <div className="italic text-right mt-3">Date et signature,</div>
                      </div>
                    </div>

                    <div className="border border-black">
                      <div className="bg-black text-white text-[9px] font-bold text-center py-[2px]">
                        VISA SERVICE INFORMATIQUE
                      </div>
                      <div className="p-2 h-[75px]">
                        <div>Immatriculation provisoire confirmée.</div>
                        <div className="italic text-right mt-6">Date et signature,</div>
                      </div>
                    </div>

                    <div className="border border-black">
                      <div className="bg-black text-white text-[9px] font-bold text-center py-[2px]">
                        VISA SERVICE IMMATRICULATION
                      </div>
                      <div className="p-2 h-[70px]">
                        <div>Assuré affilié le : <Boxes count={8} /></div>
                        <div className="italic text-right mt-4">Signature,</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bas de la colonne gauche : Pièces à fournir + accusé */}
                <div className="border-t border-dashed border-black grid grid-cols-2 gap-2 p-2 text-[8.5px] leading-tight">
                  <div>
                    <div className="italic font-bold text-center underline mb-1">Pièces à fournir</div>
                    <p>
                      A) - Cette déclaration et demande d'affiliation doivent être obligatoirement accompagnées
                      des pièces justificatives suivantes :
                    </p>
                    <ol className="list-decimal pl-4 mt-1 space-y-[2px]">
                      <li>Une photocopie de la carte nationale d'immatriculation ou de la carte CHIFA pour tout assuré déjà immatriculé à la Sécurité Sociale.</li>
                      <li>Une fiche familiale d'état civil pour tout assuré social marié.</li>
                      <li>
                        Une pièce justifiant la qualité d'ayant droit :
                        <ul className="pl-3 mt-[2px] space-y-[1px]">
                          <li>– Kafala, attestation sur l'honneur légalisée par la Mairie.</li>
                          <li>– Certificat de scolarité pour tout enfant scolarisé.</li>
                          <li>– Attestation de non mariage pour ayant droit féminin.</li>
                          <li>– Attestation de non perception de revenus pour ascendants.</li>
                        </ul>
                      </li>
                    </ol>
                    <p className="mt-1">B) - Joindre un chèque barré pour le virement bancaire ou postal.</p>
                    <div className="italic font-bold text-center underline mt-2">Avertissement</div>
                    <p className="mt-1">
                      A) - L'employeur doit adresser cette déclaration à la Caisse dans les dix (10) jours
                      suivant le recrutement.
                    </p>
                    <p className="mt-1">B) - La loi punit quiconque se rend coupable de fraude ou de fausses déclarations.</p>
                  </div>

                  <div className="border border-black p-2">
                    <div className="text-center font-bold italic text-[9.5px] leading-tight">
                      Accusé de réception d'une déclaration
                      <br />
                      et demande d'affiliation
                      <br />
                      <span className="not-italic">SÉCURITÉ SOCIALE</span>
                    </div>
                    <div className="mt-2 border border-black p-1 text-[9px]">
                      <div>Nom : <span className="underline">{form.nom.toUpperCase()}</span></div>
                      <div>Prénom : <span className="underline">{form.prenom}</span></div>
                      <div>Né(e) le : <span className="underline">{form.date_naissance ? format(new Date(form.date_naissance), "dd/MM/yyyy") : ""}</span></div>
                      <div>N° Immat. : <span className="underline">{form.cnas}</span></div>
                    </div>
                    <div className="text-center italic mt-2">Déposée auprès de</div>
                    <div className="text-center italic">Cachet et signature</div>
                    <div className="mt-3 text-[9px] space-y-[3px]">
                      <div>Agence : ..............................</div>
                      <div>Service : ..............................</div>
                      <div>Date : <Boxes count={8} /></div>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* ---------- COLONNE DROITE ---------- */}
              <div>
                <CnasHeader />
                <div className="border border-black mb-2">
                  <div className="text-center font-bold text-[13px] py-1 border-b border-black">
                    DECLARATION ET DEMANDE D'AFFILIATION D'UN ASSURE SOCIAL
                  </div>
                  <div className="p-2">
                    <SectionTitle>NUMERO D'IMMATRICULATION</SectionTitle>
                    <div className="flex flex-col items-center gap-1 py-2">
                      <Boxes value={form.cnas} count={13} />
                      <div className="text-[8.5px] text-center italic max-w-[300px]">
                        Numéro à recopier à partir de la carte nationale d'immatriculation ou de la carte CHIFA
                        pour tout assuré déjà immatriculé à la Sécurité Sociale
                      </div>
                    </div>
                  </div>
                </div>

                {/* Déclaration employeur */}
                <div className="border border-black mb-2">
                  <SectionTitle>DECLARATION DE L'EMPLOYEUR OU DE L'ORGANISME ASSIMILE</SectionTitle>
                  <div className="p-3 text-[10px] space-y-2">
                    <div className="flex flex-col items-center">
                      <Boxes value={form.numero_employeur} count={13} />
                      <div className="text-[9px] font-bold">Numéro Employeur</div>
                    </div>
                    <div>
                      L'employeur ou l'organisme assimilé soussigné (Nom, Prénom ou raison sociale) :
                      <div className="border-b border-dotted border-black min-h-[14px] px-1">{form.employeur}</div>
                    </div>
                    <div>
                      Déclare que l'assuré désigné ci-dessous est embauché à compter du{" "}
                      <em>(date de recrutement)</em> :
                      <span className="border-b border-dotted border-black inline-block min-w-[140px] px-1 ml-1">
                        {form.date_recrutement ? format(new Date(form.date_recrutement), "dd/MM/yyyy") : ""}
                      </span>
                    </div>
                    <div>
                      En qualité de <em>(profession ou situation de l'assuré)</em> :
                      <span className="border-b border-dotted border-black inline-block flex-1 px-1 ml-1 min-w-[220px]">
                        {form.profession}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-4 gap-4 flex-wrap">
                      <div className="min-w-0">
                        Fait à{" "}
                        <span className="border-b border-dotted border-black inline-block min-w-[90px] px-1">
                          {form.fait_a}
                        </span>{" "}
                        le{" "}
                        <span className="border-b border-dotted border-black inline-block min-w-[90px] px-1">
                          {form.fait_le}
                        </span>
                      </div>
                      <div className="italic text-[9px] underline shrink-0">
                        Signature (avec identification du signataire) et Cachet
                      </div>
                    </div>
                    <div className="h-[60px]" />
                  </div>
                </div>

                {/* Renseignements assuré */}
                <div className="border border-black">
                  <SectionTitle>RENSEIGNEMENTS CONCERNANT L'ASSURE SOCIAL</SectionTitle>
                  <div className="p-2 text-[9px]">
                    <Row label="Nom"><Boxes value={form.nom.toUpperCase()} count={22} /> <span className="ml-1">(1)</span></Row>
                    <Row label="Prénom"><Boxes value={form.prenom} count={22} /></Row>
                    <Row label="Nom de l'époux"><Boxes value={form.nom_epoux} count={22} /></Row>
                    <div className="flex items-center gap-2 mb-[3px]">
                      <span className="text-[9px] w-[130px] shrink-0">Date de naissance ......</span>
                      <div className="flex gap-2 items-end">
                        <div className="flex flex-col items-center">
                          <Boxes value={dobJ} count={2} />
                          <span className="text-[8px]">Jour</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Boxes value={dobM} count={2} />
                          <span className="text-[8px]">Mois</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Boxes value={dobA} count={4} />
                          <span className="text-[8px]">Année</span>
                        </div>
                      </div>
                    </div>
                    <Row label="Lieu de naissance"><Boxes value={form.lieu_naissance} count={22} /></Row>
                    <Row label="Commune de Naissance"><Boxes value={form.commune_naissance} count={22} /></Row>
                    <Row label="Wilaya de naissance"><Boxes value={form.wilaya_naissance} count={22} /> <span className="ml-1">(2)</span></Row>
                    <Row label="Prénom du père"><Boxes value={form.prenom_pere} count={22} /></Row>
                    <Row label="Nom de la Mère"><Boxes value={form.nom_mere} count={22} /></Row>
                    <Row label="Prénom de la Mère"><Boxes value={form.prenom_mere} count={22} /></Row>
                    <div className="text-[9px] flex items-center gap-2 mb-[3px]">
                      <span className="w-[130px] shrink-0">Sexe ..............</span>
                      <span>
                        <span className={form.sexe === "M" ? "font-bold underline" : ""}>Masculin</span>
                        {" - "}
                        <span className={form.sexe === "F" ? "font-bold underline" : ""}>Féminin</span> (3)
                      </span>
                    </div>
                    <div className="text-[9px] flex items-center gap-2 mb-[3px]">
                      <span className="w-[130px] shrink-0">Situation de famille ...</span>
                      <span>
                        {["Célibataire", "Marié(e)", "Veuf(ve)", "Divorcé(e)"].map((s, i) => (
                          <span key={s}>
                            <span className={form.situation_famille === s ? "font-bold underline" : ""}>{s}</span>
                            {i < 3 && " - "}
                          </span>
                        ))}{" "}
                        (3)
                      </span>
                    </div>
                    <Row label="Nationalité"><Boxes value={form.nationalite} count={22} /></Row>
                    <Row label="Adresse Complète"><Boxes value={form.adresse} count={30} /></Row>
                    <div className="flex justify-end my-[3px]"><Boxes count={30} /></div>
                    <Row label="Code postal"><Boxes value={form.code_postal} count={5} /></Row>

                    <div className="text-[8px] mt-2 italic space-y-[1px]">
                      <div>1 - Nom de jeune fille pour les femmes mariées.</div>
                      <div>2 - Si l'assuré est né à l'étranger, indiquez le pays de naissance.</div>
                      <div>3 - Rayer la ou les mention(s) inutile(s).</div>
                    </div>
                    <div className="text-right text-[7.5px] mt-1">IMP.CNAS 04-2021 - SECU.01</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============ PAGE 2 ============ */}
            <div className="secu-page grid grid-cols-2 gap-3 p-4">
              {/* Enfants */}
              <div>
                <CnasHeader />
                <BeneficiaireTable
                  title="RENSEIGNEMENTS CONCERNANT LES ENFANTS AYANTS DROIT"
                  columnA="NOM"
                  columnB="PRENOM"
                  ranks={Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, "0"))}
                />

                <div className="border border-black p-2 mt-3 text-[8.5px] leading-tight">
                  <div className="inline-block bg-black text-white font-bold px-2 py-[2px] text-[9px] mb-1">
                    REMARQUE
                  </div>
                  <ul className="space-y-[2px] list-none">
                    <li>♦ Inscrire ci-dessus, les enfants à charge légitimes ou recueillis par l'assuré social ou son conjoint (article 67 de la loi 83-11 du 02 juillet 1983).</li>
                    <li>▸ Les enfants âgés de moins de dix-huit (18) ans ;</li>
                    <li>▸ Les enfants âgés de moins de vingt et un (21) ans qui poursuivent leurs études ;</li>
                    <li>▸ Les enfants âgés de moins de vingt-cinq (25) ans en contrat d'apprentissage ;</li>
                    <li>▸ Sans limitation d'âge, en cas d'infirmité ou maladie chronique ;</li>
                    <li>▸ Sans limitation d'âge, lorsque l'enfant est de sexe féminin ;</li>
                    <li>♦ Pour l'assurée de sexe féminin, ses enfants doivent être inscrits si le père n'ouvre pas droit.</li>
                  </ul>
                </div>
              </div>

              {/* Conjoints + Ascendants + Déclaration */}
              <div className="space-y-3">
                <CnasHeader />
                <BeneficiaireTable
                  title="RENSEIGNEMENTS CONCERNANT LE(S) CONJOINT(S) AYANTS DROIT"
                  columnA="NOM DE JEUNE FILLE"
                  columnB="PRENOM"
                  ranks={["80", "81", "82", "83"]}
                />
                <div className="border border-black p-2 text-[8.5px]">
                  <span className="inline-block bg-black text-white font-bold px-2 py-[2px] text-[9px] mr-2">
                    REMARQUE
                  </span>
                  ♦ Inscrire ci-dessus, le conjoint lorsqu'il n'est pas lui-même assuré social.
                </div>

                <BeneficiaireTable
                  title="RENSEIGNEMENTS CONCERNANT LES ASCENDANTS AYANTS DROIT"
                  columnA="NOM"
                  columnB="PRENOM"
                  ranks={["90", "91", "92", "93"]}
                />
                <div className="border border-black p-2 text-[8.5px]">
                  <span className="inline-block bg-black text-white font-bold px-2 py-[2px] text-[9px] mr-2">
                    REMARQUE
                  </span>
                  ♦ Sont considérés à charge, les ascendants de l'assuré social ou du conjoint, lorsque leurs
                  ressources personnelles ne dépassent pas le montant minimal de la pension de retraite.
                </div>

                {/* Déclaration */}
                <div className="border border-black">
                  <SectionTitle>DECLARATION DE L'ASSURE SOCIAL</SectionTitle>
                  <div className="p-3 text-[10px] space-y-2">
                    <div>
                      Je, soussigné <em>(Nom et Prénom de l'assuré social)</em>,{" "}
                      <span className="border-b border-dotted border-black inline-block min-w-[280px] px-1">
                        {form.prenom} {form.nom.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      Déclare que les informations figurant sur la présente demande d'affiliation sont exactes
                      et complètes.
                    </div>
                    <div>
                      Je m'engage à informer immédiatement la caisse de tout changement pouvant intervenir dans
                      ma situation familiale ou dans la situation socio-professionnelle de l'un de mes ayants
                      droit.
                    </div>
                    <div className="flex justify-between items-end mt-6">
                      <div>
                        A{" "}
                        <span className="border-b border-dotted border-black inline-block min-w-[130px] px-1">
                          {form.fait_a}
                        </span>{" "}
                        le{" "}
                        <span className="border-b border-dotted border-black inline-block min-w-[130px] px-1">
                          {form.fait_le}
                        </span>
                      </div>
                      <div className="italic text-[9px] underline">Signature de l'assuré social</div>
                    </div>
                    <div className="h-[70px]" />
                  </div>
                </div>
              </div>
            </div>
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

        <style>{`
          @media print {
            body * { visibility: hidden; }
            #secu-form, #secu-form * { visibility: visible; }
            #secu-form { position: absolute; left: 0; top: 0; width: 100%; }
            .secu-page { page-break-inside: avoid; }
          }
          @page { size: A4 landscape; margin: 6mm; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

/** Tableau ayants-droit avec cases à cocher */
const BeneficiaireTable = ({
  title,
  columnA,
  columnB,
  ranks,
}: {
  title: string;
  columnA: string;
  columnB: string;
  ranks: string[];
}) => (
  <div className="border border-black">
    <div className="flex">
      <div className="flex-1 bg-black text-white text-[10px] font-bold uppercase px-2 py-[3px] text-center">
        {title}
      </div>
      <div className="bg-black text-white text-[9px] font-bold uppercase px-2 py-[3px] text-center border-l border-white w-[170px]">
        CADRE RESERVE
        <br />
        AU SERVICE AFFILIATION
      </div>
    </div>
    <table className="w-full border-collapse text-[8px]">
      <thead>
        <tr>
          <th className="border border-black w-[24px]">
            <div className="[writing-mode:vertical-rl] rotate-180 py-1 font-bold">R A N G</div>
          </th>
          <th className="border border-black py-1 font-bold">{columnA}</th>
          <th className="border border-black py-1 font-bold">{columnB}</th>
          <th className="border border-black py-1 font-bold w-[120px]">
            DATE DE NAISSANCE
            <div className="text-[7px] font-normal">Jour&nbsp;&nbsp;Mois&nbsp;&nbsp;Année</div>
          </th>
          <th className="border border-black py-1 font-bold w-[150px] text-[7px]">
            Sex. P. Sit. Date blocage
          </th>
        </tr>
      </thead>
      <tbody>
        {ranks.map((r) => (
          <tr key={r}>
            <td className="border border-black text-center font-bold py-1">{r}</td>
            <td className="border border-black px-1 py-1"><Boxes count={20} /></td>
            <td className="border border-black px-1 py-1"><Boxes count={16} /></td>
            <td className="border border-black px-1 py-1 text-center">
              <span className="inline-flex gap-1">
                <Boxes count={2} /> <Boxes count={2} /> <Boxes count={2} />
              </span>
            </td>
            <td className="border border-black px-1 py-1 text-center">
              <Boxes count={8} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
