import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function FormLoadingOverlay({ 
  isLoading, 
  message = "Chargement des données...",
  className 
}: FormLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "absolute inset-0 z-50 flex flex-col items-center justify-center",
      "bg-background/80 backdrop-blur-sm rounded-lg",
      "animate-fade-in",
      className
    )}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

interface FormFieldSkeletonProps {
  label?: boolean;
  className?: string;
}

export function FormFieldSkeleton({ label = true, className }: FormFieldSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      )}
      <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
    </div>
  );
}

export function FormCardSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 p-6">
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      <div className="flex justify-end gap-3 pt-4">
        <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
      </div>
    </div>
  );
}
