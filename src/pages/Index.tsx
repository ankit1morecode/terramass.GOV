import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { DriverRoster } from "@/components/DriverRoster";
import { Shield, AlertTriangle, Truck, Activity, Calculator, LogOut, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminSession, driverApi, type DriverProfile } from "@/lib/driver-api";

const Index = () => {
  const { fleet, history } = useRealtimeData(2500);
  const { liveVehicles } = useMqttTelemetry();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const handleSelect = (v: VehicleData) => setSelectedId(v.id);
  const navigate = useNavigate();
  const [savedDrivers, setSavedDrivers] = useState<DriverProfile[]>([]);

  const fetchDrivers = useCallback(async () => {
    try {
      setSavedDrivers(await driverApi.list());
    } catch {
      // transient; next poll retries
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 15000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  const handleLogout = () => {
    adminSession.clear();
    navigate("/", { replace: true });
  };

  // Merge saved drivers into fleet
  const mergedFleet = useMemo(() => {
    const driverVehicles: VehicleData[] = savedDrivers.map((d, i) => ({
      id: `SAVED-${d.id.slice(0, 8)}`,
      name: d.vehicle_name || `${d.display_name}'s Vehicle`,
      plate: d.vehicle_plate || "N/A",
      type: (d.vehicle_type as VehicleData["type"]) || "truck",
      driver: d.display_name,
      location: fleet[i % Math.max(fleet.length, 1)]?.location || "Mumbai",
      coordinates: fleet[i % Math.max(fleet.length, 1)]?.coordinates ?? [19.07, 72.88],
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">TerraMass<span className="text-primary">.GOV</span></h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Fleet Command</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <MQTTStatus />
            <span className="hidden md:inline text-xs text-muted-foreground font-mono">{mergedFleet.length} vehicles online</span>
            <Link to="/map" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors">
              <Map className="h-3.5 w-3.5" />
              Fleet Map
            </Link>
            <Link to="/calculator" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors">
              <Calculator className="h-3.5 w-3.5" />
              Calculator
            </Link>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-xs text-muted-foreground">
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 fade-up">
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

        {/* Drivers + Messaging */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DriverRoster drivers={savedDrivers} onChange={fetchDrivers} />
          <DriverMessagePanel drivers={savedDrivers} />
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
