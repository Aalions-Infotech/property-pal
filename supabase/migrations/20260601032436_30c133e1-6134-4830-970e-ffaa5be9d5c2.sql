REVOKE ALL ON FUNCTION public.normalize_property_listing_values() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_property_update_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_listing_update_on_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_update_request_audit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_update_request_submitted() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.normalize_property_listing_values() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_property_update_request() TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_listing_update_on_approval() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_update_request_audit() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_update_request_submitted() TO service_role;