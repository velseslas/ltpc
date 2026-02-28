import { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  highlight: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({ title, highlight, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          {title} <span className="text-primary text-glow">{highlight}</span>
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-6 rounded-2xl bg-primary/10 mb-6">
          <Icon className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Module en développement
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          Ce module sera bientôt disponible. Vous pourrez gérer vos {highlight.toLowerCase()} directement depuis cette interface.
        </p>
      </div>
    </>
  );
}
