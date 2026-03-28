import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface SpeedChartProps {
  data: { time: string; avgSpeed: number; avgSafe: number; alerts: number }[];
}

export const SpeedChart = ({ data }: SpeedChartProps) => (
  <div className="card-glass rounded-lg p-5">
    <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Fleet Velocity Envelope</h3>
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="safeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(38, 90%, 55%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(38, 90%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
          <XAxis dataKey="time" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} stroke="hsl(220, 15%, 18%)" />
          <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} stroke="hsl(220, 15%, 18%)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220, 18%, 10%)",
              border: "1px solid hsl(220, 15%, 18%)",
              borderRadius: "8px",
              color: "hsl(210, 20%, 90%)",
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="avgSafe" stroke="hsl(185, 80%, 50%)" fill="url(#safeGrad)" strokeWidth={2} name="Safe Speed" />
          <Area type="monotone" dataKey="avgSpeed" stroke="hsl(38, 90%, 55%)" fill="url(#speedGrad)" strokeWidth={2} name="Avg Speed" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);
