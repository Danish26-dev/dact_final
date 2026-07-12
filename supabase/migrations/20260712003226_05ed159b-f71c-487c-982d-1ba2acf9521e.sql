ALTER PUBLICATION supabase_realtime ADD TABLE public.gateway_queue_events;
ALTER TABLE public.gateway_queue_events REPLICA IDENTITY FULL;