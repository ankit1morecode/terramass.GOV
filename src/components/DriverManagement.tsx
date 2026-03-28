import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Save, Plus, User } from "lucide-react";

export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  type: "truck" | "mining" | "municipal" | "fleet";
  phone?: string;
  email?: string;
  licenseNumber?: string;
  isTest?: boolean;
}

const TEST_DRIVERS: Driver[] = [
  {
    id: "test001",
    name: "Test Driver 1",
    vehicle: "TRAILER_1",
    plate: "TR-001",
    type: "truck",
    phone: "+91-9876543210",
    email: "test1@terrakargo.com",
    licenseNumber: "DL-TEST-001",
    isTest: true,
  },
  {
    id: "test002", 
    name: "Test Driver 2",
    vehicle: "TRAILER_2",
    plate: "TR-002",
    type: "fleet",
    phone: "+91-9876543211",
    email: "test2@terrakargo.com",
    licenseNumber: "DL-TEST-002",
    isTest: true,
  },
];

export const DriverManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<Partial<Driver>>({
    name: "",
    vehicle: "",
    plate: "",
    type: "truck",
    phone: "",
    email: "",
    licenseNumber: "",
  });

  // Load drivers from localStorage on mount
  useEffect(() => {
    const savedDrivers = localStorage.getItem("saved_drivers");
    if (savedDrivers) {
      try {
        const parsed = JSON.parse(savedDrivers);
        setDrivers([...parsed, ...TEST_DRIVERS]);
      } catch (error) {
        console.error("Failed to load saved drivers:", error);
        setDrivers(TEST_DRIVERS);
      }
    } else {
      setDrivers(TEST_DRIVERS);
    }
  }, []);

  // Save drivers to localStorage whenever they change
  useEffect(() => {
    const nonTestDrivers = drivers.filter(d => !d.isTest);
    localStorage.setItem("saved_drivers", JSON.stringify(nonTestDrivers));
  }, [drivers]);

  const handleSaveDriver = () => {
    if (!formData.name || !formData.vehicle || !formData.plate) {
      alert("Please fill in all required fields (Name, Vehicle, Plate)");
      return;
    }

    if (editingDriver) {
      // Update existing driver
      setDrivers(drivers.map(d => 
        d.id === editingDriver.id 
          ? { ...d, ...formData, id: editingDriver.id }
          : d
      ));
      setEditingDriver(null);
    } else {
      // Add new driver
      const newDriver: Driver = {
        id: `driver_${Date.now()}`,
        name: formData.name!,
        vehicle: formData.vehicle!,
        plate: formData.plate!,
        type: formData.type as Driver["type"],
        phone: formData.phone,
        email: formData.email,
        licenseNumber: formData.licenseNumber,
      };
      setDrivers([...drivers, newDriver]);
    }

    // Reset form
    setFormData({
      name: "",
      vehicle: "",
      plate: "",
      type: "truck",
      phone: "",
      email: "",
      licenseNumber: "",
    });
  };

  const handleEditDriver = (driver: Driver) => {
    if (driver.isTest) {
      alert("Test drivers cannot be edited");
      return;
    }
    setEditingDriver(driver);
    setFormData(driver);
  };

  const handleDeleteDriver = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver?.isTest) {
      alert("Test drivers cannot be deleted");
      return;
    }
    setDrivers(drivers.filter(d => d.id !== driverId));
  };

  const handleAddTestDriver = (testDriver: Driver) => {
    // Create a copy of test driver without isTest flag
    const newDriver = { ...testDriver, id: `driver_${Date.now()}`, isTest: false };
    setDrivers([...drivers, newDriver]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Add/Edit Driver Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {editingDriver ? "Edit Driver" : "Add New Driver"}
          </CardTitle>
          <CardDescription>
            {editingDriver ? "Update driver information" : "Create a new driver profile"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Driver Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter driver name"
              />
            </div>
            <div>
              <Label htmlFor="vehicle">Vehicle Name *</Label>
              <Input
                id="vehicle"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                placeholder="e.g., TRAILER_1"
              />
            </div>
            <div>
              <Label htmlFor="plate">Vehicle Plate *</Label>
              <Input
                id="plate"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                placeholder="e.g., TR-001"
              />
            </div>
            <div>
              <Label htmlFor="type">Vehicle Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Driver["type"] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="mining">Mining</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="fleet">Fleet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91-9876543210"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="driver@example.com"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="DL-1234567890"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveDriver}>
              <Save className="h-4 w-4 mr-2" />
              {editingDriver ? "Update Driver" : "Save Driver"}
            </Button>
            {editingDriver && (
              <Button variant="outline" onClick={() => {
                setEditingDriver(null);
                setFormData({
                  name: "",
                  vehicle: "",
                  plate: "",
                  type: "truck",
                  phone: "",
                  email: "",
                  licenseNumber: "",
                });
              }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Drivers Section */}
      <Card>
        <CardHeader>
          <CardTitle>Test Drivers</CardTitle>
          <CardDescription>Quickly add pre-configured test drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEST_DRIVERS.map((testDriver) => (
              <div key={testDriver.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{testDriver.name}</div>
                  <div className="text-sm text-muted-foreground">{testDriver.vehicle} · {testDriver.plate}</div>
                </div>
                <Button size="sm" onClick={() => handleAddTestDriver(testDriver)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Use
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Saved Drivers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Drivers ({drivers.length})</CardTitle>
          <CardDescription>Manage your driver database</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {drivers.map((driver) => (
                <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{driver.name}</span>
                      {driver.isTest && <Badge variant="secondary">Test</Badge>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <span>Vehicle: {driver.vehicle}</span>
                      <span>Plate: {driver.plate}</span>
                      <span>Type: {driver.type}</span>
                      {driver.phone && <span>📱 {driver.phone}</span>}
                    </div>
                    {driver.email && <div className="text-sm text-muted-foreground">📧 {driver.email}</div>}
                    {driver.licenseNumber && <div className="text-sm text-muted-foreground">🪪 {driver.licenseNumber}</div>}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleEditDriver(driver)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteDriver(driver.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
