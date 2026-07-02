
-- Conversations
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre text NOT NULL DEFAULT 'Nouvelle conversation',
  is_favorite boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  contexte jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_conversations_user_idx ON public.ai_conversations(user_id, last_message_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conversations" ON public.ai_conversations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ai_conversations_upd BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content text NOT NULL DEFAULT '',
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  tool_calls jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_messages_conv_idx ON public.ai_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.ai_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Snapshots de contexte
CREATE TABLE public.ai_context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.ai_messages(id) ON DELETE SET NULL,
  route text,
  entity_type text,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_ctx_conv_idx ON public.ai_context_snapshots(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_context_snapshots TO authenticated;
GRANT ALL ON public.ai_context_snapshots TO service_role;
ALTER TABLE public.ai_context_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshots" ON public.ai_context_snapshots FOR ALL
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Chunks pour futur RAG (embeddings JSONB pour rester agnostique — migration pgvector future)
CREATE TABLE public.ai_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  chunk_index integer NOT NULL DEFAULT 0,
  contenu text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding jsonb,
  embedding_model text,
  content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('french', coalesce(contenu,''))) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id, chunk_index)
);
CREATE INDEX ai_chunks_tsv_idx ON public.ai_knowledge_chunks USING GIN(content_tsv);
CREATE INDEX ai_chunks_src_idx ON public.ai_knowledge_chunks(source_type, source_id);
GRANT SELECT ON public.ai_knowledge_chunks TO authenticated;
GRANT ALL ON public.ai_knowledge_chunks TO service_role;
ALTER TABLE public.ai_knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read chunks authenticated" ON public.ai_knowledge_chunks FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_ai_chunks_upd BEFORE UPDATE ON public.ai_knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
