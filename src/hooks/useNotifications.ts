import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useCurrentUserChantiers } from "@/hooks/useCurrentUserChantiers";

export interface Notification {
  id: string;
  type: "overdue_test" | "calibration_due" | "calibration_overdue" | "pending_test";
  severity: "warning" | "error" | "info";
  title: string;
  message: string;
  link?: string;
  date: string;
}

export function useNotifications() {
  const { data: role } = useCurrentUserRole();
  const { data: userChantiers } = useCurrentUserChantiers();
  const isTechnicien = role === "technicien" || role === "operateur";
  const allowedChantierIds = userChantiers?.chantierIds ?? [];

  return useQuery({
    queryKey: ["notifications", role, allowedChantierIds.join(",")],
    enabled: !isTechnicien || !!userChantiers,
    queryFn: async (): Promise<Notification[]> => {
      const notifications: Notification[] = [];
      const today = new Date();
      const allowedSet = new Set(allowedChantierIds);


      // 1. Check for overdue essais (pending or in-progress for more than 7 days)
      // Techniciens: skip generic essais (no chantier scoping available here)
      const { data: essais, error: essaisError } = isTechnicien
        ? { data: [], error: null }
        : await supabase
            .from("essais")
            .select("id, nom, reference, statut, date_reception")
            .in("statut", ["pending", "in-progress"]);


      if (!essaisError && essais) {
        essais.forEach((essai) => {
          if (essai.date_reception) {
            const receptionDate = parseISO(essai.date_reception);
            const daysSince = differenceInDays(today, receptionDate);
            
            if (daysSince > 14) {
              notifications.push({
                id: `essai-overdue-${essai.id}`,
                type: "overdue_test",
                severity: "error",
                title: "Essai en retard",
                message: `${essai.nom} (${essai.reference}) - ${daysSince} jours depuis réception`,
                link: `/essais`,
                date: essai.date_reception,
              });
            } else if (daysSince > 7) {
              notifications.push({
                id: `essai-warning-${essai.id}`,
                type: "pending_test",
                severity: "warning",
                title: "Essai en attente",
                message: `${essai.nom} (${essai.reference}) - ${daysSince} jours depuis réception`,
                link: `/essais`,
                date: essai.date_reception,
              });
            }
          }
        });
      }

      // 3. Check for compression samples needing attention (based on jours_essai)
      let compressionQuery = supabase
        .from("echantillons_compression")
        .select("id, numero, statut, date_coulage, jours_essai, ouvrage, chantier_id, clients:client_id(nom), chantiers:chantier_id(nom)")
        .in("statut", ["a-faire", "en-cours"]);
      if (isTechnicien) {
        if (allowedChantierIds.length === 0) {
          compressionQuery = compressionQuery.eq("chantier_id", "00000000-0000-0000-0000-000000000000");
        } else {
          compressionQuery = compressionQuery.in("chantier_id", allowedChantierIds);
        }
      }
      const { data: compressionSamples, error: compressionError } = await compressionQuery;

      if (!compressionError && compressionSamples) {
        compressionSamples.forEach((sample) => {

          if (sample.date_coulage && sample.jours_essai) {
            const coulageDate = parseISO(sample.date_coulage);
            const joursEssaiData = sample.jours_essai as Array<{ jour: number; nombre: number }>;
            
            const clientNom = (sample.clients as any)?.nom || "";
            const chantierNom = (sample.chantiers as any)?.nom || "";
            const ouvrage = sample.ouvrage || "";
            const detailParts = [clientNom, chantierNom, ouvrage].filter(Boolean).join(" — ");
            
            const overdueJours: { jour: number; daysSince: number }[] = [];
            const dueJours: { jour: number; daysUntil: number }[] = [];
            
            // Check each test day
            joursEssaiData.forEach((item) => {
              const jour = item.jour;
              const testDate = addDays(coulageDate, jour);
              const daysUntilTest = differenceInDays(testDate, today);
              
              if (daysUntilTest < 0) {
                overdueJours.push({ jour, daysSince: Math.abs(daysUntilTest) });
              } else if (daysUntilTest <= 7) {
                dueJours.push({ jour, daysUntil: daysUntilTest });
              }
            });
            
            // Create single notification for overdue tests
            if (overdueJours.length > 0) {
              const joursLabel = overdueJours.map(j => `${j.jour}j`).join(" et ");
              const maxDays = Math.max(...overdueJours.map(j => j.daysSince));
              notifications.push({
                id: `compression-overdue-${sample.id}`,
                type: "overdue_test",
                severity: "error",
                title: "Échantillon compression en retard",
                message: `EC-${String(sample.numero).padStart(3, "0")} — ${joursLabel} — Échu depuis ${maxDays} jours${detailParts ? `\n${detailParts}` : ""}`,
                link: `/essais/beton/beton-durci/compression/${sample.id}`,
                date: sample.date_coulage,
              });
            }
            
            // Create single notification for due tests
            if (dueJours.length > 0) {
              const joursLabel = dueJours.map(j => `${j.jour}j`).join(" et ");
              const minDays = Math.min(...dueJours.map(j => j.daysUntil));
              const daysText = minDays === 0 ? "aujourd'hui" : minDays === 1 ? "1 jour" : `${minDays} jours`;
              notifications.push({
                id: `compression-due-${sample.id}`,
                type: "pending_test",
                severity: minDays <= 1 ? "warning" : "info",
                title: `Échantillon ${joursLabel} — Échéance proche`,
                message: `EC-${String(sample.numero).padStart(3, "0")} — ${joursLabel} — Dans ${daysText}${detailParts ? `\n${detailParts}` : ""}`,
                link: `/essais/beton/beton-durci/compression/${sample.id}`,
                date: sample.date_coulage,
              });
            }
          }
        });
      }

      // 3. Check for equipment calibration (skip for techniciens — not scoped by chantier)
      const { data: materiel, error: materielError } = isTechnicien
        ? { data: [], error: null }
        : await supabase
            .from("materiel")
            .select("id, nom, reference, date_prochain_etalonnage, statut")
            .not("date_prochain_etalonnage", "is", null);


      if (!materielError && materiel) {
        materiel.forEach((equip) => {
          if (equip.date_prochain_etalonnage) {
            const calibrationDate = parseISO(equip.date_prochain_etalonnage);
            const daysUntil = differenceInDays(calibrationDate, today);
            
            if (isBefore(calibrationDate, today)) {
              // Overdue calibration
              notifications.push({
                id: `calibration-overdue-${equip.id}`,
                type: "calibration_overdue",
                severity: "error",
                title: "Étalonnage en retard",
                message: `${equip.nom}${equip.reference ? ` (${equip.reference})` : ""} - Échu depuis ${Math.abs(daysUntil)} jours`,
                link: `/materiel`,
                date: equip.date_prochain_etalonnage,
              });
            } else if (daysUntil <= 30) {
              // Calibration due soon
              notifications.push({
                id: `calibration-due-${equip.id}`,
                type: "calibration_due",
                severity: daysUntil <= 7 ? "warning" : "info",
                title: "Étalonnage à prévoir",
                message: `${equip.nom}${equip.reference ? ` (${equip.reference})` : ""} - Dans ${daysUntil} jours`,
                link: `/materiel`,
                date: equip.date_prochain_etalonnage,
              });
            }
          }
        });
      }

      // Sort by severity (errors first) then by date
      const severityOrder = { error: 0, warning: 1, info: 2 };
      notifications.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      return notifications;
    },
    refetchInterval: 30 * 1000, // Actualisation auto toutes les 30s
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
    gcTime: 60 * 1000,

  });
}
