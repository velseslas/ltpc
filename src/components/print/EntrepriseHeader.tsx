import { ReportHeader } from "@/components/reports/ReportHeader";
import { useEntreprise } from "@/hooks/useEntreprise";

interface EntrepriseHeaderProps {
  title: string;
  subtitle?: string;
}

export function EntrepriseHeader({ title, subtitle }: EntrepriseHeaderProps) {
  const { data: entreprise } = useEntreprise();
  const verificationUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="p-6 bg-white text-black">
      <ReportHeader
        entreprise={entreprise}
        verificationUrl={verificationUrl}
        title={title}
        subtitle={subtitle}
      />
    </div>
  );
}
