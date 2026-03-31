-- Keep creator notifications in sync with RSVP confirmations, including anonymous guests.
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'generic';

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_presence_unique
ON public.notifications(user_id, event_id, kind)
WHERE kind = 'presence_confirmation';

CREATE OR REPLACE FUNCTION public.refresh_presence_notification(target_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_id UUID;
  total_confirmed INTEGER;
  display_message TEXT;
BEGIN
  SELECT created_by
  INTO creator_id
  FROM public.events
  WHERE id = target_event_id;

  IF creator_id IS NULL THEN
    RETURN;
  END IF;

  WITH confirmed AS (
    SELECT
      COALESCE(NULLIF(er.guest_name, ''), NULLIF(p.display_name, ''), 'Membro') AS name,
      er.updated_at
    FROM public.event_responses er
    LEFT JOIN public.profiles p ON p.id = er.user_id
    WHERE er.event_id = target_event_id
      AND er.status = 'sim'
  ),
  ranked AS (
    SELECT
      name,
      MAX(updated_at) AS latest_update
    FROM confirmed
    GROUP BY name
    ORDER BY MAX(updated_at) DESC
  ),
  counted AS (
    SELECT COUNT(*)::INTEGER AS total
    FROM ranked
  )
  SELECT
    counted.total,
    CASE
      WHEN counted.total = 0 THEN NULL
      WHEN counted.total = 1 THEN (SELECT name FROM ranked LIMIT 1) || ' confirmou presença.'
      WHEN counted.total <= 3 THEN (SELECT string_agg(name, ', ') FROM (SELECT name FROM ranked LIMIT 3) top_names) || ' Confirmaram presença.'
      ELSE (SELECT string_agg(name, ', ') FROM (SELECT name FROM ranked LIMIT 3) top_names) || '... Confirmaram presença.'
    END
  INTO total_confirmed, display_message
  FROM counted;

  IF total_confirmed = 0 OR display_message IS NULL THEN
    DELETE FROM public.notifications
    WHERE user_id = creator_id
      AND event_id = target_event_id
      AND kind = 'presence_confirmation';
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, event_id, kind, message, read, created_at)
  VALUES (creator_id, target_event_id, 'presence_confirmation', display_message, false, now())
  ON CONFLICT (user_id, event_id, kind)
  WHERE kind = 'presence_confirmation'
  DO UPDATE SET
    message = EXCLUDED.message,
    read = false,
    created_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_presence_notification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_presence_notification(OLD.event_id);
  ELSE
    PERFORM public.refresh_presence_notification(NEW.event_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_event_responses_presence_notification ON public.event_responses;

CREATE TRIGGER trg_event_responses_presence_notification
AFTER INSERT OR UPDATE OR DELETE ON public.event_responses
FOR EACH ROW
EXECUTE FUNCTION public.handle_presence_notification_change();
