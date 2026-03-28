import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { VehicleData, SensorData } from "@/lib/mock-data";

interface LocalTelemetryContextType {
  vehicles: VehicleData[];
  isConnected: boolean;
  error: string | null;
}

const LocalTelemetryContext = createContext<LocalTelemetryContextType>({
  vehicles: [],
  isConnected: false,
  error: null,
});

export const useLocalTelemetry = () => useContext(LocalTelemetryContext);

export const LocalTelemetryProvider = ({ children }: { children: ReactNode }) => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch local telemetry data
    const fetchLocalTelemetry = async () => {
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
          setVehicles(vehicleData);
          setIsConnected(true);
          setError(null);
        } else {
          throw new Error('Failed to fetch local telemetry');
        }
      } catch (err) {
        console.error('Local telemetry fetch error:', err);
        setError('Local telemetry unavailable');
        setIsConnected(false);
      }
    };

    fetchLocalTelemetry();
    const interval = setInterval(fetchLocalTelemetry, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <LocalTelemetryContext.Provider value={{ vehicles, isConnected, error }}>
      {children}
    </LocalTelemetryContext.Provider>
  );
};
