-- 1. Drop old single-purpose trigger and replace with a unified one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Unified handler: creates profile + default role + auto-promotes admin
CREATE OR REPLACE FUNCTION public.handle_new_user_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile (idempotent)
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert default user role (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT DO NOTHING;

  -- Auto-promote admin emails
  IF NEW.email = 'azmata601010@gmail.com' THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach the new trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_complete();

-- 4. Backfill missing profiles for existing auth users
INSERT INTO public.profiles (user_id, email, full_name)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 5. Backfill missing 'user' role for existing users (without overriding existing roles)
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'user'::app_role
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id
);

-- 6. Promote admin email if registered
UPDATE public.user_roles SET role = 'admin'::app_role
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'azmata601010@gmail.com');