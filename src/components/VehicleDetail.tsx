import type { VehicleData } from "@/lib/mock-data";
import { SensorCard } from "./SensorCard";
import { X, MapPin } from "lucide-react";
import { Truck3D } from "./three/Truck3D";

interface VehicleDetailProps {
  vehicle: VehicleData;
  onClose: () => void;
}

export const VehicleDetail = ({ vehicle, onClose }: VehicleDetailProps) => {
  const { sensor } = vehicle;
  const speedRatio = sensor.speed / sensor.safeSpeed;
  const barColor = speedRatio > 0.95 ? "bg-destructive" : speedRatio > 0.8 ? "bg-warning" : "bg-success";

  return (
    <div className="card-glass rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{vehicle.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            {vehicle.location}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <Truck3D
        className="h-[220px] -mx-5 mb-5 border-y border-border bg-gradient-to-b from-primary/5 to-transparent"
        speed={sensor.speed}
        slope={sensor.slope}
        grip={sensor.gripCoefficient}
        load={sensor.load}
        brakingDistance={sensor.brakingDistance}
        status={sensor.status}
      />

      {/* Speed gauge bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Current: {sensor.speed} km/h</span>
          <span>Safe: {sensor.safeSpeed} km/h</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(speedRatio * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SensorCard label="Slope" value={sensor.slope.toFixed(2)} unit="°" icon="slope" status={sensor.status} />
        <SensorCard label="Road Grip (µ)" value={sensor.gripCoefficient.toFixed(2)} unit="" icon="grip" status={sensor.status} />
        <SensorCard label="Vehicle Load" value={(sensor.load / 1000).toFixed(2)} unit="tonnes" icon="load" status={sensor.status} />
        <SensorCard label="Throttle" value={sensor.throttle.toFixed(2)} unit="%" icon="throttle" status={sensor.status} />
        <SensorCard label="Deceleration" value={sensor.deceleration.toFixed(2)} unit="m/s²" icon="deceleration" status={sensor.status} />
        <SensorCard label="Braking Dist." value={sensor.brakingDistance.toFixed(2)} unit="m" icon="braking" status={sensor.status} />
      </div>
    </div>
  );
};
