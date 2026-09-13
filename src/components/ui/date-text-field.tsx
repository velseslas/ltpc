import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function dateToFr(d?: Date | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

function frToDate(fr: string): Date | undefined {
  const m = fr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return undefined;
  const date = new Date(y, mo - 1, d);
  if (date.getMonth() !== mo - 1 || date.getDate() !== d) return undefined;
  return date;
}

function maskFr(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/");
}

export interface DateTextFieldProps {
  value?: Date | null;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/** Saisie libre d'une date au format JJ/MM/AAAA (remplace le calendrier). */
export function DateTextField({
  value,
  onSelect,
  className,
  placeholder = "JJ/MM/AAAA",
  disabled,
  id,
}: DateTextFieldProps) {
  const [text, setText] = React.useState(() => dateToFr(value));
  const lastEmitted = React.useRef(dateToFr(value));

  React.useEffect(() => {
    const incoming = dateToFr(value);
    if (incoming !== lastEmitted.current) {
      lastEmitted.current = incoming;
      setText(incoming);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskFr(e.target.value);
    setText(masked);
    const parsed = frToDate(masked);
    if (masked === "") {
      lastEmitted.current = "";
      onSelect?.(undefined);
    } else if (parsed) {
      lastEmitted.current = masked;
      onSelect?.(parsed);
    }
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      maxLength={10}
      disabled={disabled}
      placeholder={placeholder}
      value={text}
      onChange={handleChange}
      className={cn("bg-background", className)}
    />
  );
}
