import * as React from "react";
import { Input } from "@/components/ui/input";

function isoToFr(iso?: string | null) {
  if (!iso) return "";
  const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function frToIso(fr: string) {
  const m = fr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const d = Number(dd), mo = Number(mm), y = Number(yyyy);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return "";
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return "";
  return `${yyyy}-${mm}-${dd}`;
}

/** Masque de saisie JJ/MM/AAAA à partir des chiffres tapés */
function maskFr(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join("/");
}

export interface DateInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> {
  /** Valeur ISO "YYYY-MM-DD" */
  value?: string | null;
  /** Reçoit un événement dont target.value est la valeur ISO ("" si incomplet) */
  onChange?: (e: { target: { name: string; value: string } }) => void;
}

/**
 * Champ de date en saisie libre au format JJ/MM/AAAA.
 * Conserve l'API d'un <DateInput /> : value/onChange en ISO.
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, placeholder = "JJ/MM/AAAA", inputMode = "numeric", ...props }, ref) => {
    const [text, setText] = React.useState(() => isoToFr(value));
    const lastEmitted = React.useRef<string>(value ? String(value).slice(0, 10) : "");

    React.useEffect(() => {
      const incoming = value ? String(value).slice(0, 10) : "";
      if (incoming !== lastEmitted.current) {
        lastEmitted.current = incoming;
        setText(isoToFr(incoming));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskFr(e.target.value);
      setText(masked);
      const iso = frToIso(masked);
      const next = masked === "" ? "" : iso;
      if (next !== lastEmitted.current && (next !== "" || masked === "")) {
        lastEmitted.current = next;
        onChange?.({ target: { value: next } });
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={10}
        value={text}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
DateInput.displayName = "DateInput";
