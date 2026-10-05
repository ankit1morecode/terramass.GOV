import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Required function secrets (set with `supabase secrets set ...`):
//   ADMIN_PASSWORD  - admin dashboard password
//   SESSION_SECRET  - long random string used to sign session tokens
// Optional:
//   ALLOWED_ORIGINS - comma-separated list of allowed browser origins (default "*")
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const SESSION_SECRET = Deno.env.get("SESSION_SECRET") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ADMIN_TTL_SECONDS = 60 * 60 * 8; // 8h
const DRIVER_TTL_SECONDS = 60 * 60 * 12; // 12h
const PBKDF2_ITERATIONS = 100_000;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_FIELD_LENGTH = 100;

const encoder = new TextEncoder();

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes("*")
    ? "*"
    : ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-session-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// ---------- crypto helpers ----------

const toB64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromB64Url = (s: string) => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

function timingSafeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64Url(salt)}$${toB64Url(hash)}`;
}

/** Returns { ok, legacy } — legacy=true means the stored value was plaintext and should be re-hashed. */
async function verifyPassword(password: string, stored: string): Promise<{ ok: boolean; legacy: boolean }> {
  if (!stored.startsWith("pbkdf2$")) {
    return { ok: timingSafeEqual(password, stored), legacy: true };
  }
  const [, iter, saltB64, hashB64] = stored.split("$");
  const hash = await pbkdf2(password, fromB64Url(saltB64), Number(iter));
  return { ok: timingSafeEqual(toB64Url(hash), hashB64), legacy: false };
}

async function hmacKey() {
  return crypto.subtle.importKey("raw", encoder.encode(SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

type Session = { role: "admin" } | { role: "driver"; sub: string };

async function signSession(session: Session, ttlSeconds: number): Promise<string> {
  const payload = toB64Url(encoder.encode(JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + ttlSeconds })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payload)));
  return `${payload}.${toB64Url(sig)}`;
}

async function readSession(token: string | null | undefined): Promise<Session | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const valid = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64Url(sig), encoder.encode(payload));
  if (!valid) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64Url(payload)));
    if (typeof data.exp !== "number" || data.exp < Date.now() / 1000) return null;
    if (data.role === "admin") return { role: "admin" };
    if (data.role === "driver" && typeof data.sub === "string") return { role: "driver", sub: data.sub };
  } catch {
    // fall through
  }
  return null;
}

// ---------- validation helpers ----------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VEHICLE_TYPES = new Set(["truck", "mining", "municipal", "fleet"]);

const cleanText = (v: unknown, max = MAX_FIELD_LENGTH) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// ---------- handler ----------

Deno.serve(async (req) => {
  const headers = { ...corsHeaders(req), "Content-Type": "application/json" };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    console.error("driver-crud: ADMIN_PASSWORD and SESSION_SECRET secrets must be set");
    return json({ error: "Server not configured" }, 500);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body ?? {};
    const session = await readSession(req.headers.get("x-session-token"));
    const isAdmin = session?.role === "admin";

    // Service role client — bypasses RLS, so every action below must authorize explicitly.
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    switch (action) {
      // Public: driver picker. Never returns passwords.
      case "list": {
        const { data, error } = await supabase
          .from("drivers")
          .select("id, display_name, vehicle_name, vehicle_plate, vehicle_type")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data });
      }

      case "admin_login": {
        if (!timingSafeEqual(String(body.admin_password ?? ""), ADMIN_PASSWORD)) {
          return json({ error: "Incorrect password" }, 401);
        }
        return json({ token: await signSession({ role: "admin" }, ADMIN_TTL_SECONDS), expires_in: ADMIN_TTL_SECONDS });
      }

      case "verify": {
        const driverId = String(body.driver_id ?? "");
        const password = String(body.driver_password ?? "");
        if (!UUID_RE.test(driverId) || !password) return json({ error: "Missing driver_id or password" }, 400);

        const { data } = await supabase
          .from("drivers")
          .select("id, display_name, vehicle_name, vehicle_plate, vehicle_type, password")
          .eq("id", driverId)
          .maybeSingle();

        // Same response for unknown driver and wrong password to avoid enumeration.
        const result = data ? await verifyPassword(password, data.password) : { ok: false, legacy: false };
        if (!data || !result.ok) return json({ error: "Incorrect driver or password" }, 401);

        if (result.legacy) {
          await supabase.from("drivers").update({ password: await hashPassword(password) }).eq("id", driverId);
        }

        const { password: _pw, ...driver } = data;
        return json({
          data: driver,
          token: await signSession({ role: "driver", sub: driver.id }, DRIVER_TTL_SECONDS),
          expires_in: DRIVER_TTL_SECONDS,
        });
      }

      case "create": {
        if (!isAdmin) return json({ error: "Unauthorized" }, 401);
        const d = body.driver_data ?? {};
        const displayName = cleanText(d.display_name);
        const password = typeof d.password === "string" ? d.password : "";
        if (!displayName || password.length < 8 || password.length > 128) {
          return json({ error: "Name is required and password must be 8–128 characters" }, 400);
        }
        const vehicleType = VEHICLE_TYPES.has(d.vehicle_type) ? d.vehicle_type : "truck";

        const { data, error } = await supabase
          .from("drivers")
          .insert({
            display_name: displayName,
            vehicle_name: cleanText(d.vehicle_name) || "My Vehicle",
            vehicle_plate: cleanText(d.vehicle_plate, 20) || "XX-00-XX-0000",
            vehicle_type: vehicleType,
            password: await hashPassword(password),
          })
          .select("id, display_name, vehicle_name, vehicle_plate, vehicle_type")
          .single();
        if (error) throw error;
        return json({ data });
      }

      case "delete": {
        if (!isAdmin) return json({ error: "Unauthorized" }, 401);
        const driverId = String(body.driver_id ?? "");
        if (!UUID_RE.test(driverId)) return json({ error: "Missing driver_id" }, 400);
        // driver_messages cascade on delete
        const { error } = await supabase.from("drivers").delete().eq("id", driverId);
        if (error) throw error;
        return json({ success: true });
      }

      // Admin: any driver's messages. Driver: only their own.
      case "messages_list": {
        const driverId = String(body.driver_id ?? "");
        if (!UUID_RE.test(driverId)) return json({ error: "Missing driver_id" }, 400);
        const allowed = isAdmin || (session?.role === "driver" && session.sub === driverId);
        if (!allowed) return json({ error: "Unauthorized" }, 401);

        const { data, error } = await supabase
          .from("driver_messages")
          .select("id, message, created_at, read, driver_id")
          .eq("driver_id", driverId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return json({ data });
      }

      case "message_send": {
        if (!isAdmin) return json({ error: "Unauthorized" }, 401);
        const message = cleanText(body.message, MAX_MESSAGE_LENGTH);
        if (!message) return json({ error: "Message is required" }, 400);

        let driverIds: string[];
        if (body.broadcast === true) {
          const { data, error } = await supabase.from("drivers").select("id");
          if (error) throw error;
          driverIds = (data ?? []).map((d) => d.id);
        } else {
          const driverId = String(body.driver_id ?? "");
          if (!UUID_RE.test(driverId)) return json({ error: "Missing driver_id" }, 400);
          driverIds = [driverId];
        }
        if (driverIds.length === 0) return json({ success: true, count: 0 });

        const { error } = await supabase
          .from("driver_messages")
          .insert(driverIds.map((driver_id) => ({ driver_id, message })));
        if (error) throw error;
        return json({ success: true, count: driverIds.length });
      }

      case "messages_mark_read": {
        if (session?.role !== "driver") return json({ error: "Unauthorized" }, 401);
        const { error } = await supabase
          .from("driver_messages")
          .update({ read: true })
          .eq("driver_id", session.sub)
          .eq("read", false);
        if (error) throw error;
        return json({ success: true });
      }

      default:
        return json({ error: "Invalid action" }, 400);
    }
  } catch (err) {
    console.error("driver-crud error:", err);
    return json({ error: "Server error" }, 500);
  }
});
