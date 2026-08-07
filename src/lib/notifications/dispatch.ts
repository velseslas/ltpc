// LOT 14.2 — Point de déclenchement UNIQUE des notifications métier.
//
// Le client n'envoie JAMAIS de contenu de notification : il signale seulement
// qu'un événement métier vient de se produire (type + identifiant de ressource).
// L'Edge Function `push-dispatch` :
//   1. valide l'appelant (JWT) ;
//   2. reconstruit le titre / message / lien depuis la base ;
//   3. détermine les destinataires ;
//   4. insère dans `notifications` (source de vérité) ;
//   5. envoie le Push aux abonnements actifs.
//
// Aucun échec de notification ne doit interrompre le flux métier.
import { supabase } from "@/integrations/supabase/client";

export type NotificationEvent =
  | "affectation_creee"
  | "rapport_valide"
  | "rapport_a_valider"
  | "echantillon_cree"
  | "message_recu";

export async function dispatchNotificationEvent(
  event: NotificationEvent,
  resourceId: string
): Promise<void> {
  if (!resourceId) return;
  try {
    const { error } = await supabase.functions.invoke("push-dispatch", {
      body: { event, resource_id: resourceId },
    });
    if (error) console.warn("[dispatchNotificationEvent] échec", event, error.message);
  } catch (e) {
    console.warn("[dispatchNotificationEvent] échec", event, e);
  }
}
