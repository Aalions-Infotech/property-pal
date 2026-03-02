
-- Agent applications table
CREATE TABLE public.agent_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  city text,
  bio text,
  experience_years integer DEFAULT 0,
  specialization text,
  languages text,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_note text,
  generated_password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own applications
CREATE POLICY "Users can submit agent applications"
  ON public.agent_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.agent_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.agent_applications FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admins can update applications
CREATE POLICY "Admins can update applications"
  ON public.agent_applications FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admins can delete applications
CREATE POLICY "Admins can delete applications"
  ON public.agent_applications FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Agent profiles extended data (experience, sales etc)
CREATE TABLE public.agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  agent_id text NOT NULL UNIQUE,
  experience_years integer DEFAULT 0,
  specialization text,
  languages text,
  total_sales integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  commission_earned numeric DEFAULT 0,
  properties_listed integer DEFAULT 0,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  areas_served text[],
  certifications text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- Agents can view their own profile
CREATE POLICY "Agents can view own agent profile"
  ON public.agent_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Agents can update their own profile
CREATE POLICY "Agents can update own agent profile"
  ON public.agent_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all agent profiles
CREATE POLICY "Admins can manage agent profiles"
  ON public.agent_profiles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Public can view agent profiles (for client-facing)
CREATE POLICY "Public can view agent profiles"
  ON public.agent_profiles FOR SELECT TO anon
  USING (true);

CREATE POLICY "Authenticated can view agent profiles"
  ON public.agent_profiles FOR SELECT TO authenticated
  USING (true);

-- Agent sales/client tracking
CREATE TABLE public.agent_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  property_id uuid,
  status text NOT NULL DEFAULT 'lead',
  notes text,
  deal_value numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_clients ENABLE ROW LEVEL SECURITY;

-- Agents can manage their own clients
CREATE POLICY "Agents can manage own clients"
  ON public.agent_clients FOR ALL TO authenticated
  USING (auth.uid() = agent_id);

-- Admins can view all clients
CREATE POLICY "Admins can view all agent clients"
  ON public.agent_clients FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Enable realtime for agent applications
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_applications;

-- Add profiles public read for agent pages
CREATE POLICY "Public can view agent profiles from profiles"
  ON public.profiles FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = profiles.user_id AND role = 'agent'));
