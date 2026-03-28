import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRealtimeData, type VehicleData, generateSensorData } from "@/lib/mock-data";
import { useMqttTelemetry } from "@/hooks/useMqttTelemetry";
import FleetMap from "@/components/FleetMap";
import { VehicleDetail } from "@/components/VehicleDetail";
import { Shield, ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface RegisteredDriver {
  user_id: string;
  display_name: string | null;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  vehicle_type: string | null;
}

const FleetMapPage = () => {
  const { fleet } = useRealtimeData(2500);
  const { liveVehicles, isConnected, error } = useMqttTelemetry();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const handleSelect = (v: VehicleData) => setSelectedId(v.id);
  const { signOut } = useAuth();
  const [registeredDrivers, setRegisteredDrivers] = useState<RegisteredDriver[]>([]);

  useEffect(() => {
  const fetchDrivers = async () => {
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "driver");

    if (roleError) {
      console.error("Role fetch error:", roleError);
      return;
    }

    if (!roleData || roleData.length === 0) return;

    const driverIds = roleData.map((r) => r.user_id);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, display_name, vehicle_name, vehicle_plate, vehicle_type")
      .in("user_id", driverIds);

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return;
    }

    if (profileData) setRegisteredDrivers(profileData as RegisteredDriver[]);
  };

  fetchDrivers();
  const interval = setInterval(fetchDrivers, 30000);
  return () => clearInterval(interval);
}, []);

  const mergedFleet = useMemo(() => {
    const driverVehicles: VehicleData[] = registeredDrivers.map((d, i) => ({
      id: `REG-${d.user_id.slice(0, 8)}`,
      name: d.vehicle_name || `${d.display_name || "Driver"}'s Vehicle`,
      plate: d.vehicle_plate || "N/A",
      type: (d.vehicle_type as VehicleData["type"]) || "truck",
      driver: d.display_name || "Unknown",
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
  }, [fleet, registeredDrivers, liveVehicles]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return mergedFleet.find((v) => v.id === selectedId) || null;
  }, [selectedId, mergedFleet]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Fleet Map</h1>
              <p className="text-xs text-muted-foreground">{mergedFleet.length} vehicles online</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        <FleetMap vehicles={mergedFleet} onSelect={handleSelect} selectedId={selectedId ?? undefined} />

        {selected && (
          <VehicleDetail vehicle={selected} onClose={() => setSelectedId(null)} />
        )}
      </main>
    </div>
  );
};

export default FleetMapPage;
