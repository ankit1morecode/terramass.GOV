import { useMemo, useState } from "react";
import { Gauge, Mountain, Grip, Weight, Signpost, ShieldCheck } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Truck3D } from "@/components/three/Truck3D";
import { cn } from "@/lib/utils";
import { brakingDistanceM, safeSpeedKmh, speedStatus, MAX_BRAKING_DISTANCE } from "@/lib/physics";

const FIXED_SIGN_LIMIT = 60;

const presets = [
  { name: "Dry highway", speed: 60, slope: 0, grip: 0.75, load: 8000 },
  { name: "Wet ghat descent", speed: 55, slope: 8, grip: 0.35, load: 16000 },
  { name: "Loaded mine haul", speed: 40, slope: 12, grip: 0.5, load: 20000 },
] as const;

type State = { speed: number; slope: number; grip: number; load: number };

const statusStyles = {
  safe: { text: "text-success", bg: "bg-success/10 border-success/30", label: "Within safe stopping distance" },
  warning: { text: "text-warning", bg: "bg-warning/10 border-warning/30", label: "Close to the limit — ease off" },
  critical: { text: "text-destructive", bg: "bg-destructive/10 border-destructive/30", label: "Cannot stop in time" },
};

export const SafeSpeedDemo = () => {
  const [s, setS] = useState<State>({ ...presets[1] });
  const set = (key: keyof State) => ([v]: number[]) => setS((prev) => ({ ...prev, [key]: v }));

  const { safe, braking, status } = useMemo(() => {
    const safe = safeSpeedKmh(s.slope, s.grip);
    return { safe, braking: brakingDistanceM(s.speed, s.slope, s.grip), status: speedStatus(s.speed, safe) };
  }, [s]);

  const signGap = FIXED_SIGN_LIMIT - safe;
  const style = statusStyles[status];

  const controls = [
    { key: "speed", label: "Speed", icon: Gauge, min: 0, max: 100, step: 1, fmt: (v: number) => `${v} km/h` },
    { key: "slope", label: "Downhill slope", icon: Mountain, min: -10, max: 25, step: 0.5, fmt: (v: number) => `${v}°` },
    { key: "grip", label: "Road grip (µ)", icon: Grip, min: 0.15, max: 0.9, step: 0.01, fmt: (v: number) => v.toFixed(2) },
    { key: "load", label: "Payload", icon: Weight, min: 0, max: 20000, step: 500, fmt: (v: number) => `${(v / 1000).toFixed(1)} t` },
  ] as const;

  return (
    <div className="card-glass rounded-2xl overflow-hidden grid lg:grid-cols-[1.4fr_1fr]">
      <div className="relative min-h-[320px] sm:min-h-[400px] lg:min-h-[480px] bg-gradient-to-b from-primary/5 to-transparent">
        <Truck3D
          className="absolute inset-0"
          speed={s.speed}
          slope={s.slope}
          grip={s.grip}
          load={s.load}
          brakingDistance={braking}
          status={status}
        />
        <div className={cn("pointer-events-none absolute left-3 top-3 rounded-lg border px-3 py-2 backdrop-blur", style.bg)}>
          <p className={cn("text-xs font-semibold", style.text)}>{style.label}</p>
          <p className="text-[11px] text-muted-foreground font-mono">
            stops in {braking.toFixed(0)} m · limit {MAX_BRAKING_DISTANCE} m
          </p>
        </div>
        <p className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-muted-foreground">
          Drag to orbit · scroll to zoom
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-5 border-t lg:border-t-0 lg:border-l border-border">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => setS({ speed: p.speed, slope: p.slope, grip: p.grip, load: p.load })}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {controls.map(({ key, label, icon: Icon, min, max, step, fmt }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </span>
                <span className="font-mono text-foreground">{fmt(s[key])}</span>
              </div>
              <Slider aria-label={label} min={min} max={max} step={step} value={[s[key]]} onValueChange={set(key)} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Signpost className="h-3.5 w-3.5" /> Fixed sign limit
            </p>
            <p className="font-mono text-2xl font-bold text-muted-foreground">
              {FIXED_SIGN_LIMIT}
              <span className="text-xs font-normal"> km/h</span>
            </p>
          </div>
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 glow-primary">
            <p className="flex items-center gap-1.5 text-[11px] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> TerraMass limit
            </p>
            <p className="font-mono text-2xl font-bold text-primary">
              {safe.toFixed(0)}
              <span className="text-xs font-normal"> km/h</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {signGap > 2 ? (
            <>
              On this road the signboard allows <strong className="text-destructive">{signGap.toFixed(0)} km/h more</strong> than
              physics says is safe.
            </>
          ) : signGap < -2 ? (
            <>Conditions are good — the vehicle could safely go {Math.abs(signGap).toFixed(0)} km/h above the sign.</>
          ) : (
            <>Here the signboard and physics agree.</>
          )}
        </p>
      </div>
    </div>
  );
};
