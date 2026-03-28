import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // Support single or batch payloads
    const records = Array.isArray(body) ? body : [body];

    for (const record of records) {
      const {
        vehicle_id,
        vehicle_name,
        vehicle_plate,
        driver,
        vehicle_type,
        speed = 0,
        safe_speed,
        safeSpeed,
        slope = 0,
        grip_coefficient,
        gripCoefficient,
        load = 0,
        throttle = 0,
        deceleration = 0,
        braking_distance,
        brakingDistance,
        BrakingDistance,
        status,
        latitude,
        longitude,
        location,
      } = record;

      if (!vehicle_id) {
        continue; // skip records without vehicle_id
      }

      // Compute status if not provided
      const safeSpeedVal = safe_speed ?? safeSpeed ?? 60;
      const computedStatus =
        status ||
        (speed > safeSpeedVal * 1.1
          ? "critical"
          : speed > safeSpeedVal * 0.9
          ? "warning"
          : "safe");

      const row = {
        vehicle_id,
        vehicle_name: vehicle_name || vehicle_id,
        vehicle_plate: vehicle_plate || null,
        driver: driver || null,
        vehicle_type: vehicle_type || "truck",
        speed,
        safe_speed: safeSpeedVal,
        slope,
        grip_coefficient: grip_coefficient ?? gripCoefficient ?? 0.5,
        load,
        throttle,
        deceleration,
        braking_distance:
          braking_distance ?? brakingDistance ?? BrakingDistance ?? 0,
        status: computedStatus,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        location: location ?? null,
        updated_at: new Date().toISOString(),
      };

      // Upsert by vehicle_id
      const { error } = await supabase
        .from("vehicle_telemetry")
        .upsert(row, { onConflict: "vehicle_id" });

      if (error) {
        console.error("Upsert error:", error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: records.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});