
-- Phase 2: approval authority
ALTER TABLE public.property_listings
  ADD COLUMN IF NOT EXISTS approval_authority TEXT;

-- Phase 3: update requests
CREATE TABLE IF NOT EXISTS public.property_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  user_id UUID NOT NULL,
  proposed_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_update_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners insert update requests"
ON public.property_update_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners view own update requests"
ON public.property_update_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all update requests"
ON public.property_update_requests FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins manage update requests"
ON public.property_update_requests FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete update requests"
ON public.property_update_requests FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_property_update_requests_timestamp
BEFORE UPDATE ON public.property_update_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: when admin approves, apply the changes to the listing
CREATE OR REPLACE FUNCTION public.apply_listing_update_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k TEXT;
  v JSONB;
  allowed_keys TEXT[] := ARRAY[
    'title','description','listing_type','property_type','city','locality','address',
    'price','price_unit','area','area_unit','bedrooms','bathrooms','floor','total_floors',
    'parking','furnishing','facing','age_of_property','amenities','contact_name',
    'contact_phone','contact_email','rera_id','approval_authority','society_name',
    'builder_name','images','whatsapp_number'
  ];
  set_clause TEXT := '';
  json_value TEXT;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Build dynamic update from proposed_changes
    FOR k, v IN SELECT * FROM jsonb_each(NEW.proposed_changes) LOOP
      IF k = ANY(allowed_keys) THEN
        IF set_clause <> '' THEN set_clause := set_clause || ', '; END IF;
        set_clause := set_clause || quote_ident(k) || ' = ($1->' || quote_literal(k) || ')';
      END IF;
    END LOOP;

    IF set_clause <> '' THEN
      EXECUTE format(
        'UPDATE public.property_listings SET %s, updated_at = now() WHERE id = $2',
        regexp_replace(set_clause, '\(\$1->''([^'']+)''\)', E'(CASE WHEN jsonb_typeof($1->\'\\1\') = \'string\' THEN to_jsonb(($1->>\'\\1\')::text) ELSE $1->\'\\1\' END)', 'g')
      );
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '✅ Listing Update Approved',
      'Your update request has been approved and applied to your listing.',
      'success',
      '/property/' || NEW.listing_id
    );
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '📋 Listing Update Rejected',
      'Your update request was rejected. ' || COALESCE('Note: ' || NEW.admin_note, ''),
      'error',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Simpler & safer: rewrite without dynamic SQL hackery
CREATE OR REPLACE FUNCTION public.apply_listing_update_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c JSONB;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    c := NEW.proposed_changes;
    UPDATE public.property_listings SET
      title              = COALESCE(c->>'title', title),
      description        = COALESCE(c->>'description', description),
      listing_type       = COALESCE(c->>'listing_type', listing_type),
      property_type      = COALESCE(c->>'property_type', property_type),
      city               = COALESCE(c->>'city', city),
      locality           = COALESCE(c->>'locality', locality),
      address            = COALESCE(c->>'address', address),
      price              = COALESCE((c->>'price')::numeric, price),
      area               = COALESCE((c->>'area')::numeric, area),
      bedrooms           = COALESCE((c->>'bedrooms')::int, bedrooms),
      bathrooms          = COALESCE((c->>'bathrooms')::int, bathrooms),
      parking            = COALESCE((c->>'parking')::int, parking),
      furnishing         = COALESCE(c->>'furnishing', furnishing),
      facing             = COALESCE(c->>'facing', facing),
      age_of_property    = COALESCE(c->>'age_of_property', age_of_property),
      contact_name       = COALESCE(c->>'contact_name', contact_name),
      contact_phone      = COALESCE(c->>'contact_phone', contact_phone),
      contact_email      = COALESCE(c->>'contact_email', contact_email),
      rera_id            = COALESCE(c->>'rera_id', rera_id),
      approval_authority = COALESCE(c->>'approval_authority', approval_authority),
      society_name       = COALESCE(c->>'society_name', society_name),
      builder_name       = COALESCE(c->>'builder_name', builder_name),
      amenities          = COALESCE(
                             CASE WHEN jsonb_typeof(c->'amenities') = 'array'
                               THEN ARRAY(SELECT jsonb_array_elements_text(c->'amenities'))
                               ELSE NULL END,
                             amenities),
      images             = COALESCE(
                             CASE WHEN jsonb_typeof(c->'images') = 'array'
                               THEN ARRAY(SELECT jsonb_array_elements_text(c->'images'))
                               ELSE NULL END,
                             images),
      updated_at         = now()
    WHERE id = NEW.listing_id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '✅ Listing Update Approved',
            'Your update request has been approved and applied to your listing.',
            'success', '/property/' || NEW.listing_id);
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '📋 Listing Update Rejected',
            'Your update request was rejected. ' || COALESCE('Note: ' || NEW.admin_note, ''),
            'error', '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_listing_update ON public.property_update_requests;
CREATE TRIGGER trg_apply_listing_update
AFTER UPDATE ON public.property_update_requests
FOR EACH ROW EXECUTE FUNCTION public.apply_listing_update_on_approval();
