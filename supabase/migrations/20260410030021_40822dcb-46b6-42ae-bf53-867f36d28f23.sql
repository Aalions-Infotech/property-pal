
-- Saved Properties table
CREATE TABLE public.saved_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved properties" ON public.saved_properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save properties" ON public.saved_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave properties" ON public.saved_properties
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all saved properties" ON public.saved_properties
  FOR SELECT USING (is_admin(auth.uid()));

-- Property Reviews table
CREATE TABLE public.property_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reviewer_name TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view property reviews" ON public.property_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.property_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.property_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.property_reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.property_reviews
  FOR ALL USING (is_admin(auth.uid()));

CREATE TRIGGER update_property_reviews_updated_at
  BEFORE UPDATE ON public.property_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add ban status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
