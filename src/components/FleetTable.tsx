import type { VehicleData } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Truck, HardHat, Bus, Container, Wifi, WifiOff } from "lucide-react";

interface FleetTableProps {
  vehicles: VehicleData[];
  onSelect: (v: VehicleData) => void;
  selectedId?: string;
  liveIds?: Set<string>;
}

const typeIcons = {
  truck: Truck,
  mining: HardHat,
  municipal: Bus,
  fleet: Container,
};

const statusBadge = {
  safe: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

export const FleetTable = ({ vehicles, onSelect, selectedId, liveIds }: FleetTableProps) => (
  <div className="card-glass rounded-lg overflow-hidden">
    <div className="p-4 border-b border-border">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Fleet Monitoring</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-3 font-medium">Vehicle</th>
            <th className="text-center p-3 font-medium">Source</th>
            <th className="text-left p-3 font-medium">Driver</th>
            <th className="text-right p-3 font-medium">Speed</th>
            <th className="text-right p-3 font-medium">Safe Limit</th>
            <th className="text-right p-3 font-medium">Slope</th>
            <th className="text-right p-3 font-medium">Grip (µ)</th>
            <th className="text-right p-3 font-medium">Load</th>
            <th className="text-center p-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => {
            const Icon = typeIcons[v.type] || Container;
            const isLive = liveIds?.has(v.id) ?? false;
            return (
              <tr
                key={v.id}
                onClick={() => onSelect(v)}
                className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-secondary/50 ${selectedId === v.id ? "bg-secondary/80" : ""}`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">{v.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{v.plate}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  {isLive ? (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 gap-1">
                      <Wifi className="h-3 w-3" /> LIVE
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-border gap-1">
                      <WifiOff className="h-3 w-3" /> SIM
                    </Badge>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{v.driver}</td>
                <td className="p-3 text-right font-mono font-semibold text-foreground">{v.sensor.speed.toFixed(2)} <span className="text-xs text-muted-foreground">km/h</span></td>
                <td className="p-3 text-right font-mono text-primary">{v.sensor.safeSpeed.toFixed(2)} <span className="text-xs text-muted-foreground">km/h</span></td>
                <td className="p-3 text-right font-mono">{v.sensor.slope.toFixed(2)}°</td>
                <td className="p-3 text-right font-mono">{v.sensor.gripCoefficient.toFixed(2)}</td>
                <td className="p-3 text-right font-mono">{(v.sensor.load / 1000).toFixed(2)} <span className="text-xs text-muted-foreground">t</span></td>
                <td className="p-3 text-center">
                  <Badge variant="outline" className={`text-xs ${statusBadge[v.sensor.status]}`}>
                    {v.sensor.status === "safe" ? "SAFE" : v.sensor.status === "warning" ? "WARN" : "CRIT"}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
