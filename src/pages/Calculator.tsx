import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft, Calculator, TrendingDown, Gauge, Weight, Grip, Save, History } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const Calculator_Page = () => {
  const [slope, setSlope] = useState(5);
  const [grip, setGrip] = useState(0.55);
  const [load, setLoad] = useState(8000);
  const [vehicleMass, setVehicleMass] = useState(5000);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: savedResults, refetch } = useQuery({
    queryKey: ["calculator_results", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculator_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const results = useMemo(() => {
    const g = 9.81;
    const theta = (slope * Math.PI) / 180;
    const totalMass = vehicleMass + load;
    const deceleration = g * (grip * Math.cos(theta) - Math.sin(theta));
    const effectiveDecel = Math.max(deceleration, 0.1);
    const maxBrakingDist = 50;
    const safeSpeed = Math.sqrt(2 * effectiveDecel * maxBrakingDist) * 3.6;

    const testSpeeds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const brakingTable = testSpeeds.map((spd) => {
      const v = spd / 3.6;
      const dist = (v * v) / (2 * effectiveDecel);
      return { speed: spd, distance: parseFloat(dist.toFixed(1)) };
    });

    const normalForce = totalMass * g * Math.cos(theta);
    const frictionForce = grip * normalForce;
    const gravityComponent = totalMass * g * Math.sin(theta);

    return {
      deceleration: parseFloat(deceleration.toFixed(3)),
      effectiveDecel: parseFloat(effectiveDecel.toFixed(3)),
      safeSpeed: parseFloat(safeSpeed.toFixed(1)),
      totalMass,
      normalForce: parseFloat(normalForce.toFixed(0)),
      frictionForce: parseFloat(frictionForce.toFixed(0)),
      gravityComponent: parseFloat(gravityComponent.toFixed(0)),
      brakingTable,
      isUnsafe: deceleration <= 0,
    };
  }, [slope, grip, load, vehicleMass]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("calculator_results").insert({
      user_id: user.id,
      slope,
      grip,
      vehicle_mass: vehicleMass,
      payload: load,
      safe_speed: results.safeSpeed,
      deceleration: results.deceleration,
      braking_table: results.brakingTable,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Calculator result saved to your history." });
      refetch();
    }
  };

  const loadResult = (r: any) => {
    setSlope(r.slope);
    setGrip(r.grip);
    setVehicleMass(r.vehicle_mass);
    setLoad(r.payload);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">TerraMass<span className="text-primary">.GOV</span></h1>
              <p className="text-xs text-muted-foreground">Physics Calculator</p>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="card-glass rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Input Parameters</h2>
              </div>
              <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {saving ? "Saving..." : "Save Result"}
              </Button>
            </div>

            {/* Slope */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-foreground">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  Slope (degrees)
                </Label>
                <span className="text-sm font-mono text-primary">{slope}°</span>
              </div>
              <Slider value={[slope]} onValueChange={([v]) => setSlope(v)} min={-10} max={45} step={0.5} className="w-full" />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>-10° (downhill)</span>
                <span>45° (steep)</span>
              </div>
            </div>

            {/* Grip */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-foreground">
                  <Grip className="h-4 w-4 text-muted-foreground" />
                  Grip Coefficient (µ)
                </Label>
                <span className="text-sm font-mono text-primary">{grip}</span>
              </div>
              <Slider value={[grip]} onValueChange={([v]) => setGrip(parseFloat(v.toFixed(2)))} min={0.1} max={0.9} step={0.01} className="w-full" />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0.1 (icy)</span>
                <span>0.9 (dry rubber)</span>
              </div>
            </div>

            {/* Vehicle Mass */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground">
                <Weight className="h-4 w-4 text-muted-foreground" />
                Vehicle Mass (kg)
              </Label>
              <Input type="number" value={vehicleMass} onChange={(e) => setVehicleMass(clamp(Number(e.target.value) || 0, 500, 50000))} className="font-mono bg-secondary/50 border-border" min={500} max={50000} />
            </div>

            {/* Payload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground">
                <Weight className="h-4 w-4 text-muted-foreground" />
                Payload / Load (kg)
              </Label>
              <Input type="number" value={load} onChange={(e) => setLoad(clamp(Number(e.target.value) || 0, 0, 50000))} className="font-mono bg-secondary/50 border-border" min={0} max={50000} />
            </div>

            {/* Saved Results History */}
            {savedResults && savedResults.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Saved Results</span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {savedResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => loadResult(r)}
                      className="w-full text-left card-glass rounded p-3 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-foreground">
                          θ={r.slope}° µ={r.grip} m={r.vehicle_mass}kg
                        </span>
                        <span className="text-xs font-mono text-primary">{r.safe_speed} km/h</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Key Results */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`card-glass rounded-lg p-4 ${results.isUnsafe ? "glow-destructive" : "glow-primary"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Safe Speed</span>
                </div>
                {results.isUnsafe ? (
                  <span className="text-2xl font-mono font-bold text-destructive">UNSAFE</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-mono font-bold text-primary">{results.safeSpeed}</span>
                    <span className="text-xs text-muted-foreground">km/h</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Max speed for 50m braking</p>
              </div>

              <div className={`card-glass rounded-lg p-4 ${results.deceleration <= 0 ? "glow-destructive" : "glow-success"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Deceleration</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-mono font-bold ${results.deceleration <= 0 ? "text-destructive" : "text-success"}`}>
                    {results.deceleration}
                  </span>
                  <span className="text-xs text-muted-foreground">m/s²</span>
                </div>
                {results.deceleration <= 0 && (
                  <p className="text-[10px] text-destructive mt-1">Cannot stop — slope exceeds grip!</p>
                )}
              </div>

              <div className="card-glass rounded-lg p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Mass</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-mono font-bold text-foreground">{(results.totalMass / 1000).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">tonnes</span>
                </div>
              </div>

              <div className="card-glass rounded-lg p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Friction Force</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-mono font-bold text-foreground">{(results.frictionForce / 1000).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">kN</span>
                </div>
              </div>
            </div>

            {/* Braking Distance Table */}
            <div className="card-glass rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Braking Distance by Speed</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3 font-medium">Speed (km/h)</th>
                    <th className="text-right p-3 font-medium">Braking Distance (m)</th>
                    <th className="text-right p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.brakingTable.map((row) => {
                    const isSafe = row.speed <= results.safeSpeed;
                    return (
                      <tr key={row.speed} className="border-b border-border/50">
                        <td className="p-3 font-mono text-foreground">{row.speed}</td>
                        <td className="p-3 text-right font-mono text-foreground">{row.distance}</td>
                        <td className="p-3 text-right">
                          <span className={`text-xs font-mono font-semibold ${isSafe ? "text-success" : "text-destructive"}`}>
                            {isSafe ? "SAFE" : "EXCEEDS"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Braking Distance Chart */}
            <div className="card-glass rounded-lg p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Braking Distance Curve</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.brakingTable} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="brakingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis dataKey="speed" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} stroke="hsl(220, 15%, 18%)" label={{ value: "Speed (km/h)", position: "insideBottom", offset: -2, fill: "hsl(215, 15%, 50%)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} stroke="hsl(220, 15%, 18%)" label={{ value: "Distance (m)", angle: -90, position: "insideLeft", fill: "hsl(215, 15%, 50%)", fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px", color: "hsl(210, 20%, 90%)", fontSize: 12 }} formatter={(value: number) => [`${value} m`, "Braking Distance"]} labelFormatter={(label) => `${label} km/h`} />
                    <ReferenceLine y={50} stroke="hsl(0, 72%, 55%)" strokeDasharray="6 3" label={{ value: "50m limit", fill: "hsl(0, 72%, 55%)", fontSize: 10, position: "right" }} />
                    {!results.isUnsafe && (
                      <ReferenceLine x={Math.round(results.safeSpeed)} stroke="hsl(150, 60%, 45%)" strokeDasharray="6 3" label={{ value: `Safe: ${results.safeSpeed} km/h`, fill: "hsl(150, 60%, 45%)", fontSize: 10, position: "top" }} />
                    )}
                    <Area type="monotone" dataKey="distance" stroke="hsl(185, 80%, 50%)" fill="url(#brakingGrad)" strokeWidth={2} name="Braking Distance" dot={{ r: 3, fill: "hsl(185, 80%, 50%)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Formula Reference */}
            <div className="card-glass rounded-lg p-4">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Formula Reference</h3>
              <div className="space-y-2 text-xs text-muted-foreground font-mono">
                <p>a = g × (µ × cos(θ) − sin(θ))</p>
                <p>d = v² / (2 × |a|)</p>
                <p>v_safe = √(2 × a × d_max) × 3.6</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calculator_Page;
