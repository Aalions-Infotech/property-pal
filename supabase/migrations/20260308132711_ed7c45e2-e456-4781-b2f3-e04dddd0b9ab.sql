
-- Fix profiles RLS: replace subquery on user_roles with security definer function
DROP POLICY IF EXISTS "Public can view agent profiles from profiles" ON public.profiles;
CREATE POLICY "Public can view agent profiles from profiles" ON public.profiles
FOR SELECT USING (public.has_role(profiles.user_id, 'agent'));
