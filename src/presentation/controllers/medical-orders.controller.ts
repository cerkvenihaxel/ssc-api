import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalOrdersService } from '../../application/services/medical-orders/medical-orders.service';
import { CreateMedicalOrderDto, UpdateMedicalOrderDto, AuthorizeOrderDto, MedicalOrderQueryDto, MedicalOrderResponseDto, MedicalOrderListResponseDto, CorrectMedicalOrderDto } from '../../api/dtos/medical-order.dto';

@ApiTags('Medical Orders')
@Controller('medical-orders')
@ApiBearerAuth()
export class MedicalOrdersController {
  constructor(private readonly medicalOrdersService: MedicalOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pedido médico' })
  @ApiResponse({ status: 201, description: 'Pedido médico creado exitosamente', type: MedicalOrderResponseDto })
  async createMedicalOrder(
    @Body() createDto: CreateMedicalOrderDto,
    @Request() req: any
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.id || 'anonymous';
      const requesterType = req.user?.role || 'admin';
      return await this.medicalOrdersService.createMedicalOrder(createDto, userId, requesterType);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de pedidos médicos' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos médicos obtenida exitosamente', type: MedicalOrderListResponseDto })
  async getMedicalOrders(
    @Query() query: MedicalOrderQueryDto
  ): Promise<MedicalOrderListResponseDto> {
    try {
      return await this.medicalOrdersService.getMedicalOrders(query);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un pedido médico específico' })
  @ApiResponse({ status: 200, description: 'Detalles del pedido médico obtenidos exitosamente', type: MedicalOrderResponseDto })
  async getMedicalOrderById(
    @Param('id') id: string
  ): Promise<MedicalOrderResponseDto> {
    try {
      return await this.medicalOrdersService.getMedicalOrderById(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un pedido médico' })
  @ApiResponse({ status: 200, description: 'Pedido médico actualizado exitosamente', type: MedicalOrderResponseDto })
  async updateMedicalOrder(
    @Param('id') id: string,
    @Body() updateDto: UpdateMedicalOrderDto,
    @Request() req: any
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.id || 'anonymous';
      return await this.medicalOrdersService.updateMedicalOrder(id, updateDto, userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un pedido médico' })
  @ApiResponse({ status: 200, description: 'Pedido médico eliminado exitosamente' })
  async deleteMedicalOrder(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<{ message: string }> {
    try {
      const userId = req.user?.id || 'anonymous';
      await this.medicalOrdersService.deleteMedicalOrder(id, userId);
      return { message: 'Pedido médico eliminado exitosamente' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/authorize')
  @ApiOperation({ summary: 'Autorizar o rechazar un pedido médico manualmente' })
  @ApiResponse({ status: 200, description: 'Pedido médico autorizado exitosamente', type: MedicalOrderResponseDto })
  async authorizeMedicalOrder(
    @Param('id') id: string,
    @Body() authorizeDto: AuthorizeOrderDto,
    @Request() req: any
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.id || 'anonymous';
      return await this.medicalOrdersService.authorizeMedicalOrder(id, authorizeDto, userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/ai-authorize')
  @ApiOperation({ summary: 'Procesar autorización automática con IA' })
  @ApiResponse({ status: 200, description: 'Análisis de IA completado exitosamente', type: MedicalOrderResponseDto })
  async aiAuthorizeMedicalOrder(
    @Param('id') id: string
  ): Promise<MedicalOrderResponseDto> {
    try {
      return await this.medicalOrdersService.aiAuthorizeMedicalOrder(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/correct')
  @ApiOperation({ summary: 'Corregir un pedido médico rechazado o parcialmente autorizado' })
  @ApiResponse({ status: 200, description: 'Pedido médico corregido exitosamente', type: MedicalOrderResponseDto })
  async correctMedicalOrder(
    @Param('id') id: string,
    @Body() correctDto: CorrectMedicalOrderDto,
    @Request() req: any
  ): Promise<MedicalOrderResponseDto> {
    try {
      const userId = req.user?.id || 'anonymous';
      return await this.medicalOrdersService.correctMedicalOrder(id, correctDto, userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id/authorization-history')
  @ApiOperation({ summary: 'Obtener historial de autorizaciones de un pedido médico' })
  @ApiResponse({ status: 200, description: 'Historial de autorizaciones obtenido exitosamente' })
  async getAuthorizationHistory(
    @Param('id') id: string
  ): Promise<any[]> {
    try {
      return await this.medicalOrdersService.getAuthorizationHistory(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/ai-analysis')
  @ApiOperation({ summary: 'Obtener análisis detallado de IA para un pedido médico' })
  @ApiResponse({ status: 200, description: 'Análisis de IA obtenido exitosamente' })
  async getAiAnalysis(
    @Param('id') id: string
  ): Promise<any> {
    try {
      return await this.medicalOrdersService.getAiAnalysis(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/ai-analysis/history')
  @ApiOperation({ summary: 'Obtener historial completo de análisis de IA' })
  @ApiResponse({ status: 200, description: 'Historial de análisis de IA obtenido exitosamente' })
  async getAiAnalysisHistory(
    @Param('id') id: string
  ): Promise<any[]> {
    try {
      return await this.medicalOrdersService.getAiAnalysisHistory(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/items/:itemId/ai-analysis')
  @ApiOperation({ summary: 'Obtener análisis de IA específico de un artículo' })
  @ApiResponse({ status: 200, description: 'Análisis de IA del artículo obtenido exitosamente' })
  async getItemAiAnalysis(
    @Param('id') id: string,
    @Param('itemId') itemId: string
  ): Promise<any> {
    try {
      return await this.medicalOrdersService.getItemAiAnalysis(id, itemId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post(':id/refresh-ai-analysis')
  @ApiOperation({ summary: 'Actualizar análisis de IA para corregir inconsistencias' })
  @ApiResponse({ status: 200, description: 'Análisis de IA actualizado exitosamente' })
  async refreshAiAnalysis(
    @Param('id') id: string
  ): Promise<{ message: string }> {
    try {
      await this.medicalOrdersService.refreshAIAnalysis(id);
      return { message: 'Análisis de IA actualizado exitosamente' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
} 