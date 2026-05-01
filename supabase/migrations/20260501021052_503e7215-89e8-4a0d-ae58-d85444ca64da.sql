-- 1. Remove orphan agent_profiles (no associated profile)
DELETE FROM public.agent_profiles
WHERE user_id NOT IN (SELECT user_id FROM public.profiles);

-- Also clean up any stray user_roles for those orphan users
DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT user_id FROM public.profiles);

-- 2. Admin function to fully delete a user's app data
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  -- Must be admin/moderator
  IF NOT public.is_admin(v_caller) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Don't allow deleting yourself
  IF v_caller = _target_user_id THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Don't allow deleting other admins
  IF public.is_admin(_target_user_id) THEN
    RAISE EXCEPTION 'Cannot delete an admin account. Demote first.';
  END IF;

  -- Delete dependent data
  DELETE FROM public.saved_properties WHERE user_id = _target_user_id;
  DELETE FROM public.property_reviews WHERE user_id = _target_user_id;
  DELETE FROM public.agent_reviews WHERE reviewer_user_id = _target_user_id OR agent_user_id = _target_user_id;
  DELETE FROM public.agent_clients WHERE agent_id = _target_user_id;
  DELETE FROM public.agent_applications WHERE user_id = _target_user_id;
  DELETE FROM public.agent_profiles WHERE user_id = _target_user_id;
  DELETE FROM public.notifications WHERE user_id = _target_user_id;
  DELETE FROM public.leads WHERE user_id = _target_user_id OR agent_id = _target_user_id;
  DELETE FROM public.sponsorships WHERE user_id = _target_user_id;
  DELETE FROM public.property_listings WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE user_id = _target_user_id;

  -- Log it
  INSERT INTO public.admin_activity_log (admin_id, action, entity_type, entity_id, details)
  VALUES (v_caller, 'delete_user', 'user', _target_user_id::text, jsonb_build_object('deleted_at', now()));

  RETURN jsonb_build_object('success', true, 'deleted_user_id', _target_user_id);
END;
$$;

-- Allow profiles DELETE for admins (in case anything bypasses the function)
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.is_admin(auth.uid()));