-- Ensure update request and audit data are reachable through the app backend
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_update_requests TO authenticated;
GRANT ALL ON public.property_update_requests TO service_role;
GRANT SELECT, INSERT ON public.update_request_audit TO authenticated;
GRANT ALL ON public.update_request_audit TO service_role;

-- Property-type specific attribute whitelist
CREATE OR REPLACE FUNCTION public.allowed_property_attribute_keys(_property_type text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  CASE COALESCE(_property_type, '')
    WHEN 'Agriculture Land' THEN
      RETURN ARRAY['front_width','back_width','plot_length','total_land_area','water_availability','soil_type','road_access','irrigation_facility','electricity_connection','boundary_available'];
    WHEN 'Plot/Land' THEN
      RETURN ARRAY['plot_width','plot_length','corner_plot','boundary_wall','road_width','facing','construction_allowed','zone_type'];
    WHEN 'Office' THEN
      RETURN ARRAY['cabin_count','washrooms','reception_area','pantry','parking','floor','total_floors','power_backup','furnishing','conference_room'];
    WHEN 'Shop' THEN
      RETURN ARRAY['frontage','floor','washrooms','power_backup','parking'];
    WHEN 'Warehouse' THEN
      RETURN ARRAY['shed_height','power_load','dock_availability','crane_facility','industrial_water_supply','office_space','warehouse_area','truck_access'];
    WHEN 'Apartment' THEN
      RETURN ARRAY['bedrooms','bathrooms','balconies','furnishing','floor','total_floors','parking','facing','carpet_area','super_builtup_area'];
    WHEN 'House' THEN
      RETURN ARRAY['bedrooms','bathrooms','balconies','furnishing','floor','total_floors','parking','facing','carpet_area','super_builtup_area'];
    WHEN 'Villa' THEN
      RETURN ARRAY['bedrooms','bathrooms','balconies','furnishing','floor','total_floors','parking','facing','carpet_area','super_builtup_area'];
    WHEN 'Builder Floor' THEN
      RETURN ARRAY['bedrooms','bathrooms','balconies','furnishing','floor','total_floors','parking','facing','carpet_area','super_builtup_area'];
    WHEN 'PG' THEN
      RETURN ARRAY['bedrooms','bathrooms','balconies','furnishing','floor','total_floors','parking','facing','carpet_area','super_builtup_area'];
    ELSE
      RETURN ARRAY[]::text[];
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_residential_property_type(_property_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(_property_type, '') = ANY (ARRAY['Apartment','House','Villa','Builder Floor','PG']);
$$;

CREATE OR REPLACE FUNCTION public.filter_property_attributes(_property_type text, _attrs jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  allowed text[] := public.allowed_property_attribute_keys(_property_type);
  result jsonb := '{}'::jsonb;
  item record;
BEGIN
  IF _attrs IS NULL OR jsonb_typeof(_attrs) <> 'object' THEN
    RETURN '{}'::jsonb;
  END IF;

  FOR item IN SELECT key, value FROM jsonb_each(_attrs) LOOP
    IF item.key = ANY(allowed) AND item.value IS NOT NULL AND item.value <> 'null'::jsonb AND item.value <> '""'::jsonb THEN
      result := result || jsonb_build_object(item.key, item.value);
    END IF;
  END LOOP;

  RETURN result;
END;
$$;

-- Normalize listing values before storage so displayed price and per-sqft values cannot drift
CREATE OR REPLACE FUNCTION public.normalize_property_listing_values()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price IS NULL OR NEW.price <= 0 THEN
    RAISE EXCEPTION 'Property price must be greater than zero';
  END IF;

  IF NEW.area IS NULL OR NEW.area <= 0 THEN
    RAISE EXCEPTION 'Property area must be greater than zero';
  END IF;

  NEW.price := round(NEW.price::numeric, 2);
  NEW.area := round(NEW.area::numeric, 2);
  NEW.price_per_sqft := round((NEW.price / NULLIF(NEW.area, 0))::numeric);
  NEW.property_attributes := public.filter_property_attributes(NEW.property_type, COALESCE(NEW.property_attributes, '{}'::jsonb));

  IF public.is_residential_property_type(NEW.property_type) THEN
    NEW.bedrooms := COALESCE(NEW.bedrooms, NULLIF(NEW.property_attributes->>'bedrooms', '')::int);
    NEW.bathrooms := COALESCE(NEW.bathrooms, NULLIF(NEW.property_attributes->>'bathrooms', '')::int);
  ELSE
    NEW.bedrooms := NULL;
    NEW.bathrooms := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_property_listing_values ON public.property_listings;
CREATE TRIGGER trg_normalize_property_listing_values
BEFORE INSERT OR UPDATE ON public.property_listings
FOR EACH ROW EXECUTE FUNCTION public.normalize_property_listing_values();

-- Validate update request review inputs and proposed changes
CREATE OR REPLACE FUNCTION public.validate_property_update_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_listing public.property_listings%ROWTYPE;
  requested_price numeric;
  requested_area numeric;
  requested_type text;
  requested_attrs jsonb;
BEGIN
  IF NEW.proposed_changes IS NULL OR jsonb_typeof(NEW.proposed_changes) <> 'object' OR NEW.proposed_changes = '{}'::jsonb THEN
    RAISE EXCEPTION 'Update request must include at least one proposed change';
  END IF;

  SELECT * INTO target_listing FROM public.property_listings WHERE id = NEW.listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing for update request was not found';
  END IF;

  requested_price := COALESCE(NULLIF(NEW.proposed_changes->>'price', '')::numeric, target_listing.price);
  requested_area := COALESCE(NULLIF(NEW.proposed_changes->>'area', '')::numeric, target_listing.area);
  requested_type := COALESCE(NULLIF(NEW.proposed_changes->>'property_type', ''), target_listing.property_type);

  IF requested_price <= 0 THEN
    RAISE EXCEPTION 'Updated price must be greater than zero';
  END IF;
  IF requested_area <= 0 THEN
    RAISE EXCEPTION 'Updated area must be greater than zero';
  END IF;

  IF NEW.proposed_changes ? 'property_attributes' THEN
    requested_attrs := public.filter_property_attributes(requested_type, NEW.proposed_changes->'property_attributes');
    NEW.proposed_changes := jsonb_set(NEW.proposed_changes, '{property_attributes}', requested_attrs, true);
  END IF;

  IF NEW.status IN ('approved','rejected') THEN
    IF NEW.reviewed_by IS NULL THEN
      RAISE EXCEPTION 'Reviewer is required';
    END IF;
    IF NEW.reviewed_at IS NULL THEN
      NEW.reviewed_at := now();
    END IF;
    IF NEW.status = 'rejected' AND length(trim(COALESCE(NEW.admin_note, ''))) < 5 THEN
      RAISE EXCEPTION 'Rejection remarks must be at least 5 characters';
    END IF;
    IF length(COALESCE(NEW.admin_note, '')) > 500 THEN
      RAISE EXCEPTION 'Admin remarks must be 500 characters or fewer';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_property_update_request ON public.property_update_requests;
CREATE TRIGGER trg_validate_property_update_request
BEFORE INSERT OR UPDATE ON public.property_update_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_property_update_request();

-- Apply approved updates safely and recompute derived values
CREATE OR REPLACE FUNCTION public.apply_listing_update_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c jsonb;
  old_listing jsonb;
  new_listing jsonb;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    c := NEW.proposed_changes;
    SELECT to_jsonb(pl.*) INTO old_listing FROM public.property_listings pl WHERE pl.id = NEW.listing_id;

    UPDATE public.property_listings SET
      title              = COALESCE(c->>'title', title),
      description        = COALESCE(c->>'description', description),
      listing_type       = COALESCE(c->>'listing_type', listing_type),
      property_type      = COALESCE(c->>'property_type', property_type),
      city               = COALESCE(c->>'city', city),
      locality           = COALESCE(c->>'locality', locality),
      address            = COALESCE(c->>'address', address),
      price              = COALESCE(NULLIF(c->>'price', '')::numeric, price),
      area               = COALESCE(NULLIF(c->>'area', '')::numeric, area),
      bedrooms           = CASE WHEN public.is_residential_property_type(COALESCE(c->>'property_type', property_type)) THEN COALESCE(NULLIF(c->>'bedrooms', '')::int, bedrooms) ELSE NULL END,
      bathrooms          = CASE WHEN public.is_residential_property_type(COALESCE(c->>'property_type', property_type)) THEN COALESCE(NULLIF(c->>'bathrooms', '')::int, bathrooms) ELSE NULL END,
      parking            = COALESCE(NULLIF(c->>'parking', '')::int, parking),
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
      property_attributes = public.filter_property_attributes(
        COALESCE(c->>'property_type', property_type),
        COALESCE(c->'property_attributes', property_attributes, '{}'::jsonb)
      ),
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

    SELECT to_jsonb(pl.*) INTO new_listing FROM public.property_listings pl WHERE pl.id = NEW.listing_id;

    INSERT INTO public.update_request_audit (request_id, listing_id, reviewer_id, action, note, changes)
    VALUES (
      NEW.id,
      NEW.listing_id,
      NEW.reviewed_by,
      'applied',
      NEW.admin_note,
      jsonb_build_object('before', old_listing, 'after', new_listing, 'requested', c)
    );

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

-- Upgrade audit entries to include previous/current request snapshots on review
CREATE OR REPLACE FUNCTION public.log_update_request_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('approved','rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.update_request_audit (request_id, listing_id, reviewer_id, action, note, changes)
    VALUES (
      NEW.id,
      NEW.listing_id,
      NEW.reviewed_by,
      NEW.status,
      NEW.admin_note,
      jsonb_build_object('before_request', to_jsonb(OLD), 'after_request', to_jsonb(NEW), 'proposed_changes', NEW.proposed_changes)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill exact per-sqft values for existing listings
UPDATE public.property_listings
SET price = round(price::numeric, 2),
    area = round(area::numeric, 2),
    price_per_sqft = round((price / NULLIF(area, 0))::numeric),
    property_attributes = public.filter_property_attributes(property_type, COALESCE(property_attributes, '{}'::jsonb)),
    bedrooms = CASE WHEN public.is_residential_property_type(property_type) THEN bedrooms ELSE NULL END,
    bathrooms = CASE WHEN public.is_residential_property_type(property_type) THEN bathrooms ELSE NULL END
WHERE price IS NOT NULL AND area IS NOT NULL AND area > 0;