import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Shield, Settings, Plus } from "lucide-react";
import type { Driver } from "@/components/DriverManagement";

const DEFAULT_CREDENTIALS = {
  "driver001": {
    password: "terra123",
    name: "John Smith",
    vehicle: "TRAILER_1",
    plate: "TR-001",
    type: "truck"
  }
};

export default function DriverLogin() {
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [savedDrivers, setSavedDrivers] = useState<Driver[]>([]);
  const navigate = useNavigate();

  // Load saved drivers from localStorage
  useEffect(() => {
    const savedDriversData = localStorage.getItem("saved_drivers");
    if (savedDriversData) {
      try {
        const parsed = JSON.parse(savedDriversData);
        setSavedDrivers(parsed);
      } catch (error) {
        console.error("Failed to load saved drivers:", error);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check default credentials first
    const defaultDriver = DEFAULT_CREDENTIALS[driverId as keyof typeof DEFAULT_CREDENTIALS];
    
    if (defaultDriver && defaultDriver.password === password) {
      // Store driver details in localStorage
      localStorage.setItem("driver_details", JSON.stringify({
        id: driverId,
        display_name: defaultDriver.name,
        vehicle_name: defaultDriver.vehicle,
        vehicle_plate: defaultDriver.plate,
        vehicle_type: defaultDriver.type
      }));
      
      navigate("/driver/dashboard");
      return;
    }

    // Check saved drivers (password is driver ID for saved drivers)
    const savedDriver = savedDrivers.find(d => d.id === driverId);
    
    if (savedDriver && password === driverId) {
      // Store driver details in localStorage
      localStorage.setItem("driver_details", JSON.stringify({
        id: savedDriver.id,
        display_name: savedDriver.name,
        vehicle_name: savedDriver.vehicle,
        vehicle_plate: savedDriver.plate,
        vehicle_type: savedDriver.type
      }));
      
      navigate("/driver/dashboard");
      return;
    }

    setError("Invalid driver ID or password");
  };

  const handleDriverSelect = (selectedDriverId: string) => {
    setDriverId(selectedDriverId);
    // For saved drivers, password is the driver ID
    setPassword(selectedDriverId);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Driver Portal</CardTitle>
          <p className="text-muted-foreground">Enter your credentials to access dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="driverId" className="text-sm font-medium">
                Driver ID
              </label>
              {savedDrivers.length > 0 && (
                <Select onValueChange={handleDriverSelect} value={driverId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select saved driver or enter ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} - {driver.vehicle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                id="driverId"
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="Enter driver ID"
                className="mt-2"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Login to Dashboard
            </Button>
          </form>
          
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Default Credentials:</h4>
              <div className="text-xs space-y-1 font-mono">
                <div>Driver ID: <span className="text-primary">driver001</span></div>
                <div>Password: <span className="text-primary">terra123</span></div>
              </div>
            </div>

            {savedDrivers.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Saved Drivers:</h4>
                <div className="text-xs space-y-1">
                  <div className="text-muted-foreground">For saved drivers, use driver ID as password</div>
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/driver/manage")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Drivers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
