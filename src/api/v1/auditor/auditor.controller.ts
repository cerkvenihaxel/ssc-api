import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AuditorService } from '../../../application/services/auditor/auditor.service';
import { CreateAuditRequestDto } from './dtos/create-audit-request.dto';
import { UpdateAuditRequestDto } from './dtos/update-audit-request.dto';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auditor')
export class AuditorController {
  constructor(private readonly auditorService: AuditorService) {}

  private getUserRoleFromRequest(req: any): string {
    const userRoleId = req.user?.roleId;
    return userRoleId === 1
      ? 'Administrador'
      : userRoleId === 2
        ? 'Proveedor'
        : userRoleId === 3
          ? 'Auditor'
          : 'Usuario';
  }

  // =============== COTIZACIONES PENDIENTES DE AUDITORÍA ===============

  @Get('pending-quotations')
  @ApiOperation({
    summary: 'Obtener cotizaciones pendientes de auditoría',
    description: 'Lista las cotizaciones que están disponibles para ser auditadas con paginación optimizada',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado de cotización',
  })
  @ApiQuery({
    name: 'provider_id',
    required: false,
    description: 'Filtrar por proveedor',
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    description: 'Fecha desde (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    description: 'Fecha hasta (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'patient_name',
    required: false,
    description: 'Filtrar por nombre de paciente',
  })
  @ApiQuery({
    name: 'medical_order_id',
    required: false,
    description: 'Filtrar por orden médica',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (mínimo: 1, máximo: 1000)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página (mínimo: 1, máximo: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cotizaciones pendientes de auditoría',
  })
  async getPendingQuotations(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('provider_id') providerId?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('patient_name') patientName?: string,
    @Query('medical_order_id') medicalOrderId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para acceder a esta funcionalidad',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.getPendingQuotations(userId, userRole, {
        status,
        provider_id: providerId,
        date_from: dateFrom,
        date_to: dateTo,
        patient_name: patientName,
        medical_order_id: medicalOrderId,
        page,
        limit,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener cotizaciones pendientes de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =============== SOLICITUDES PARA AUDITAR (DEPRECATED) ===============

  @Get('pending-requests')
  @ApiOperation({
    summary: 'Obtener solicitudes pendientes de auditoría (DEPRECATED)',
    description: 'Lista las cotizaciones que están disponibles para ser auditadas',
  })
  @ApiQuery({
    name: 'providerId',
    required: false,
    description: 'Filtrar por proveedor',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes pendientes de auditoría',
  })
  async getPendingAuditRequests(
    @Req() req: any,
    @Query('providerId') providerId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para acceder a esta funcionalidad',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.getPendingAuditRequests(userId, userRole, {
        providerId,
        page,
        limit,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener solicitudes pendientes de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =============== DETALLE DE COTIZACIÓN ===============

  @Get('quotations/:id')
  @ApiOperation({
    summary: 'Obtener detalle de cotización',
    description: 'Obtiene los detalles completos de una cotización específica',
  })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la cotización',
  })
  @ApiResponse({
    status: 404,
    description: 'Cotización no encontrada',
  })
  async getQuotationDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para acceder a esta funcionalidad',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.getQuotationDetail(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener detalle de cotización',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =============== SOLICITUDES FINALIZADAS ===============

  @Get('completed-requests')
  @ApiOperation({
    summary: 'Obtener solicitudes finalizadas',
    description: 'Lista las solicitudes de auditoría que han sido completadas con paginación optimizada',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado de auditoría',
  })
  @ApiQuery({
    name: 'provider_id',
    required: false,
    description: 'Filtrar por proveedor',
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    description: 'Fecha desde (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    description: 'Fecha hasta (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'patient_name',
    required: false,
    description: 'Filtrar por nombre de paciente',
  })
  @ApiQuery({
    name: 'medical_order_id',
    required: false,
    description: 'Filtrar por orden médica',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (mínimo: 1, máximo: 1000)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página (mínimo: 1, máximo: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes finalizadas',
  })
  async getCompletedRequests(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('provider_id') providerId?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('patient_name') patientName?: string,
    @Query('medical_order_id') medicalOrderId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para acceder a esta funcionalidad',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.getCompletedRequests(userId, userRole, {
        status,
        provider_id: providerId,
        date_from: dateFrom,
        date_to: dateTo,
        patient_name: patientName,
        medical_order_id: medicalOrderId,
        page,
        limit,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener solicitudes finalizadas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =============== SOLICITUDES AUDITADAS (DEPRECATED) ===============

  @Get('audited-requests')
  @ApiOperation({
    summary: 'Obtener solicitudes auditadas (DEPRECATED)',
    description: 'Lista las solicitudes que ya han sido auditadas',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado de auditoría',
  })
  @ApiQuery({
    name: 'auditorId',
    required: false,
    description: 'Filtrar por auditor',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes auditadas',
  })
  async getAuditedRequests(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('auditorId') auditorId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para acceder a esta funcionalidad',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.getAuditedRequests(userId, userRole, {
        status,
        auditorId,
        page,
        limit,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener solicitudes auditadas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =============== CREAR SOLICITUD DE AUDITORÍA ===============

  @Post('audit-requests')
  @ApiOperation({
    summary: 'Crear solicitud de auditoría',
    description: 'Crea una nueva solicitud de auditoría para una cotización',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud de auditoría creada exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una solicitud de auditoría para esta cotización',
  })
  async createAuditRequest(
    @Body() createDto: CreateAuditRequestDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para crear solicitudes de auditoría',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.createAuditRequest(createDto, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al crear solicitud de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =============== ACTUALIZAR SOLICITUD DE AUDITORÍA ===============

  @Put('audit-requests/:id')
  @ApiOperation({
    summary: 'Actualizar solicitud de auditoría',
    description: 'Actualiza una solicitud de auditoría existente',
  })
  @ApiParam({ name: 'id', description: 'ID de la solicitud de auditoría' })
  @ApiResponse({
    status: 200,
    description: 'Solicitud de auditoría actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud de auditoría no encontrada',
  })
  async updateAuditRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAuditRequestDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para actualizar solicitudes de auditoría',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.updateAuditRequest(id, updateDto, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al actualizar solicitud de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =============== AUDITAR COTIZACIÓN DIRECTAMENTE ===============

  @Put('quotations/:id/audit')
  @ApiOperation({
    summary: 'Auditar cotización',
    description: 'Aprueba o rechaza una cotización específica',
  })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiResponse({
    status: 200,
    description: 'Cotización auditada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cotización no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para auditar',
  })
  async auditQuotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() auditDto: UpdateAuditRequestDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para auditar cotizaciones',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.auditQuotation(id, auditDto, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al auditar cotización',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =============== DETALLE DE AUDITORÍA ===============

  @Get('audit-requests/:id')
  @ApiOperation({
    summary: 'Obtener detalle de auditoría',
    description: 'Obtiene los detalles completos de una solicitud de auditoría',
  })
  @ApiParam({ name: 'id', description: 'ID de la solicitud de auditoría' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la solicitud de auditoría',
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud de auditoría no encontrada',
  })
  async getAuditRequestDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para acceder a esta funcionalidad',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.getAuditRequestDetail(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener detalle de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =============== ESTADÍSTICAS ===============

  @Get('statistics')
  @ApiOperation({
    summary: 'Estadísticas de auditoría',
    description: 'Obtiene estadísticas generales de auditoría',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de auditoría',
  })
  async getAuditStatistics(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const userRole = this.getUserRoleFromRequest(req);

      // Verificar permisos (solo auditores y administradores)
      if (!['AUDITOR', 'ADMIN', 'Auditor', 'Administrador'].includes(userRole)) {
        throw new HttpException(
          'No tiene permisos para acceder a esta funcionalidad',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.auditorService.getAuditStatistics(userId, userRole);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener estadísticas de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 