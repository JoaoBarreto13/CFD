-- Aggregate attendance confirmations into one notification per event.
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'generic';

CREATE INDEX IF NOT EXISTS idx_notifications_user_event_kind
ON public.notifications(user_id, event_id, kind);

-- Allow participants to read/update the aggregated presence notification row
-- so they can refresh the message instead of inserting floods.
CREATE POLICY "Participants can view presence notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    kind = 'presence_confirmation'
    AND EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = notifications.event_id
        AND events.created_by = notifications.user_id
    )
    AND (
      auth.uid() = notifications.user_id
      OR EXISTS (
        SELECT 1
        FROM public.event_responses
        WHERE event_responses.event_id = notifications.event_id
          AND event_responses.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Participants can update presence notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    kind = 'presence_confirmation'
    AND EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = notifications.event_id
        AND events.created_by = notifications.user_id
    )
    AND (
      auth.uid() = notifications.user_id
      OR EXISTS (
        SELECT 1
        FROM public.event_responses
        WHERE event_responses.event_id = notifications.event_id
          AND event_responses.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    kind = 'presence_confirmation'
    AND EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = notifications.event_id
        AND events.created_by = notifications.user_id
    )
  );
