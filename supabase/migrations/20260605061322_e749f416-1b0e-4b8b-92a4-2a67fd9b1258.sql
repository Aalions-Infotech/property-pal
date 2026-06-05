
-- 1. Remove plaintext password storage
ALTER TABLE public.agent_applications DROP COLUMN IF EXISTS generated_password;

-- 2. Remove OTP code column (not used)
ALTER TABLE public.leads DROP COLUMN IF EXISTS otp_code;

-- 3. Tighten notifications INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Restrict public agent profile visibility to authenticated users
DROP POLICY IF EXISTS "Public can view agent profiles from profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view agent profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role(user_id, 'agent'::app_role));

-- 5. Tighten property-images storage policies to folder ownership
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;

CREATE POLICY "Users can upload to their own property image folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own property images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own property images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Remove overly broad user_roles read policy
DROP POLICY IF EXISTS "public_read_user_roles" ON public.user_roles;

-- 7. Remove agent_applications from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'agent_applications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.agent_applications';
  END IF;
END $$;
