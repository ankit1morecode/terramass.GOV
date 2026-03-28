
-- Drop existing RESTRICTIVE policies on drivers
DROP POLICY IF EXISTS "Admins can delete drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can read drivers" ON public.drivers;

-- Create PERMISSIVE policies instead
CREATE POLICY "Admins can read drivers"
ON public.drivers AS PERMISSIVE FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert drivers"
ON public.drivers AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete drivers"
ON public.drivers AS PERMISSIVE FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
