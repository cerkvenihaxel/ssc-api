export class ActivityLog {
  constructor(
    public readonly logId: string,
    public readonly userId: string | null,
    public readonly action: string,
    public readonly entityType: string | null,
    public readonly entityId: string | null,
    public readonly oldValues: any | null,
    public readonly newValues: any | null,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly createdAt: Date,
    public readonly userInfo?: {
      nombre: string;
      email: string;
      role: string;
    }
  ) {}

  // Getter para compatibilidad con el frontend
  get timestamp(): string {
    return this.createdAt.toISOString();
  }

  static create(
    userId: string | null,
    action: string,
    entityType?: string,
    entityId?: string,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string
  ): Partial<ActivityLog> {
    return {
      userId,
      action,
      entityType: entityType || null,
      entityId: entityId || null,
      oldValues: oldValues || null,
      newValues: newValues || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date()
    };
  }

  getFormattedAction(): string {
    const actionMap: Record<string, string> = {
      'USER_CREATED': 'Usuario creado',
      'USER_UPDATED': 'Usuario actualizado',
      'USER_DELETED': 'Usuario eliminado',
      'USER_LOGIN': 'Inicio de sesión',
      'USER_LOGOUT': 'Cierre de sesión',
      'EFFECTOR_REQUEST_CREATED': 'Pedido de efector creado',
      'EFFECTOR_REQUEST_UPDATED': 'Pedido de efector actualizado',
      'EFFECTOR_REQUEST_APPROVED': 'Pedido de efector aprobado',
      'EFFECTOR_REQUEST_REJECTED': 'Pedido de efector rechazado',
      'MEDICAL_ORDER_CREATED': 'Pedido médico creado',
      'MEDICAL_ORDER_AUTHORIZED': 'Pedido médico autorizado',
      'MEDICAL_ORDER_REJECTED': 'Pedido médico rechazado',
      'MEDICAL_ORDER_AI_ANALYZED': 'Pedido médico analizado por IA',
      'PROVIDER_CREATED': 'Proveedor creado',
      'PROVIDER_UPDATED': 'Proveedor actualizado',
      'QUOTATION_CREATED': 'Cotización creada',
      'QUOTATION_UPDATED': 'Cotización actualizada',
      'AUDIT_COMPLETED': 'Auditoría completada',
      'SYSTEM_MAINTENANCE': 'Mantenimiento del sistema',
    };

    return actionMap[this.action] || this.action;
  }

  getActionType(): 'create' | 'update' | 'delete' | 'auth' | 'approval' | 'system' {
    if (this.action.includes('CREATED')) return 'create';
    if (this.action.includes('UPDATED')) return 'update';
    if (this.action.includes('DELETED')) return 'delete';
    if (this.action.includes('LOGIN') || this.action.includes('LOGOUT')) return 'auth';
    if (this.action.includes('APPROVED') || this.action.includes('REJECTED') || this.action.includes('AUTHORIZED')) return 'approval';
    return 'system';
  }

  getActionStatus(): 'success' | 'warning' | 'info' | 'error' {
    if (this.action.includes('APPROVED') || this.action.includes('AUTHORIZED') || this.action.includes('CREATED')) return 'success';
    if (this.action.includes('REJECTED') || this.action.includes('DELETED')) return 'warning';
    if (this.action.includes('LOGIN') || this.action.includes('UPDATED')) return 'info';
    return 'info';
  }

  getRelativeTime(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.createdAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Hace menos de un minuto';
    if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return this.createdAt.toLocaleDateString('es-ES');
  }
} 