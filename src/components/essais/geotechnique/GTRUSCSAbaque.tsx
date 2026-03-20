import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GTRUSCSAbaqueProps {
  passant80um: number;
  passant2mm: number;
  ip: number;
  vbs: number;
  mo: number;
  gtrSousClasse?: string | null;
  uscsCode?: string | null;
}

// GTR classification tree data
const GTR_TREE = [
  {
    classe: "A", label: "Sols fins", condition: "Passant 80µm > 35%", color: "bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700",
    sousClasses: [
      { code: "A1", label: "Peu plastique", condition: "Ip ≤ 12", color: "text-sky-600" },
      { code: "A2", label: "Moy. plastique", condition: "12 < Ip ≤ 25", color: "text-amber-600" },
      { code: "A3", label: "Plastique", condition: "25 < Ip ≤ 40", color: "text-orange-600" },
      { code: "A4", label: "Très plastique", condition: "Ip > 40", color: "text-red-600" },
    ],
  },
  {
    classe: "B", label: "Sols sableux/graveleux", condition: "Passant 80µm ≤ 35%", color: "bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700",
    sousClasses: [
      { code: "B1", label: "Sable propre", condition: "VBS ≤ 0.1", color: "text-cyan-600" },
      { code: "B2", label: "Sable peu argileux", condition: "0.1 < VBS ≤ 0.2", color: "text-blue-600" },
      { code: "B3", label: "Sable argileux", condition: "0.2 < VBS ≤ 1.5", color: "text-purple-600" },
      { code: "B4", label: "Sable très argileux", condition: "VBS > 1.5", color: "text-rose-600" },
      { code: "B5", label: "Grave propre", condition: "Pass. 2mm ≤ 70%, Pass. 80µm ≤ 12%", color: "text-teal-600" },
      { code: "B6", label: "Grave argileuse", condition: "Pass. 2mm ≤ 70%, Pass. 80µm > 12%", color: "text-indigo-600" },
    ],
  },
  {
    classe: "F", label: "Sols organiques", condition: "MO > 10%", color: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700",
    sousClasses: [
      { code: "F1", label: "Faible MO", condition: "3% < MO ≤ 10%", color: "text-emerald-500" },
      { code: "F2", label: "Forte MO", condition: "10% < MO ≤ 30%", color: "text-emerald-600" },
      { code: "F3", label: "Tourbe", condition: "MO > 30%", color: "text-emerald-700" },
    ],
  },
];

const USCS_GROUPS = [
  {
    label: "Sols grossiers (Pass. 80µm < 50%)",
    color: "bg-teal-100 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700",
    codes: [
      { code: "GW", label: "Grave bien graduée", condition: "Pass. 80µm < 5%", color: "text-teal-600" },
      { code: "GP", label: "Grave mal graduée", condition: "Pass. 80µm < 5%", color: "text-teal-500" },
      { code: "GM", label: "Grave limoneuse", condition: "Ip ≤ 7", color: "text-blue-600" },
      { code: "GC", label: "Grave argileuse", condition: "Ip > 7", color: "text-indigo-600" },
      { code: "SW", label: "Sable bien gradué", condition: "Pass. 80µm < 5%", color: "text-cyan-600" },
      { code: "SP", label: "Sable mal gradué", condition: "Pass. 80µm < 5%", color: "text-cyan-500" },
      { code: "SM", label: "Sable limoneux", condition: "Ip ≤ 7", color: "text-blue-500" },
      { code: "SC", label: "Sable argileux", condition: "Ip > 7", color: "text-purple-600" },
    ],
  },
  {
    label: "Sols fins (Pass. 80µm ≥ 50%)",
    color: "bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700",
    codes: [
      { code: "ML", label: "Limon peu plastique", condition: "Wl < 50, sous ligne A", color: "text-sky-600" },
      { code: "CL", label: "Argile peu plastique", condition: "Wl < 50, au-dessus ligne A", color: "text-orange-600" },
      { code: "CL-ML", label: "Argile limoneuse", condition: "4 ≤ Ip ≤ 7, Wl < 50", color: "text-amber-600" },
      { code: "MH", label: "Limon très plastique", condition: "Wl ≥ 50, sous ligne A", color: "text-violet-600" },
      { code: "CH", label: "Argile très plastique", condition: "Wl ≥ 50, au-dessus ligne A", color: "text-red-600" },
    ],
  },
];

export function GTRUSCSAbaqueButton({ passant80um, passant2mm, ip, vbs, mo, gtrSousClasse, uscsCode }: GTRUSCSAbaqueProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Abaque GTR / USCS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Abaque de Classification des Sols</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="gtr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gtr">GTR (NF P 11-300)</TabsTrigger>
            <TabsTrigger value="uscs">USCS (ASTM D2487)</TabsTrigger>
          </TabsList>

          <TabsContent value="gtr" className="space-y-4 mt-4">
            {/* Current values summary */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <ValueBox label="Pass. 80µm" value={passant80um} unit="%" />
              <ValueBox label="Pass. 2mm" value={passant2mm} unit="%" />
              <ValueBox label="Ip" value={ip} unit="%" />
              <ValueBox label="VBS" value={vbs} unit="g/100g" />
              <ValueBox label="MO" value={mo} unit="%" />
            </div>

            {GTR_TREE.map(group => (
              <div key={group.classe} className={`rounded-lg border p-3 ${group.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg">Classe {group.classe}</span>
                  <span className="text-sm text-muted-foreground">— {group.label}</span>
                  <Badge variant="outline" className="text-xs ml-auto">{group.condition}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {group.sousClasses.map(sc => {
                    const isActive = gtrSousClasse === sc.code;
                    return (
                      <div
                        key={sc.code}
                        className={`p-2 rounded border text-sm transition-all ${
                          isActive
                            ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm"
                            : "bg-background/60 border-border/50"
                        }`}
                      >
                        <span className={`font-bold ${sc.color}`}>{sc.code}</span>
                        <span className="text-muted-foreground ml-1">— {sc.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{sc.condition}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="uscs" className="space-y-4 mt-4">
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <ValueBox label="Pass. 80µm" value={passant80um} unit="%" />
              <ValueBox label="Pass. 2mm" value={passant2mm} unit="%" />
              <ValueBox label="Ip" value={ip} unit="%" />
              <ValueBox label="VBS" value={vbs} unit="g/100g" />
              <ValueBox label="MO" value={mo} unit="%" />
            </div>

            {USCS_GROUPS.map(group => (
              <div key={group.label} className={`rounded-lg border p-3 ${group.color}`}>
                <p className="font-bold text-sm mb-2">{group.label}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {group.codes.map(c => {
                    const isActive = uscsCode === c.code || (uscsCode === "GW/GP" && (c.code === "GW" || c.code === "GP")) || (uscsCode === "SW/SP" && (c.code === "SW" || c.code === "SP"));
                    return (
                      <div
                        key={c.code}
                        className={`p-2 rounded border text-sm transition-all ${
                          isActive
                            ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm"
                            : "bg-background/60 border-border/50"
                        }`}
                      >
                        <span className={`font-bold ${c.color}`}>{c.code}</span>
                        <span className="text-muted-foreground ml-1">— {c.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.condition}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ValueBox({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="p-1.5 rounded bg-muted/50 border border-border">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-bold text-foreground">{value > 0 ? `${value} ${unit}` : "-"}</p>
    </div>
  );
}
