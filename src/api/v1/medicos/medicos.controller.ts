import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MedicoService } from '../../../application/services/medico/medico.service';
import { CreateMedicoDto } from './dtos/create-medico.dto';
import { UpdateMedicoDto } from './dtos/update-medico.dto';
import { Medico } from '../../../domain/models/medico/medico.model';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Médicos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/medicos')
export class MedicosController {
  constructor(private readonly medicoService: MedicoService) {}

  @ApiOperation({ summary: 'Obtener todos los médicos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de médicos',
    type: Medico,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @Get()
  async findAll(): Promise<Medico[]> {
    return this.medicoService.findAll();
  }

  @ApiOperation({ summary: 'Obtener médicos por especialidad' })
  @ApiQuery({ name: 'especialidadId', description: 'ID de la especialidad' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de médicos de la especialidad',
    type: Medico,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @Get('by-especialidad')
  async findByEspecialidad(@Query('especialidadId') especialidadId: string): Promise<Medico[]> {
    return this.medicoService.findByEspecialidad(especialidadId);
  }

  @ApiOperation({ summary: 'Obtener médicos por obra social' })
  @ApiQuery({ name: 'obraSocialId', description: 'ID de la obra social' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de médicos de la obra social',
    type: Medico,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @Get('by-obra-social')
  async findByObraSocial(@Query('obraSocialId') obraSocialId: string): Promise<Medico[]> {
    return this.medicoService.findByObraSocial(obraSocialId);
  }

  @ApiOperation({ summary: 'Obtener un médico por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Médico encontrado',
    type: Medico
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado' })
  @Get(':id')
  async findById(@Param('id') id: string): Promise<Medico> {
    return this.medicoService.findById(id);
  }

  @ApiOperation({ summary: 'Obtener obras sociales asociadas a un médico' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de IDs de obras sociales',
    type: [String]
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado' })
  @Get(':id/obras-sociales')
  async getObrasSocialesAssociated(@Param('id') id: string): Promise<string[]> {
    return this.medicoService.getObrasSocialesAssociated(id);
  }

  @ApiOperation({ summary: 'Crear un nuevo médico' })
  @ApiResponse({ 
    status: 201, 
    description: 'Médico creado exitosamente',
    type: Medico
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Ya existe un médico con esa matrícula o email' })
  @Post()
  async create(@Body() dto: CreateMedicoDto): Promise<Medico> {
    return this.medicoService.create(dto);
  }

  @ApiOperation({ summary: 'Actualizar un médico existente' })
  @ApiResponse({ 
    status: 200, 
    description: 'Médico actualizado exitosamente',
    type: Medico
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Ya existe un médico con esa matrícula o email' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMedicoDto
  ): Promise<Medico> {
    return this.medicoService.update(id, dto);
  }

  @ApiOperation({ summary: 'Asociar médico con obra social' })
  @ApiResponse({ status: 200, description: 'Asociación creada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado' })
  @Post(':id/obras-sociales/:obraSocialId')
  async associateWithObraSocial(
    @Param('id') medicoId: string,
    @Param('obraSocialId') obraSocialId: string
  ): Promise<void> {
    await this.medicoService.associateWithObraSocial(medicoId, obraSocialId);
  }

  @ApiOperation({ summary: 'Desasociar médico de obra social' })
  @ApiResponse({ status: 200, description: 'Asociación eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado' })
  @Delete(':id/obras-sociales/:obraSocialId')
  async dissociateFromObraSocial(
    @Param('id') medicoId: string,
    @Param('obraSocialId') obraSocialId: string
  ): Promise<void> {
    await this.medicoService.dissociateFromObraSocial(medicoId, obraSocialId);
  }

  @ApiOperation({ summary: 'Eliminar un médico' })
  @ApiResponse({ status: 200, description: 'Médico eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado' })
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.medicoService.delete(id);
  }
} 