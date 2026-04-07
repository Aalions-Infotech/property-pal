
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  budget TEXT,
  visit_date DATE,
  otp_code TEXT,
  otp_verified BOOLEAN DEFAULT false,
  property_id UUID REFERENCES public.property_listings(id) ON DELETE SET NULL,
  agent_id UUID,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert leads (public inquiry form)
CREATE POLICY "Anyone can submit leads"
ON public.leads FOR INSERT
TO public
WITH CHECK (true);

-- Admins can view all leads
CREATE POLICY "Admins can view all leads"
ON public.leads FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Admins can update leads
CREATE POLICY "Admins can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Admins can delete leads
CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Property owners can view leads for their listings
CREATE POLICY "Owners can view leads for their properties"
ON public.leads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_listings pl
    WHERE pl.id = property_id AND pl.user_id = auth.uid()
  )
);

-- Agents can view their leads
CREATE POLICY "Agents can view their leads"
ON public.leads FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

-- Add RERA number to agent_applications
ALTER TABLE public.agent_applications ADD COLUMN IF NOT EXISTS rera_number TEXT;

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
