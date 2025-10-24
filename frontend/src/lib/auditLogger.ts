import { AuditLog } from '@/types/events';

interface CreateAuditLogParams {
  eventId: number;
  userId: number;
  userName: string;
  userRole: string;
  action: 'created' | 'updated' | 'deleted';
  section: 'evento' | 'contrato' | 'decoracion' | 'personal' | 'gastos';
  description: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
}

/**
 * Crea un registro de auditoría
 */
export function createAuditLog(params: CreateAuditLogParams): AuditLog {
  const { eventId, userId, userName, userRole, action, section, description, changes } = params;

  // Detectar actividad sospechosa:
  // Si Admin o Socio modifica gastos (debería ser solo Encargado de Compras)
  const isSuspicious =
    section === 'gastos' &&
    action === 'updated' &&
    (userRole === 'admin' || userRole === 'socio');

  return {
    id: Date.now(), // En producción, esto vendría del backend
    eventId,
    userId,
    userName,
    userRole,
    action,
    section,
    description,
    timestamp: new Date().toISOString(),
    isSuspicious,
    changes,
  };
}

/**
 * Formatea un registro de auditoría para mostrar
 */
export function formatAuditLog(log: AuditLog): string {
  const actionText = {
    created: 'creó',
    updated: 'modificó',
    deleted: 'eliminó',
  }[log.action];

  const sectionText = {
    evento: 'el evento',
    contrato: 'el contrato',
    decoracion: 'la decoración',
    personal: 'el personal',
    gastos: 'los gastos',
  }[log.section];

  return `${log.userName} ${actionText} ${sectionText}`;
}

/**
 * Filtra registros sospechosos
 */
export function getSuspiciousActivities(auditLogs: AuditLog[]): AuditLog[] {
  return auditLogs.filter((log) => log.isSuspicious);
}

/**
 * Agrupa registros por sección
 */
export function groupAuditLogsBySection(
  auditLogs: AuditLog[]
): Record<string, AuditLog[]> {
  return auditLogs.reduce((acc, log) => {
    if (!acc[log.section]) {
      acc[log.section] = [];
    }
    acc[log.section].push(log);
    return acc;
  }, {} as Record<string, AuditLog[]>);
}

/**
 * Obtiene el último cambio de una sección
 */
export function getLastChange(
  auditLogs: AuditLog[],
  section: AuditLog['section']
): AuditLog | undefined {
  return auditLogs
    .filter((log) => log.section === section)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
}

/**
 * Genera descripción de cambios
 */
export function generateChangeDescription(
  changes: Record<string, { before: unknown; after: unknown }>
): string {
  return Object.entries(changes)
    .map(([field, { before, after }]) => {
      return `${field}: ${before} → ${after}`;
    })
    .join(', ');
}