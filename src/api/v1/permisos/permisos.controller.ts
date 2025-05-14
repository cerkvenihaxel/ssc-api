import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermisoService } from '../../../application/services/permiso/permiso.service';
import { CreatePermisoDto } from './dtos/create-permiso.dto';
import { UpdatePermisoDto } from './dtos/update-permiso.dto';
import { Permiso } from '../../../domain/models/permiso/permiso.model';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Permisos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/permisos')
export class PermisosController {
  constructor(private readonly permisoService: PermisoService) {}

  @ApiOperation({ summary: 'Obtener todos los permisos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de permisos',
    type: Permiso,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @Get()
  async findAll(): Promise<Permiso[]> {
    return this.permisoService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un permiso por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Permiso encontrado',
    type: Permiso
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Permiso> {
    return this.permisoService.findById(id);
  }

  @ApiOperation({ summary: 'Crear un nuevo permiso' })
  @ApiResponse({ 
    status: 201, 
    description: 'Permiso creado exitosamente',
    type: Permiso
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 409, description: 'Ya existe un permiso con ese nombre' })
  @Post()
  async create(@Body() dto: CreatePermisoDto): Promise<Permiso> {
    return this.permisoService.create(dto);
  }

  @ApiOperation({ summary: 'Actualizar un permiso existente' })
  @ApiResponse({ 
    status: 200, 
    description: 'Permiso actualizado exitosamente',
    type: Permiso
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya existe un permiso con ese nombre' })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermisoDto
  ): Promise<Permiso> {
    return this.permisoService.update(id, dto);
  }

  @ApiOperation({ summary: 'Eliminar un permiso' })
  @ApiResponse({ status: 200, description: 'Permiso eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.permisoService.delete(id);
  }
} 