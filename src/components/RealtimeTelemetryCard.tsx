import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMqttTelemetry } from "@/hooks/useMqttTelemetry";
import { Wifi, WifiOff, AlertTriangle, Activity } from "lucide-react";
import { useEffect, useState } from "react";

export const RealtimeTelemetryCard = () => {
  const { liveVehicles, isConnected, error } = useMqttTelemetry();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (liveVehicles.length > 0) {
      const latest = liveVehicles.reduce((latest, vehicle) => {
        const vehicleTime = new Date(vehicle.sensor.timestamp);
        return vehicleTime > latest ? vehicleTime : latest;
      }, new Date(0));
      setLastUpdate(latest);
    }
  }, [liveVehicles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe": return "bg-success/15 text-success border-success/30";
      case "warning": return "bg-warning/15 text-warning border-warning/30";
      case "critical": return "bg-destructive/15 text-destructive border-destructive/30";
      default: return "bg-muted/15 text-muted-foreground border-muted/30";
    }
  };

  const avgSpeed = liveVehicles.length > 0 
    ? (liveVehicles.reduce((sum, v) => sum + v.sensor.speed, 0) / liveVehicles.length).toFixed(1)
    : "0";

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Real-time Telemetry</CardTitle>
        <div className="flex items-center gap-2">
          {error ? (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              Error
            </Badge>
          ) : isConnected ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1 text-xs">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border gap-1 text-xs">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{liveVehicles.length}</div>
            <p className="text-xs text-muted-foreground">Active Vehicles</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">{avgSpeed}</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Speed (km/h)</p>
          </div>

          {lastUpdate && (
            <div className="text-xs text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}

          {liveVehicles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Vehicle Status</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(
                  liveVehicles.reduce((acc, v) => {
                    acc[v.sensor.status] = (acc[v.sensor.status] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([status, count]) => (
                  <Badge key={status} variant="outline" className={`text-xs ${getStatusColor(status)}`}>
                    {status.toUpperCase()}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
