import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";
import { BottomNavigation } from "./BottomNavigation";
import { ReactNode, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PushActivationBanner } from "@/components/notifications/PushActivationBanner";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const embed = searchParams.get("embed") === "1";

  if (embed) {
    return (
      <div className="min-h-dvh bg-background">
        <main className="p-4">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <Navbar onMenuClick={() => setDrawerOpen(true)} />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <main
        className={cn(
          "pt-20 px-4 md:px-6 pb-24 md:pb-6 transition-all duration-300",
          "ml-0",
          collapsed ? "md:ml-16" : "md:ml-56"
        )}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <BottomNavigation onMenuClick={() => setDrawerOpen(true)} />
    </div>
  );
}
