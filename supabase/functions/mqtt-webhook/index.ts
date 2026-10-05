import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Required function secret: MQTT_WEBHOOK_SECRET — devices/bridges must send it in the
// `x-webhook-secret` header. Without it anyone on the internet could forge telemetry.
const WEBHOOK_SECRET = Deno.env.get("MQTT_WEBHOOK_SECRET") ?? "";
const MAX_BATCH = 100;
const STATUSES = new Set(["safe", "warning", "critical"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

/** Finite number within [min, max], else the fallback. */
function num(value: unknown, fallback: number, min = -1e6, max = 1e6): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

function optNum(value: unknown, min: number, max: number): number | null {
  const n = num(value, NaN, min, max);
  return Number.isNaN(n) ? null : n;
}

const str = (value: unknown, max = 100): string | null =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!WEBHOOK_SECRET) {
    console.error("mqtt-webhook: MQTT_WEBHOOK_SECRET is not set");
    return json({ error: "Server not configured" }, 500);
  }
  if (!timingSafeEqual(req.headers.get("x-webhook-secret") ?? "", WEBHOOK_SECRET)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json();
    const records: Record<string, unknown>[] = (Array.isArray(body) ? body : [body]).slice(0, MAX_BATCH);
    let saved = 0;

    for (const record of records) {
      if (!record || typeof record !== "object") continue;
      const vehicleId = str(record.vehicle_id, 64);
      if (!vehicleId) continue;

      const speed = num(record.speed, 0, 0, 500);
      const safeSpeed = num(record.safe_speed ?? record.safeSpeed, 60, 0, 500);
      const providedStatus = typeof record.status === "string" ? record.status.toLowerCase() : "";
      const status = STATUSES.has(providedStatus)
        ? providedStatus
        : speed > safeSpeed * 1.1
        ? "critical"
        : speed > safeSpeed * 0.9
        ? "warning"
        : "safe";

      const row = {
        vehicle_id: vehicleId,
        vehicle_name: str(record.vehicle_name) ?? vehicleId,
        vehicle_plate: str(record.vehicle_plate, 20),
        driver: str(record.driver),
        vehicle_type: str(record.vehicle_type, 20) ?? "truck",
        speed,
        safe_speed: safeSpeed,
        slope: num(record.slope, 0, -90, 90),
        grip_coefficient: num(record.grip_coefficient ?? record.gripCoefficient, 0.5, 0, 2),
        load: num(record.load, 0, 0, 1e6),
        throttle: num(record.throttle, 0, 0, 100),
        deceleration: num(record.deceleration, 0, -100, 100),
        braking_distance: num(record.braking_distance ?? record.brakingDistance ?? record.BrakingDistance, 0, 0, 1e4),
        status,
        latitude: optNum(record.latitude, -90, 90),
        longitude: optNum(record.longitude, -180, 180),
        location: str(record.location),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("vehicle_telemetry").upsert(row, { onConflict: "vehicle_id" });
      if (error) console.error("Upsert error:", error);
      else saved++;
    }

    return json({ success: true, count: saved });
  } catch (err) {
    console.error("Webhook error:", err);
    return json({ error: "Invalid payload" }, 400);
  }
});
