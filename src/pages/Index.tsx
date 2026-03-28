import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useRealtimeData, type VehicleData, generateSensorData } from "@/lib/mock-data";
import { useMqttTelemetry } from "@/hooks/useMqttTelemetry";
import { SensorCard } from "@/components/SensorCard";
import { SpeedChart } from "@/components/SpeedChart";
import { FleetTable } from "@/components/FleetTable";
import { VehicleDetail } from "@/components/VehicleDetail";
import { AlertChart } from "@/components/AlertChart";
import { MQTTStatus } from "@/components/MQTTStatus";
import { RealtimeTelemetryCard } from "@/components/RealtimeTelemetryCard";
import { DriverMessagePanel } from "@/components/DriverMessagePanel";
import { Shield, AlertTriangle, Truck, Activity, Calculator, ArrowLeft, Map, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SavedDriver {
  id: string;
  display_name: string;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  vehicle_type: string | null;
}

const Index = () => {
  const { fleet, history } = useRealtimeData(2500);
  const { liveVehicles, isConnected, error } = useMqttTelemetry();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const handleSelect = (v: VehicleData) => setSelectedId(v.id);
  const navigate = useNavigate();
  const prevFleetRef = useRef<VehicleData[]>([]);
  const [savedDrivers, setSavedDrivers] = useState<SavedDriver[]>([]);
  // Fetch saved drivers from DB
  useEffect(() => {
    const fetchDrivers = async () => {
      const { data } = await supabase
        .from("drivers")
        .select("id, display_name, vehicle_name, vehicle_plate, vehicle_type")
        .order("created_at", { ascending: false });
      if (data) setSavedDrivers(data);
    };
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 15000);
    return () => clearInterval(interval);
  }, []);




  // Merge saved drivers into fleet
  const mergedFleet = useMemo(() => {
    const driverVehicles: VehicleData[] = savedDrivers.map((d, i) => ({
      id: `SAVED-${d.id.slice(0, 8)}`,
      name: d.vehicle_name || `${d.display_name}'s Vehicle`,
      plate: d.vehicle_plate || "N/A",
      type: (d.vehicle_type as VehicleData["type"]) || "truck",
      driver: d.display_name,
      location: fleet[i % Math.max(fleet.length, 1)]?.location || "Mumbai",
      sensor: generateSensorData(),
    }));
    const allVehicles = [...liveVehicles];
    for (const v of fleet) {
      if (!allVehicles.find((mv) => mv.id === v.id)) allVehicles.push(v);
    }
    for (const v of driverVehicles) {
      if (!allVehicles.find((mv) => mv.id === v.id)) allVehicles.push(v);
    }
    return allVehicles;
  }, [fleet, savedDrivers, liveVehicles]);

  // Keep selected vehicle in sync with live data
  const selected = useMemo(() => {
    if (!selectedId) return null;
    return mergedFleet.find((v) => v.id === selectedId) || null;
  }, [selectedId, mergedFleet]);

  // Alerts logging removed (no auth)

  const safeCount = mergedFleet.filter((v) => v.sensor.status === "safe").length;
  const warnCount = mergedFleet.filter((v) => v.sensor.status === "warning").length;
  const critCount = mergedFleet.filter((v) => v.sensor.status === "critical").length;
  const avgSpeed = mergedFleet.length > 0 ? (mergedFleet.reduce((s, v) => s + v.sensor.speed, 0) / mergedFleet.length).toFixed(1) : "0";

  // Guard: must have verified admin password
  if (sessionStorage.getItem("admin_verified") !== "true") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">TerraMass<span className="text-primary">.GOV</span></h1>
              <p className="text-xs text-muted-foreground">Terrain-Mass-Grip Velocity Governance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MQTTStatus />
            <span className="text-xs text-muted-foreground font-mono">{mergedFleet.length} vehicles online</span>
            <Link to="/map" className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
              <Map className="h-3.5 w-3.5" />
              Fleet Map
            </Link>
            <Link to="/calculator" className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
              <Calculator className="h-3.5 w-3.5" />
              Calculator
            </Link>
            <Button size="sm" variant="ghost" onClick={() => navigate("/")} className="text-xs text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card-glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Fleet</span>
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <span className="text-3xl font-mono font-bold text-foreground">{mergedFleet.length}</span>
          </div>
          <div className="card-glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Speed</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-bold text-foreground">{avgSpeed}</span>
              <span className="text-xs text-muted-foreground">km/h</span>
            </div>
          </div>
          <div className="card-glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Warnings</span>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-warning">{warnCount}</span>
              <span className="text-xs text-destructive font-mono font-bold">{critCount} critical</span>
            </div>
          </div>
          <div className="card-glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Safe Vehicles</span>
              <Shield className="h-4 w-4 text-success" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-bold text-success">{safeCount}</span>
              <span className="text-xs text-muted-foreground">/ {mergedFleet.length}</span>
            </div>
          </div>
          <RealtimeTelemetryCard />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SpeedChart data={history} />
          </div>
          <AlertChart data={history} />
        </div>

        {/* Saved Drivers + Messaging */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-glass rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Saved Drivers ({savedDrivers.length})
              </h3>
            </div>
            <div className="p-2 max-h-52 overflow-y-auto space-y-1">
              {savedDrivers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No drivers saved yet</p>
              ) : (
                savedDrivers.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent/30 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{d.display_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{d.vehicle_name} · {d.vehicle_plate}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DriverMessagePanel />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <FleetTable vehicles={mergedFleet} onSelect={handleSelect} selectedId={selectedId ?? undefined} liveIds={new Set(liveVehicles.map(v => v.id))} />
          </div>
          <div>
            {selected ? (
              <VehicleDetail vehicle={selected} onClose={() => setSelectedId(null)} />
            ) : (
              <div className="card-glass rounded-lg p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                <Truck className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select a vehicle from the fleet table to view detailed sensor data</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Index;
