import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Truck, HardHat, ArrowRight, Mountain, Gauge, Grip, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SceneBackground } from "@/components/SceneBackground";
import { TiltCard } from "@/components/TiltCard";
import { SafeSpeedDemo } from "@/components/SafeSpeedDemo";
import { adminSession, driverApi } from "@/lib/driver-api";
import { MAX_BRAKING_DISTANCE } from "@/lib/physics";

const pillars = [
  { icon: Mountain, label: "Terrain", text: "Live slope & pitch" },
  { icon: Gauge, label: "Mass", text: "Payload-aware limits" },
  { icon: Grip, label: "Grip", text: "Surface friction model" },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const openAdmin = () => {
    if (adminSession.isActive()) navigate("/admin");
    else setShowAdminDialog(true);
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;
    setSigningIn(true);
    try {
      await driverApi.adminLogin(adminPassword);
      setAdminPassword("");
      navigate("/admin");
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Sign-in failed", variant: "destructive" });
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <SceneBackground />

      <header className="px-6 py-5 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold tracking-tight">
            TerraMass<span className="text-primary">.GOV</span>
          </span>
        </div>
        <span className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
          Velocity governance online
        </span>
      </header>

      <main className="min-h-[calc(100vh-80px)] flex items-center px-6 pb-16">
        <div className="max-w-6xl w-full mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <section className="space-y-7 fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
              Terrain · Mass · Grip
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Safe speed,
              <br />
              <span className="text-gradient-primary">computed live.</span>
            </h1>
            <p className="text-muted-foreground max-w-lg text-base sm:text-lg">
              Real-time velocity governance for heavy fleets — every vehicle's safe speed adapts to the road
              gradient, its payload and surface grip.
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-lg">
              {pillars.map(({ icon: Icon, label, text }, i) => (
                <div
                  key={label}
                  className="card-glass rounded-xl p-3 fade-up"
                  style={{ animationDelay: `${150 + i * 90}ms` }}
                >
                  <Icon className="h-4 w-4 text-primary mb-2" />
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 fade-up" style={{ animationDelay: "120ms" }}>
            <TiltCard
              role="button"
              tabIndex={0}
              onClick={() => navigate("/driver")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/driver")}
              className="p-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="tilt-layer flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center float-y">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">Driver Portal</h2>
                  <p className="text-sm text-muted-foreground">
                    Live speedometer, road warnings and messages from dispatch.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary mt-1" />
              </div>
            </TiltCard>

            <TiltCard
              role="button"
              tabIndex={0}
              onClick={openAdmin}
              onKeyDown={(e) => e.key === "Enter" && openAdmin()}
              className="p-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="tilt-layer flex items-start gap-4">
                <div
                  className="h-12 w-12 shrink-0 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center float-y"
                  style={{ animationDelay: "1.5s" }}
                >
                  <HardHat className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">Fleet Command</h2>
                  <p className="text-sm text-muted-foreground">
                    Fleet telemetry, live map, driver management and alerts.
                  </p>
                </div>
                <Lock className="h-4 w-4 text-muted-foreground mt-1.5" />
              </div>
            </TiltCard>
          </section>
        </div>
      </main>

      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-primary">Try it</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Speed limits for physics, not signboards.</h2>
            <p className="text-sm text-muted-foreground">
              Change the slope, grip and payload. The truck needs to stop within {MAX_BRAKING_DISTANCE} m — watch the
              stopping zone grow and the safe limit move.
            </p>
          </div>
          <SafeSpeedDemo />
        </div>
      </section>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Fleet Command sign-in</DialogTitle>
            <DialogDescription>Enter the administrator password to continue.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-3">
            <Input
              type="password"
              autoComplete="current-password"
              autoFocus
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={signingIn || !adminPassword}>
              {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Welcome;
