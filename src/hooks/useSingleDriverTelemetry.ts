import { useEffect, useState } from "react";
import type { VehicleData, SensorData } from "@/lib/mock-data";

interface TelemetryData {
  vehicle_id: string;
  vehicle_name: string;
  vehicle_plate: string;
  driver: string;
  vehicle_type: string;
  speed: number;
  safe_speed: number;
  slope: number;
  grip_coefficient: number;
  load: number;
  throttle: number;
  deceleration: number;
  braking_distance: number;
  status: string;
  timestamp: string;
  updated_at: string;
}

// Location coordinates mapping
const locationCoordinates: Record<string, [number, number]> = {
  "NH-44, Sultanpur": [26.26, 82.07],
  "SH-12, Amethi": [26.15, 81.81],
  "NH-56, Lucknow": [26.85, 80.95],
  "Dhanbad Mine-7": [23.79, 86.43],
  "Mumbai-Pune Exp": [18.99, 73.31],
  "Sultanpur City": [26.27, 82.07],
  "NH-48, Jaipur": [26.92, 75.78],
  "NH-8, Ahmedabad": [23.02, 72.57],
  "Live Tracking": [26.26, 82.07], // Default for live tracking
};

function telemetryToVehicle(data: TelemetryData): VehicleData {
  const sensor: SensorData = {
    speed: data.speed || 0,
    safeSpeed: data.safe_speed || 30,
    slope: data.slope || 0,
    gripCoefficient: data.grip_coefficient || 0.7,
    load: data.load || 0,
    throttle: data.throttle || 0,
    deceleration: data.deceleration || 0,
    brakingDistance: data.braking_distance || 0,
    status: (data.status as SensorData["status"]) || "safe",
    timestamp: new Date(data.timestamp || data.updated_at).getTime(),
  };

  // Ensure we always have valid coordinates
  const coordinates = locationCoordinates["Live Tracking"] || [26.26, 82.07];

  return {
    id: data.vehicle_id,
    name: data.vehicle_name,
    plate: data.vehicle_plate,
    type: (data.vehicle_type as VehicleData["type"]) || "truck",
    driver: data.driver,
    location: "Live Tracking",
    coordinates,
    sensor,
  };
}

export function useSingleDriverTelemetry(vehicleId: string) {
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        // Try local API first (for real-time data)
        const response = await fetch('http://localhost:3001/api/telemetry');
        if (response.ok) {
          const data = await response.json();
          const driverData = data.find((record: TelemetryData) => 
            record.vehicle_id === vehicleId || record.vehicle_name === vehicleId
          );
          
          if (driverData) {
            setVehicle(telemetryToVehicle(driverData));
            setIsConnected(true);
            setError(null);
            return;
          }
        }
        
        // Fallback to mock data if no real data found
        throw new Error('No telemetry data found');
      } catch (err) {
        console.error('Telemetry fetch error:', err);
        setError('Telemetry unavailable');
        setIsConnected(false);
        
        // Generate mock data for demonstration
        const mockData: VehicleData = {
          id: vehicleId,
          name: "Driver Vehicle",
          plate: "TR-001",
          type: "truck",
          driver: "John Smith",
          location: "NH-44, Sultanpur",
          coordinates: locationCoordinates["NH-44, Sultanpur"],
          sensor: {
            speed: 25 + Math.random() * 15,
            safeSpeed: 35,
            slope: Math.random() * 10 - 5,
            gripCoefficient: 0.7 + Math.random() * 0.2,
            load: 300 + Math.random() * 200,
            throttle: 50 + Math.random() * 40,
            deceleration: Math.random() * 2,
            brakingDistance: 20 + Math.random() * 30,
            status: "safe",
            timestamp: Date.now(),
          },
        };
        setVehicle(mockData);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);

    return () => clearInterval(interval);
  }, [vehicleId]);

  return { vehicle, isConnected, error };
}
