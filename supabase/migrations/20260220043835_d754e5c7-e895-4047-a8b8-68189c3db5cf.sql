
-- Pre-seed admin role for specific email (runs on signup trigger)
-- Also create a function to auto-promote known admin emails
CREATE OR REPLACE FUNCTION public.auto_promote_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-promote specific admin emails
  IF NEW.email IN ('azmata601010@gmail.com') THEN
    -- Remove existing user role and set admin
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created_promote_admin ON public.profiles;

-- Create trigger on profiles table (since we can't use auth schema)
CREATE TRIGGER on_profile_created_promote_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_promote_admin();

-- Enable realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_listings;

-- Add chat_messages table for AI chatbot support
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages by session" ON public.chat_messages
  FOR SELECT USING (true);

-- Add property_images storage bucket reference in listings
-- Already handled via images[] column in property_listings

-- Update sponsorship_plans with stripe price IDs
ALTER TABLE public.sponsorship_plans ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE public.sponsorship_plans ADD COLUMN IF NOT EXISTS stripe_product_id text;

-- Update existing plans with Stripe IDs
UPDATE public.sponsorship_plans SET 
  stripe_price_id = 'price_1T2lRSIk4qgoIBK1Bixe90ur',
  stripe_product_id = 'prod_U0n13cccAcPpLA',
  price = 499
WHERE name = 'basic';

UPDATE public.sponsorship_plans SET 
  stripe_price_id = 'price_1T2lS6Ik4qgoIBK1UGLy8JPg',
  stripe_product_id = 'prod_U0n2WZQGEYZcGO',
  price = 1499
WHERE name = 'standard';

UPDATE public.sponsorship_plans SET 
  stripe_price_id = 'price_1T2lSzIk4qgoIBK1VlktvDrM',
  stripe_product_id = 'prod_U0n39cGQeJwvdF',
  price = 3499
WHERE name = 'premium';

-- If plans don't exist, insert them
INSERT INTO public.sponsorship_plans (name, display_name, description, price, duration_days, stripe_price_id, stripe_product_id, features, sort_order, is_active)
VALUES 
  ('basic', 'Basic Boost', 'Get noticed with top placement', 499, 7, 'price_1T2lRSIk4qgoIBK1Bixe90ur', 'prod_U0n13cccAcPpLA', ARRAY['Top of search results', 'Bold listing badge', 'Priority support'], 1, true),
  ('standard', 'Standard Spotlight', 'Featured with enhanced visibility', 1499, 30, 'price_1T2lS6Ik4qgoIBK1UGLy8JPg', 'prod_U0n2WZQGEYZcGO', ARRAY['Homepage featured section', 'Top of category', 'Verified badge', 'Analytics dashboard'], 2, true),
  ('premium', 'Premium Showcase', 'Maximum exposure across platform', 3499, 60, 'price_1T2lSzIk4qgoIBK1VlktvDrM', 'prod_U0n39cGQeJwvdF', ARRAY['Homepage hero placement', 'Email newsletter feature', 'Social media promotion', 'Dedicated account manager', 'Priority support'], 3, true)
ON CONFLICT (name) DO UPDATE SET 
  stripe_price_id = EXCLUDED.stripe_price_id,
  stripe_product_id = EXCLUDED.stripe_product_id,
  price = EXCLUDED.price;

-- Add whatsapp_number to profiles for agent contact
ALTER TABLE public.property_listings ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- Add payment_url to sponsorships for Stripe checkout tracking
ALTER TABLE public.sponsorships ADD COLUMN IF NOT EXISTS checkout_session_id text;

-- Allow delete on notifications for users
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
