
-- ====================================================
-- STEP 1: ENUMS
-- ====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'agent', 'user');
CREATE TYPE public.listing_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE public.sponsorship_status AS ENUM ('pending', 'active', 'expired', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- ====================================================
-- STEP 2: USER ROLES TABLE (before profiles, needed by helper functions)
-- ====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'moderator'))
$$;

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.is_admin(auth.uid()));

-- ====================================================
-- STEP 3: PROFILES TABLE
-- ====================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));

-- ====================================================
-- STEP 4: PROPERTY LISTINGS TABLE
-- ====================================================
CREATE TABLE public.property_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  listing_type TEXT NOT NULL,
  property_type TEXT NOT NULL,
  city TEXT NOT NULL,
  locality TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bedrooms INTEGER,
  bathrooms INTEGER,
  area DECIMAL(10, 2),
  area_unit TEXT DEFAULT 'sq.ft',
  floor INTEGER,
  total_floors INTEGER,
  furnishing TEXT DEFAULT 'Unfurnished',
  facing TEXT,
  parking INTEGER DEFAULT 0,
  age_of_property TEXT,
  price DECIMAL(15, 2) NOT NULL,
  price_unit TEXT DEFAULT 'total',
  price_per_sqft DECIMAL(10, 2),
  status listing_status DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  amenities TEXT[],
  images TEXT[],
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  rera_id TEXT,
  society_name TEXT,
  builder_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own listings" ON public.property_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own listings" ON public.property_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending listings" ON public.property_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all listings" ON public.property_listings FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update any listing" ON public.property_listings FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete any listing" ON public.property_listings FOR DELETE USING (public.is_admin(auth.uid()));
CREATE POLICY "Public can view approved listings" ON public.property_listings FOR SELECT USING (status = 'approved');

-- ====================================================
-- STEP 5: SPONSORSHIP PLANS
-- ====================================================
CREATE TABLE public.sponsorship_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsorship_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON public.sponsorship_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.sponsorship_plans FOR ALL USING (public.is_admin(auth.uid()));

-- ====================================================
-- STEP 6: SPONSORSHIPS TABLE
-- ====================================================
CREATE TABLE public.sponsorships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'standard',
  amount DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  status sponsorship_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  payment_id TEXT,
  payment_method TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sponsorships" ON public.sponsorships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sponsorships" ON public.sponsorships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all sponsorships" ON public.sponsorships FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update sponsorships" ON public.sponsorships FOR UPDATE USING (public.is_admin(auth.uid()));

-- ====================================================
-- STEP 7: NOTIFICATIONS TABLE
-- ====================================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- ====================================================
-- STEP 8: ADMIN ACTIVITY LOG
-- ====================================================
CREATE TABLE public.admin_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view activity log" ON public.admin_activity_log FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert activity log" ON public.admin_activity_log FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- ====================================================
-- STEP 9: TIMESTAMPS TRIGGER
-- ====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.property_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sponsorships_updated_at BEFORE UPDATE ON public.sponsorships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================
-- STEP 10: AUTO-CREATE PROFILE ON SIGNUP
-- ====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================
-- STEP 11: SEED SPONSORSHIP PLANS
-- ====================================================
INSERT INTO public.sponsorship_plans (name, display_name, description, price, duration_days, features, sort_order) VALUES
('basic', 'Basic Boost', 'Get extra visibility for your listing', 999, 7, ARRAY['Featured badge', 'Top placement in search', 'Priority support'], 1),
('standard', 'Standard Spotlight', 'Maximum visibility for 30 days', 2499, 30, ARRAY['Featured badge', 'Top placement in search', 'Homepage feature', 'Priority support', 'Analytics dashboard'], 2),
('premium', 'Premium Showcase', 'Enterprise-level promotion for 60 days', 4999, 60, ARRAY['Featured badge', 'Top placement in search', 'Homepage feature', 'Priority support', 'Analytics dashboard', 'Social media promotion', 'Dedicated account manager'], 3);
