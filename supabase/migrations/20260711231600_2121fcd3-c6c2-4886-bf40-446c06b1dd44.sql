CREATE TABLE public.gateway_queue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container text NOT NULL,
  kind text NOT NULL,
  node_id text NOT NULL DEFAULT 'EXT-API',
  event_ts timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'forwarded', 'syncing', 'acked')),
  retries integer NOT NULL DEFAULT 0 CHECK (retries >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.gateway_queue_events TO anon;
GRANT SELECT, INSERT ON public.gateway_queue_events TO authenticated;
GRANT ALL ON public.gateway_queue_events TO service_role;

ALTER TABLE public.gateway_queue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can add gateway queue events"
ON public.gateway_queue_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(container)) BETWEEN 1 AND 80
  AND length(trim(kind)) BETWEEN 1 AND 80
  AND length(trim(node_id)) BETWEEN 1 AND 80
);

CREATE POLICY "Public can view gateway queue events"
ON public.gateway_queue_events
FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX gateway_queue_events_created_at_idx
ON public.gateway_queue_events (created_at DESC);