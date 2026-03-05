
-- New Projects table for builder/developer projects
CREATE TABLE public.new_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  builder text NOT NULL,
  city text NOT NULL,
  locality text NOT NULL,
  type text NOT NULL DEFAULT 'Residential',
  configs text[] DEFAULT '{}',
  min_price numeric NOT NULL DEFAULT 0,
  max_price numeric NOT NULL DEFAULT 0,
  image text,
  status text NOT NULL DEFAULT 'draft',
  possession_date text,
  rera_id text,
  amenities text[] DEFAULT '{}',
  rating numeric DEFAULT 0,
  total_units integer DEFAULT 0,
  available_units integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_new boolean DEFAULT true,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.new_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published projects" ON public.new_projects FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage projects" ON public.new_projects FOR ALL USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_new_projects BEFORE UPDATE ON public.new_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add email notification function for property approval
CREATE OR REPLACE FUNCTION public.notify_listing_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.user_id, '🎉 Listing Approved & Live!', 'Your listing "' || NEW.title || '" is now visible to buyers across India.', 'success', '/property/' || NEW.id);
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.user_id, '📋 Listing Requires Changes', 'Your listing "' || NEW.title || '" needs changes. Note: ' || COALESCE(NEW.admin_note, 'Please contact support.'), 'error', '/dashboard');
    ELSIF NEW.status = 'suspended' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.user_id, '🚫 Listing Suspended', 'Your listing "' || NEW.title || '" has been suspended by admin.', 'error', '/dashboard');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_listing_status_change
  AFTER UPDATE ON public.property_listings
  FOR EACH ROW
  EXECUTE FUNCTION notify_listing_status_change();
