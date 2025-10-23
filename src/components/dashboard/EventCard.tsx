import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  capacity: number;
  status: "upcoming" | "ongoing" | "completed";
}

const statusConfig = {
  upcoming: { label: "Próximo", color: "bg-secondary/10 text-secondary border-secondary/20" },
  ongoing: { label: "En curso", color: "bg-success/10 text-success border-success/20" },
  completed: { label: "Completado", color: "bg-muted/10 text-muted-foreground border-muted/20" },
};

export function EventCard({ title, date, time, location, attendees, capacity, status }: EventCardProps) {
  const config = statusConfig[status];
  const occupancyPercentage = (attendees / capacity) * 100;

  return (
    <div className="group bg-gradient-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card animate-fade-in-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <Badge variant="outline" className={cn("text-xs", config.color)}>
            {config.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {attendees} / {capacity} personas
              </span>
            </div>
            <span className="text-xs font-medium text-foreground">{occupancyPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                occupancyPercentage >= 90 ? "bg-destructive" : occupancyPercentage >= 70 ? "bg-warning" : "bg-success"
              )}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
