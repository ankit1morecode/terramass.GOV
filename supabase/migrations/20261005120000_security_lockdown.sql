-- Security lockdown
-- 1. drivers / driver_messages had "Public ..." policies (USING true) for every operation,
--    so anyone holding the public anon key could read plaintext driver passwords, create,
--    edit or delete drivers, and read/forge messages. All browser access now goes through
--    the driver-crud edge function (service role + server-side checks).
DROP POLICY IF EXISTS "Public read drivers" ON public.drivers;
DROP POLICY IF EXISTS "Public insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "Public update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Public delete drivers" ON public.drivers;

DROP POLICY IF EXISTS "Public read driver_messages" ON public.driver_messages;
DROP POLICY IF EXISTS "Public insert driver_messages" ON public.driver_messages;
DROP POLICY IF EXISTS "Public update driver_messages" ON public.driver_messages;
DROP POLICY IF EXISTS "Public delete driver_messages" ON public.driver_messages;

-- Compared auth.uid() with a drivers.id; never correct, remove to avoid confusion.
DROP POLICY IF EXISTS "Drivers can read own messages" ON public.driver_messages;

-- Defence in depth: the anon role gets no direct access at all, and authenticated admins
-- can read every column except the password hash. (A column-level REVOKE is ignored while a
-- table-level grant exists, so revoke the table and grant the safe columns back.)
REVOKE ALL ON public.drivers FROM anon;
REVOKE ALL ON public.driver_messages FROM anon;
REVOKE SELECT ON public.drivers FROM authenticated;
GRANT SELECT (id, display_name, vehicle_name, vehicle_plate, vehicle_type, created_at)
  ON public.drivers TO authenticated;

-- 2. Privilege escalation: "System can insert roles" only checked user_id, so any signed-in
--    user could insert {user_id: self, role: 'admin'}. Roles are created by the
--    handle_new_user_role() SECURITY DEFINER trigger, so clients never need INSERT.
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;

-- Letting users delete their own role row lets them shed restrictions tied to it;
-- role management is admin-only.
DROP POLICY IF EXISTS "Users can delete own role" ON public.user_roles;

-- Updates previously had no WITH CHECK on the admin policy; tighten it.
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Recipients could UPDATE any column of an admin message (including its text/sender).
DROP POLICY IF EXISTS "Recipients can update read status" ON public.admin_messages;
CREATE POLICY "Recipients can update read status" ON public.admin_messages AS PERMISSIVE FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);
REVOKE UPDATE ON public.admin_messages FROM authenticated;
GRANT UPDATE (read) ON public.admin_messages TO authenticated;

-- 4. Users could rename their profile to anything but also re-point user_id.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. SECURITY DEFINER functions were callable by anyone via /rest/v1/rpc/*.
--    The trigger functions are only ever invoked by triggers. has_role() must stay
--    executable by `authenticated` because RLS policies call it as the querying user.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 6. Basic data hygiene on messages.
ALTER TABLE public.driver_messages
  ADD CONSTRAINT driver_messages_length CHECK (char_length(message) BETWEEN 1 AND 1000) NOT VALID;
