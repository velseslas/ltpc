import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  to: string;
  className?: string;
}

export function BackButton({ to, className }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "shrink-0 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50",
        className
      )}
      onClick={() => navigate(to)}
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
}
