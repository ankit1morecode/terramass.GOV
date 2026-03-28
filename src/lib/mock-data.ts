import { useState, useEffect, useCallback } from "react";

// Simulated real-time sensor data
export interface SensorData {
  speed: number;
  safeSpeed: number;
  slope: number;
  gripCoefficient: number;
  load: number;
  throttle: number;
  deceleration: number;
  brakingDistance: number;
  status: "safe" | "warning" | "critical";
  timestamp: number;
}

export interface VehicleData {
  id: string;
  name: string;
  plate: string;
  type: "truck" | "mining" | "municipal" | "fleet";
  sensor: SensorData;
  location: string;
  driver: string;
  coordinates: [number, number]; // [lat, lng]
}

export const generateSensorData = (): SensorData => {
  const slope = parseFloat((Math.random() * 30 - 5).toFixed(1));
  const gripCoefficient = parseFloat((0.3 + Math.random() * 0.5).toFixed(2));
  const load = parseFloat((2000 + Math.random() * 18000).toFixed(0));
  const safeSpeed = parseFloat((20 + Math.random() * 60).toFixed(1));
  const speed = parseFloat((safeSpeed * (0.6 + Math.random() * 0.5)).toFixed(1));
  const throttle = parseFloat((Math.random() * 100).toFixed(0));
  const g = 9.81;
  const theta = (slope * Math.PI) / 180;
  const deceleration = parseFloat((g * (gripCoefficient * Math.cos(theta) - Math.sin(theta))).toFixed(2));
  const brakingDistance = speed > 0 ? parseFloat(((speed * speed) / (2 * Math.abs(deceleration) || 1)).toFixed(1)) : 0;

  const ratio = speed / safeSpeed;
  const status: SensorData["status"] = ratio > 0.95 ? "critical" : ratio > 0.8 ? "warning" : "safe";

  return { speed, safeSpeed, slope, gripCoefficient, load, throttle, deceleration, brakingDistance, status, timestamp: Date.now() };
};

const vehicleNames = [
  { name: "Tata LPT 3518", plate: "UP-65-AB-1234", type: "truck" as const, location: "NH-44, Sultanpur", driver: "Rajesh Kumar", coordinates: [26.26, 82.07] as [number, number] },
  { name: "Ashok Leyland 4825", plate: "UP-65-CD-5678", type: "truck" as const, location: "SH-12, Amethi", driver: "Sunil Verma", coordinates: [26.15, 81.81] as [number, number] },
  { name: "BharatBenz 2823R", plate: "UP-65-EF-9012", type: "fleet" as const, location: "NH-56, Lucknow", driver: "Amit Singh", coordinates: [26.85, 80.95] as [number, number] },
  { name: "CAT 775G Mining", plate: "JH-01-GH-3456", type: "mining" as const, location: "Dhanbad Mine-7", driver: "Vikram Yadav", coordinates: [23.79, 86.43] as [number, number] },
  { name: "Volvo FM 420", plate: "MH-12-IJ-7890", type: "fleet" as const, location: "Mumbai-Pune Exp", driver: "Pramod Joshi", coordinates: [18.99, 73.31] as [number, number] },
  { name: "Eicher Pro 6049", plate: "UP-65-KL-2345", type: "municipal" as const, location: "Sultanpur City", driver: "Rahul Mishra", coordinates: [26.27, 82.07] as [number, number] },
  { name: "Mahindra Blazo X35", plate: "RJ-14-MN-6789", type: "truck" as const, location: "NH-48, Jaipur", driver: "Deepak Sharma", coordinates: [26.92, 75.78] as [number, number] },
  { name: "Tata Signa 4825.TK", plate: "GJ-01-OP-0123", type: "fleet" as const, location: "NH-8, Ahmedabad", driver: "Karan Patel", coordinates: [23.02, 72.57] as [number, number] },
];

export const generateFleetData = (): VehicleData[] =>
  vehicleNames.map((v, i) => ({
    id: `VEH-${String(i + 1).padStart(3, "0")}`,
    ...v,
    sensor: generateSensorData(),
  }));

export const useRealtimeData = (intervalMs = 2000) => {
  const [fleet, setFleet] = useState<VehicleData[]>(generateFleetData());
  const [history, setHistory] = useState<{ time: string; avgSpeed: number; avgSafe: number; alerts: number }[]>([]);

  const refresh = useCallback(() => {
    const newFleet = generateFleetData();
    setFleet(newFleet);
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    const avgSpeed = parseFloat((newFleet.reduce((s, v) => s + v.sensor.speed, 0) / newFleet.length).toFixed(1));
    const avgSafe = parseFloat((newFleet.reduce((s, v) => s + v.sensor.safeSpeed, 0) / newFleet.length).toFixed(1));
    const alerts = newFleet.filter((v) => v.sensor.status !== "safe").length;
    setHistory((h) => [...h.slice(-19), { time, avgSpeed, avgSafe, alerts }]);
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { fleet, history };
};
