
-- Fix overly permissive INSERT policies on notifications
DROP POLICY "Service role can insert notifications" ON public.notifications;
DROP POLICY "Anon can insert notifications" ON public.notifications;

-- Allow authenticated users to insert notifications for event creators
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events WHERE events.id = event_id AND events.created_by = notifications.user_id
    )
  );

-- Allow anon to insert notifications for event creators  
CREATE POLICY "Anon can insert notifications"
  ON public.notifications
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events WHERE events.id = event_id AND events.created_by = notifications.user_id
    )
  );
