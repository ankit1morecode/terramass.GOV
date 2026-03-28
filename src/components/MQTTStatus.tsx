import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMqttTelemetry } from "@/hooks/useMqttTelemetry";

export const MQTTStatus = () => {
  const { isConnected, error, liveVehicles } = useMqttTelemetry();

  if (error) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        MQTT Error
      </Badge>
    );
  }

  if (isConnected && liveVehicles.length > 0) {
    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
        <Wifi className="h-3 w-3" />
        LIVE ({liveVehicles.length})
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border gap-1">
      <WifiOff className="h-3 w-3" />
      OFFLINE
    </Badge>
  );
};
