import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbItemType {
  label: React.ReactNode;
  path?: string;
}

interface AppBreadcrumbProps {
  items: BreadcrumbItemType[];
  showHome?: boolean;
}

export function AppBreadcrumb({ items, showHome = true }: AppBreadcrumbProps) {
  // On mobile, keep only the last 2 items to avoid horizontal overflow.
  const isLong = items.length > 2;
  const mobileItems = isLong ? items.slice(-2) : items;

  const renderItems = (list: BreadcrumbItemType[], keyPrefix: string) =>
    list.map((item, index) => (
      <span key={`${keyPrefix}-${index}`} className="contents">
        {index > 0 && <BreadcrumbSeparator />}
        <BreadcrumbItem>
          {item.path ? (
            <BreadcrumbLink asChild>
              <Link to={item.path} className="hover:text-primary truncate max-w-[40vw] md:max-w-none">
                {item.label}
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="truncate max-w-[55vw] md:max-w-none">{item.label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
      </span>
    ));

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {showHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="hover:text-primary flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  <span className="sr-only md:not-sr-only">Accueil</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {items.length > 0 && <BreadcrumbSeparator />}
          </>
        )}
        {/* Mobile: truncated list */}
        <span className="contents md:hidden">
          {isLong && (
            <>
              <BreadcrumbItem>
                <span className="text-muted-foreground">…</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          {renderItems(mobileItems, "m")}
        </span>
        {/* Desktop: full list */}
        <span className="contents hidden md:contents">{renderItems(items, "d")}</span>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
