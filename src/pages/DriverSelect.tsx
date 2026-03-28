// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Truck, Lock, ArrowLeft, User, Trash2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// interface Driver {
//   id: string;
//   display_name: string;
//   vehicle_name: string | null;
//   vehicle_plate: string | null;
//   vehicle_type: string | null;
// }

// const DRIVER_CRUD_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/driver-crud`;

// const callDriverCrud = async (payload: Record<string, unknown>) => {
//   const response = await fetch(DRIVER_CRUD_URL, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
//       Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
//     },
//     body: JSON.stringify(payload),
//   });

//   const raw = await response.text();
//   const json = raw ? JSON.parse(raw) : {};

//   if (!response.ok) {
//     throw new Error((json as { error?: string }).error || `Request failed (${response.status})`);
//   }

//   return json as { data?: unknown; error?: string; success?: boolean };
// };

// const DriverSelect = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [drivers, setDrivers] = useState<Driver[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
//   const [passwordInput, setPasswordInput] = useState("");
//   const [verifying, setVerifying] = useState(false);
//   const [deleteDriverId, setDeleteDriverId] = useState<string | null>(null);
//   const [deletePassword, setDeletePassword] = useState("");

//   useEffect(() => {
//     const fetchDrivers = async () => {
//       try {
//         const result = await callDriverCrud({ action: "list" });
//         if (Array.isArray(result.data)) {
//           setDrivers(result.data as Driver[]);
//         }
//       } catch {
//         toast({ title: "Failed to load drivers", variant: "destructive" });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDrivers();
//   }, [toast]);

//   const handleVerify = async () => {
//     if (!selectedDriver) return;
//     setVerifying(true);

//     try {
//       const result = await callDriverCrud({
//         action: "verify",
//         driver_id: selectedDriver.id,
//         driver_password: passwordInput,
//       });

//       if (result.error || !result.data) {
//         toast({ title: result.error || "Incorrect password", variant: "destructive" });
//         return;
//       }

//       localStorage.setItem("driver_details", JSON.stringify(result.data));
//       navigate("/driver/dashboard");
//     } catch (err) {
//       toast({
//         title: "Verification failed",
//         description: err instanceof Error ? err.message : "Please try again",
//         variant: "destructive",
//       });
//     } finally {
//       setVerifying(false);
//     }
//   };

//   const handleDeleteDriver = async () => {
//     if (!deleteDriverId) return;

//     try {
//       const result = await callDriverCrud({
//         action: "delete",
//         driver_id: deleteDriverId,
//         admin_password: deletePassword,
//       });

//       if (result.error) {
//         toast({ title: result.error, variant: "destructive" });
//         return;
//       }

//       setDrivers((prev) => prev.filter((d) => d.id !== deleteDriverId));
//       setDeleteDriverId(null);
//       setDeletePassword("");
//       toast({ title: "Driver removed successfully" });
//     } catch (err) {
//       toast({
//         title: "Failed to delete driver",
//         description: err instanceof Error ? err.message : "Please try again",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background flex items-center justify-center p-4">
//       <div className="w-full max-w-md space-y-6">
//         <div className="text-center space-y-2">
//           <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto">
//             <Truck className="h-8 w-8 text-primary" />
//           </div>
//           <h1 className="text-xl font-bold text-foreground">Select Driver</h1>
//           <p className="text-sm text-muted-foreground">Choose your profile to access the dashboard</p>
//         </div>

//         <div className="card-glass rounded-xl p-4 space-y-2 max-h-[400px] overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center py-8">
//               <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
//             </div>
//           ) : drivers.length === 0 ? (
//             <p className="text-sm text-muted-foreground text-center py-8">
//               No drivers registered yet. Go back and add a driver first.
//             </p>
//           ) : (
//             drivers.map((driver) => (
//               <div key={driver.id} className="flex items-center gap-2">
//                 <button
//                   onClick={() => {
//                     setSelectedDriver(driver);
//                     setPasswordInput("");
//                   }}
//                   className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
//                 >
//                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                     <User className="h-5 w-5 text-primary" />
//                   </div>
//                   <div className="min-w-0">
//                     <p className="text-sm font-medium text-foreground truncate">{driver.display_name}</p>
//                     <p className="text-[10px] text-muted-foreground truncate">
//                       {driver.vehicle_name || "No vehicle"} · {driver.vehicle_plate || "N/A"}
//                     </p>
//                   </div>
//                   <Truck className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
//                 </button>
//                 <Button
//                   size="icon"
//                   variant="ghost"
//                   className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
//                   onClick={() => {
//                     setDeleteDriverId(driver.id);
//                     setDeletePassword("");
//                   }}
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </Button>
//               </div>
//             ))
//           )}
//         </div>

//         <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
//           <ArrowLeft className="h-4 w-4 mr-2" />
//           Back to Home
//         </Button>

//         <Dialog open={!!selectedDriver} onOpenChange={(open) => !open && setSelectedDriver(null)}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2">
//                 <Lock className="h-4 w-4" />
//                 Enter Password for {selectedDriver?.display_name}
//               </DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4 pt-2">
//               <Input
//                 type="password"
//                 placeholder="Enter your password"
//                 value={passwordInput}
//                 onChange={(e) => setPasswordInput(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && handleVerify()}
//                 autoFocus
//               />
//               <Button className="w-full" onClick={handleVerify} disabled={verifying}>
//                 {verifying ? "Verifying..." : "Access Dashboard"}
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>

//         <Dialog
//           open={!!deleteDriverId}
//           onOpenChange={(open) => {
//             if (!open) {
//               setDeleteDriverId(null);
//               setDeletePassword("");
//             }
//           }}
//         >
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2">
//                 <Lock className="h-4 w-4" /> Confirm Driver Removal
//               </DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4 pt-2">
//               <p className="text-sm text-muted-foreground">Enter admin password to remove this driver and all their messages.</p>
//               <Input
//                 type="password"
//                 placeholder="Admin password"
//                 value={deletePassword}
//                 onChange={(e) => setDeletePassword(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") handleDeleteDriver();
//                 }}
//                 autoFocus
//               />
//               <Button variant="destructive" className="w-full" onClick={handleDeleteDriver}>
//                 Remove Driver
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </div>
//   );
// };

// export default DriverSelect;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Lock, ArrowLeft, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Driver {
  id: string;
  display_name: string;
  password: string;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  vehicle_type: string | null;
}

const DriverSelect = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [deleteDriverId, setDeleteDriverId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  // ✅ FETCH DRIVERS (DIRECT DB)
  useEffect(() => {
    const fetchDrivers = async () => {
      const { data, error } = await supabase.from("drivers").select("*");

      if (error) {
        toast({ title: "Failed to load drivers", variant: "destructive" });
      } else {
        setDrivers(data || []);
      }

      setLoading(false);
    };

    fetchDrivers();
  }, [toast]);

  // ✅ VERIFY PASSWORD (CLIENT SIDE)
  const handleVerify = async () => {
    if (!selectedDriver) return;
    setVerifying(true);

    if (passwordInput !== selectedDriver.password) {
      toast({ title: "Incorrect password", variant: "destructive" });
      setVerifying(false);
      return;
    }

    localStorage.setItem("driver_details", JSON.stringify(selectedDriver));
    navigate("/driver/dashboard");
  };

  // ✅ DELETE DRIVER
  const handleDeleteDriver = async () => {
    if (!deleteDriverId) return;

    const { error } = await supabase
      .from("drivers")
      .delete()
      .eq("id", deleteDriverId);

    if (error) {
      toast({ title: "Failed to delete driver", variant: "destructive" });
    } else {
      setDrivers((prev) => prev.filter((d) => d.id !== deleteDriverId));
      setDeleteDriverId(null);
      setDeletePassword("");
      toast({ title: "Driver removed successfully" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Select Driver</h1>
          <p className="text-sm text-muted-foreground">
            Choose your profile to access the dashboard
          </p>
        </div>

        <div className="card-glass rounded-xl p-4 space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No drivers registered yet.
            </p>
          ) : (
            drivers.map((driver) => (
              <div key={driver.id} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedDriver(driver);
                    setPasswordInput("");
                  }}
                  className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {driver.display_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {driver.vehicle_name || "No vehicle"} ·{" "}
                      {driver.vehicle_plate || "N/A"}
                    </p>
                  </div>
                  <Truck className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
                </button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteDriverId(driver.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* PASSWORD DIALOG */}
        <Dialog open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Enter Password for {selectedDriver?.display_name}
              </DialogTitle>
            </DialogHeader>
            <Input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <Button onClick={handleVerify} disabled={verifying}>
              Access Dashboard
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DriverSelect;