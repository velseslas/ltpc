// LOT 14.2 — Clé publique VAPID.
// La clé PUBLIQUE est destinée au navigateur (PushManager.subscribe) : elle peut
// figurer dans le bundle. La clé PRIVÉE reste exclusivement dans les secrets
// serveur (VAPID_PRIVATE_KEY) et n'est jamais référencée côté client.
//
// Un override par variable d'environnement reste possible pour les environnements
// disposant de leur propre paire (VITE_VAPID_PUBLIC_KEY).

const FALLBACK_VAPID_PUBLIC_KEY =
  "BBW4917bp_r44Wq7JFeGlfmP2tc98OD7509vTqaxmmSbNmDAfCwf0KkJ0Jzala7lljYldGlNQoS4A0fqdPogEMQ";

const envKey = (import.meta as { env?: Record<string, string> }).env?.VITE_VAPID_PUBLIC_KEY;

export const VAPID_PUBLIC_KEY: string = envKey && envKey.length > 0 ? envKey : FALLBACK_VAPID_PUBLIC_KEY;
