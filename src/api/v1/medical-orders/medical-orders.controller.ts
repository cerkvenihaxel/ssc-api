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
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateMedicalOrderDto,
  UpdateMedicalOrderDto,
  AuthorizeOrderDto,
  MedicalOrderQueryDto,
  MedicalOrderResponseDto,
  MedicalOrderListResponseDto,
  CorrectMedicalOrderDto,
} from '../../dtos/medical-order.dto';
import { MedicalOrdersService } from '../../../application/services/medical-orders/medical-orders.service';
import { AiAnalysisPersistenceService } from '../../../application/services/medical-orders/ai-analysis-persistence.service';

@ApiTags('Medical Orders')
@ApiBearerAuth()
@Controller('medical-orders')
export class MedicalOrdersController {
  constructor(
    private readonly medicalOrderService: MedicalOrdersService,
    private readonly aiAnalysisService: AiAnalysisPersistenceService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pedido médico' })
  @ApiResponse({
    status: 201,
    description: 'Pedido médico creado exitosamente',
    type: MedicalOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos para crear pedidos' })
  async createMedicalOrder(
    @Body() createDto: CreateMedicalOrderDto,
    @Req() req: any,
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.userId || '0f24578f-3fed-4293-ba45-472974113123';
      const userRole = req.user?.role || 'ADMIN';
      
      // Determinar el tipo de solicitante basado en el rol
      let requesterType: 'admin' | 'doctor' | 'auditor';
      if (userRole === 'ADMIN') {
        requesterType = 'admin';
      } else if (userRole === 'MEDICO') {
        requesterType = 'doctor';
      } else if (userRole === 'AUDITOR') {
        requesterType = 'auditor';
      } else {
        throw new HttpException('Rol no autorizado para crear pedidos médicos', HttpStatus.FORBIDDEN);
      }

      return await this.medicalOrderService.createMedicalOrder(
        createDto,
        userId,
        requesterType,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al crear el pedido médico',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de pedidos médicos con filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos médicos',
    type: MedicalOrderListResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'authorizationStatus', required: false, type: String })
  @ApiQuery({ name: 'requesterType', required: false, type: String })
  @ApiQuery({ name: 'urgencyId', required: false, type: Number })
  @ApiQuery({ name: 'affiliateId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getMedicalOrders(
    @Query() queryDto: MedicalOrderQueryDto,
    @Req() req: any,
  ): Promise<MedicalOrderListResponseDto> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role || 'ADMIN';
      
      // Si no es admin, solo puede ver sus propios pedidos
      if (userRole !== 'ADMIN' && !queryDto.requesterId) {
        queryDto.requesterId = userId;
      }

      return await this.medicalOrderService.getMedicalOrders(queryDto);
    } catch (error) {
      throw new HttpException(
        'Error al obtener pedidos médicos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pedido médico por ID' })
  @ApiResponse({
    status: 200,
    description: 'Pedido médico encontrado',
    type: MedicalOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pedido médico no encontrado' })
  async getMedicalOrderById(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role || 'ADMIN';
      
      const order = await this.medicalOrderService.getMedicalOrderById(id);
      
      // Verificar permisos: admin puede ver todo, otros solo sus propios pedidos
      if (userRole !== 'ADMIN' && order.requesterId !== userId) {
        throw new HttpException('No tiene permisos para ver este pedido', HttpStatus.FORBIDDEN);
      }
      
      return order;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener el pedido médico',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un pedido médico' })
  @ApiResponse({
    status: 200,
    description: 'Pedido médico actualizado exitosamente',
    type: MedicalOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pedido médico no encontrado' })
  @ApiResponse({ status: 400, description: 'El pedido no puede ser modificado en su estado actual' })
  async updateMedicalOrder(
    @Param('id') id: string,
    @Body() updateDto: UpdateMedicalOrderDto,
    @Req() req: any,
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.userId || '0f24578f-3fed-4293-ba45-472974113123';
      const userRole = req.user?.role || 'ADMIN';
      
      // Verificar permisos de edición
      const order = await this.medicalOrderService.getMedicalOrderById(id);
      if (userRole !== 'ADMIN' && order.requesterId !== userId) {
        throw new HttpException('No tiene permisos para editar este pedido', HttpStatus.FORBIDDEN);
      }
      
      return await this.medicalOrderService.updateMedicalOrder(id, updateDto, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al actualizar el pedido médico',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un pedido médico' })
  @ApiResponse({ status: 204, description: 'Pedido médico eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido médico no encontrado' })
  @ApiResponse({ status: 400, description: 'El pedido no puede ser eliminado en su estado actual' })
  async deleteMedicalOrder(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<void> {
    try {
      const userId = req.user?.userId || 'system';
      const userRole = req.user?.role || 'ADMIN';
      
      // Verificar permisos de eliminación
      const order = await this.medicalOrderService.getMedicalOrderById(id);
      if (userRole !== 'ADMIN' && order.requesterId !== userId) {
        throw new HttpException('No tiene permisos para eliminar este pedido', HttpStatus.FORBIDDEN);
      }
      
      await this.medicalOrderService.deleteMedicalOrder(id, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al eliminar el pedido médico',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/authorize')
  @ApiOperation({ summary: 'Autorizar un pedido médico manualmente' })
  @ApiResponse({
    status: 200,
    description: 'Pedido médico autorizado exitosamente',
    type: MedicalOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pedido médico no encontrado' })
  @ApiResponse({ status: 400, description: 'El pedido no puede ser autorizado en su estado actual' })
  async authorizeMedicalOrder(
    @Param('id') id: string,
    @Body() authorizeDto: AuthorizeOrderDto,
    @Req() req: any,
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.userId || '0f24578f-3fed-4293-ba45-472974113123';
      return await this.medicalOrderService.authorizeMedicalOrder(id, authorizeDto, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al autorizar el pedido médico',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/ai-authorize')
  @ApiOperation({ summary: 'Autorizar un pedido médico automáticamente con IA' })
  @ApiResponse({
    status: 200,
    description: 'Análisis de IA completado',
    type: MedicalOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pedido médico no encontrado' })
  @ApiResponse({ status: 400, description: 'El pedido no puede ser analizado en su estado actual' })
  @ApiResponse({ status: 503, description: 'Servicio de IA no disponible' })
  async aiAuthorizeMedicalOrder(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<MedicalOrderResponseDto> {
    try {
      return await this.medicalOrderService.aiAuthorizeMedicalOrder(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al analizar el pedido médico con IA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/correct')
  @ApiOperation({ summary: 'Corregir un pedido médico rechazado o parcialmente aprobado' })
  @ApiResponse({
    status: 200,
    description: 'Pedido médico corregido exitosamente',
    type: MedicalOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pedido médico no encontrado' })
  @ApiResponse({ status: 400, description: 'El pedido no puede ser corregido en su estado actual' })
  @ApiResponse({ status: 403, description: 'No tiene permisos para corregir este pedido' })
  async correctMedicalOrder(
    @Param('id') id: string,
    @Body() correctDto: CorrectMedicalOrderDto,
    @Req() req: any,
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.userId || '0f24578f-3fed-4293-ba45-472974113123';
      return await this.medicalOrderService.correctMedicalOrder(id, correctDto, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al corregir el pedido médico',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/authorization-history')
  @ApiOperation({ summary: 'Obtener historial de autorizaciones de un pedido médico' })
  @ApiResponse({ status: 200, description: 'Historial de autorizaciones' })
  @ApiResponse({ status: 404, description: 'Pedido médico no encontrado' })
  async getAuthorizationHistory(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<any[]> {
    try {
      return await this.medicalOrderService.getAuthorizationHistory(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener historial de autorizaciones',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/ai-analysis')
  @ApiOperation({ summary: 'Obtener análisis de IA detallado de un pedido médico' })
  @ApiResponse({
    status: 200,
    description: 'Análisis de IA obtenido exitosamente',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Pedido médico no encontrado o sin análisis de IA' })
  async getAIAnalysis(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<any> {
    try {
      const analysis = await this.aiAnalysisService.getLatestAnalysis(id);
      if (!analysis) {
        throw new HttpException('No se encontró análisis de IA para este pedido', HttpStatus.NOT_FOUND);
      }
      return analysis;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener el análisis de IA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/ai-analysis/history')
  @ApiOperation({ summary: 'Obtener historial completo de análisis de IA' })
  @ApiResponse({
    status: 200,
    description: 'Historial de análisis de IA obtenido exitosamente',
    type: [Object],
  })
  @ApiResponse({ status: 404, description: 'Pedido médico no encontrado' })
  async getAIAnalysisHistory(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<any[]> {
    try {
      return await this.aiAnalysisService.getAnalysisHistory(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener el historial de análisis de IA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/items/:itemId/ai-analysis')
  @ApiOperation({ summary: 'Obtener análisis de IA para un item específico' })
  @ApiResponse({ status: 200, description: 'Análisis de IA del item' })
  @ApiResponse({ status: 404, description: 'Pedido o item no encontrado' })
  async getItemAIAnalysis(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() req: any,
  ): Promise<any> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role || 'ADMIN';
      
      // Verificar permisos
      const order = await this.medicalOrderService.getMedicalOrderById(id);
      if (userRole !== 'ADMIN' && order.requesterId !== userId) {
        throw new HttpException('No tiene permisos para ver este análisis', HttpStatus.FORBIDDEN);
      }
      
      return await this.aiAnalysisService.getItemAnalysis(id, itemId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener análisis de IA del item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/refresh-ai-analysis')
  @ApiOperation({ summary: 'Refresca y corrige el análisis de IA de un pedido médico' })
  @ApiResponse({ 
    status: 200, 
    description: 'Análisis de IA refrescado exitosamente', 
    type: MedicalOrderResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 400, description: 'Error en la solicitud' })
  async refreshAIAnalysis(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role || 'ADMIN';
      
      // Verificar permisos
      const order = await this.medicalOrderService.getMedicalOrderById(id);
      if (userRole !== 'ADMIN' && order.requesterId !== userId) {
        throw new HttpException('No tiene permisos para refrescar este análisis', HttpStatus.FORBIDDEN);
      }
      
      return await this.medicalOrderService.refreshAIAnalysis(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al refrescar análisis de IA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('categories/medical')
  @ApiOperation({ summary: 'Obtener categorías médicas disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de categorías médicas' })
  async getMedicalCategories(): Promise<any[]> {
    try {
      return await this.medicalOrderService.getMedicalCategories();
    } catch (error) {
      throw new HttpException(
        'Error al obtener categorías médicas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('urgency-types/all')
  @ApiOperation({ summary: 'Obtener tipos de urgencia disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de urgencia' })
  async getUrgencyTypes(): Promise<any[]> {
    try {
      return await this.medicalOrderService.getUrgencyTypes();
    } catch (error) {
      throw new HttpException(
        'Error al obtener tipos de urgencia',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/dashboard')
  @ApiOperation({ summary: 'Obtener estadísticas para el dashboard' })
  @ApiResponse({ status: 200, description: 'Estadísticas de pedidos médicos' })
  async getDashboardStats(@Req() req: any): Promise<any> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role || 'ADMIN';
      
      return await this.medicalOrderService.getDashboardStats(
        userRole === 'ADMIN' ? undefined : userId
      );
    } catch (error) {
      throw new HttpException(
        'Error al obtener estadísticas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Buscar afiliados para pedidos médicos' })
  @ApiQuery({ name: 'search', required: false, description: 'Término de búsqueda (nombre, apellido, número, CUIL)' })
  @ApiQuery({ name: 'page', required: false, description: 'Página', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite por página', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de afiliados encontrados',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              affiliateId: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              affiliateNumber: { type: 'string' },
              cuil: { type: 'string' },
              email: { type: 'string' },
              healthcareProviders: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    healthcareProviderId: { type: 'string' },
                    name: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        }
      }
    }
  })
  @Get('affiliates/search')
  async searchAffiliates(
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
         return this.medicalOrderService.searchAffiliates({
      search: search || '',
      page: Math.max(1, page),
      limit: Math.min(50, Math.max(1, limit)) // Máximo 50 resultados por página
    });
  }
} 