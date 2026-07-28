UPDATE public.echantillons_compression e
SET resultats = sub.new_resultats
FROM (
  SELECT e2.id,
         jsonb_agg(
           CASE
             WHEN COALESCE((r->>'isHeures')::boolean, false) THEN r
             ELSE jsonb_set(r, '{dateEssai}', to_jsonb(to_char(e2.date_coulage + ((r->>'joursEssai')::numeric)::int, 'DD/MM/YYYY')))
           END
           ORDER BY ord
         ) AS new_resultats
  FROM public.echantillons_compression e2,
       LATERAL jsonb_array_elements(e2.resultats) WITH ORDINALITY AS t(r, ord)
  WHERE jsonb_typeof(e2.resultats) = 'array'
    AND e2.date_coulage IS NOT NULL
    AND r ? 'joursEssai'
  GROUP BY e2.id
) sub
WHERE e.id = sub.id;