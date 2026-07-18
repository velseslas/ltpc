CREATE TABLE public.user_passwords_visible (
  utilisateur_id uuid PRIMARY KEY REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  password_plain text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_passwords_visible TO authenticated;
GRANT ALL ON public.user_passwords_visible TO service_role;
ALTER TABLE public.user_passwords_visible ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_select_passwords" ON public.user_passwords_visible
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));