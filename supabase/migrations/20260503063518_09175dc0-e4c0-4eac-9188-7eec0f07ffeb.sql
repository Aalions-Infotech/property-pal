
-- App settings (single-row pattern via key)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read app settings"
ON public.app_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can insert app settings"
ON public.app_settings FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update app settings"
ON public.app_settings FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete app settings"
ON public.app_settings FOR DELETE
USING (public.is_admin(auth.uid()));

-- Seed default theme settings
INSERT INTO public.app_settings (key, value) VALUES
  ('theme', '{"default":"system","enforce":false}'::jsonb),
  ('platform', '{"maintenance_mode":false,"support_email":"support@ekanandaestate.com","support_phone":"+91-9999999999","tagline":"Find Your Dream Property"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Saved searches with optional alerts
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  listing_type text,
  city text,
  locality text,
  property_type text,
  min_price numeric,
  max_price numeric,
  bedrooms int,
  alerts_enabled boolean NOT NULL DEFAULT true,
  last_alerted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved searches"
ON public.saved_searches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved searches"
ON public.saved_searches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches"
ON public.saved_searches FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
ON public.saved_searches FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all saved searches"
ON public.saved_searches FOR SELECT
USING (public.is_admin(auth.uid()));
