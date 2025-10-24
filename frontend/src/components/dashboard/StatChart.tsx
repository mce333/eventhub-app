import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StatChartProps {
  data: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}

export function StatChart({ data }: StatChartProps) {
  return (
    <div className="bg-gradient-card rounded-xl p-6 border border-border animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Rendimiento Mensual</h3>
        <p className="text-sm text-muted-foreground">Eventos e ingresos de los últimos 6 meses</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
          />
          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Ingresos" />
          <Bar dataKey="expenses" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} name="Gastos" />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Ingresos (€)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <span className="text-xs text-muted-foreground">Gastos (€)</span>
        </div>
      </div>
    </div>
  );
}