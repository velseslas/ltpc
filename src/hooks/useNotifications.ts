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
      const { data: mobileLabos, error: mobileLabosError } = await supabase
        .from("laboratoires_mobiles")
        .select("chantier_id")
        .not("chantier_id", "is", null);
      const mobileLabChantierIds = new Set(
        (mobileLabos ?? [])
          .map((labo) => labo.chantier_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      );
      const canValidateMobileLabLink = !mobileLabosError;


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

      // 3. Échéances des essais de compression (labo + laboratoire mobile).
      // LOT 15.6 — ces échéances sont désormais un canal Push exclusif
      // (voir `echeances-dispatch`) : elles ne doivent plus apparaître dans la
      // cloche ni être comptées dans son badge. Le calcul reste inchangé côté
      // serveur ; on se contente de ne plus produire d'alerte in-app ici.
      const ECHEANCES_COMPRESSION_PUSH_ONLY = true;

      let compressionQuery = supabase
        .from("echantillons_compression")
        .select("id, numero, numero_chantier, statut, date_coulage, jours_essai, resultats, ouvrage, chantier_id, is_laboratoire_chantier, clients:client_id(nom), chantiers:chantier_id(nom)")
        .in("statut", ["a-faire", "en-cours"]);
      if (isTechnicien) {
        if (allowedChantierIds.length === 0) {
          compressionQuery = compressionQuery.eq("chantier_id", "00000000-0000-0000-0000-000000000000");
        } else {
          compressionQuery = compressionQuery.in("chantier_id", allowedChantierIds);
        }
      }
      const { data: compressionSamples, error: compressionError } = ECHEANCES_COMPRESSION_PUSH_ONLY
        ? { data: [] as any[], error: null }
        : await compressionQuery;


      if (!compressionError && compressionSamples) {
        compressionSamples.forEach((sample) => {
          const isLaboratoireChantier = Boolean((sample as any).is_laboratoire_chantier);

          // Un échantillon mobile ne doit générer une notification que si son chantier
          // est encore rattaché à un laboratoire mobile. Cela évite les alertes fantômes
          // après suppression/désaffectation du laboratoire chantier (ex. chantier Tiaret).
          if (
            isLaboratoireChantier &&
            canValidateMobileLabLink &&
            (!sample.chantier_id || !mobileLabChantierIds.has(sample.chantier_id))
          ) {
            return;
          }


          if (sample.date_coulage && sample.jours_essai) {
            const coulageDate = parseISO(sample.date_coulage);
            const joursEssaiData = (Array.isArray(sample.jours_essai) ? sample.jours_essai : []) as Array<{
              jour: number; nombre: number; unite?: string; heures?: number;
            }>;
            const resultats = (Array.isArray((sample as any).resultats) ? (sample as any).resultats : []) as Array<{
              joursEssai?: number; isHeures?: boolean; resistance?: number;
            }>;

            const clientNom = (sample.clients as any)?.nom || "";
            const chantierNom = (sample.chantiers as any)?.nom || "";
            const ouvrage = sample.ouvrage || "";
            const detailParts = [clientNom, chantierNom, ouvrage].filter(Boolean).join(" — ");
            // Numérotation affichée : numéro chantier pour les labos mobiles, numéro global sinon.
            const numeroAffiche = isLaboratoireChantier
              ? ((sample as any).numero_chantier ?? sample.numero)
              : sample.numero;
            // Les échantillons de laboratoire chantier n'existent pas dans la liste compression :
            // on pointe vers leur écran dédié pour éviter un lien mort.
            const sampleLink = isLaboratoireChantier && sample.chantier_id
              ? `/laboratoires-mobiles/chantier/${sample.chantier_id}/echantillon/${sample.id}`
              : `/essais/beton/beton-durci/compression/${sample.id}`;

            const overdueJours: { label: string; daysSince: number }[] = [];
            const dueJours: { label: string; daysUntil: number }[] = [];

            // Check each test deadline, en ignorant celles déjà réalisées (résultats saisis).
            joursEssaiData.forEach((item) => {
              const isHeures = item.unite === "heures" && typeof item.heures === "number";
              const label = isHeures ? `${item.heures} h` : `${item.jour} J`;

              // Nombre d'éprouvettes déjà renseignées pour cette échéance.
              const done = resultats.filter(
                (r) => !!r.isHeures === isHeures && Number(r.joursEssai) === Number(item.jour) && Number(r.resistance) > 0
              ).length;
              if (done >= (item.nombre ?? 1)) return; // échéance réalisée : pas d'alerte

              const testDate = isHeures
                ? new Date(coulageDate.getTime() + (item.heures as number) * 3600_000)
                : addDays(coulageDate, item.jour);
              const daysUntilTest = differenceInDays(testDate, today);

              if (daysUntilTest < 0) {
                overdueJours.push({ label, daysSince: Math.abs(daysUntilTest) });
              } else if (daysUntilTest <= 7) {
                dueJours.push({ label, daysUntil: daysUntilTest });
              }
            });

            // Create single notification for overdue tests
            if (overdueJours.length > 0) {
              const joursLabel = overdueJours.map(j => j.label).join(" et ");
              const maxDays = Math.max(...overdueJours.map(j => j.daysSince));
              notifications.push({
                id: `compression-overdue-${sample.id}`,
                type: "overdue_test",
                severity: "error",
                title: "Échantillon compression en retard",
                message: `EC-${String(numeroAffiche).padStart(3, "0")} — ${joursLabel} — Échu depuis ${maxDays} jours${detailParts ? `\n${detailParts}` : ""}`,
                link: sampleLink,
                date: sample.date_coulage,
              });
            }

            // Create single notification for due tests
            if (dueJours.length > 0) {
              const joursLabel = dueJours.map(j => j.label).join(" et ");
              const minDays = Math.min(...dueJours.map(j => j.daysUntil));
              const daysText = minDays === 0 ? "aujourd'hui" : minDays === 1 ? "1 jour" : `${minDays} jours`;
              notifications.push({
                id: `compression-due-${sample.id}`,
                type: "pending_test",
                severity: minDays <= 1 ? "warning" : "info",
                title: `Échantillon ${joursLabel} — Échéance proche`,
                message: `EC-${String(numeroAffiche).padStart(3, "0")} — ${joursLabel} — Dans ${daysText}${detailParts ? `\n${detailParts}` : ""}`,
                link: sampleLink,
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
