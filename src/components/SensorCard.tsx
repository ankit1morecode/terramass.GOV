import { Gauge, Mountain, Grip, Weight, Thermometer, AlertTriangle, Truck, Activity } from "lucide-react";
import type { SensorData } from "@/lib/mock-data";

interface SensorCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: "speed" | "slope" | "grip" | "load" | "throttle" | "braking" | "deceleration" | "status";
  status?: SensorData["status"];
}

const iconMap = {
  speed: Gauge,
  slope: Mountain,
  grip: Grip,
  load: Weight,
  throttle: Activity,
  braking: Truck,
  deceleration: AlertTriangle,
  status: Thermometer,
};

const statusColors = {
  safe: "border-success/40 glow-success",
  warning: "border-warning/40 glow-accent",
  critical: "border-destructive/40 glow-destructive",
};

const statusIconColors = {
  safe: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
};

export const SensorCard = ({ label, value, unit, icon, status = "safe" }: SensorCardProps) => {
  const Icon = iconMap[icon];

  return (
    <div className={`card-glass rounded-lg p-4 transition-all duration-300 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`h-4 w-4 ${statusIconColors[status]}`} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-mono font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
};
