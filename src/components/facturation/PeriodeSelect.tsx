import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface PeriodeSelectProps {
  /** Format "YYYY-MM" */
  value: string;
  onChange: (value: string) => void;
}

export function PeriodeSelect({ value, onChange }: PeriodeSelectProps) {
  const [yyyy, mm] = (value || "").split("-");
  const currentYear = new Date().getFullYear();
  const annees = Array.from({ length: 11 }, (_, i) => String(currentYear - 5 + i));

  const setMois = (m: string) => onChange(`${yyyy || String(currentYear)}-${m}`);
  const setAnnee = (a: string) => onChange(`${a}-${mm || "01"}`);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Select value={mm || ""} onValueChange={setMois}>
        <SelectTrigger><SelectValue placeholder="Mois" /></SelectTrigger>
        <SelectContent>
          {MOIS.map((label, i) => (
            <SelectItem key={label} value={String(i + 1).padStart(2, "0")}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={yyyy || ""} onValueChange={setAnnee}>
        <SelectTrigger><SelectValue placeholder="Année" /></SelectTrigger>
        <SelectContent>
          {annees.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
