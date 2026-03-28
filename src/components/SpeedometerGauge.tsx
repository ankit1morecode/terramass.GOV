import type { SensorData } from "@/lib/mock-data";

interface SpeedometerGaugeProps {
  sensor: SensorData;
}

export const SpeedometerGauge = ({ sensor }: SpeedometerGaugeProps) => {
  const { speed, safeSpeed, status } = sensor;
  const maxSpeed = Math.max(safeSpeed * 1.5, 120);
  const speedAngle = (speed / maxSpeed) * 240 - 120; // -120 to +120 degrees
  const safeAngle = (safeSpeed / maxSpeed) * 240 - 120;

  const statusColor =
    status === "critical"
      ? "hsl(var(--destructive))"
      : status === "warning"
      ? "hsl(var(--warning))"
      : "hsl(var(--success))";

  return (
    <div className="card-glass rounded-lg p-6 flex flex-col items-center">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Speedometer
      </h3>
      <div className="relative w-56 h-40">
        <svg viewBox="0 0 200 130" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Safe zone arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(var(--success) / 0.3)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(safeSpeed / maxSpeed) * 251} 251`}
          />
          {/* Speed needle */}
          <line
            x1="100"
            y1="100"
            x2={100 + 65 * Math.cos((speedAngle * Math.PI) / 180 - Math.PI / 2)}
            y2={100 + 65 * Math.sin((speedAngle * Math.PI) / 180 - Math.PI / 2)}
            stroke={statusColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Safe speed marker */}
          <line
            x1={100 + 60 * Math.cos((safeAngle * Math.PI) / 180 - Math.PI / 2)}
            y1={100 + 60 * Math.sin((safeAngle * Math.PI) / 180 - Math.PI / 2)}
            x2={100 + 75 * Math.cos((safeAngle * Math.PI) / 180 - Math.PI / 2)}
            y2={100 + 75 * Math.sin((safeAngle * Math.PI) / 180 - Math.PI / 2)}
            stroke="hsl(var(--warning))"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx="100" cy="100" r="6" fill={statusColor} />
          {/* Scale Labels */}
          <text x="15" y="108" className="fill-muted-foreground" fontSize="8" textAnchor="middle">0</text>
          <text x="185" y="108" className="fill-muted-foreground" fontSize="8" textAnchor="middle">{Math.round(maxSpeed)}</text>
          {/* Speed display inside SVG */}
          <text x="100" y="126" textAnchor="middle" fontSize="24" fontFamily="monospace" fontWeight="bold" fill={statusColor}>
            {speed.toFixed(2)}
          </text>
          <text x="130" y="126" textAnchor="start" fontSize="8" className="fill-muted-foreground">
            km/h
          </text>
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span>Safe: <strong className="text-foreground">{safeSpeed.toFixed(2)} km/h</strong></span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
          style={{ backgroundColor: statusColor, color: "#fff" }}
        >
          {status}
        </span>
      </div>
      {status === "critical" && (
        <div className="mt-3 px-3 py-1.5 bg-destructive/20 border border-destructive/40 rounded text-xs text-destructive font-medium animate-pulse">
          ⚠️ OVER-SPEED ALERT — Reduce speed immediately!
        </div>
      )}
    </div>
  );
};
