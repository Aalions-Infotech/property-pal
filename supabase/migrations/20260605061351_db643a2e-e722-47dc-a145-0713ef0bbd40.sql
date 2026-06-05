
CREATE POLICY "Admins can insert notifications for any user"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));
