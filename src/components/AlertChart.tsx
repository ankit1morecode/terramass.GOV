import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface AlertChartProps {
  data: { time: string; alerts: number }[];
}

export const AlertChart = ({ data }: AlertChartProps) => (
  <div className="card-glass rounded-lg p-5">
    <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Alert Timeline</h3>
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
          <XAxis dataKey="time" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} stroke="hsl(220, 15%, 18%)" />
          <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} stroke="hsl(220, 15%, 18%)" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220, 18%, 10%)",
              border: "1px solid hsl(220, 15%, 18%)",
              borderRadius: "8px",
              color: "hsl(210, 20%, 90%)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="alerts" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} name="Alerts" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
