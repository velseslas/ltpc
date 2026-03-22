import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from "recharts";

interface GranulometrieSolAbaqueProps {
  tamisData: { d: number; passant: number }[];
  classification: { classe: string; description: string; conforme: boolean };
}

// NF EN 13285 grading envelopes for different GNT types
const FUSEAUX = [
  {
    label: "GNT 0/20",
    dMax: 20,
    points: [
      { d: 0.063, min: 2, max: 9 },
      { d: 0.5, min: 12, max: 32 },
      { d: 2, min: 22, max: 48 },
      { d: 4, min: 29, max: 58 },
      { d: 6.3, min: 36, max: 66 },
      { d: 10, min: 48, max: 78 },
      { d: 16, min: 64, max: 92 },
      { d: 20, min: 100, max: 100 },
    ],
  },
  {
    label: "GNT 0/31.5",
    dMax: 31.5,
    points: [
      { d: 0.063, min: 2, max: 9 },
      { d: 0.5, min: 10, max: 30 },
      { d: 2, min: 20, max: 45 },
      { d: 4, min: 25, max: 55 },
      { d: 6.3, min: 30, max: 60 },
      { d: 10, min: 38, max: 68 },
      { d: 16, min: 50, max: 78 },
      { d: 20, min: 58, max: 85 },
      { d: 25, min: 68, max: 95 },
      { d: 31.5, min: 100, max: 100 },
    ],
  },
  {
    label: "GNT 0/63",
    dMax: 63,
    points: [
      { d: 0.063, min: 1, max: 7 },
      { d: 0.5, min: 8, max: 25 },
      { d: 2, min: 15, max: 38 },
      { d: 4, min: 20, max: 45 },
      { d: 6.3, min: 25, max: 52 },
      { d: 10, min: 30, max: 58 },
      { d: 16, min: 38, max: 68 },
      { d: 20, min: 43, max: 73 },
      { d: 25, min: 50, max: 80 },
      { d: 31.5, min: 58, max: 86 },
      { d: 40, min: 68, max: 92 },
      { d: 50, min: 80, max: 97 },
      { d: 63, min: 100, max: 100 },
    ],
  },
];

// Classification categories NF EN 13285
const CATEGORIES = [
  { classe: "GNT A", fines: "f ≤ 3%", description: "Grave non traitée de type A — Faible teneur en fines, très bonne portance", usage: "Couche de fondation, couche de base" },
  { classe: "GNT B", fines: "3% < f ≤ 7%", description: "Grave non traitée de type B — Teneur moyenne en fines, bonne portance", usage: "Couche de fondation, couche de forme" },
  { classe: "GNT C", fines: "7% < f ≤ 12%", description: "Grave non traitée de type C — Teneur élevée en fines, portance moyenne", usage: "Couche de forme, remblai" },
  { classe: "Hors norme", fines: "f > 12%", description: "Teneur en fines excessive", usage: "Non conforme pour couches de chaussée" },
];

export default function GranulometrieSolAbaque({ tamisData, classification }: GranulometrieSolAbaqueProps) {
  // Build chart data with fuseau GNT 0/31.5 as reference
  const fuseau = FUSEAUX[1]; // 0/31.5
  const chartPoints = fuseau.points.map(fp => {
    const sample = tamisData.find(t => Math.abs(t.d - fp.d) < 0.01);
    return {
      d: fp.d,
      min: fp.min,
      max: fp.max,
      passant: sample?.passant ?? null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Chart with fuseau */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Fuseau granulométrique — {fuseau.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartPoints} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="d"
                  scale="log"
                  domain={['auto', 'auto']}
                  tickFormatter={v => `${v}`}
                  label={{ value: 'Ouverture tamis (mm)', position: 'bottom', offset: 10, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  label={{ value: 'Passant cumulé (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip formatter={(value: number | null) => value !== null ? [`${value}%`] : ['-']} labelFormatter={l => `Tamis: ${l} mm`} />
                {/* Fuseau min */}
                <Line type="monotone" dataKey="min" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Min fuseau" />
                {/* Fuseau max */}
                <Line type="monotone" dataKey="max" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Max fuseau" />
                {/* Sample curve */}
                <Line
                  type="monotone"
                  dataKey="passant"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  connectNulls
                  name="Échantillon"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Lignes pointillées : limites du fuseau NF EN 13285 ({fuseau.label})
          </p>
        </CardContent>
      </Card>

      {/* Classification table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Classification NF EN 13285</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CATEGORIES.map(cat => {
              const isActive = classification.classe === cat.classe;
              return (
                <div
                  key={cat.classe}
                  className={`p-3 rounded border text-sm transition-all ${
                    isActive
                      ? "bg-primary/15 border-primary ring-2 ring-primary/30 shadow-md"
                      : "bg-muted/30 border-border opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-extrabold text-base ${isActive ? "text-primary" : "text-foreground"}`}>
                        {cat.classe}
                      </span>
                      <span className="text-foreground/70 ml-2 font-medium">({cat.fines})</span>
                    </div>
                    {isActive && <Badge className="bg-primary text-primary-foreground">Actif</Badge>}
                  </div>
                  <p className="text-foreground/80 mt-1">{cat.description}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Usage : {cat.usage}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All fuseaux reference */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Fuseaux de référence NF EN 13285</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-2 text-left text-muted-foreground">Tamis (mm)</th>
                  {FUSEAUX.map(f => (
                    <th key={f.label} className="py-2 px-2 text-center text-muted-foreground" colSpan={2}>{f.label}</th>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <th className="py-1 px-2"></th>
                  {FUSEAUX.map(f => (
                    <><th key={`${f.label}-min`} className="py-1 px-1 text-center text-muted-foreground">Min</th>
                    <th key={`${f.label}-max`} className="py-1 px-1 text-center text-muted-foreground">Max</th></>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0.063, 0.5, 2, 4, 6.3, 10, 16, 20, 25, 31.5, 40, 50, 63].map(d => (
                  <tr key={d} className="border-b border-border/50">
                    <td className="py-1 px-2 font-medium text-foreground">{d}</td>
                    {FUSEAUX.map(f => {
                      const pt = f.points.find(p => Math.abs(p.d - d) < 0.01);
                      return (
                        <><td key={`${f.label}-${d}-min`} className="py-1 px-1 text-center text-muted-foreground">{pt?.min ?? "-"}</td>
                        <td key={`${f.label}-${d}-max`} className="py-1 px-1 text-center text-muted-foreground">{pt?.max ?? "-"}</td></>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
