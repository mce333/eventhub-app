import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AuditLog } from '@/types/events';
import { formatAuditLog } from '@/lib/auditLogger';

interface SuspiciousActivityAlertProps {
  activities: AuditLog[];
}

export function SuspiciousActivityAlert({ activities }: SuspiciousActivityAlertProps) {
  if (activities.length === 0) return null;

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <Alert key={activity.id} variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">⚠️ ACTIVIDAD SOSPECHOSA</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            <p className="font-medium">{formatAuditLog(activity)}</p>
            <p className="text-sm">
              {new Date(activity.timestamp).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-sm text-destructive-foreground/80 mt-2">
              Los gastos deberían ser modificados solo por Encargados de Compras
            </p>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}