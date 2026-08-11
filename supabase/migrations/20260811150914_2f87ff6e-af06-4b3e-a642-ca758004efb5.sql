CREATE POLICY "clients_select_assigned_chantiers"
ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chantiers c
    WHERE c.client_id = clients.id
      AND public.can_access_chantier_data(c.id)
  )
);