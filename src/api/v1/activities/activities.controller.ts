import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard, RequirePermission } from '../../guards/admin.guard';
import { ActivityLogService, ActivityStatsDto, UserAutoCompleteDto } from '../../../application/services/activity/activity-log.service';
import { ActivityLog } from '../../../domain/models/activity/activity-log.model';
import { ActivityLogFilters } from '../../../domain/repositories/activity-log.repository';

@ApiTags('activities')
@Controller('v1/activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
export class ActivitiesController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get('search')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Búsqueda avanzada de actividades con filtros optimizados' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Texto de búsqueda libre' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Tipo de entidad' })
  @ApiQuery({ name: 'action', required: false, description: 'Tipo de acción' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario' })
  @ApiQuery({ name: 'userEmail', required: false, description: 'Email del usuario' })
  @ApiQuery({ name: 'userName', required: false, description: 'Nombre del usuario' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actividades encontradas exitosamente',
  })
  async searchActivities(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('userEmail') userEmail?: string,
    @Query('userName') userName?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<{ activities: ActivityLog[], total: number }> {
    const filters: ActivityLogFilters = {
      search,
      entityType,
      action,
      userId,
      userEmail,
      userName,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };

    // Remover filtros vacíos
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    return this.activityLogService.findWithFilters(filters, page, limit);
  }

  @Get('autocomplete/users')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Autocompletado de usuarios para filtros' })
  @ApiQuery({ name: 'search', required: false, description: 'Texto de búsqueda' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sugerencias de usuarios obtenidas exitosamente',
  })
  async getUserSuggestions(
    @Query('search') search?: string,
  ): Promise<UserAutoCompleteDto[]> {
    return this.activityLogService.getUserSuggestions(search);
  }

  @Get('autocomplete/entity-types')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Autocompletado de tipos de entidad' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipos de entidad obtenidos exitosamente',
  })
  async getEntityTypeSuggestions(): Promise<string[]> {
    return this.activityLogService.getEntityTypeSuggestions();
  }

  @Get('autocomplete/actions')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Autocompletado de acciones' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Acciones obtenidas exitosamente',
  })
  async getActionSuggestions(): Promise<string[]> {
    return this.activityLogService.getActionSuggestions();
  }

  @Get()
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener todas las actividades con paginación (método legacy)' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de actividades obtenida exitosamente',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ activities: ActivityLog[], total: number }> {
    // Usar el método optimizado incluso para consultas simples
    return this.activityLogService.findWithFilters({}, page, limit);
  }

  @Get('recent')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener actividades recientes' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actividades recientes obtenidas exitosamente',
  })
  async findRecent(
    @Query('limit') limit: number = 10,
  ): Promise<ActivityLog[]> {
    return this.activityLogService.findRecent(limit);
  }

  @Get('stats')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener estadísticas de actividades' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas de actividades obtenidas exitosamente',
  })
  async getStats(): Promise<ActivityStatsDto> {
    return this.activityLogService.getActivityStats();
  }

  @Get('dashboard')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener datos para el dashboard de actividades' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Datos del dashboard obtenidos exitosamente',
  })
  async getDashboardData(): Promise<{
    recentActivities: ActivityLog[];
    stats: ActivityStatsDto;
  }> {
    const [recentActivities, stats] = await Promise.all([
      this.activityLogService.findRecent(15),
      this.activityLogService.getActivityStats(),
    ]);

    return {
      recentActivities,
      stats,
    };
  }

  @Get('user/:userId')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener actividades por usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actividades del usuario obtenidas exitosamente',
  })
  async findByUserId(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ activities: ActivityLog[], total: number }> {
    return this.activityLogService.findByUserId(userId, page, limit);
  }

  @Get('action/:action')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener actividades por tipo de acción' })
  @ApiParam({ name: 'action', description: 'Tipo de acción' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actividades por acción obtenidas exitosamente',
  })
  async findByAction(
    @Param('action') action: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ activities: ActivityLog[], total: number }> {
    return this.activityLogService.findByAction(action, page, limit);
  }

  @Get('entity/:entityType')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener actividades por tipo de entidad' })
  @ApiParam({ name: 'entityType', description: 'Tipo de entidad' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actividades por tipo de entidad obtenidas exitosamente',
  })
  async findByEntityType(
    @Param('entityType') entityType: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ activities: ActivityLog[], total: number }> {
    return this.activityLogService.findByEntityType(entityType, page, limit);
  }

  @Get('date-range')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener actividades en un rango de fechas' })
  @ApiQuery({ name: 'startDate', description: 'Fecha de inicio (ISO string)' })
  @ApiQuery({ name: 'endDate', description: 'Fecha de fin (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actividades en el rango de fechas obtenidas exitosamente',
  })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ activities: ActivityLog[], total: number }> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.activityLogService.findByDateRange(start, end, page, limit);
  }

  @Get('my-activities')
  @RequirePermission('VIEW_ALL_USERS') // Menos restrictivo para que los usuarios vean sus propias actividades
  @ApiOperation({ summary: 'Obtener actividades del usuario actual' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actividades del usuario actual obtenidas exitosamente',
  })
  async findMyActivities(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ activities: ActivityLog[], total: number }> {
    const userId = req.user?.userId;
    return this.activityLogService.findByUserId(userId, page, limit);
  }

  @Get(':id')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener actividad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actividad obtenida exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Actividad no encontrada',
  })
  async findById(@Param('id') id: string): Promise<ActivityLog | null> {
    return this.activityLogService.findById(id);
  }
} 