import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, ArrowLeft, Search, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SceneBackground } from "@/components/SceneBackground";
import { TiltCard } from "@/components/TiltCard";
import { driverApi, driverSession, type DriverProfile } from "@/lib/driver-api";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const DriverSelect = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (driverSession.get()) {
      navigate("/driver/dashboard", { replace: true });
      return;
    }
    driverApi
      .list()
      .then(setDrivers)
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, [navigate, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) =>
      [d.display_name, d.vehicle_name, d.vehicle_plate].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [drivers, query]);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !passwordInput) return;
    setVerifying(true);
    try {
      await driverApi.driverLogin(selectedDriver.id, passwordInput);
      navigate("/driver/dashboard");
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Sign-in failed", variant: "destructive" });
    } finally {
      setVerifying(false);
      setPasswordInput("");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <SceneBackground />

      <div className="w-full max-w-md space-y-6 fade-up">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto float-y">
            <Truck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Portal</h1>
          <p className="text-sm text-muted-foreground">Choose your profile to start your shift</p>
        </div>

        <TiltCard max={4} className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, vehicle or plate"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-secondary/40"
            />
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[60px] rounded-lg bg-secondary/40 animate-pulse" />
              ))
            ) : loadFailed ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-destructive">Couldn't reach the server.</p>
                <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {drivers.length === 0 ? "No drivers registered yet. Ask your fleet admin." : "No matches."}
              </p>
            ) : (
              filtered.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => {
                    setSelectedDriver(driver);
                    setPasswordInput("");
                  }}
                  className="group w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-none transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-info/30 border border-primary/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                    {initials(driver.display_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{driver.display_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      {driver.vehicle_name || "No vehicle"} · {driver.vehicle_plate || "N/A"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))
            )}
          </div>
        </TiltCard>

        <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <Dialog open={!!selectedDriver} onOpenChange={(open) => !open && setSelectedDriver(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Welcome, {selectedDriver?.display_name}</DialogTitle>
            <DialogDescription>Enter your password to open the dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerify} className="space-y-3">
            <Input
              type="password"
              autoComplete="current-password"
              autoFocus
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={verifying || !passwordInput}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Access Dashboard"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverSelect;
