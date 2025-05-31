import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EspecialidadService } from '../../../application/services/especialidad/especialidad.service';
import { CreateEspecialidadDto } from './dtos/create-especialidad.dto';
import { UpdateEspecialidadDto } from './dtos/update-especialidad.dto';
import { Especialidad } from '../../../domain/models/especialidad/especialidad.model';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Especialidades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/especialidades')
export class EspecialidadesController {
  constructor(private readonly especialidadService: EspecialidadService) {}

  @ApiOperation({ summary: 'Obtener todas las especialidades' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de especialidades',
    type: Especialidad,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @Get()
  async findAll(): Promise<Especialidad[]> {
    return this.especialidadService.findAll();
  }

  @ApiOperation({ summary: 'Obtener solo las especialidades activas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de especialidades activas',
    type: Especialidad,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @Get('active')
  async findActive(): Promise<Especialidad[]> {
    return this.especialidadService.findActive();
  }

  @ApiOperation({ summary: 'Obtener una especialidad por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad encontrada',
    type: Especialidad
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @Get(':id')
  async findById(@Param('id') id: string): Promise<Especialidad> {
    return this.especialidadService.findById(id);
  }

  @ApiOperation({ summary: 'Crear una nueva especialidad' })
  @ApiResponse({ 
    status: 201, 
    description: 'Especialidad creada exitosamente',
    type: Especialidad
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Ya existe una especialidad con ese nombre o código' })
  @Post()
  async create(@Body() dto: CreateEspecialidadDto): Promise<Especialidad> {
    return this.especialidadService.create(dto);
  }

  @ApiOperation({ summary: 'Actualizar una especialidad existente' })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad actualizada exitosamente',
    type: Especialidad
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @ApiResponse({ status: 409, description: 'Conflicto - Ya existe una especialidad con ese nombre o código' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEspecialidadDto
  ): Promise<Especialidad> {
    return this.especialidadService.update(id, dto);
  }

  @ApiOperation({ summary: 'Activar una especialidad' })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad activada exitosamente',
    type: Especialidad
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @Patch(':id/activate')
  async activate(@Param('id') id: string): Promise<Especialidad> {
    return this.especialidadService.activate(id);
  }

  @ApiOperation({ summary: 'Desactivar una especialidad' })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad desactivada exitosamente',
    type: Especialidad
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string): Promise<Especialidad> {
    return this.especialidadService.deactivate(id);
  }

  @ApiOperation({ summary: 'Eliminar una especialidad' })
  @ApiResponse({ status: 200, description: 'Especialidad eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.especialidadService.delete(id);
  }
} 