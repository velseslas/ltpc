import { ReactNode, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFilterSheetProps {
  /** Filter form / body */
  children: ReactNode;
  /** Number of active filters shown as a badge on the trigger */
  activeCount?: number;
  /** Callback to reset filters */
  onReset?: () => void;
  title?: string;
  triggerLabel?: string;
  className?: string;
}

/**
 * Reusable mobile-only bottom sheet for grouping filters.
 * Renders a trigger button; on desktop, host the filters inline instead.
 * No business logic — purely presentational shell.
 */
export function MobileFilterSheet({
  children,
  activeCount = 0,
  onReset,
  title = "Filtres",
  triggerLabel = "Filtres",
  className,
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-11 gap-2 touch-target md:hidden", className)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{triggerLabel}</span>
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] rounded-t-2xl safe-area-bottom flex flex-col p-0"
      >
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        <SheetFooter className="px-4 py-3 border-t border-border flex flex-row gap-2 sm:flex-row">
          {onReset && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={() => {
                onReset();
              }}
            >
              Réinitialiser
            </Button>
          )}
          <SheetClose asChild>
            <Button type="button" className="flex-1 h-11">
              Appliquer
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
