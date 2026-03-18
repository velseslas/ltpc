import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3 } from "lucide-react";
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { classifySoil, SoilClassificationResult } from "./SoilClassification";

interface CasagrandeAbaqueProps {
  wl: number;
  ip: number;
  classification: SoilClassificationResult | null;
  /** For print report context - renders inline without dialog */
  inline?: boolean;
}

function AbaqueChart({ wl, ip, classification }: { wl: number; ip: number; classification: SoilClassificationResult | null }) {
  // Line A: Ip = 0.73 * (Wl - 20), from Wl=20 to Wl=110
  const lineAData = Array.from({ length: 19 }, (_, i) => {
    const x = 20 + i * 5;
    return { x, y: 0.73 * (x - 20) };
  });

  // Point data
  const pointData = wl > 0 && ip > 0 ? [{ x: wl, y: ip }] : [];

  return (
    <div className="space-y-4">
      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <ComposedChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 110]}
              ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]}
              label={{ value: "Limite de liquidité Wl (%)", position: "insideBottom", offset: -25, style: { fontSize: 12 } }}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={[0, 70]}
              ticks={[0, 10, 20, 30, 40, 50, 60, 70]}
              label={{ value: "Indice de plasticité Ip (%)", angle: -90, position: "insideLeft", offset: -5, style: { fontSize: 12 } }}
              tick={{ fontSize: 10 }}
            />
            <Tooltip formatter={(v: number) => v.toFixed(2)} />
            {/* Line B: Wl = 50 */}
            <ReferenceLine x={50} stroke="hsl(var(--destructive))" strokeDasharray="5 3" label={{ value: "B", position: "top", fontSize: 11 }} />
            {/* Ip = 4 horizontal */}
            <ReferenceLine y={4} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <ReferenceLine y={7} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            {/* Line A */}
            <Line data={lineAData} dataKey="y" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} name="Ligne A" type="linear" />
            {/* User point */}
            {pointData.length > 0 && (
              <Scatter data={pointData} fill="hsl(var(--destructive))" shape="circle" r={7} name="Échantillon" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Zone labels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-orange-100 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-800">
          <span className="font-bold text-orange-700 dark:text-orange-400">CL</span> — Argile peu plastique
        </div>
        <div className="p-2 rounded bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800">
          <span className="font-bold text-red-700 dark:text-red-400">CH</span> — Argile très plastique
        </div>
        <div className="p-2 rounded bg-sky-100 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-800">
          <span className="font-bold text-sky-700 dark:text-sky-400">ML</span> — Limon peu plastique
        </div>
        <div className="p-2 rounded bg-violet-100 dark:bg-violet-950/30 border border-violet-300 dark:border-violet-800">
          <span className="font-bold text-violet-700 dark:text-violet-400">MH</span> — Limon très plastique
        </div>
      </div>

      {classification && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">Classification de l'échantillon</p>
          <p className={`text-lg font-bold ${classification.color}`}>
            {classification.code} — {classification.label}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{classification.description}</p>
        </div>
      )}
    </div>
  );
}

export function ClassificationBadge({ wl, ip }: { wl: number; ip: number }) {
  const classification = classifySoil(wl, ip);
  if (!classification) return null;

  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <p className="text-xs text-muted-foreground mb-1">Classification du sol (Casagrande)</p>
      <p className={`text-lg font-bold ${classification.color}`}>
        {classification.code} — {classification.label}
      </p>
      <p className="text-xs text-muted-foreground">{classification.description}</p>
    </div>
  );
}

export function AbaqueButton({ wl, ip }: { wl: number; ip: number }) {
  const [open, setOpen] = useState(false);
  const classification = classifySoil(wl, ip);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Voir Abaque
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Abaque de Casagrande — Diagramme de Plasticité</DialogTitle>
        </DialogHeader>
        <AbaqueChart wl={wl} ip={ip} classification={classification} />
      </DialogContent>
    </Dialog>
  );
}

export function AbaqueInline({ wl, ip }: { wl: number; ip: number }) {
  const classification = classifySoil(wl, ip);
  return <AbaqueChart wl={wl} ip={ip} classification={classification} />;
}
