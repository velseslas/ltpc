-- Types
CREATE TYPE public.conversation_type AS ENUM ('direct', 'chantier');

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.conversation_type NOT NULL DEFAULT 'direct',
  titre TEXT,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01T00:00:00Z',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_conv_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_last_msg ON public.conversations(last_message_at DESC);

-- Fonctions de sécurité (SECURITY DEFINER, évitent la récursion RLS)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id AND cp.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_conversation(_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_conversation_participant(_conversation_id)
     AND EXISTS (
       SELECT 1 FROM public.conversations c
       WHERE c.id = _conversation_id
         AND (c.chantier_id IS NULL OR public.can_access_chantier_data(c.chantier_id))
     );
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_owner(_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = _conversation_id AND c.created_by = auth.uid());
$$;

-- RLS conversations
CREATE POLICY "conv_select_participant" ON public.conversations FOR SELECT TO authenticated
  USING (public.can_access_conversation(id));
CREATE POLICY "conv_insert_self" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (chantier_id IS NULL OR public.can_access_chantier_data(chantier_id)));
CREATE POLICY "conv_update_participant" ON public.conversations FOR UPDATE TO authenticated
  USING (public.can_access_conversation(id)) WITH CHECK (public.can_access_conversation(id));

-- RLS participants
CREATE POLICY "cp_select_participant" ON public.conversation_participants FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id));
CREATE POLICY "cp_insert_owner_or_self" ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (public.is_conversation_owner(conversation_id));
CREATE POLICY "cp_update_own" ON public.conversation_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "cp_delete_own" ON public.conversation_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS messages
CREATE POLICY "msg_select_participant" ON public.messages FOR SELECT TO authenticated
  USING (public.can_access_conversation(conversation_id));
CREATE POLICY "msg_insert_self" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.can_access_conversation(conversation_id));
CREATE POLICY "msg_update_own" ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() AND public.can_access_conversation(conversation_id))
  WITH CHECK (sender_id = auth.uid());

-- Contenu non vide et borné
CREATE OR REPLACE FUNCTION public.validate_message() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.content := btrim(NEW.content);
  IF NEW.content = '' OR length(NEW.content) > 4000 THEN
    RAISE EXCEPTION 'Contenu de message invalide';
  END IF;
  NEW.sender_id := COALESCE(auth.uid(), NEW.sender_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_validate_message BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_message();

-- Remontée de la conversation + aperçu
CREATE OR REPLACE FUNCTION public.bump_conversation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at,
         last_message_preview = left(NEW.content, 140),
         updated_at = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_bump_conversation AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation();

-- Recherche/ouverture d'une conversation directe sans doublon
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(_other_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid := auth.uid(); _conv uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF _other_user_id = _me THEN RAISE EXCEPTION 'Conversation avec soi-même interdite'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.utilisateurs u WHERE u.user_id = _other_user_id AND u.statut = 'actif') THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  SELECT c.id INTO _conv
  FROM public.conversations c
  WHERE c.type = 'direct'
    AND EXISTS (SELECT 1 FROM public.conversation_participants p WHERE p.conversation_id = c.id AND p.user_id = _me)
    AND EXISTS (SELECT 1 FROM public.conversation_participants p WHERE p.conversation_id = c.id AND p.user_id = _other_user_id)
    AND (SELECT count(*) FROM public.conversation_participants p WHERE p.conversation_id = c.id) = 2
  LIMIT 1;

  IF _conv IS NOT NULL THEN RETURN _conv; END IF;

  INSERT INTO public.conversations (type, created_by) VALUES ('direct', _me) RETURNING id INTO _conv;
  INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (_conv, _me), (_conv, _other_user_id);
  RETURN _conv;
END; $$;
REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid) TO authenticated;

-- Conversation de chantier (accès chantier vérifié)
CREATE OR REPLACE FUNCTION public.create_chantier_conversation(_chantier_id uuid, _titre text, _participants uuid[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid := auth.uid(); _conv uuid; _p uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF NOT public.can_access_chantier_data(_chantier_id) THEN RAISE EXCEPTION 'Accès chantier refusé'; END IF;
  INSERT INTO public.conversations (type, titre, chantier_id, created_by)
  VALUES ('chantier', NULLIF(btrim(coalesce(_titre,'')), ''), _chantier_id, _me) RETURNING id INTO _conv;
  INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (_conv, _me);
  FOREACH _p IN ARRAY COALESCE(_participants, ARRAY[]::uuid[]) LOOP
    IF _p <> _me THEN
      INSERT INTO public.conversation_participants (conversation_id, user_id)
      VALUES (_conv, _p) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RETURN _conv;
END; $$;
REVOKE ALL ON FUNCTION public.create_chantier_conversation(uuid, text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_chantier_conversation(uuid, text, uuid[]) TO authenticated;

-- Compteur global de messages non lus
CREATE OR REPLACE FUNCTION public.unread_messages_count()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(count(*), 0)::int
  FROM public.messages m
  JOIN public.conversation_participants cp
    ON cp.conversation_id = m.conversation_id AND cp.user_id = auth.uid()
  WHERE m.created_at > cp.last_read_at
    AND m.sender_id <> auth.uid()
    AND m.deleted_at IS NULL
    AND cp.is_archived = false;
$$;
REVOKE ALL ON FUNCTION public.unread_messages_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unread_messages_count() TO authenticated;

-- Annuaire minimal pour la recherche d'utilisateur (pas de données sensibles)
CREATE OR REPLACE FUNCTION public.search_messaging_users(_q text)
RETURNS TABLE (user_id uuid, nom text, role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.user_id, u.nom, u.role
  FROM public.utilisateurs u
  WHERE u.statut = 'actif'
    AND u.user_id IS NOT NULL
    AND u.user_id <> auth.uid()
    AND auth.uid() IS NOT NULL
    AND (COALESCE(btrim(_q), '') = '' OR u.nom ILIKE '%' || _q || '%')
  ORDER BY u.nom
  LIMIT 30;
$$;
REVOKE ALL ON FUNCTION public.search_messaging_users(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_messaging_users(text) TO authenticated;

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;