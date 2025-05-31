import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EspecialidadService } from '../../../application/services/especialidad/especialidad.service';
import { CreateEspecialidadDto } from '../especialidades/dtos/create-especialidad.dto';
import { UpdateEspecialidadDto } from '../especialidades/dtos/update-especialidad.dto';
import { Especialidad } from '../../../domain/models/especialidad/especialidad.model';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard, RequirePermission } from '../../guards/admin.guard';

@ApiTags('admin-especialidades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('v1/admin/especialidades')
export class AdminEspecialidadesController {
  constructor(private readonly especialidadService: EspecialidadService) {}

  @ApiOperation({ summary: 'Obtener todas las especialidades (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de especialidades con información detallada para admin',
    schema: {
      type: 'object',
      properties: {
        especialidades: {
          type: 'array',
          items: { $ref: '#/components/schemas/Especialidad' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @Get()
  @RequirePermission('ADMIN_ACCESS')
  async findAll(): Promise<{ especialidades: Especialidad[] }> {
    const especialidades = await this.especialidadService.findAll();
    return { especialidades };
  }

  @ApiOperation({ summary: 'Obtener solo las especialidades activas (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de especialidades activas',
    type: Especialidad,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @Get('active')
  @RequirePermission('ADMIN_ACCESS')
  async findActive(): Promise<Especialidad[]> {
    return this.especialidadService.findActive();
  }

  @ApiOperation({ summary: 'Obtener una especialidad por ID (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad encontrada',
    type: Especialidad
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @Get(':id')
  @RequirePermission('ADMIN_ACCESS')
  async findById(@Param('id') id: string): Promise<Especialidad> {
    return this.especialidadService.findById(id);
  }

  @ApiOperation({ summary: 'Crear una nueva especialidad (Admin)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Especialidad creada exitosamente',
    type: Especialidad
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 409, description: 'Conflicto - Ya existe una especialidad con ese nombre o código' })
  @Post()
  @RequirePermission('ADMIN_ACCESS')
  async create(@Body() dto: CreateEspecialidadDto): Promise<Especialidad> {
    return this.especialidadService.create(dto);
  }

  @ApiOperation({ summary: 'Actualizar una especialidad existente (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad actualizada exitosamente',
    type: Especialidad
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @ApiResponse({ status: 409, description: 'Conflicto - Ya existe una especialidad con ese nombre o código' })
  @Put(':id')
  @RequirePermission('ADMIN_ACCESS')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEspecialidadDto
  ): Promise<Especialidad> {
    return this.especialidadService.update(id, dto);
  }

  @ApiOperation({ summary: 'Activar una especialidad (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad activada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @Patch(':id/activate')
  @RequirePermission('ADMIN_ACCESS')
  async activate(@Param('id') id: string): Promise<{ message: string }> {
    await this.especialidadService.activate(id);
    return { message: 'Especialidad activada exitosamente' };
  }

  @ApiOperation({ summary: 'Desactivar una especialidad (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad desactivada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @Patch(':id/deactivate')
  @RequirePermission('ADMIN_ACCESS')
  async deactivate(@Param('id') id: string): Promise<{ message: string }> {
    await this.especialidadService.deactivate(id);
    return { message: 'Especialidad desactivada exitosamente' };
  }

  @ApiOperation({ summary: 'Eliminar una especialidad (Admin)' })
  @ApiResponse({ status: 200, description: 'Especialidad eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @Delete(':id')
  @RequirePermission('ADMIN_ACCESS')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.especialidadService.delete(id);
    return { message: 'Especialidad eliminada exitosamente' };
  }
} 