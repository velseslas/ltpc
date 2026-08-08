ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'inapp';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_channel_check'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_channel_check CHECK (channel IN ('inapp','push'));
  END IF;
END $$;

-- Migration non destructive de l'historique : les evenements Push-only existants
-- sont marques comme canal 'push' (donc exclus de la cloche) sans suppression.
UPDATE public.notifications
SET channel = 'push'
WHERE channel <> 'push'
  AND (category IN ('echeance_compression','message_recu') OR type = 'message_recu');

CREATE INDEX IF NOT EXISTS notifications_user_channel_idx
  ON public.notifications (user_id, channel, is_read, is_archived);