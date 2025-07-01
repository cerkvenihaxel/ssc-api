import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, SelectQueryBuilder } from 'typeorm';
import { ActivityLogRepository, ActivityLogFilters } from '../../domain/repositories/activity-log.repository';
import { ActivityLog } from '../../domain/models/activity/activity-log.model';
import { ActivityLogEntity } from '../entities/activity-log.entity';

@Injectable()
export class ActivityLogRepositoryImpl implements ActivityLogRepository {
  constructor(
    @InjectRepository(ActivityLogEntity)
    private readonly activityLogEntityRepository: Repository<ActivityLogEntity>,
  ) {}

  async create(activityLogData: Partial<ActivityLog>): Promise<ActivityLog> {
    const entity = this.activityLogEntityRepository.create(activityLogData);
    const savedEntity = await this.activityLogEntityRepository.save(entity);
    return this.mapEntityToModel(savedEntity);
  }

  async findAll(page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    const [entities, total] = await this.activityLogEntityRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const activities = await Promise.all(
      entities.map(entity => this.enrichWithUserInfo(entity))
    );

    return { activities, total };
  }

  async findByUserId(userId: string, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    const [entities, total] = await this.activityLogEntityRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const activities = await Promise.all(
      entities.map(entity => this.enrichWithUserInfo(entity))
    );

    return { activities, total };
  }

  async findByAction(action: string, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    const [entities, total] = await this.activityLogEntityRepository.findAndCount({
      where: { action },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const activities = await Promise.all(
      entities.map(entity => this.enrichWithUserInfo(entity))
    );

    return { activities, total };
  }

  async findByEntityType(entityType: string, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    const [entities, total] = await this.activityLogEntityRepository.findAndCount({
      where: { entityType },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const activities = await Promise.all(
      entities.map(entity => this.enrichWithUserInfo(entity))
    );

    return { activities, total };
  }

  async findByDateRange(startDate: Date, endDate: Date, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    const [entities, total] = await this.activityLogEntityRepository.findAndCount({
      where: {
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const activities = await Promise.all(
      entities.map(entity => this.enrichWithUserInfo(entity))
    );

    return { activities, total };
  }

  async findRecent(limit = 10): Promise<ActivityLog[]> {
    const entities = await this.activityLogEntityRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return Promise.all(
      entities.map(entity => this.enrichWithUserInfo(entity))
    );
  }

  async findById(logId: string): Promise<ActivityLog | null> {
    const entity = await this.activityLogEntityRepository.findOne({
      where: { logId },
    });

    if (!entity) return null;

    return this.enrichWithUserInfo(entity);
  }

  async getActivityStats(): Promise<{
    totalActivities: number;
    todayActivities: number;
    weekActivities: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total de actividades
    const totalActivities = await this.activityLogEntityRepository.count();

    // Actividades de hoy
    const todayActivities = await this.activityLogEntityRepository.count({
      where: {
        createdAt: Between(today, now),
      },
    });

    // Actividades de la semana
    const weekActivities = await this.activityLogEntityRepository.count({
      where: {
        createdAt: Between(weekAgo, now),
      },
    });

    // Top acciones
    const topActionsQuery = await this.activityLogEntityRepository
      .createQueryBuilder('log')
      .select('log.action, COUNT(*) as count')
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const topActions = topActionsQuery.map(item => ({
      action: item.action,
      count: parseInt(item.count, 10),
    }));

    // Top usuarios
    const topUsersQuery = await this.activityLogEntityRepository
      .createQueryBuilder('log')
      .leftJoin('usuarios', 'u', 'u.user_id = log.user_id')
      .select('log.user_id as userId, u.nombre as userName, COUNT(*) as count')
      .where('log.user_id IS NOT NULL')
      .groupBy('log.user_id, u.nombre')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const topUsers = topUsersQuery.map(item => ({
      userId: item.userid,
      userName: item.username || 'Usuario',
      count: parseInt(item.count, 10),
    }));

    return {
      totalActivities,
      todayActivities,
      weekActivities,
      topActions,
      topUsers,
    };
  }

  async findWithFilters(filters: ActivityLogFilters, page = 1, limit = 20): Promise<{ activities: ActivityLog[], total: number }> {
    // Use a simpler approach: get entities first, then enrich
    const queryBuilder = this.activityLogEntityRepository
      .createQueryBuilder('log')
      .select([
        'log.logId',
        'log.userId', 
        'log.action',
        'log.entityType',
        'log.entityId',
        'log.oldValues',
        'log.newValues',
        'log.ipAddress',
        'log.userAgent',
        'log.createdAt'
      ]);

    this.applySimpleFilters(queryBuilder, filters);

    queryBuilder.orderBy('log.createdAt', 'DESC');

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [entities, total] = await Promise.all([
      queryBuilder.getMany(),
      this.getFilteredCount(filters)
    ]);

    // Enrich each entity with user info
    const activities = await Promise.all(
      entities.map(entity => this.enrichWithUserInfo(entity))
    );

    return { activities, total };
  }

  private applySimpleFilters(queryBuilder: SelectQueryBuilder<ActivityLogEntity>, filters: ActivityLogFilters): void {
    if (filters.search) {
      queryBuilder.andWhere(
        '(log.action ILIKE :search OR log.entityType ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.entityType) {
      queryBuilder.andWhere('log.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.action) {
      queryBuilder.andWhere('log.action ILIKE :action', { action: `%${filters.action}%` });
    }

    if (filters.userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId: filters.userId });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('log.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      const endDate = this.createValidDate(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('log.createdAt <= :dateTo', { dateTo: endDate });
    }
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<ActivityLogEntity>, filters: ActivityLogFilters): void {
    if (filters.search) {
      queryBuilder.andWhere(
        '(log.action ILIKE :search OR log.entity_type ILIKE :search OR u.nombre ILIKE :search OR u.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.entityType) {
      queryBuilder.andWhere('log.entity_type = :entityType', { entityType: filters.entityType });
    }

    if (filters.action) {
      queryBuilder.andWhere('log.action ILIKE :action', { action: `%${filters.action}%` });
    }

    if (filters.userId) {
      queryBuilder.andWhere('log.user_id = :userId', { userId: filters.userId });
    }

    if (filters.userEmail) {
      queryBuilder.andWhere('u.email ILIKE :userEmail', { userEmail: `%${filters.userEmail}%` });
    }

    if (filters.userName) {
      queryBuilder.andWhere('u.nombre ILIKE :userName', { userName: `%${filters.userName}%` });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('log.created_at >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      const endDate = this.createValidDate(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('log.created_at <= :dateTo', { dateTo: endDate });
    }
  }

  private async getFilteredCount(filters: ActivityLogFilters): Promise<number> {
    const countQueryBuilder = this.activityLogEntityRepository
      .createQueryBuilder('log');

    this.applySimpleFilters(countQueryBuilder, filters);

    return countQueryBuilder.getCount();
  }

  async getDistinctUsers(search?: string): Promise<Array<{ userId: string; userName: string; userEmail: string }>> {
    const queryBuilder = this.activityLogEntityRepository
      .createQueryBuilder('log')
      .innerJoin('usuarios', 'u', 'u.user_id = log.user_id')
      .select(['u.user_id as userId', 'u.nombre as userName', 'u.email as userEmail'])
      .distinct(true)
      .where('u.nombre IS NOT NULL');

    if (search) {
      queryBuilder.andWhere('(u.nombre ILIKE :search OR u.email ILIKE :search)', { search: `%${search}%` });
    }

    queryBuilder.orderBy('u.nombre').limit(20);

    const results = await queryBuilder.getRawMany();
    return results.map(row => ({
      userId: row.userid,
      userName: row.username || 'Usuario',
      userEmail: row.useremail || ''
    }));
  }

  async getDistinctEntityTypes(): Promise<string[]> {
    const results = await this.activityLogEntityRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.entity_type', 'entityType')
      .where('log.entity_type IS NOT NULL')
      .orderBy('log.entity_type')
      .getRawMany();

    return results.map(row => row.entityType);
  }

  async getDistinctActions(): Promise<string[]> {
    const results = await this.activityLogEntityRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.action', 'action')
      .orderBy('log.action')
      .getRawMany();

    return results.map(row => row.action);
  }

  private async enrichWithUserInfo(entity: ActivityLogEntity): Promise<ActivityLog> {
    let userInfo: { nombre: string; email: string; role: string; } | undefined;

    if (entity.userId && entity.userId !== 'system') {
      try {
        // Consulta directa más eficiente usando la base de datos
        const userQuery = await this.activityLogEntityRepository.manager.query(`
          SELECT u.nombre, u.email, r.role_name
          FROM usuarios u
          LEFT JOIN roles r ON r.role_id = u.role_id
          WHERE u.user_id = $1
        `, [entity.userId]);

        if (userQuery && userQuery.length > 0) {
          const user = userQuery[0];
          userInfo = {
            nombre: user.nombre || 'Usuario',
            email: user.email || '',
            role: user.role_name || '',
          };
        }
      } catch (error) {
        console.warn(`Could not fetch user info for activity ${entity.logId}:`, error.message);
        // Fallback con información básica del email si está disponible
        if (entity.userId) {
          userInfo = {
            nombre: 'Usuario',
            email: entity.userId.includes('@') ? entity.userId : '',
            role: '',
          };
        }
      }
    } else if (entity.userId === 'system') {
      userInfo = {
        nombre: 'Sistema',
        email: 'system@ssc.gov.ar',
        role: 'Sistema',
      };
    }

    // Validate dates before creating the activity log
    const validCreatedAt = this.createValidDate(entity.createdAt);

    const activityLog = new ActivityLog(
      entity.logId,
      entity.userId,
      entity.action,
      entity.entityType,
      entity.entityId,
      entity.oldValues,
      entity.newValues,
      entity.ipAddress,
      entity.userAgent,
      validCreatedAt,
      userInfo
    );

    // Agregar timestamp explícitamente para compatibilidad con frontend
    return {
      ...activityLog,
      timestamp: validCreatedAt.toISOString()
    } as ActivityLog;
  }

  private mapEntityToModel(entity: ActivityLogEntity): ActivityLog {
    // Validate dates before creating the activity log
    const validCreatedAt = this.createValidDate(entity.createdAt);

    const activityLog = new ActivityLog(
      entity.logId,
      entity.userId,
      entity.action,
      entity.entityType,
      entity.entityId,
      entity.oldValues,
      entity.newValues,
      entity.ipAddress,
      entity.userAgent,
      validCreatedAt,
      entity.userInfo
    );

    // Agregar timestamp explícitamente para compatibilidad con frontend
    return {
      ...activityLog,
      timestamp: validCreatedAt.toISOString()
    } as ActivityLog;
  }

  /**
   * Helper method to create a valid Date object, falling back to current date if invalid
   */
  private createValidDate(dateInput: any): Date {
    if (!dateInput) {
      console.warn('Null or undefined date provided, using current date as fallback');
      return new Date();
    }

    const date = new Date(dateInput);
    
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date value provided (${dateInput}), using current date as fallback`);
      return new Date();
    }

    return date;
  }
} 