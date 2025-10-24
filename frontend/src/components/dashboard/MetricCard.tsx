import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  extraInfo?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
}

export function MetricCard({ title, value, change, extraInfo, changeType = "neutral", icon: Icon, trend }: MetricCardProps) {
  return (
    <div className="group relative bg-gradient-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {trend && (
            <div
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                trend === "up" && "bg-success/10 text-success",
                trend === "down" && "bg-destructive/10 text-destructive",
                trend === "stable" && "bg-muted text-muted-foreground"
              )}
            >
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
              {trend === "stable" && "→"}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm text-muted-foreground font-medium">{title}</h3>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                "text-sm font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
          {extraInfo && (
            <p className="text-xs text-muted-foreground">
              {extraInfo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
