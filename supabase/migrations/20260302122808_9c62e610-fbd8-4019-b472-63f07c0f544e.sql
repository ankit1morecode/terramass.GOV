
-- Fix privilege escalation: remove self-update policy, add admin-only update
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
