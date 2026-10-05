import { supabase } from "@/integrations/supabase/client";

/**
 * All driver / driver-message access goes through the `driver-crud` edge function.
 * The database no longer allows the browser to touch these tables directly; the
 * function checks passwords server-side and hands back a short-lived signed session token.
 */

export interface DriverProfile {
  id: string;
  display_name: string;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  vehicle_type: string | null;
}

export interface DriverMessage {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  driver_id: string;
}

const ADMIN_KEY = "tm_admin_session";
const DRIVER_KEY = "tm_driver_session";

interface StoredSession<T = undefined> {
  token: string;
  expiresAt: number;
  driver?: T;
}

function readStored<T>(key: string): StoredSession<T> | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession<T>;
    if (!parsed.token || parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function store(key: string, token: string, expiresInSeconds: number, driver?: DriverProfile) {
  sessionStorage.setItem(key, JSON.stringify({ token, expiresAt: Date.now() + expiresInSeconds * 1000, driver }));
}

export const adminSession = {
  get: () => readStored(ADMIN_KEY),
  isActive: () => readStored(ADMIN_KEY) !== null,
  clear: () => sessionStorage.removeItem(ADMIN_KEY),
};

export const driverSession = {
  get: () => readStored<DriverProfile>(DRIVER_KEY),
  driver: () => readStored<DriverProfile>(DRIVER_KEY)?.driver ?? null,
  clear: () => sessionStorage.removeItem(DRIVER_KEY),
};

async function call<T>(action: string, payload: Record<string, unknown> = {}, token?: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke("driver-crud", {
    body: { action, ...payload },
    headers: token ? { "x-session-token": token } : undefined,
  });

  if (error) {
    // FunctionsHttpError carries the JSON body in `context`
    let message = "Request failed";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    if (message === "Unauthorized") {
      adminSession.clear();
      driverSession.clear();
    }
    throw new Error(message);
  }
  return data as T;
}

const adminToken = () => adminSession.get()?.token;
const driverToken = () => driverSession.get()?.token;

export const driverApi = {
  list: async () => (await call<{ data: DriverProfile[] }>("list")).data ?? [],

  adminLogin: async (password: string) => {
    const res = await call<{ token: string; expires_in: number }>("admin_login", { admin_password: password });
    store(ADMIN_KEY, res.token, res.expires_in);
  },

  driverLogin: async (driverId: string, password: string) => {
    const res = await call<{ data: DriverProfile; token: string; expires_in: number }>("verify", {
      driver_id: driverId,
      driver_password: password,
    });
    store(DRIVER_KEY, res.token, res.expires_in, res.data);
    return res.data;
  },

  create: async (driver: Omit<DriverProfile, "id"> & { password: string }) =>
    (await call<{ data: DriverProfile }>("create", { driver_data: driver }, adminToken())).data,

  remove: (driverId: string) => call("delete", { driver_id: driverId }, adminToken()),

  /** Uses the admin session if present, otherwise the driver session. */
  messages: async (driverId: string) =>
    (await call<{ data: DriverMessage[] }>("messages_list", { driver_id: driverId }, adminToken() ?? driverToken()))
      .data ?? [],

  send: (message: string, target: { driverId: string } | { broadcast: true }) =>
    call<{ count: number }>(
      "message_send",
      "broadcast" in target ? { message, broadcast: true } : { message, driver_id: target.driverId },
      adminToken(),
    ),

  markRead: () => call("messages_mark_read", {}, driverToken()),
};
