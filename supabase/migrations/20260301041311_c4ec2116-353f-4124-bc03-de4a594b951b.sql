
-- Create articles table for admin-managed news/blog system
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Market News',
  read_time INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID NOT NULL,
  author_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Public can view published articles" ON public.articles
  FOR SELECT USING (status = 'published');

-- Admins have full access
CREATE POLICY "Admins can manage articles" ON public.articles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create article-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true);

-- Storage policies for article-images
CREATE POLICY "Admins can upload article images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'article-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Public can view article images" ON storage.objects
  FOR SELECT USING (bucket_id = 'article-images');

CREATE POLICY "Admins can delete article images" ON storage.objects
  FOR DELETE USING (bucket_id = 'article-images' AND public.is_admin(auth.uid()));

-- Create a materialized-like view for market trends (regular view for simplicity)
CREATE OR REPLACE VIEW public.market_trends AS
SELECT 
  city,
  ROUND(AVG(CASE WHEN area > 0 THEN price / area ELSE NULL END)::numeric, 0) as avg_price_sqft,
  COUNT(*) as listing_count,
  EXTRACT(YEAR FROM created_at) as year
FROM public.property_listings
WHERE status = 'approved' AND price > 0 AND area > 0
GROUP BY city, EXTRACT(YEAR FROM created_at);

-- Enable realtime for articles
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
