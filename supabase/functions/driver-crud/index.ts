import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const ADMIN_PASSWORD = "terramass@ankit";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, admin_password, driver_password, driver_id, driver_data } = body;

    // Service role client to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // LIST: no auth required - returns drivers WITHOUT passwords
    if (action === "list") {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, display_name, vehicle_name, vehicle_plate, vehicle_type")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // VERIFY: driver password check server-side
    if (action === "verify") {
      if (!driver_id || !driver_password) {
        return new Response(JSON.stringify({ error: "Missing driver_id or password" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("drivers")
        .select("id, display_name, vehicle_name, vehicle_plate, vehicle_type, password")
        .eq("id", driver_id)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Driver not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (data.password !== driver_password) {
        return new Response(JSON.stringify({ error: "Incorrect password" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return driver details without password
      const { password: _, ...driverInfo } = data;
      return new Response(JSON.stringify({ data: driverInfo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE: requires admin password
    if (action === "create") {
      if (admin_password !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!driver_data?.display_name || !driver_data?.password) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase.from("drivers").insert({
        display_name: driver_data.display_name,
        vehicle_name: driver_data.vehicle_name || "My Vehicle",
        vehicle_plate: driver_data.vehicle_plate || "XX-00-XX-0000",
        vehicle_type: driver_data.vehicle_type || "truck",
        password: driver_data.password,
      }).select("id, display_name, vehicle_name, vehicle_plate, vehicle_type").single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE: requires admin password
    if (action === "delete") {
      if (admin_password !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!driver_id) {
        return new Response(JSON.stringify({ error: "Missing driver_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete messages first, then driver
      await supabase.from("driver_messages").delete().eq("driver_id", driver_id);
      const { error } = await supabase.from("drivers").delete().eq("id", driver_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
