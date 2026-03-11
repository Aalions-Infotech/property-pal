
-- Fix agent_applications RLS policies - recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can submit agent applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON public.agent_applications;

CREATE POLICY "Users can submit agent applications" ON public.agent_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own applications" ON public.agent_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON public.agent_applications
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update applications" ON public.agent_applications
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete applications" ON public.agent_applications
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Also fix agent_profiles, agent_clients, and agent_reviews policies
DROP POLICY IF EXISTS "Public can view agent profiles" ON public.agent_profiles;
DROP POLICY IF EXISTS "Admins can manage agent profiles" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agents can update own agent profile" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agents can view own agent profile" ON public.agent_profiles;

CREATE POLICY "Public can view agent profiles" ON public.agent_profiles
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage agent profiles" ON public.agent_profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Agents can update own agent profile" ON public.agent_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Agents can view own agent profile" ON public.agent_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow agents to INSERT their own profile (needed for self-registration approval flow)
CREATE POLICY "Agents can insert own agent profile" ON public.agent_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Fix agent_reviews policies
DROP POLICY IF EXISTS "Public can view agent reviews" ON public.agent_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.agent_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.agent_reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.agent_reviews;

CREATE POLICY "Public can view agent reviews" ON public.agent_reviews
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can insert reviews" ON public.agent_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_user_id AND agent_user_id <> reviewer_user_id);

CREATE POLICY "Users can delete own reviews" ON public.agent_reviews
  FOR DELETE TO authenticated USING (auth.uid() = reviewer_user_id);

CREATE POLICY "Admins can manage reviews" ON public.agent_reviews
  FOR ALL TO authenticated USING (is_admin(auth.uid()));
