-- LOT 14.2 : désactivation (jamais suppression) des abonnements Push obsolètes.
-- Règle sûre : on ne conserve actif que l'abonnement le plus récent PAR APPAREIL
-- (couple user_id + user_agent). Les appareils distincts restent tous actifs.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, user_agent
           ORDER BY coalesce(last_used_at, created_at) DESC, created_at DESC
         ) AS rn
  FROM public.push_subscriptions
  WHERE is_active = true
)
UPDATE public.push_subscriptions p
SET is_active = false
FROM ranked r
WHERE p.id = r.id AND r.rn > 1;