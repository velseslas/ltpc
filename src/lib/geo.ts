/**
 * LOT 14.1 — Utilitaires de localisation des chantiers.
 * Aucun moteur de navigation interne : on délègue à l'application externe.
 */

export interface ChantierLocalisation {
  latitude?: number | null;
  longitude?: number | null;
  adresse_localisation?: string | null;
  adresse?: string | null;
  ville?: string | null;
  nom?: string | null;
}

export function hasCoords(loc?: ChantierLocalisation | null): boolean {
  return (
    !!loc &&
    typeof loc.latitude === "number" &&
    typeof loc.longitude === "number" &&
    Number.isFinite(loc.latitude) &&
    Number.isFinite(loc.longitude)
  );
}

export function formatCoords(lat?: number | null, lng?: number | null): string {
  if (typeof lat !== "number" || typeof lng !== "number") return "—";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** Adresse affichable : adresse géolocalisée > adresse saisie > wilaya. */
export function displayAdresse(loc?: ChantierLocalisation | null): string | null {
  if (!loc) return null;
  return (
    loc.adresse_localisation?.trim() ||
    loc.adresse?.trim() ||
    loc.ville?.trim() ||
    null
  );
}

/**
 * URL universelle d'itinéraire.
 * Priorité aux coordonnées GPS, sinon recherche textuelle.
 * L'URL google.com/maps/dir/ est prise en charge par l'app Google Maps
 * (Android / iOS) et par les navigateurs Desktop (Chrome, Edge, Firefox).
 */
export function buildItineraireUrl(loc?: ChantierLocalisation | null): string | null {
  if (hasCoords(loc)) {
    const dest = `${loc!.latitude},${loc!.longitude}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
  }
  const adresse = displayAdresse(loc);
  if (adresse) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(adresse)}&travelmode=driving`;
  }
  return null;
}

/** URL de visualisation simple (marqueur) pour « Voir sur la carte ». */
export function buildVoirSurCarteUrl(loc?: ChantierLocalisation | null): string | null {
  if (hasCoords(loc)) {
    return `https://www.google.com/maps/search/?api=1&query=${loc!.latitude},${loc!.longitude}`;
  }
  const adresse = displayAdresse(loc);
  if (adresse) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;
  }
  return null;
}

export function openExternalNavigation(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Recherche d'adresse (géocodage) — OpenStreetMap Nominatim, sans clé API. */
export interface GeocodeResult {
  label: string;
  latitude: number;
  longitude: number;
}

export async function geocodeAdresse(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=fr&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Recherche indisponible (${res.status})`);
  const rows = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return rows
    .map((r) => ({ label: r.display_name, latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) }))
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
}

/** Géocodage inverse : coordonnées → adresse lisible. */
export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=fr&lat=${lat}&lon=${lng}`;
  try {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}
