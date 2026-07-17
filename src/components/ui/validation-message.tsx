import { AlertCircle } from "lucide-react";

interface ValidationMessageProps {
  show: boolean;
  message?: string;
}

export const ValidationMessage = ({ show, message = "Ce champ est obligatoire" }: ValidationMessageProps) => {
  if (!show) return null;
  return (
    <p className="text-destructive text-sm flex items-center gap-1 mt-1">
      <AlertCircle className="w-4 h-4" />
      {message}
    </p>
  );
};
