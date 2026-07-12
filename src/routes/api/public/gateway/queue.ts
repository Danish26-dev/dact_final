import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Gateway Queue public API
 *
 * POST /api/public/gateway/queue
 *   Body (JSON):
 *     {
 *       "container": "MSCU123456",   // required
 *       "kind":      "RFID Scan",    // required
 *       "nodeId":    "TRK-01",       // optional — defaults to "EXT-API"
 *       "status":    "queued"        // optional — "queued" | "forwarded" | "syncing" | "acked" (default: "queued")
 *     }
 *   Response: 201 { ok: true, event: {...} }
 *
 * GET /api/public/gateway/queue
 *   Response: 200 { queue: [...], count: n }
 *
 * Data is stored in Supabase so POSTed events show on the frontend
 * across worker instances and deployments.
 */

type QueueStatus = "queued" | "forwarded" | "syncing" | "acked";

interface QueueEvent {
  id: string;
  container: string;
  kind: string;
  nodeId: string;
  ts: number;
  status: QueueStatus;
  retries: number;
}

interface GatewayQueueRow {
  id: string;
  container: string;
  kind: string;
  node_id: string;
  event_ts: string;
  status: QueueStatus;
  retries: number;
}

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type, authorization, x-requested-with, accept, origin",
  "access-control-max-age": "86400",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store, max-age=0",
      ...corsHeaders,
    },
  });

const toEvent = (row: GatewayQueueRow): QueueEvent => ({
  id: row.id,
  container: row.container,
  kind: row.kind,
  nodeId: row.node_id,
  ts: new Date(row.event_ts).getTime(),
  status: row.status,
  retries: row.retries,
});

const getDb = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const Route = createFileRoute("/api/public/gateway/queue")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: corsHeaders,
        }),

      GET: async () => {
        const db = getDb();
        if (!db) return json({ ok: false, error: "Backend is not configured" }, 500);

        const { data, error } = await db
          .from("gateway_queue_events")
          .select("id, container, kind, node_id, event_ts, status, retries")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) return json({ ok: false, error: error.message }, 500);

        const queue = ((data ?? []) as GatewayQueueRow[]).map(toEvent).reverse();
        return json({ queue, count: queue.length });
      },

      POST: async ({ request }) => {
        let body: Record<string, unknown>;

        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ ok: false, error: "Invalid JSON body" }, 400);
        }

        const container = typeof body.container === "string" ? body.container.trim() : "";
        const kind = typeof body.kind === "string" ? body.kind.trim() : "";

        if (!container || !kind) {
          return json({ ok: false, error: "container and kind are required" }, 400);
        }

        if (container.length > 80 || kind.length > 80) {
          return json({ ok: false, error: "container and kind must be 80 characters or less" }, 400);
        }

        const nodeId = typeof body.nodeId === "string" && body.nodeId.trim() ? body.nodeId.trim() : "EXT-API";

        if (nodeId.length > 80) {
          return json({ ok: false, error: "nodeId must be 80 characters or less" }, 400);
        }

        const status: QueueStatus =
          body.status === "forwarded" || body.status === "syncing" || body.status === "acked"
            ? body.status
            : "queued";

        const db = getDb();
        if (!db) return json({ ok: false, error: "Backend is not configured" }, 500);

        const { data, error } = await db
          .from("gateway_queue_events")
          .insert({
            container,
            kind,
            node_id: nodeId,
            status,
            retries: 0,
          })
          .select("id, container, kind, node_id, event_ts, status, retries")
          .single();

        if (error) return json({ ok: false, error: error.message }, 500);

        return json({ ok: true, event: toEvent(data as GatewayQueueRow) }, 201);
      },
    },
  },
});
