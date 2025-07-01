import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard, RequirePermission } from '../../guards/admin.guard';
// import { DashboardService } from '../../../application/services/dashboard/dashboard.service';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
export class DashboardController {
  // constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener todos los datos del dashboard principal' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Datos del dashboard obtenidos exitosamente',
  })
  async getDashboardData(): Promise<any> {
    // Temporary mock data until service is created
    return {
      message: 'Dashboard endpoint ready - service implementation pending'
    };
  }

  @Get('realtime')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener datos en tiempo real del dashboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Datos en tiempo real obtenidos exitosamente',
  })
  async getRealtimeData(): Promise<any> {
    return {
      message: 'Realtime endpoint ready - service implementation pending'
    };
  }

  @Get('summary')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Obtener resumen ejecutivo del dashboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumen ejecutivo obtenido exitosamente',
  })
  async getExecutiveSummary(): Promise<any> {
    return {
      message: 'Summary endpoint ready - service implementation pending'
    };
  }
} 