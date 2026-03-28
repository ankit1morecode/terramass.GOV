
-- Fix admin_messages policies
DROP POLICY IF EXISTS "Admins can delete messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Recipients can update read status" ON public.admin_messages;
DROP POLICY IF EXISTS "Recipients can view their messages" ON public.admin_messages;

CREATE POLICY "Admins can delete messages" ON public.admin_messages AS PERMISSIVE FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert messages" ON public.admin_messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = from_user_id);
CREATE POLICY "Recipients can update read status" ON public.admin_messages AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = to_user_id);
CREATE POLICY "Recipients can view their messages" ON public.admin_messages AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Fix calculator_results policies
DROP POLICY IF EXISTS "Users can delete own results" ON public.calculator_results;
DROP POLICY IF EXISTS "Users can insert own results" ON public.calculator_results;
DROP POLICY IF EXISTS "Users can view own results" ON public.calculator_results;

CREATE POLICY "Users can delete own results" ON public.calculator_results AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.calculator_results AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own results" ON public.calculator_results AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix driver_messages policies
DROP POLICY IF EXISTS "Admins can manage driver_messages" ON public.driver_messages;
DROP POLICY IF EXISTS "Drivers can read own messages" ON public.driver_messages;

CREATE POLICY "Admins can manage driver_messages" ON public.driver_messages AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers can read own messages" ON public.driver_messages AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid())::text = (driver_id)::text);

-- Fix profiles policies
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles AS PERMISSIVE FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix user_roles policies
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert roles" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own role" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix vehicle_alerts policies
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.vehicle_alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.vehicle_alerts;
DROP POLICY IF EXISTS "Users can view own alerts" ON public.vehicle_alerts;

CREATE POLICY "Users can view own alerts" ON public.vehicle_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.vehicle_alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.vehicle_alerts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix vehicle_telemetry policy
DROP POLICY IF EXISTS "Authenticated users can read telemetry" ON public.vehicle_telemetry;

CREATE POLICY "Authenticated users can read telemetry" ON public.vehicle_telemetry AS PERMISSIVE FOR SELECT TO authenticated USING (true);
