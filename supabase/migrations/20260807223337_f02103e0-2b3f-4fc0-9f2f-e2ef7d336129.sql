
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS audio_path text,
  ADD COLUMN IF NOT EXISTS audio_duration integer;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_chk;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_chk CHECK (message_type IN ('text','audio'));

ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.sender_id := COALESCE(auth.uid(), NEW.sender_id);
  IF NEW.message_type IS NULL THEN NEW.message_type := 'text'; END IF;

  IF NEW.message_type = 'audio' THEN
    NEW.content := NULL;
    IF NEW.audio_path IS NULL OR btrim(NEW.audio_path) = '' THEN
      RAISE EXCEPTION 'Message vocal sans fichier';
    END IF;
    -- Le chemin doit appartenir à la conversation du message.
    IF split_part(NEW.audio_path, '/', 1) <> NEW.conversation_id::text THEN
      RAISE EXCEPTION 'Chemin audio invalide';
    END IF;
    IF NEW.audio_duration IS NULL OR NEW.audio_duration < 1 OR NEW.audio_duration > 120 THEN
      RAISE EXCEPTION 'Durée audio invalide';
    END IF;
  ELSE
    NEW.audio_path := NULL;
    NEW.audio_duration := NULL;
    NEW.content := btrim(NEW.content);
    IF NEW.content IS NULL OR NEW.content = '' OR length(NEW.content) > 4000 THEN
      RAISE EXCEPTION 'Contenu de message invalide';
    END IF;
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at,
         last_message_preview = CASE WHEN NEW.message_type = 'audio'
                                     THEN 'Message vocal'
                                     ELSE left(NEW.content, 140) END,
         updated_at = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $function$;

-- Storage privé : accès réservé aux participants de la conversation (1er dossier = conversation_id)
DROP POLICY IF EXISTS "message_audio_select" ON storage.objects;
DROP POLICY IF EXISTS "message_audio_insert" ON storage.objects;
DROP POLICY IF EXISTS "message_audio_delete" ON storage.objects;

CREATE POLICY "message_audio_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'message-audio'
  AND public.can_access_conversation(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "message_audio_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-audio'
  AND owner = auth.uid()
  AND public.can_access_conversation(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "message_audio_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'message-audio'
  AND owner = auth.uid()
);
