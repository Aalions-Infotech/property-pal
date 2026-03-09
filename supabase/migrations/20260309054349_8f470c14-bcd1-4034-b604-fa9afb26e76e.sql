
CREATE TABLE public.agent_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_user_id uuid NOT NULL,
  reviewer_user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  reviewer_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Public can view agent reviews"
  ON public.agent_reviews FOR SELECT
  USING (true);

-- Authenticated users can submit reviews
CREATE POLICY "Authenticated users can insert reviews"
  ON public.agent_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_user_id AND agent_user_id != reviewer_user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.agent_reviews FOR DELETE
  USING (auth.uid() = reviewer_user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews"
  ON public.agent_reviews FOR ALL
  USING (is_admin(auth.uid()));
