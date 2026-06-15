import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { DuplicateReportDialog } from "./DuplicateReportDialog";

export interface DuplicateReportButtonProps {
  tableName: string;
  sourceId: string;
  reportRoute: (id: string) => string;
  invalidateKeys?: string[];
  /** Visual variant of the trigger button. */
  variant?: "outline" | "default" | "ghost";
  className?: string;
  label?: string;
}

/**
 * Standard "Dupliquer" action for any report.
 * Hidden when printing (print:hidden).
 */
export function DuplicateReportButton({
  tableName,
  sourceId,
  reportRoute,
  invalidateKeys,
  variant = "outline",
  className = "",
  label = "Dupliquer",
}: DuplicateReportButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={variant}
        onClick={() => setOpen(true)}
        className={`print:hidden border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 ${className}`}
      >
        <Copy className="h-4 w-4 mr-2" />
        {label}
      </Button>
      <DuplicateReportDialog
        open={open}
        onOpenChange={setOpen}
        tableName={tableName}
        sourceId={sourceId}
        reportRoute={reportRoute}
        invalidateKeys={invalidateKeys}
      />
    </>
  );
}
