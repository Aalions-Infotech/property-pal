CREATE OR REPLACE FUNCTION public.notify_admin_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      admin_record.user_id,
      '📩 New Lead Received',
      'New enquiry from ' || NEW.full_name || ' (' || NEW.phone || ')',
      'info',
      '/admin'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_lead_notify_admin
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_lead();