
-- Fix agent_applications: ensure SELECT policies are PERMISSIVE (not RESTRICTIVE)
-- Drop and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can view all applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Users can submit agent applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON public.agent_applications;

CREATE POLICY "Admins can view all applications" ON public.agent_applications
FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own applications" ON public.agent_applications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can submit agent applications" ON public.agent_applications
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update applications" ON public.agent_applications
FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete applications" ON public.agent_applications
FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Fix user_roles: ensure SELECT policies are PERMISSIVE
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles" ON public.user_roles
FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Fix profiles: ensure policies are PERMISSIVE
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Fix agent_profiles: ensure policies are PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage agent profiles" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agents can update own agent profile" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agents can view own agent profile" ON public.agent_profiles;
DROP POLICY IF EXISTS "Authenticated can view agent profiles" ON public.agent_profiles;
DROP POLICY IF EXISTS "Public can view agent profiles" ON public.agent_profiles;

CREATE POLICY "Public can view agent profiles" ON public.agent_profiles
FOR SELECT USING (true);

CREATE POLICY "Admins can manage agent profiles" ON public.agent_profiles
FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Agents can update own agent profile" ON public.agent_profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Agents can view own agent profile" ON public.agent_profiles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix agent_clients
DROP POLICY IF EXISTS "Admins can view all agent clients" ON public.agent_clients;
DROP POLICY IF EXISTS "Agents can manage own clients" ON public.agent_clients;

CREATE POLICY "Admins can view all agent clients" ON public.agent_clients
FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Agents can manage own clients" ON public.agent_clients
FOR ALL TO authenticated USING (auth.uid() = agent_id);

-- Fix notifications
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
FOR DELETE TO authenticated USING (auth.uid() = user_id);
