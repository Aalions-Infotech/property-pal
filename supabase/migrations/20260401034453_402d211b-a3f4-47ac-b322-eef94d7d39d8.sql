
-- Drop existing RLS policies on user_roles that might conflict
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admin insert" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admin delete" ON public.user_roles;
DROP POLICY IF EXISTS "Allow read" ON public.user_roles;
DROP POLICY IF EXISTS "Public read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_manage_roles" ON public.user_roles;

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create the security definer function for role checks (idempotent)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  )
$$;

-- 1. Anyone can read roles (needed for auth context)
CREATE POLICY "public_read_user_roles" ON public.user_roles
FOR SELECT TO authenticated
USING (true);

-- 2. Admins can insert roles (uses security definer to avoid recursion)
CREATE POLICY "admin_insert_user_roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Admins can delete roles
CREATE POLICY "admin_delete_user_roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admins can update roles
CREATE POLICY "admin_update_user_roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
