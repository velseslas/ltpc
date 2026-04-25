import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { ReactNode, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchParams] = useSearchParams();
  const embed = searchParams.get("embed") === "1";

  if (embed) {
    return (
      <div className="min-h-screen bg-background">
        <main className="p-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={cn(
          "pt-20 px-6 pb-6 transition-all duration-300",
          collapsed ? "ml-16" : "ml-56"
        )}
      >
        {children}
      </main>
    </div>
  );
}

