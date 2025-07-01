import { ActivityLog } from '../models/activity/activity-log.model';

export interface ActivityLogFilters {
  search?: string;
  entityType?: string;
  action?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  userEmail?: string;
  userName?: string;
}

export interface ActivityLogRepository {
  create(activityLogData: Partial<ActivityLog>): Promise<ActivityLog>;
  findAll(page?: number, limit?: number): Promise<{ activities: ActivityLog[], total: number }>;
  
  // Nuevo método unificado optimizado
  findWithFilters(filters: ActivityLogFilters, page?: number, limit?: number): Promise<{ activities: ActivityLog[], total: number }>;
  
  findByUserId(userId: string, page?: number, limit?: number): Promise<{ activities: ActivityLog[], total: number }>;
  findByAction(action: string, page?: number, limit?: number): Promise<{ activities: ActivityLog[], total: number }>;
  findByEntityType(entityType: string, page?: number, limit?: number): Promise<{ activities: ActivityLog[], total: number }>;
  findByDateRange(startDate: Date, endDate: Date, page?: number, limit?: number): Promise<{ activities: ActivityLog[], total: number }>;
  findRecent(limit?: number): Promise<ActivityLog[]>;
  findById(logId: string): Promise<ActivityLog | null>;
  
  // Métodos para autocompletado
  getDistinctUsers(search?: string): Promise<Array<{ userId: string; userName: string; userEmail: string }>>;
  getDistinctEntityTypes(): Promise<string[]>;
  getDistinctActions(): Promise<string[]>;
  
  getActivityStats(): Promise<{
    totalActivities: number;
    todayActivities: number;
    weekActivities: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
  }>;
} 