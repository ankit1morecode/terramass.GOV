import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleData, SensorData } from "@/lib/mock-data";

interface TelemetryRow {
  vehicle_id: string;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  driver: string | null;
  vehicle_type: string | null;
  speed: number;
  safe_speed: number;
  slope: number;
  grip_coefficient: number;
  load: number;
  throttle: number;
  deceleration: number;
  braking_distance: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  updated_at: string;
}

function rowToVehicle(row: TelemetryRow): VehicleData {
  const sensor: SensorData = {
    speed: row.speed || 0,
    safeSpeed: row.safe_speed || 30,
    slope: row.slope || 0,
    gripCoefficient: row.grip_coefficient || 0.7,
    load: row.load || 0,
    throttle: row.throttle || 0,
    deceleration: row.deceleration || 0,
    brakingDistance: row.braking_distance || 0,
    status: (row.status as SensorData["status"]) || "safe",
    timestamp: new Date(row.updated_at).getTime(),
  };

  return {
    id: row.vehicle_id,
    name: row.vehicle_name || row.vehicle_id,
    plate: row.vehicle_plate || "N/A",
    type: (row.vehicle_type as VehicleData["type"]) || "truck",
    driver: row.driver || "Unknown",
    location: row.location || "Unknown",
    sensor,
  };
}

export function useMqttTelemetry() {
  const [liveVehicles, setLiveVehicles] = useState<VehicleData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const fetchFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("vehicle_telemetry")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(100);

        if (error) {
          console.error("Error fetching telemetry:", error);
          setError(error.message);
          return false;
        }

        if (data) {
          setLiveVehicles((data as TelemetryRow[]).map(rowToVehicle));
          setIsConnected(true);
          setError(null);
          retryCount = 0;
          return true;
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch telemetry data");
        retryCount++;
        if (retryCount >= maxRetries) {
          setIsConnected(false);
        }
      }
      return false;
    };

    const fetchFromLocal = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/telemetry');
        if (response.ok) {
          const data = await response.json();
          const vehicleData = data.map((record: any) => ({
            id: record.vehicle_id,
            name: record.vehicle_name || record.vehicle_id,
            plate: record.vehicle_plate || "N/A",
            type: (record.vehicle_type as VehicleData["type"]) || "truck",
            driver: record.driver || "Local Driver",
            location: "Local Network",
            sensor: {
              speed: record.speed || 0,
              safeSpeed: record.safe_speed || 30,
              slope: record.slope || 0,
              gripCoefficient: record.grip_coefficient || 0.7,
              load: record.load || 0,
              throttle: record.throttle || 0,
              deceleration: record.deceleration || 0,
              brakingDistance: record.braking_distance || 0,
              status: (record.status as SensorData["status"]) || "safe",
              timestamp: new Date(record.timestamp || record.updated_at).getTime(),
            },
          }));
          setLiveVehicles(vehicleData);
          setIsConnected(true);
          setError(null);
          return true;
        }
      } catch (err) {
        console.error("Local fetch error:", err);
      }
      return false;
    };

    const fetchAll = async () => {
      // Try Supabase first, fallback to local API
      const success = await fetchFromSupabase();
      if (!success) {
        await fetchFromLocal();
      }
    };

    // Initial fetch
    fetchAll();

    // Subscribe to realtime changes from Supabase
    const channel = supabase
      .channel("vehicle_telemetry_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicle_telemetry" },
        (payload) => {
          try {
            if (payload.eventType === "DELETE") {
              setLiveVehicles((prev) =>
                prev.filter((v) => v.id !== (payload.old as TelemetryRow).vehicle_id)
              );
              return;
            }
            const updated = rowToVehicle(payload.new as TelemetryRow);
            setLiveVehicles((prev) => {
              const exists = prev.findIndex((v) => v.id === updated.id);
              if (exists >= 0) {
                const next = [...prev];
                next[exists] = updated;
                return next;
              }
              return [...prev, updated];
            });
            setIsConnected(true);
            setError(null);
          } catch (err) {
            console.error("Error processing realtime update:", err);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Connected to realtime telemetry updates");
          setIsConnected(true);
        } else if (status === "CHANNEL_ERROR") {
          console.error("Realtime subscription error");
          setIsConnected(false);
          setError("Realtime connection failed");
        }
      });

    // Polling fallback every 10s (reduced frequency)
    const pollInterval = setInterval(fetchAll, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  return { liveVehicles, isConnected, error };
}
