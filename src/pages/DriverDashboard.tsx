import { useState, useEffect, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSingleDriverTelemetry } from "@/hooks/useSingleDriverTelemetry";
import { SpeedometerGauge } from "@/components/SpeedometerGauge";
import FleetMap from "@/components/FleetMap";
import {
  Gauge, Mountain, Grip, Weight, ArrowDownCircle, RulerIcon,
  ShieldCheck, Truck, LogOut, MessageSquare, Wifi, WifiOff, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { driverApi, driverSession, type DriverMessage } from "@/lib/driver-api";
import { Truck3D } from "@/components/three/Truck3D";
import type { SpeedStatus } from "@/lib/physics";

/** Bridge telemetry sends "SAFE"/"WARNING"/…; the UI expects lowercase. */
const normalizeStatus = (s: string): SpeedStatus => {
  const v = s?.toLowerCase();
  return v === "warning" || v === "critical" ? v : "safe";
};

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driverDetails] = useState(() => driverSession.driver());
  const { vehicle, isConnected, error } = useSingleDriverTelemetry(driverDetails?.vehicle_name || "TRAILER_1");
  const [messages, setMessages] = useState<DriverMessage[]>([]);

  // Fetch messages for this driver
  useEffect(() => {
    if (!driverDetails) return;
    const fetchMessages = async () => {
      try {
        setMessages(await driverApi.messages(driverDetails.id));
      } catch (err) {
        // Session expired or revoked → back to login
        if (err instanceof Error && err.message === "Unauthorized") navigate("/driver", { replace: true });
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [driverDetails, navigate]);

  const unreadCount = messages.filter((m) => !m.read).length;

  const markAllRead = async () => {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    try {
      await driverApi.markRead();
    } catch {
      // next poll restores true state
    }
  };

  const handleLogout = () => {
    driverSession.clear();
    navigate("/driver", { replace: true });
  };

  // Safety score
  const safetyScore = useMemo(() => {
    if (!vehicle) return 100;
    const ratio = vehicle.sensor.speed / vehicle.sensor.safeSpeed;
    if (ratio > 0.95) return Math.max(0, Math.round(100 - (ratio - 0.95) * 500));
    if (ratio > 0.8) return Math.round(85 - (ratio - 0.8) * 100);
    return Math.round(95 + Math.random() * 5);
  }, [vehicle]);

  if (!driverDetails) return <Navigate to="/driver" replace />;

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vehicle telemetry...</p>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  const { sensor } = vehicle;

  const sensorCards = [
    { icon: Mountain, label: "Slope", value: `${sensor.slope.toFixed(2)}°`, color: "text-info" },
    { icon: Grip, label: "Grip Coeff.", value: sensor.gripCoefficient.toFixed(2), color: "text-primary" },
    { icon: Weight, label: "Load", value: `${(sensor.load / 1000).toFixed(2)}t`, color: "text-warning" },
    { icon: ArrowDownCircle, label: "Deceleration", value: `${sensor.deceleration.toFixed(2)} m/s²`, color: "text-accent" },
    { icon: RulerIcon, label: "Braking Dist.", value: `${sensor.brakingDistance.toFixed(2)}m`, color: sensor.brakingDistance > 50 ? "text-destructive" : "text-success" },
    { icon: Gauge, label: "Throttle", value: `${sensor.throttle.toFixed(2)}%`, color: "text-primary" },
  ];

  const scoreColor =
    safetyScore >= 85
      ? "hsl(var(--success))"
      : safetyScore >= 60
      ? "hsl(var(--warning))"
      : "hsl(var(--destructive))";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Truck className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">{driverDetails.vehicle_name || vehicle.name}</h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              {driverDetails.vehicle_plate || vehicle.plate} · {driverDetails.display_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${isConnected ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'LIVE DATA' : 'OFFLINE'}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-6xl mx-auto">
        {/* Top row: Speedometer + Safety Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SpeedometerGauge sensor={sensor} />
          </div>
          <div className="card-glass rounded-lg p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Safety Score
            </h3>
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(safetyScore / 100) * 264} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-mono font-bold" style={{ color: scoreColor }}>
                  {safetyScore}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              <span className="text-xs text-muted-foreground">
                {safetyScore >= 85 ? "Excellent" : safetyScore >= 60 ? "Needs improvement" : "Critical"}
              </span>
            </div>
          </div>
        </div>

        {/* Sensor cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {sensorCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card-glass rounded-lg p-3 text-center">
              <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
              <div className="text-[10px] text-muted-foreground">{label}</div>
              <div className="text-sm font-mono font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>

        {/* Live 3D view */}
        <div className="card-glass rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Live 3D View</h3>
            <span className="text-[10px] font-mono text-muted-foreground">
              slope {sensor.slope.toFixed(1)}° · µ {sensor.gripCoefficient.toFixed(2)} · {(sensor.load / 1000).toFixed(1)} t
            </span>
          </div>
          <Truck3D
            className="h-[280px] sm:h-[360px]"
            speed={sensor.speed}
            slope={sensor.slope}
            grip={sensor.gripCoefficient}
            load={sensor.load}
            brakingDistance={sensor.brakingDistance}
            status={normalizeStatus(sensor.status)}
          />
        </div>

        {/* Braking & Road Warnings */}
        <div className="card-glass rounded-lg p-4 border-l-4 border-warning h-[120px] overflow-hidden">
          <h3 className="text-sm font-bold text-warning uppercase mb-2">⚠ Road Warnings</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            {sensor.brakingDistance > 50 ? (
              <p>Braking distance is <strong className="text-destructive">{sensor.brakingDistance}m</strong> — exceeds 50m safety threshold. Reduce speed.</p>
            ) : (
              <p>Braking distance: <strong className="text-success">{sensor.brakingDistance}m</strong> — within safe limits.</p>
            )}
            {sensor.slope > 15 ? (
              <p>Steep slope detected: <strong className="text-warning">{sensor.slope}°</strong>. Use engine braking.</p>
            ) : (
              <p>Slope: <strong className="text-foreground">{sensor.slope}°</strong> — normal.</p>
            )}
            {sensor.gripCoefficient < 0.4 ? (
              <p>Low grip coefficient: <strong className="text-warning">{sensor.gripCoefficient}</strong>. Road surface is slippery.</p>
            ) : (
              <p>Grip: <strong className="text-foreground">{sensor.gripCoefficient}</strong> — adequate traction.</p>
            )}
          </div>
        </div>

        {/* Map + Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FleetMap
            vehicles={[vehicle]}
            onSelect={() => {}}
            selectedId={vehicle.id}
          />
          <div className="card-glass rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Messages from Admin
              </h3>
              {unreadCount > 0 && (
                <>
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                  <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={markAllRead}>
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark read
                  </Button>
                </>
              )}
            </div>
            <ScrollArea className="h-52">
              {messages.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground text-center">No messages yet</p>
              ) : (
                <div className="p-2 space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded text-xs ${
                        msg.read ? "bg-secondary/30" : "bg-primary/10 border border-primary/30"
                      }`}
                    >
                      <p className="text-foreground break-words">{msg.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
