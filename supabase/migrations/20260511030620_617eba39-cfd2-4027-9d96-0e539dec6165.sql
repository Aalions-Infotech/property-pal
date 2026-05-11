
-- 1. Add property_attributes JSONB to listings for type-specific dynamic fields
ALTER TABLE public.property_listings
  ADD COLUMN IF NOT EXISTS property_attributes JSONB DEFAULT '{}'::jsonb;

-- 2. Audit log for update requests
CREATE TABLE IF NOT EXISTS public.update_request_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  reviewer_id UUID,
  action TEXT NOT NULL, -- 'approved' | 'rejected' | 'submitted'
  note TEXT,
  changes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.update_request_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all audit"
  ON public.update_request_audit FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Owners view audit for their requests"
  ON public.update_request_audit FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.property_update_requests r
    WHERE r.id = request_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated insert audit"
  ON public.update_request_audit FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Trigger to auto-log approvals/rejections
CREATE OR REPLACE FUNCTION public.log_update_request_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('approved','rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.update_request_audit (request_id, listing_id, reviewer_id, action, note, changes)
    VALUES (NEW.id, NEW.listing_id, NEW.reviewed_by, NEW.status, NEW.admin_note, NEW.proposed_changes);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_update_request_audit ON public.property_update_requests;
CREATE TRIGGER trg_log_update_request_audit
AFTER UPDATE ON public.property_update_requests
FOR EACH ROW EXECUTE FUNCTION public.log_update_request_audit();

-- 4. Trigger to log submission
CREATE OR REPLACE FUNCTION public.log_update_request_submitted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.update_request_audit (request_id, listing_id, reviewer_id, action, note, changes)
  VALUES (NEW.id, NEW.listing_id, NEW.user_id, 'submitted', NULL, NEW.proposed_changes);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_update_request_submitted ON public.property_update_requests;
CREATE TRIGGER trg_log_update_request_submitted
AFTER INSERT ON public.property_update_requests
FOR EACH ROW EXECUTE FUNCTION public.log_update_request_submitted();

CREATE INDEX IF NOT EXISTS idx_update_request_audit_request ON public.update_request_audit(request_id);
CREATE INDEX IF NOT EXISTS idx_update_request_audit_listing ON public.update_request_audit(listing_id);
