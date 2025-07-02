import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Req, 
  UseGuards,
  HttpException,
  HttpStatus,
  ParseUUIDPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ProviderQuotationsService } from '../../../application/services/provider-quotations/provider-quotations.service';
import { CreateProviderQuotationDto } from './dtos/create-provider-quotation.dto';
import { UpdateProviderQuotationDto } from './dtos/update-provider-quotation.dto';
import { AuditQuotationDto } from './dtos/audit-quotation.dto';

@ApiTags('Servicios Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('provider-quotations')
export class ProviderQuotationsController {
  constructor(private readonly providerQuotationsService: ProviderQuotationsService) {}

  private getUserRoleFromRequest(req: any): string {
    const userRoleId = req.user?.roleId;
    // Convertir roleId a role name (roleId: 1 = 'Administrador', roleId: 2 = 'Proveedor', etc.)
    return userRoleId === 1 ? 'Administrador' : userRoleId === 2 ? 'Proveedor' : userRoleId === 3 ? 'Auditor' : 'Usuario';
  }

  // =============== SOLICITUDES A COTIZAR ===============
  
  @Get('request/:requestId')
  @ApiOperation({
    summary: 'Obtener detalle de un pedido específico',
    description: 'Obtiene los detalles completos de un pedido para cotización'
  })
  @ApiParam({ name: 'requestId', description: 'ID del pedido' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del pedido'
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido no encontrado'
  })
  async getRequestDetail(
    @Param('requestId') requestId: string,
    @Req() req: any
  ) {
    try {
      console.log('[ProviderQuotationsController] req.user:', JSON.stringify(req.user, null, 2));
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);
      console.log('[ProviderQuotationsController] Extracted values:', { userId, userRole });

      return this.providerQuotationsService.getRequestDetail(requestId, userId, userRole);
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al obtener el detalle del pedido',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Get('available-requests')
  @ApiOperation({ 
    summary: 'Obtener solicitudes disponibles para cotizar',
    description: 'Obtiene los pedidos aprobados que están disponibles para cotización y coinciden con las especialidades del proveedor'
  })
  @ApiQuery({ name: 'specialty', required: false, description: 'Filtrar por especialidad' })
  @ApiQuery({ name: 'type', required: false, enum: ['medical', 'effector', 'all'], description: 'Tipo de pedido' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filtrar por prioridad' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página' })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes disponibles para cotizar'
  })
  async getAvailableRequests(
    @Req() req: any,
    @Query('specialty') specialty?: string,
    @Query('type') type: 'medical' | 'effector' | 'all' = 'all',
    @Query('priority') priority?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      return this.providerQuotationsService.getAvailableRequests(
        userId,
        userRole,
        { specialty, type, priority, page, limit }
      );
    } catch (error) {
      throw new HttpException(
        'Error al obtener solicitudes disponibles',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ 
    summary: 'Crear nueva cotización',
    description: 'Permite a un proveedor cotizar total o parcialmente un pedido'
  })
  @ApiResponse({
    status: 201,
    description: 'Cotización creada exitosamente'
  })
  @ApiResponse({
    status: 409,
    description: 'El proveedor ya tiene una cotización para este pedido'
  })
  async createQuotation(
    @Body() createQuotationDto: CreateProviderQuotationDto,
    @Req() req: any
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      return this.providerQuotationsService.createQuotation(
        createQuotationDto,
        userId,
        userRole
      );
    } catch (error) {
      if (error.message.includes('ya tiene una cotización')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Error al crear la cotización',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // =============== MIS SOLICITUDES COTIZADAS ===============

  @Get('my-quotations')
  @ApiOperation({ 
    summary: 'Obtener mis cotizaciones',
    description: 'Lista las cotizaciones realizadas por el proveedor autenticado'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'date_from', required: false, description: 'Fecha desde' })
  @ApiQuery({ name: 'date_to', required: false, description: 'Fecha hasta' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de cotizaciones del proveedor'
  })
  async getMyQuotations(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      return this.providerQuotationsService.getMyQuotations(
        userId,
        userRole,
        { status, dateFrom, dateTo, page, limit }
      );
    } catch (error) {
      throw new HttpException(
        'Error al obtener mis cotizaciones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener detalle de cotización',
    description: 'Obtiene los detalles completos de una cotización específica'
  })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la cotización'
  })
  @ApiResponse({
    status: 404,
    description: 'Cotización no encontrada'
  })
  async getQuotationById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      return this.providerQuotationsService.getQuotationById(id, userId, userRole);
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al obtener la cotización',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Actualizar cotización',
    description: 'Actualiza una cotización si aún no ha sido auditada'
  })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiResponse({
    status: 200,
    description: 'Cotización actualizada exitosamente'
  })
  @ApiResponse({
    status: 403,
    description: 'No se puede actualizar una cotización ya auditada'
  })
  async updateQuotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuotationDto: UpdateProviderQuotationDto,
    @Req() req: any
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      return this.providerQuotationsService.updateQuotation(
        id,
        updateQuotationDto,
        userId,
        userRole
      );
    } catch (error) {
      if (error.message.includes('no se puede actualizar')) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        'Error al actualizar la cotización',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar cotización',
    description: 'Elimina una cotización si aún no ha sido auditada'
  })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiResponse({
    status: 200,
    description: 'Cotización eliminada exitosamente'
  })
  async deleteQuotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      return this.providerQuotationsService.deleteQuotation(id, userId, userRole);
    } catch (error) {
      throw new HttpException(
        'Error al eliminar la cotización',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // =============== SOLICITUDES PROCESADAS POR AUDITORES ===============

  @Get('audited-quotations')
  @ApiOperation({ 
    summary: 'Obtener cotizaciones auditadas',
    description: 'Lista las cotizaciones del proveedor que han sido procesadas por auditores'
  })
  @ApiQuery({ name: 'audit_result', required: false, description: 'Filtrar por resultado de auditoría' })
  @ApiQuery({ name: 'auditor_id', required: false, description: 'Filtrar por auditor (solo admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de cotizaciones auditadas'
  })
  async getAuditedQuotations(
    @Req() req: any,
    @Query() query: any
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      
      const auditResult = query.audit_result;
      const auditorId = query.auditor_id;
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;

      return this.providerQuotationsService.getAuditedQuotations(
        userId,
        userRole,
        { auditResult, auditorId, page, limit }
      );
    } catch (error) {
      throw new HttpException(
        'Error al obtener cotizaciones auditadas',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // =============== AUDITORÍA (Solo auditores y admin) ===============

  @Post(':id/audit')
  @ApiOperation({ 
    summary: 'Auditar cotización',
    description: 'Permite a un auditor revisar y aprobar/rechazar una cotización'
  })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiResponse({
    status: 200,
    description: 'Auditoría realizada exitosamente'
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para auditar'
  })
  async auditQuotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() auditDto: AuditQuotationDto,
    @Req() req: any
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      // Solo auditores y admins pueden auditar
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para auditar cotizaciones',
          HttpStatus.FORBIDDEN
        );
      }

      return this.providerQuotationsService.auditQuotation(id, auditDto, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al auditar la cotización',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/ai-audit')
  @ApiOperation({ 
    summary: 'Auditar cotización con IA',
    description: 'Ejecuta una auditoría automática usando IA'
  })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiResponse({
    status: 200,
    description: 'Auditoría por IA realizada exitosamente'
  })
  async aiAuditQuotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      // Solo auditores y admins pueden ejecutar auditoría IA
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para ejecutar auditoría automática',
          HttpStatus.FORBIDDEN
        );
      }

      return this.providerQuotationsService.aiAuditQuotation(id, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error en la auditoría automática',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // =============== REPORTES Y ESTADÍSTICAS ===============

  @Get('stats/dashboard')
  @ApiOperation({ 
    summary: 'Estadísticas del dashboard de proveedor',
    description: 'Obtiene estadísticas generales para el dashboard del proveedor'
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del dashboard'
  })
  async getProviderDashboardStats(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      return this.providerQuotationsService.getProviderDashboardStats(userId, userRole);
    } catch (error) {
      throw new HttpException(
        'Error al obtener estadísticas',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 