import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Shield, User, Hash, Car, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const Welcome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [driverName, setDriverName] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("truck");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  // ✅ SAVE DRIVER (DIRECT SUPABASE)
  const handleSave = async () => {
    if (!driverName.trim()) {
      toast({ title: "Driver name is required", variant: "destructive" });
      return;
    }

    if (!password.trim() || password.length < 4) {
      toast({ title: "Password must be at least 4 characters", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("drivers").insert({
      display_name: driverName.trim(),
      vehicle_name: vehicleName.trim() || "My Vehicle",
      vehicle_plate: vehiclePlate.trim() || "XX-00-XX-0000",
      vehicle_type: vehicleType,
      password: password,
    });

    if (error) {
      console.error(error);
      toast({
        title: "Failed to save driver",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Driver saved successfully!" });

      // reset form
      setDriverName("");
      setVehicleName("");
      setVehiclePlate("");
      setVehicleType("truck");
      setPassword("");
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            TerraMass<span className="text-primary">.GOV</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Terrain-Mass-Grip Velocity Governance
          </p>
        </div>

        <div className="card-glass rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Add New Driver
          </h2>

          <div className="space-y-4">
            <Input placeholder="Driver Name" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
            <Input placeholder="Vehicle Name" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} />
            <Input placeholder="Vehicle Plate" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />

            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="mining">Mining</SelectItem>
                <SelectItem value="municipal">Municipal</SelectItem>
                <SelectItem value="fleet">Fleet</SelectItem>
              </SelectContent>
            </Select>

            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Driver"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => navigate("/driver")}>Driver Dashboard</Button>
          <Button variant="secondary" onClick={() => setShowAdminDialog(true)}>
            Admin Dashboard
          </Button>
        </div>

        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Admin Access</DialogTitle>
            </DialogHeader>

            <Input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />

            <Button
              onClick={() => {
                if (adminPassword === "terramass@ankit") {
                  sessionStorage.setItem("admin_verified", "true");
                  navigate("/admin");
                } else {
                  toast({ title: "Incorrect password", variant: "destructive" });
                }
              }}
            >
              Access Admin Dashboard
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Welcome;