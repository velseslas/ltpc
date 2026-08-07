# LOT 15.1 — Messages vocaux (ajout à la messagerie LOT 15)

## Principe
Ajout **strictement additif** : aucun changement du texte, du Realtime, des badges,
des RLS de conversation ni du Push. Un message vocal est un message `messages` normal
avec `message_type = 'audio'`.

## Base de données
- `messages` : `message_type` (`text` par défaut | `audio`), `audio_path`, `audio_duration` (s).
- Trigger `validate_message` étendu :
  - `text` → contenu non vide, ≤ 4000 caractères ;
  - `audio` → `audio_path` obligatoire, préfixé par `conversation_id/`, `audio_duration` entre 1 et 120 s ;
  - `sender_id := auth.uid()` inchangé (usurpation impossible).
- Trigger `bump_conversation` : aperçu « 🎤 Message vocal » pour un vocal.

## Stockage
Bucket **privé** `message-audio`, chemin `conversation_id/<uuid>.<ext>`.
Policies `storage.objects` : SELECT/INSERT/DELETE réservés aux participants de la
conversation (`can_access_conversation` sur le 1er segment du chemin).
Lecture via **URL signée 1 h** générée à la demande — aucune URL publique, rien en base.

## Frontend
- `src/lib/messagerie/audio.ts` — helpers purs : formats supportés, validation
  (MIME, taille ≤ 5 Mo, durée ≤ 120 s), chemin, formatage mm:ss.
- `src/components/messagerie/VoiceRecorder.tsx` — MediaRecorder natif (aucune dépendance) :
  micro, minuteur, arrêt auto à 120 s, aperçu écoutable, suppression ou envoi,
  libération systématique du micro.
- `src/components/messagerie/VoiceMessage.tsx` — lecteur bulle : play/pause, barre de
  progression, durée, message clair si l'audio est indisponible.
- `useMessagerieActions().sendVoiceMessage` — upload Storage puis insertion du message ;
  **rollback du fichier** si l'insertion échoue (jamais de message incomplet).

## Notifications
Aucun nouveau système : même événement `message_recu`. `push-dispatch` distingue
seulement le libellé → « Nouveau message vocal ». Deep-link identique.

## Tests
`src/hooks/__tests__/useMessagerieVoice.test.ts` (6 tests) + LOT 15 (5 tests) = 11 ✅
`tsgo --noEmit` : 0 erreur.

## Limites connues
- Pas de transcription, pas de waveform, pas d'édition d'un vocal (V1 volontaire).
- Navigateurs sans `MediaRecorder` : le bouton micro est masqué, le texte reste disponible.
- Test physique micro Android/iOS à confirmer sur appareil réel.

**LOT 15.1 = 🟢 TERMINÉ**
