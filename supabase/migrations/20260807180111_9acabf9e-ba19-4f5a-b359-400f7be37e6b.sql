CREATE OR REPLACE FUNCTION public.list_conversations(_limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE (
  id uuid,
  type text,
  titre text,
  chantier_id uuid,
  chantier_nom text,
  other_user_id uuid,
  other_user_nom text,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count integer,
  is_archived boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    c.id,
    c.type::text,
    c.titre,
    c.chantier_id,
    ch.nom AS chantier_nom,
    ou.user_id AS other_user_id,
    ou.nom AS other_user_nom,
    c.last_message_at,
    c.last_message_preview,
    (
      SELECT count(*)::int FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.created_at > cp.last_read_at
        AND m.sender_id <> auth.uid()
        AND m.deleted_at IS NULL
    ) AS unread_count,
    cp.is_archived
  FROM public.conversations c
  JOIN public.conversation_participants cp
    ON cp.conversation_id = c.id AND cp.user_id = auth.uid()
  LEFT JOIN public.chantiers ch ON ch.id = c.chantier_id
  LEFT JOIN LATERAL (
    SELECT u.user_id, u.nom
    FROM public.conversation_participants p
    LEFT JOIN public.utilisateurs u ON u.user_id = p.user_id
    WHERE p.conversation_id = c.id AND p.user_id <> auth.uid()
    ORDER BY u.nom
    LIMIT 1
  ) ou ON true
  WHERE auth.uid() IS NOT NULL
    AND (c.chantier_id IS NULL OR public.can_access_chantier_data(c.chantier_id))
  ORDER BY c.last_message_at DESC
  LIMIT LEAST(COALESCE(_limit, 50), 100) OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;
REVOKE ALL ON FUNCTION public.list_conversations(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_conversations(integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.conversation_sender_names(_conversation_id uuid)
RETURNS TABLE (user_id uuid, nom text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.user_id, u.nom
  FROM public.conversation_participants p
  LEFT JOIN public.utilisateurs u ON u.user_id = p.user_id
  WHERE p.conversation_id = _conversation_id
    AND public.is_conversation_participant(_conversation_id);
$$;
REVOKE ALL ON FUNCTION public.conversation_sender_names(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.conversation_sender_names(uuid) TO authenticated;