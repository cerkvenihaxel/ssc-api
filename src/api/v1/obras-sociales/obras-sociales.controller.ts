import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ObraSocialService } from '../../../application/services/obra-social/obra-social.service';
import { CreateObraSocialDto } from './dtos/create-obra-social.dto';
import { UpdateObraSocialDto } from './dtos/update-obra-social.dto';
import { ObraSocial } from '../../../domain/models/obra-social/obra-social.model';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Obras Sociales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/obras-sociales')
export class ObrasSocialesController {
  constructor(private readonly obraSocialService: ObraSocialService) {}

  @ApiOperation({ summary: 'Obtener todas las obras sociales' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de obras sociales',
    type: ObraSocial,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @Get()
  async findAll(): Promise<ObraSocial[]> {
    return this.obraSocialService.findAll();
  }

  @ApiOperation({ summary: 'Obtener una obra social por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Obra social encontrada',
    type: ObraSocial
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Obra social no encontrada' })
  @Get(':id')
  async findById(@Param('id') id: string): Promise<ObraSocial> {
    return this.obraSocialService.findById(id);
  }

  @ApiOperation({ summary: 'Crear una nueva obra social' })
  @ApiResponse({ 
    status: 201, 
    description: 'Obra social creada exitosamente',
    type: ObraSocial
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Ya existe una obra social con ese nombre' })
  @Post()
  async create(@Body() dto: CreateObraSocialDto): Promise<ObraSocial> {
    return this.obraSocialService.create(dto);
  }

  @ApiOperation({ summary: 'Actualizar una obra social existente' })
  @ApiResponse({ 
    status: 200, 
    description: 'Obra social actualizada exitosamente',
    type: ObraSocial
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Obra social no encontrada' })
  @ApiResponse({ status: 409, description: 'Conflicto - Ya existe una obra social con ese nombre' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateObraSocialDto
  ): Promise<ObraSocial> {
    return this.obraSocialService.update(id, dto);
  }

  @ApiOperation({ summary: 'Eliminar una obra social' })
  @ApiResponse({ status: 200, description: 'Obra social eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Obra social no encontrada' })
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.obraSocialService.delete(id);
  }
} 