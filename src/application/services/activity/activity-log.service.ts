import { Injectable, Inject } from '@nestjs/common';
import { ActivityLogRepository, ActivityLogFilters } from '../../../domain/repositories/activity-log.repository';
import { ActivityLog } from '../../../domain/models/activity/activity-log.model';

export interface LogActivityDto {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: any;
}

export interface ActivityStatsDto {
  totalActivities: number;
  todayActivities: number;
  weekActivities: number;
  topActions: Array<{ action: string; formattedAction: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
}

export interface UserAutoCompleteDto {
  userId: string;
  userName: string;
  userEmail: string;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @Inject('ActivityLogRepository')
    private readonly activityLogRepository: ActivityLogRepository,
  ) {}

  /**
   * Registra una nueva actividad en el sistema
   */
  async logActivity(data: LogActivityDto): Promise<ActivityLog> {
    try {
      const activityData = ActivityLog.create(
        data.userId || null,
        data.action,
        data.entityType,
        data.entityId,
        data.oldValues,
        data.newValues,
        data.ipAddress,
        data.userAgent
      );

      return await this.activityLogRepository.create(activityData);
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las actividades con paginación
   */
  async findAll(page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    return this.activityLogRepository.findAll(page, limit);
  }

  /**
   * Obtiene las actividades más recientes
   */
  async findRecent(limit = 10): Promise<ActivityLog[]> {
    return this.activityLogRepository.findRecent(limit);
  }

  /**
   * Obtiene actividades por usuario
   */
  async findByUserId(userId: string, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    return this.activityLogRepository.findByUserId(userId, page, limit);
  }

  /**
   * Obtiene actividades por tipo de acción
   */
  async findByAction(action: string, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    return this.activityLogRepository.findByAction(action, page, limit);
  }

  /**
   * Obtiene actividades por tipo de entidad
   */
  async findByEntityType(entityType: string, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    return this.activityLogRepository.findByEntityType(entityType, page, limit);
  }

  /**
   * Obtiene actividades en un rango de fechas
   */
  async findByDateRange(startDate: Date, endDate: Date, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    return this.activityLogRepository.findByDateRange(startDate, endDate, page, limit);
  }

  /**
   * Obtiene estadísticas de actividades
   */
  async getActivityStats(): Promise<ActivityStatsDto> {
    const stats = await this.activityLogRepository.getActivityStats();
    
    // Formatear las acciones para mejor presentación
    const formattedTopActions = stats.topActions.map(action => ({
      action: action.action,
      formattedAction: this.getFormattedAction(action.action),
      count: action.count
    }));

    return {
      ...stats,
      topActions: formattedTopActions
    };
  }

  /**
   * Obtiene una actividad por ID
   */
  async findById(logId: string): Promise<ActivityLog | null> {
    return this.activityLogRepository.findById(logId);
  }

  /**
   * Registra actividad de login
   */
  async logUserLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra actividad de logout
   */
  async logUserLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId,
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra creación de usuario
   */
  async logUserCreated(createdUserId: string, createdByUserId: string, newUserData: any, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: createdByUserId,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: createdUserId,
      newValues: {
        email: newUserData.email,
        nombre: newUserData.nombre,
        role: newUserData.role,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra actualización de usuario
   */
  async logUserUpdated(updatedUserId: string, updatedByUserId: string, oldData: any, newData: any, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: updatedByUserId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: updatedUserId,
      oldValues: oldData,
      newValues: newData,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra eliminación de usuario
   */
  async logUserDeleted(deletedUserId: string, deletedByUserId: string, userData: any, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: deletedByUserId,
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: deletedUserId,
      oldValues: userData,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra creación de pedido de efector
   */
  async logEffectorRequestCreated(requestId: string, createdByUserId: string, requestData: any, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: createdByUserId,
      action: 'EFFECTOR_REQUEST_CREATED',
      entityType: 'effector_request',
      entityId: requestId,
      newValues: {
        title: requestData.title,
        priority: requestData.priority,
        totalAmount: requestData.total_estimated_amount,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra aprobación de pedido de efector
   */
  async logEffectorRequestApproved(requestId: string, approvedByUserId: string, requestData: any, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: approvedByUserId,
      action: 'EFFECTOR_REQUEST_APPROVED',
      entityType: 'effector_request',
      entityId: requestId,
      newValues: {
        title: requestData.title,
        status: 'APROBADO',
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra rechazo de pedido de efector
   */
  async logEffectorRequestRejected(requestId: string, rejectedByUserId: string, requestData: any, reason: string, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: rejectedByUserId,
      action: 'EFFECTOR_REQUEST_REJECTED',
      entityType: 'effector_request',
      entityId: requestId,
      newValues: {
        title: requestData.title,
        status: 'RECHAZADO',
        rejectionReason: reason,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra creación de pedido médico
   */
  async logMedicalOrderCreated(orderId: string, createdByUserId: string, orderData: any, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: createdByUserId,
      action: 'MEDICAL_ORDER_CREATED',
      entityType: 'medical_order',
      entityId: orderId,
      newValues: {
        title: orderData.title,
        orderNumber: orderData.order_number,
        estimatedCost: orderData.estimated_cost,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra autorización de pedido médico
   */
  async logMedicalOrderAuthorized(orderId: string, authorizedByUserId: string, orderData: any, decision: string, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: authorizedByUserId,
      action: 'MEDICAL_ORDER_AUTHORIZED',
      entityType: 'medical_order',
      entityId: orderId,
      newValues: {
        title: orderData.title,
        decision: decision,
        authorizedAt: new Date(),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra análisis de IA de pedido médico
   */
  async logMedicalOrderAIAnalyzed(orderId: string, orderData: any, aiResult: any, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: 'system',
      action: 'MEDICAL_ORDER_AI_ANALYZED',
      entityType: 'medical_order',
      entityId: orderId,
      newValues: {
        title: orderData.title,
        aiDecision: aiResult.decision,
        confidence: aiResult.confidence,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra creación de proveedor
   */
  async logProviderCreated(providerId: string, createdByUserId: string, providerData: any, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: createdByUserId,
      action: 'PROVIDER_CREATED',
      entityType: 'provider',
      entityId: providerId,
      newValues: {
        name: providerData.provider_name,
        type: providerData.provider_type,
        cuit: providerData.cuit,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra auditoría completada
   */
  async logAuditCompleted(auditedEntityType: string, auditedEntityId: string, auditedByUserId: string, auditData: any, ipAddress?: string, userAgent?: string): Promise<ActivityLog> {
    return this.logActivity({
      userId: auditedByUserId,
      action: 'AUDIT_COMPLETED',
      entityType: auditedEntityType,
      entityId: auditedEntityId,
      newValues: auditData,
      ipAddress,
      userAgent,
    });
  }

  private getFormattedAction(action: string): string {
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

    return actionMap[action] || action;
  }

  // MÉTODO OPTIMIZADO PRINCIPAL
  async findWithFilters(filters: ActivityLogFilters, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    return this.activityLogRepository.findWithFilters(filters, page, limit);
  }

  // MÉTODOS DE AUTOCOMPLETADO
  async getUserSuggestions(search?: string): Promise<UserAutoCompleteDto[]> {
    return this.activityLogRepository.getDistinctUsers(search);
  }

  async getEntityTypeSuggestions(): Promise<string[]> {
    return this.activityLogRepository.getDistinctEntityTypes();
  }

  async getActionSuggestions(): Promise<string[]> {
    return this.activityLogRepository.getDistinctActions();
  }
} 