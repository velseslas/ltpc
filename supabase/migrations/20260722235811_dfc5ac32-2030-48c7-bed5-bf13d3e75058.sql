-- Switch view to security_invoker so it uses the caller's privileges (not the view owner)
ALTER VIEW public.intervenants_directory SET (security_invoker = on);